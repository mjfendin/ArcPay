import { USDC_ADDRESS, ARC_MAINNET_ID, ARC_TESTNET_ID } from "./arc";
import type { PaymentLinkPublic } from "./types";

/**
 * EIP-681 / EIP-1328 payment URI.
 *
 * Wallet apps that support this standard parse the QR and open their send
 * screen pre-filled with:
 *   - token contract  : USDC (native predeploy on Arc)
 *   - chain           : Arc (5042 mainnet / 5042002 testnet)
 *   - recipient       : the merchant address
 *   - amount          : raw 6-decimal units (exact ERC-20 transfer amount)
 *
 * This is what lets a payer scan a QR and land directly in "confirm transfer"
 * instead of a web link.
 */
export function buildWalletPaymentUri(
  link: PaymentLinkPublic,
  network: "mainnet" | "testnet" = "mainnet",
): string {
  const chainId = network === "mainnet" ? ARC_MAINNET_ID : ARC_TESTNET_ID;
  const amountRaw = parseUsdcToRaw(link.amount);
  const params = new URLSearchParams({
    address: link.recipient,
    uint256: amountRaw.toString(),
  });
  return `ethereum:${USDC_ADDRESS}@${chainId}/transfer?${params.toString()}`;
}

/** Parse a decimal USDC amount into 6-decimal raw units (server-safe). */
function parseUsdcToRaw(amount: string): bigint {
  // amount is validated at creation time; still guard here.
  const s = amount.trim();
  const [int, frac = ""] = s.split(".");
  const whole = BigInt(int || "0");
  const fracPadded = (frac + "000000").slice(0, 6);
  return whole * 1_000_000n + BigInt(fracPadded || "0");
}
