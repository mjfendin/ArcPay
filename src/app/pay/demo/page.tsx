import type { Metadata } from "next";
import { BrandHeader } from "@/components/brand-header";
import { PayPageClient } from "@/components/pay-page-client";
import type { PaymentLinkPublic } from "@/lib/types";

export const metadata: Metadata = {
  title: "Demo payment — ArcPay",
  description: "See how an Arc USDC payment link works.",
};

const demoLink: PaymentLinkPublic = {
  id: "demo",
  type: "request",
  recipient: "0x0000000000000000000000000000000000000001",
  recipientName: "Demo Merchant",
  amount: "5.00",
  currency: "USDC",
  description: "Demo payment — this is a preview.",
  createdAt: Date.now(),
  status: "pending",
};

export default function DemoPayPage() {
  return (
    <div className="flex flex-col flex-1 items-center px-5 py-8">
      <div className="w-full max-w-md">
        <BrandHeader compact showTag={false} />
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-700 dark:text-amber-400 mb-4">
          Demo mode — payments are disabled. No real USDC can be sent.
        </div>
        <PayPageClient initialLink={demoLink} demo />
      </div>
    </div>
  );
}
