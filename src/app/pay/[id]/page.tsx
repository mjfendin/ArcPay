import type { Metadata } from "next";
import { getPaymentLink } from "@/lib/store";
import { toPublicPaymentLink } from "@/lib/types";
import { displayUsdc } from "@/lib/usdc";
import { BrandHeader } from "@/components/brand-header";
import { PayPageClient } from "@/components/pay-page-client";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const link = await getPaymentLink(id);
  if (!link) {
    return { title: "Payment link not found — ArcPay" };
  }
  const amount = displayUsdc(link.amount);
  const payee = link.recipientName || "merchant";
  const currency = link.currency || "USDC";
  return {
    title: `Pay ${amount} ${currency} — ${payee}`,
    description: link.description || `Secure ${currency} payment on Arc.`,
    openGraph: {
      title: `Pay ${amount} ${currency}`,
      description: link.description || "Powered by Arc",
    },
  };
}

export default async function PayPage({ params }: Props) {
  const { id } = await params;
  const link = await getPaymentLink(id);

  if (!link) {
    return (
      <div className="flex flex-col flex-1 items-center px-5">
        <div className="w-full max-w-md">
          <BrandHeader compact />
          <div className="card-surface p-8 text-center">
            <h1 className="text-xl font-semibold">Payment link not found</h1>
            <p className="mt-2 text-sm text-muted">
              This link may be invalid or expired.
            </p>
            <a href="/" className="btn-primary mt-6 no-underline inline-flex items-center gap-2">
              Back to home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center px-5 py-8">
      <div className="w-full max-w-md">
        <BrandHeader compact showTag={false} />
        <PayPageClient initialLink={toPublicPaymentLink(link)} />
      </div>
    </div>
  );
}
