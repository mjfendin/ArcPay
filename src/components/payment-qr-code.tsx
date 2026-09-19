"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import type { PaymentLinkPublic } from "@/lib/types";
import { displayUsdc } from "@/lib/usdc";

type QRMode = "wallet" | "web";

export function PaymentQRCode({
  link,
  webUrl,
  size = 176,
}: {
  link: PaymentLinkPublic;
  webUrl: string;
  size?: number;
}) {
  const [mode, setMode] = useState<QRMode>("wallet");
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);

  /**
   * "Wallet app" mode encodes the plain recipient address. This is the
   * universally-supported QR format: every wallet app accepts a bare 0x
   * address from a QR scan and fills the recipient field. The amount must be
   * entered manually (shown below the QR with a copy button).
   */
  const walletUri = useMemo(() => link.recipient, [link]);

  const webUri = useMemo(
    () => (webUrl.includes("?") ? `${webUrl}&pay=1` : `${webUrl}?pay=1`),
    [webUrl],
  );
  const activeUri = mode === "wallet" ? walletUri : webUri;

  useEffect(() => {
    let alive = true;
    setDataUrl(null);
    QRCode.toDataURL(activeUri, {
      width: size,
      margin: 1,
      color: { dark: "#111113", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((d) => {
        if (alive) setDataUrl(d);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [activeUri, size]);

  async function copyAmount() {
    try {
      await navigator.clipboard.writeText(displayUsdc(link.amount));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Amount to send:", displayUsdc(link.amount));
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex rounded-lg border border-border p-0.5 bg-card">
        <button
          type="button"
          onClick={() => setMode("wallet")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === "wallet"
              ? "bg-accent text-accent-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Wallet app
        </button>
        <button
          type="button"
          onClick={() => setMode("web")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            mode === "web"
              ? "bg-accent text-accent-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          Browser
        </button>
      </div>

      {error ? (
        <div
          className="flex items-center justify-center rounded-lg border border-border bg-card text-xs text-muted"
          style={{ width: size, height: size }}
        >
          QR unavailable
        </div>
      ) : !dataUrl ? (
        <div
          className="flex items-center justify-center rounded-lg border border-border bg-card"
          style={{ width: size, height: size }}
        >
          <span className="spinner text-muted" />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={
            mode === "wallet"
              ? "Scan with wallet app to fill recipient address"
              : "Scan to open payment page"
          }
          width={size}
          height={size}
          className="rounded-lg border border-border bg-white"
        />
      )}

      {mode === "wallet" && (
        <div className="w-full flex items-center justify-center gap-2 text-xs">
          <span className="text-muted">Amount to enter:</span>
          <span className="font-semibold tabular-nums">
            {displayUsdc(link.amount)} USDC
          </span>
          <button
            type="button"
            onClick={copyAmount}
            className="text-accent font-medium hover:underline"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}

      <p className="text-xs text-muted text-center">
        {mode === "wallet"
          ? "Scan with your wallet app — the recipient address fills automatically. Enter the amount shown above."
          : "Scan with a camera to open the payment page in your browser."}
      </p>
    </div>
  );
}
