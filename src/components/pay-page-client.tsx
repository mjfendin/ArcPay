"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useAccount,
  useConnect,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";
import { formatUnits, parseUnits } from "viem";
import { getActiveChain, getActiveChainId, getExplorerTxUrl, USDC_ABI, USDC_ADDRESS, ERC20_ABI, ARCPAY_ADDRESS } from "@/lib/arc";
import { displayUsdc, formatUsd, shortenAddress } from "@/lib/usdc";
import type { PaymentLinkPublic } from "@/lib/types";
import { PaymentQRCode } from "@/components/payment-qr-code";
import { SharePaymentLink } from "@/components/share-payment-link";

type Stage = "idle" | "submitted" | "confirming" | "complete";

function CheckIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16.7 5.3 7.5 14.5 3.3 10.3l1.4-1.4 2.8 2.8 7.8-7.8 1.4 1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PayPageClient({
  initialLink,
  demo = false,
}: {
  initialLink: PaymentLinkPublic;
  demo?: boolean;
}) {
  const [link, setLink] = useState(initialLink);
  const [stage, setStage] = useState<Stage>(
    initialLink.status === "paid" ? "complete" : "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(
    initialLink.txHash ? (initialLink.txHash as `0x${string}`) : null,
  );

  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending: connecting } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();

  // QR scans open with ?pay=1 — auto-connect the wallet and pre-arm the pay
  // flow so the payer only has to approve the transfer in their wallet.
  const autoPayRequested = useMemo(() => {
    if (typeof window === "undefined") return false;
    const q = new URLSearchParams(window.location.search);
    return q.get("pay") === "1";
  }, []);

  useEffect(() => {
    if (autoPayRequested && !demo && !isConnected && connectors[0]) {
      connect({ connector: connectors[0] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPayRequested, demo, isConnected, connectors]);

  const chainId = getActiveChainId();
  const isARCPAY = link.currency === "ARCPAY";
  const tokenDecimals = isARCPAY ? 18 : 6;
  const tokenAddress = isARCPAY ? ARCPAY_ADDRESS : USDC_ADDRESS;
  const tokenAbi = isARCPAY ? ERC20_ABI : USDC_ABI;
  const amountRaw = useMemo(
    () => parseUnits(link.amount, tokenDecimals),
    [link.amount, tokenDecimals],
  );

  // Authoritative balance via our server API (server reads Arc RPC directly).
  const [balanceRaw, setBalanceRaw] = useState<bigint | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBalanceRaw(null);
      return;
    }
    setBalanceLoading(true);
    try {
      const res = await fetch(
        `/api/balance?address=${encodeURIComponent(address)}&token=${encodeURIComponent(link.currency)}`,
      );
      const data = await res.json();
      if (res.ok && data.balanceRaw != null) {
        setBalanceRaw(BigInt(data.balanceRaw));
      } else {
        setBalanceRaw(null);
      }
    } catch {
      setBalanceRaw(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [address, link.currency]);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const { data: receipt, isLoading: waitingReceipt } =
    useWaitForTransactionReceipt({
      hash: txHash ?? undefined,
      chainId,
      query: { enabled: Boolean(txHash) },
    });

  // Poll server verification while the transaction confirms.
  useEffect(() => {
    if (stage !== "submitted" || !txHash) return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/payments/${link.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "paid") {
          setLink(data);
          setStage("complete");
          setError(null);
          void refreshBalance();
          clearInterval(t);
        }
      }
    }, 2500);
    return () => clearInterval(t);
  }, [stage, txHash, link.id]);

  // Poll on-chain status for pending links. This catches payments made
  // directly from a wallet app after scanning the QR (no web transaction
  // submitted through our UI). It also recovers when a web transaction is
  // stuck in "submitted" because the receipt never arrived locally.
  useEffect(() => {
    if (link.status !== "pending") return;
    const t = setInterval(async () => {
      const res = await fetch(`/api/payments/${link.id}/verify`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === "paid") {
          setLink(data);
          setStage("complete");
          setError(null);
          void refreshBalance();
          clearInterval(t);
        }
      }
    }, 4000);
    return () => clearInterval(t);
  }, [link.id, link.status]);

  // When the local receipt confirms, let the server do the authoritative check.
  useEffect(() => {
    if (receipt && receipt.status === "success" && stage !== "complete") {
      setStage("confirming");
      fetch(`/api/payments/${link.id}/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.status === "paid") {
            setLink(data);
            setStage("complete");
            setError(null);
            void refreshBalance();
          } else if (data.error) {
            setError(data.error);
          }
        })
        .catch(() => {});
    }
  }, [receipt, stage, txHash, link.id]);

  const insufficientBalance =
    link.status !== "paid" &&
    isConnected &&
    balanceRaw !== null &&
    balanceRaw < amountRaw;

  async function ensureCorrectChain() {
    const active = getActiveChain();
    await switchChainAsync({ chainId: active.id });
  }

  // After a QR scan (?pay=1) connects a wallet, auto-switch it to Arc so the
  // payer sees the Confirm payment button immediately.
  useEffect(() => {
    if (autoPayRequested && isConnected && link.status === "pending") {
      void ensureCorrectChain().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPayRequested, isConnected, link.status]);

  async function handlePay() {
    if (demo) return; // hard block — never allow a real transfer from demo mode
    setError(null);
    if (!isConnected) {
      // Open the first available connector (injected / multi-wallet).
      if (connectors[0]) {
        connect({ connector: connectors[0] });
      } else {
        setError("No EVM wallet detected. Install MetaMask or another wallet.");
      }
      return;
    }
    try {
      await ensureCorrectChain();
      const tx = await writeContractAsync({
        abi: tokenAbi,
        address: tokenAddress,
        functionName: "transfer",
        args: [link.recipient as `0x${string}`, amountRaw],
        chainId,
      });
      setTxHash(tx);
      setStage("submitted");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Transaction failed. Please try again.",
      );
    }
  }

  const payLabel = `Pay ${displayUsdc(link.amount)} ${link.currency}`;

  if (link.status === "expired") {
    return (
      <div className="card-surface p-8 text-center">
        <h2 className="text-2xl font-semibold">Payment expired</h2>
        <p className="mt-2 text-muted">
          This payment request is no longer available.
        </p>
      </div>
    );
  }

  if (link.status === "cancelled") {
    return (
      <div className="card-surface p-8 text-center">
        <h2 className="text-2xl font-semibold">Payment cancelled</h2>
        <p className="mt-2 text-muted">
          The merchant cancelled this payment request.
        </p>
      </div>
    );
  }

  return (
    <div className="card-surface p-6 sm:p-8 w-full max-w-md fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">Pay {link.recipientName || "merchant"}</span>
        {link.status === "paid" ? (
          <span className="badge badge-success">
            <CheckIcon className="w-3.5 h-3.5" />
            Paid
          </span>
        ) : (
          <span className="badge badge-warning">
            <span className="w-1.5 h-1.5 rounded-full bg-current" />
            Pending
          </span>
        )}
      </div>

      <div className="mt-6 text-center">
        <div className="text-[40px] font-semibold tracking-tight leading-none tabular-nums">
          {formatUsd(link.amount)}
        </div>
        <div className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-muted">
          <span
            className={`w-2 h-2 rounded-full ${
              isARCPAY ? "bg-[#8B5CF6]" : "bg-[#2775CA]"
            }`}
          />
          {displayUsdc(link.amount)} {link.currency}
        </div>
        {link.description && (
          <p className="mt-4 text-sm text-muted leading-relaxed">
            {link.description}
          </p>
        )}
      </div>

      <div className="mt-8 space-y-2.5 text-sm border-t border-border pt-5">
        <div className="flex justify-between items-center">
          <span className="text-muted">Recipient</span>
          <span className="font-medium mono">{shortenAddress(link.recipient, 6)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted">Network</span>
          <span className="font-medium">Arc Mainnet</span>
        </div>
        {isConnected && (
          <div className="flex justify-between items-center">
            <span className="text-muted">Your balance</span>
            {balanceLoading ? (
              <span className="flex items-center gap-1.5 text-muted">
                <span className="spinner" />
              </span>
            ) : balanceRaw !== null ? (
              <span
                className={`font-medium tabular-nums ${
                  insufficientBalance ? "text-danger" : ""
                }`}
              >
                {formatUnits(balanceRaw, tokenDecimals)} {link.currency}
              </span>
            ) : (
              <span className="text-muted">—</span>
            )}
          </div>
        )}
      </div>

      {/* Errors */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {insufficientBalance && link.status !== "paid" && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
          You don&apos;t have enough {link.currency} on Arc. Fund your wallet with{" "}
          {link.currency} on Arc, then try again.
        </div>
      )}

      {/* Status line */}
      {stage === "submitted" && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
          <span className="spinner" /> Payment submitted — waiting for
          confirmation…
        </div>
      )}
      {stage === "confirming" && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted">
          <span className="spinner" /> Confirming on Arc…
        </div>
      )}

      {stage === "complete" && link.status === "paid" ? (
        <div className="mt-8 space-y-4 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-success/10 flex items-center justify-center text-success">
            <CheckIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xl font-semibold tracking-tight">
              Payment successful
            </div>
            <p className="mt-1.5 text-sm text-muted">
              {displayUsdc(link.amount)} {link.currency} sent to{" "}
              {link.recipientName || shortenAddress(link.recipient)}
            </p>
          </div>
          {link.txHash && (
            <a
              href={getExplorerTxUrl(link.txHash as `0x${string}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full no-underline"
            >
              View transaction
            </a>
          )}
          <a href="/" className="btn-primary w-full no-underline">
            Done
          </a>
          <p className="pt-2 text-sm text-muted">
            Need to get paid too?{" "}
            <a href="/" className="font-medium underline">
              Create your payment link
            </a>
          </p>
        </div>
      ) : (
        <button
          onClick={handlePay}
          disabled={demo || connecting || waitingReceipt}
          className="btn-primary w-full h-12 mt-6"
        >
          {connecting && <span className="spinner" />}
          {waitingReceipt && <span className="spinner" />}
          {demo
            ? "Demo — payments disabled"
            : isConnected
              ? autoPayRequested
                ? `Confirm ${payLabel}`
                : payLabel
              : autoPayRequested
                ? "Connecting wallet…"
                : "Connect wallet to pay"}
        </button>
      )}

      <p className="mt-5 text-center text-xs text-muted">
        Secured by Arc · Fast settlement · USDC payments
      </p>

      {link.status === "pending" && (
        <div className="mt-6 border-t border-border pt-5 space-y-4">
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-medium text-muted">Scan to pay</p>
            <PaymentQRCode
              link={link}
              webUrl={
                typeof window !== "undefined"
                  ? `${window.location.origin}/pay/${link.id}`
                  : `/pay/${link.id}`
              }
            />
          </div>
          <SharePaymentLink link={link} />
        </div>
      )}
    </div>
  );
}
