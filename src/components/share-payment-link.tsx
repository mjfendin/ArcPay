"use client";

import { useState } from "react";
import {
  buildShareMessage,
  shareToEmail,
  shareToTelegram,
  shareToTwitter,
  shareToWhatsApp,
} from "@/lib/share";
import type { PaymentLinkPublic } from "@/lib/types";

export function SharePaymentLink({ link }: { link: PaymentLinkPublic }) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/pay/${link.id}`
      : `/pay/${link.id}`;
  const [copied, setCopied] = useState(false);

  const message = buildShareMessage({
    amount: link.amount,
    description: link.description,
    recipientName: link.recipientName,
    url,
  });

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", text);
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "USDC payment", text: message, url });
        return;
      } catch {
        // user cancelled — fall through
      }
    }
    copyText(message);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className="btn-secondary flex-1" onClick={() => copyText(url)}>
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button className="btn-secondary flex-1" onClick={nativeShare}>
          Share
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <a
          className="btn-secondary no-underline text-sm"
          href={shareToTwitter(message)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Share to X
        </a>
        <a
          className="btn-secondary no-underline text-sm"
          href={shareToTelegram(message)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Telegram
        </a>
        <a
          className="btn-secondary no-underline text-sm"
          href={shareToWhatsApp(message)}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
        <a
          className="btn-secondary no-underline text-sm"
          href={shareToEmail(message)}
        >
          Email
        </a>
      </div>

      <button
        className="btn-secondary w-full text-sm"
        onClick={() => copyText(message)}
      >
        Copy payment message
      </button>
    </div>
  );
}
