import {
  createPublicClient,
  formatUnits,
  http,
  parseAbi,
  parseEventLogs,
} from "viem";
import { arc, arcTestnet } from "viem/chains";
import { getServerRpcUrl, USDC_ADDRESS, ARCPAY_ADDRESS } from "./arc";
import type { NetworkMode } from "./arc";
import type { PaymentLink } from "./types";

/**
 * On-chain verification for Arc USDC payments.
 *
 * SECURITY RULES:
 *  - A payment is "paid" ONLY when a USDC Transfer event with the exact
 *    expected amount is observed to the recipient address in a confirmed
 *    block, after the link was created.
 *  - We never mark a payment paid from the client; the client reports a tx
 *    hash and the server confirms it.
 */

const ERC20 = parseAbi([
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

function clientFor(network: NetworkMode) {
  return createPublicClient({
    chain: network === "mainnet" ? arc : arcTestnet,
    transport: http(getServerRpcUrl()),
  });
}

export function networkFromLink(link: PaymentLink): NetworkMode {
  // All links in this deployment are created on the active network. Kept
  // explicit so a future multi-network deployment can store the chain id on
  // the link and branch here.
  return process.env.NEXT_PUBLIC_NETWORK === "arc-testnet"
    ? "testnet"
    : "mainnet";
}

export interface VerificationResult {
  paid: boolean;
  status: "pending" | "paid";
  payer?: string;
  txHash?: string;
  paidAt?: number;
  actualAmountRaw?: bigint;
  amountRaw?: bigint;
  recipient: string;
  fromBlock: bigint;
  toBlock: bigint;
  transfers: Array<{
    from: string;
    to: string;
    value: bigint;
    txHash: string;
    blockNumber: bigint;
  }>;
}

export async function verifyPayment(
  link: PaymentLink,
  amountRaw: bigint,
): Promise<VerificationResult> {
  const client = clientFor(networkFromLink(link));
  const tokenAddress =
    link.currency === "ARCPAY" ? ARCPAY_ADDRESS : USDC_ADDRESS;

  const amount = amountRaw;
  const recipient = link.recipient.toLowerCase();

  // Arc's public RPC rejects large block ranges, so we scan in small windows
  // going backwards from the latest block. We only need to find ONE exact
  // transfer to the recipient — stop as soon as it is found. We cap the
  // scan at the most recent ~1,000,000 blocks (~11 days at sub-second
  // block times) to keep verification fast.
  const latestBlock = await client.getBlockNumber();
  const WINDOW = 100n;
  const MAX_SCAN = 1_000_000n;
  let cursor = latestBlock;
  const earliest = latestBlock - MAX_SCAN > 0n ? latestBlock - MAX_SCAN : 0n;
  const transfers: Array<{
    from: string;
    to: string;
    value: bigint;
    txHash: string;
    blockNumber: bigint;
  }> = [];

  while (cursor > 0n) {
    const fromBlock = cursor - WINDOW > 0n ? cursor - WINDOW : 0n;
    const toBlock = cursor;

    let logs;
    try {
      logs = await client.getLogs({
        address: tokenAddress,
        event: ERC20[2], // Transfer
        args: { to: link.recipient as `0x${string}` },
        fromBlock,
        toBlock,
      });
    } catch (e) {
      // Public RPCs rate-limit; wait and retry a few times before giving up.
      let retried = false;
      for (let attempt = 0; attempt < 3 && !retried; attempt++) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        try {
          logs = await client.getLogs({
            address: tokenAddress,
            event: ERC20[2],
            args: { to: link.recipient as `0x${string}` },
            fromBlock,
            toBlock,
          });
          retried = true;
        } catch {
          // continue retrying
        }
      }
      if (!retried) {
        // Give up on this window; move to the next one. Verification stays
        // pending and the next poll will try again.
        if (fromBlock === 0n || fromBlock <= earliest) break;
        cursor = fromBlock - 1n;
        continue;
      }
    }

    for (const log of logs ?? []) {
      transfers.push({
        from: log.args.from as string,
        to: log.args.to as string,
        value: log.args.value as bigint,
        txHash: log.transactionHash ?? "",
        blockNumber: log.blockNumber ?? 0n,
      });
    }

    const exact = transfers.find((t) => t.value === amount);
    if (exact) {
      return {
        paid: true,
        status: "paid",
        payer: exact.from,
        txHash: exact.txHash,
        paidAt: Date.now(),
        actualAmountRaw: exact.value,
        amountRaw: amount,
        recipient,
        fromBlock: 0n,
        toBlock: latestBlock,
        transfers,
      };
    }

    if (fromBlock === 0n || fromBlock <= earliest) break;
    cursor = fromBlock - 1n;
  }

  return {
    paid: false,
    status: "pending",
    recipient,
    amountRaw: amount,
    fromBlock: 0n,
    toBlock: latestBlock,
    transfers,
  };
}

export function rawToHuman(raw: bigint | string | number | undefined): string {
  if (raw === undefined) return "0";
  return formatUnits(BigInt(raw), 6);
}

export interface TxConfirmationResult {
  confirmed: boolean;
  matched: boolean;
  status: "pending" | "paid";
  payer?: string;
  txHash: string;
  recipient: string;
  amountRaw: bigint;
  actualAmountRaw?: bigint;
  blockNumber?: bigint;
}

/**
 * Confirm a client-submitted transaction hash actually moved the exact USDC
 * amount to the recipient. This is the authoritative server-side check used
 * by POST /api/payments/[id]/confirm — the client can never mark a payment
 * paid on its own.
 */
export async function confirmTransaction(
  link: PaymentLink,
  amountRaw: bigint,
  txHash: `0x${string}`,
): Promise<TxConfirmationResult> {
  const client = clientFor(networkFromLink(link));
  const tokenAddress =
    link.currency === "ARCPAY" ? ARCPAY_ADDRESS : USDC_ADDRESS;
  const receipt = await client.getTransactionReceipt({ hash: txHash });

  if (!receipt || receipt.status !== "success") {
    return {
      confirmed: false,
      matched: false,
      status: "pending",
      txHash,
      recipient: link.recipient.toLowerCase(),
      amountRaw,
    };
  }

  const logs = parseEventLogs({
    abi: ERC20,
    eventName: "Transfer",
    logs: receipt.logs,
  });

  const match = logs.find(
    (log) =>
      log.address.toLowerCase() === tokenAddress.toLowerCase() &&
      log.args.to?.toLowerCase() === link.recipient.toLowerCase() &&
      log.args.value === amountRaw,
  );

  return {
    confirmed: true,
    matched: Boolean(match),
    status: match ? "paid" : "pending",
    payer: match?.args.from,
    txHash,
    recipient: link.recipient.toLowerCase(),
    amountRaw,
    actualAmountRaw: match?.args.value,
    blockNumber: receipt.blockNumber,
  };
}
