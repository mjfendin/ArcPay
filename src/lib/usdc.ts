import { parseUnits } from "viem";

export const USDC_DECIMALS = 6;

/**
 * Convert a human USDC amount ("25.00") to 6-decimal raw units.
 * Throws on invalid input — never silently produce a wrong transfer amount.
 */
export function usdcToRaw(amount: string | number): bigint {
  const s = typeof amount === "number" ? String(amount) : amount;
  if (!/^\d+(\.\d{1,6})?$/.test(s.trim())) {
    throw new Error("Invalid USDC amount");
  }
  return parseUnits(s.trim(), USDC_DECIMALS);
}

/** Convert 6-decimal raw units back to a human string ("25.00"). */
export function rawToUsdc(raw: bigint): string {
  const s = raw.toString().padStart(USDC_DECIMALS + 1, "0");
  const int = s.slice(0, -USDC_DECIMALS);
  const frac = s.slice(-USDC_DECIMALS);
  return `${int}.${frac}`.replace(/\.?0+$/, "") || "0";
}

export function formatUsd(amount: string | number, maxDecimals = 2): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: maxDecimals,
  }).format(n);
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 2) return address || "";
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function isValidAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

/** Human-friendly amount for UI ("25" not "25.00" when clean). */
export function displayUsdc(amount: string | number): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return String(amount);
  return n.toLocaleString("en-US", { maximumFractionDigits: 6 });
}
