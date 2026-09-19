"use client";

import { useState } from "react";
import Image from "next/image";
import { ARCPAY_ADDRESS } from "@/lib/arc";

function CopyIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="7" y="7" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-6A1.5 1.5 0 0 0 4 5.5v6A1.5 1.5 0 0 0 5.5 13H7"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

function CheckIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16.7 5.3 7.5 14.5 3.3 10.3l1.4-1.4 2.8 2.8 7.8-7.8 1.4 1.4z"
        fill="currentColor"
      />
    </svg>
  );
}

function ExternalIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M11 4h5v5M16 4l-7 7M8 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5V12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TokenAddressBar() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(ARCPAY_ADDRESS);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy address:", ARCPAY_ADDRESS);
    }
  }

  return (
    <section
      className="w-full card-surface p-5 sm:p-6 fade-in"
      aria-label="ARCPAY token contract address"
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="relative w-12 h-12 rounded-full overflow-hidden ring-1 ring-border bg-white shrink-0 shadow-sm">
          <Image
            src="/logo-64.png"
            alt="ARCPAY logo"
            width={48}
            height={48}
            className="object-cover"
            priority
          />
        </div>

        {/* Main info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              ARCPAY
            </h2>
            <span className="badge badge-success">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Live on Argus
            </span>
          </div>
          <p className="mt-0.5 text-sm text-muted leading-relaxed">
            Payment token on Arc Mainnet
          </p>

          {/* Address + copy */}
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 min-w-0 rounded-lg border border-border bg-background/60 px-3 py-2.5 text-xs mono text-foreground/80 truncate select-all">
              {ARCPAY_ADDRESS}
            </code>
            <button
              onClick={copy}
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-xs font-semibold transition-colors ${
                copied
                  ? "bg-success text-white"
                  : "bg-foreground text-background hover:opacity-90"
              }`}
            >
              {copied ? <CheckIcon /> : <CopyIcon />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>

        {/* Argus link */}
        <a
          href={`https://argus.world/token/${ARCPAY_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground transition-colors"
        >
          <ExternalIcon />
          View on Argus
        </a>
      </div>
    </section>
  );
}
