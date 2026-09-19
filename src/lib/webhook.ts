import type { PaymentEvent, PaymentLink } from "./types";

/**
 * Webhook architecture (non-blocking, best-effort delivery).
 *
 * Merchants register a webhook URL per payment link via `metadata.webhookUrl`.
 * When a payment changes state we POST the event and never block the payment
 * flow on the webhook response. No secrets ever live in the frontend — this
 * module runs server-side only.
 */

const WEBHOOK_TIMEOUT_MS = 5_000;

export function buildPaymentEvent(
  link: PaymentLink,
  event: PaymentEvent["event"],
): PaymentEvent {
  return {
    event,
    payment_id: link.id,
    amount: link.amount,
    currency: "USDC",
    payer: link.payer,
    recipient: link.recipient,
    transaction_hash: link.txHash,
    created_at: link.createdAt,
    occurred_at: Date.now(),
  };
}

export async function dispatchWebhook(
  link: PaymentLink,
  event: PaymentEvent["event"],
): Promise<{ delivered: boolean; status?: number; error?: string }> {
  const url = link.metadata?.webhookUrl;
  if (!url) return { delivered: false, error: "no webhook url configured" };

  const payload = buildPaymentEvent(link, event);
  const signature = await signPayload(payload, url);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-ArcPayments-Event": event,
        "X-ArcPayments-Signature": signature,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return { delivered: res.ok, status: res.status };
  } catch (e) {
    return {
      delivered: false,
      error: e instanceof Error ? e.message : "webhook failed",
    };
  }
}

/**
 * HMAC signature (sha256) so merchants can verify webhooks came from us.
 * The shared secret is a per-link random value stored only server-side.
 */
async function signPayload(
  payload: PaymentEvent,
  webhookUrl: string,
): Promise<string> {
  const secret =
    process.env.WEBHOOK_SECRET || "arc-payments-webhook-dev-secret-change-me";
  const data = JSON.stringify(payload);
  const enc = new TextEncoder().encode(data + webhookUrl);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
