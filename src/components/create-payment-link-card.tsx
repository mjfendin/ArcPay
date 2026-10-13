"use client";

import { useState } from "react";
import type { PaymentCurrency } from "@/lib/types";

export function CreatePaymentLinkCard() {
  const [amount, setAmount] = useState("25.00");
  const [currency, setCurrency] = useState<PaymentCurrency>("USDC");
  const [recipient, setRecipient] = useState("");
  const [description, setDescription] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isARCPAY = currency === "ARCPAY";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient,
          amount,
          currency,
          description,
          recipientName,
          type: "request",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create payment link");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="card-surface p-6 sm:p-7 space-y-5 w-full max-w-md fade-in"
    >
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight">Request payment</h2>
        <p className="text-sm text-muted leading-relaxed">
          Create a shareable payment link for USDC or ARCPAY. No account or
          wallet needed.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-foreground/90">
            {isARCPAY ? "Amount (ARCPAY)" : "Amount"}
          </span>
          <div className="relative">
            {!isARCPAY && (
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] font-medium text-muted select-none leading-none">
                $
              </span>
            )}
            <input
              className="input-base h-11 tabular-nums"
              style={{ paddingLeft: isARCPAY ? "0.875rem" : "2.5rem" }}
              type="number"
              step={isARCPAY ? "0.000001" : "0.001"}
              min={isARCPAY ? "0.000001" : "0.001"}
              placeholder={isARCPAY ? "385840" : "25.000"}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <span className="block text-[11px] text-muted leading-snug">
            {isARCPAY
              ? "Enter the token amount directly."
              : "Up to 6 decimals, e.g. 0.175."}
          </span>
        </label>

        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium text-foreground/90">
            Currency
          </span>
          <select
            className="input-base h-11 text-sm font-medium cursor-pointer"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as PaymentCurrency)}
          >
            <option value="USDC">USDC</option>
            <option value="ARCPAY">ARCPAY</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-foreground/90">
          Recipient wallet
        </span>
        <input
          className="input-base mono h-11 text-sm"
          placeholder="0x..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.trim())}
          spellCheck={false}
          required
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-foreground/90">
          What is this payment for?
        </span>
        <input
          className="input-base h-11"
          placeholder="Website development, invoice #1042, design work…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium text-foreground/90">
          Your display name{" "}
          <span className="font-normal text-muted">(optional)</span>
        </span>
        <input
          className="input-base h-11"
          placeholder="MJF Endin"
          value={recipientName}
          onChange={(e) => setRecipientName(e.target.value)}
        />
      </label>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30 px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <button type="submit" className="btn-primary w-full h-11" disabled={loading}>
        {loading && <span className="spinner" />}
        Generate payment link
      </button>
    </form>
  );
}
