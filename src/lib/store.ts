import type {
  CreatePaymentLinkInput,
  PaymentLink,
  PaymentLinkType,
} from "./types";

/**
 * Payment link persistence — storage abstraction.
 *
 * Production: Vercel KV (requires KV_REST_API_URL + KV_REST_API_TOKEN).
 * Development: JSON file store so the whole flow works locally with zero
 * infrastructure. The rest of the app never talks to storage directly.
 */

const PREFIX = "payment:";
const EXPIRY_SECONDS = 60 * 60 * 24 * 365; // keep records for 1 year

export function generatePaymentId(): string {
  const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
  let id = "";
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  for (const b of bytes) id += alphabet[b % alphabet.length];
  return id;
}

// ── JSON file store (dev fallback) ─────────────────────────────────────────

import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), ".data", "payments.json");
let fileCache: Map<string, PaymentLink> | null = null;

async function readFileStore(): Promise<Map<string, PaymentLink>> {
  if (fileCache) return fileCache;
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const arr = JSON.parse(raw) as PaymentLink[];
    fileCache = new Map(arr.map((l) => [l.id, l]));
  } catch {
    fileCache = new Map();
  }
  return fileCache;
}

async function writeFileStore(map: Map<string, PaymentLink>) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const arr = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
  await fs.writeFile(FILE, JSON.stringify(arr, null, 2));
}

// ── KV store (production) ──────────────────────────────────────────────────

let kvClient: typeof import("@vercel/kv").kv | null = null;
function kvConfigured() {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}
async function getKv() {
  if (!kvClient) {
    const mod = await import("@vercel/kv");
    kvClient = mod.kv;
  }
  return kvClient;
}

function kvKey(id: string) {
  return `${PREFIX}${id}`;
}

// ── Public API ─────────────────────────────────────────────────────────────

export async function savePaymentLink(link: PaymentLink): Promise<PaymentLink> {
  if (kvConfigured()) {
    const kv = await getKv();
    await kv.set(kvKey(link.id), link, { ex: EXPIRY_SECONDS });
  } else {
    const map = await readFileStore();
    map.set(link.id, link);
    await writeFileStore(map);
  }
  return link;
}

export async function getPaymentLink(id: string): Promise<PaymentLink | null> {
  if (kvConfigured()) {
    const kv = await getKv();
    return (await kv.get<PaymentLink>(kvKey(id))) ?? null;
  }
  const map = await readFileStore();
  return map.get(id) ?? null;
}

export async function updatePaymentLink(
  id: string,
  patch: Partial<PaymentLink>,
): Promise<PaymentLink | null> {
  const link = await getPaymentLink(id);
  if (!link) return null;
  const next: PaymentLink = { ...link, ...patch, id };
  await savePaymentLink(next);
  return next;
}

export async function createPaymentLink(
  input: CreatePaymentLinkInput,
): Promise<PaymentLink> {
  const now = Date.now();
  const type: PaymentLinkType = input.type ?? "request";
  const link: PaymentLink = {
    id: generatePaymentId(),
    type,
    recipient: input.recipient,
    recipientName: input.recipientName,
    amount: input.amount,
    currency: input.currency ?? "USDC",
    description: input.description,
    customerName: input.customerName,
    reference: input.reference,
    expiresAt: input.expiresAt ?? null,
    successMessage: input.successMessage,
    tipEnabled: input.tipEnabled ?? false,
    presetAmounts: input.presetAmounts,
    createdAt: now,
    createdBy: input.createdBy,
    status: "pending",
  };
  return savePaymentLink(link);
}

export async function listRecentPayments(limit = 50): Promise<PaymentLink[]> {
  if (kvConfigured()) {
    const kv = await getKv();
    try {
      const ids = await kv.zrange(`${PREFIX}recent`, 0, limit - 1, {
        rev: true,
      });
      const links = await Promise.all(
        ids.map((id) => getPaymentLink(String(id))),
      );
      return links.filter((l): l is PaymentLink => l !== null);
    } catch {
      return [];
    }
  }
  const map = await readFileStore();
  return Array.from(map.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

/**
 * Per-user dashboard: returns only payment links where the given address is
 * the recipient. This is what keeps each merchant's activity private.
 */
export async function listPaymentsByRecipient(
  recipient: string,
  limit = 50,
): Promise<PaymentLink[]> {
  const all = await listRecentPayments(500);
  const lower = recipient.toLowerCase();
  return all
    .filter((l) => l.recipient.toLowerCase() === lower)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}

async function indexRecentPayment(id: string, createdAt: number) {
  if (kvConfigured()) {
    const kv = await getKv();
    try {
      await kv.zadd(`${PREFIX}recent`, { score: createdAt, member: id });
    } catch {
      // indexing is best-effort; never fail link creation because of it
    }
  }
  // File store keeps full history; no separate index needed.
}

export async function createAndIndexPaymentLink(
  input: CreatePaymentLinkInput,
) {
  const link = await createPaymentLink(input);
  await indexRecentPayment(link.id, link.createdAt);
  return link;
}

// ── Pay Me profiles ────────────────────────────────────────────────────────

export interface PayMeProfile {
  handle: string; // lowercase, URL-safe
  name: string;
  recipient: string;
  bio?: string;
  presetAmounts: string[];
  createdAt: number;
}

const PROFILE_PREFIX = "profile:";

function profileKey(handle: string) {
  return `${PROFILE_PREFIX}${handle}`;
}

export async function saveProfile(profile: PayMeProfile): Promise<PayMeProfile> {
  if (kvConfigured()) {
    const kv = await getKv();
    await kv.set(profileKey(profile.handle), profile, { ex: EXPIRY_SECONDS });
  } else {
    const map = await readFileStore();
    // File store only holds payments; persist profiles to a side file.
    const profPath = path.join(process.cwd(), ".data", "profiles.json");
    let profiles: Record<string, PayMeProfile> = {};
    try {
      profiles = JSON.parse(await fs.readFile(profPath, "utf8"));
    } catch {
      profiles = {};
    }
    profiles[profile.handle] = profile;
    await fs.mkdir(path.dirname(profPath), { recursive: true });
    await fs.writeFile(profPath, JSON.stringify(profiles, null, 2));
  }
  return profile;
}

export async function getProfile(
  handle: string,
): Promise<PayMeProfile | null> {
  if (kvConfigured()) {
    const kv = await getKv();
    return (await kv.get<PayMeProfile>(profileKey(handle))) ?? null;
  }
  try {
    const profPath = path.join(process.cwd(), ".data", "profiles.json");
    const profiles: Record<string, PayMeProfile> = JSON.parse(
      await fs.readFile(profPath, "utf8"),
    );
    return profiles[handle] ?? null;
  } catch {
    return null;
  }
}
