// ARCPAY price lookup — uses GeckoTerminal public API for on-chain pricing.

const ARCPAY_ADDRESS = "0xF8b688a3b2AE4793531877FE64f746b4C0f1c0b1";
const NETWORK = "arc";

export interface TokenPrice {
  priceUsd: number;
  decimals: number;
  symbol: string;
  source: string;
  fetchedAt: number;
}

/**
 * Fetch the current USD price of ARCPAY from GeckoTerminal.
 * Returns null on any failure so callers can fall back gracefully.
 */
export async function getARCPAYPriceUsd(): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.geckoterminal.com/api/v2/networks/${NETWORK}/tokens/${ARCPAY_ADDRESS}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 }, // cache 60s to stay within rate limits
      },
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: { attributes?: { price_usd?: string } };
    };
    const raw = json.data?.attributes?.price_usd;
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/**
 * Convert a token amount (human units) to its USD value.
 * USDC is treated as 1:1 with USD.
 */
export function amountToUsd(
  amount: string | number,
  currency: "USDC" | "ARCPAY",
  arcpayPriceUsd: number | null,
): number | null {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value) || value < 0) return null;
  if (currency === "USDC") return value;
  if (arcpayPriceUsd === null) return null;
  return value * arcpayPriceUsd;
}
