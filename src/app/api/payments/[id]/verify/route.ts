import { NextRequest, NextResponse } from "next/server";
import { getPaymentLink, updatePaymentLink } from "@/lib/store";
import { toPublicPaymentLink } from "@/lib/types";
import { verifyPayment } from "@/lib/verify";
import { dispatchWebhook } from "@/lib/webhook";
import { amountToRaw } from "@/lib/usdc";

/**
 * GET /api/payments/[id]/verify
 * Polled by the pay page. Returns live on-chain status without trusting the
 * client. A link is "paid" only when the exact USDC amount has arrived at the
 * recipient address in a confirmed block.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const link = await getPaymentLink(id);
  if (!link) {
    return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
  }

  if (link.status === "pending") {
    try {
      const amountRaw = amountToRaw(link.amount, link.currency);
      const result = await verifyPayment(link, amountRaw);
      if (result.paid) {
        const updated = await updatePaymentLink(id, {
          status: "paid",
          payer: result.payer,
          txHash: result.txHash,
          paidAt: result.paidAt ?? Date.now(),
          paidAmountRaw: result.actualAmountRaw?.toString(),
        });
        if (updated) {
          void dispatchWebhook(updated, "payment.completed");
          return NextResponse.json(toPublicPaymentLink(updated));
        }
      }
    } catch (e) {
      console.error("verify failed", e);
      // Verification errors must not crash the poller; return current state.
    }
  }

  return NextResponse.json(toPublicPaymentLink(link));
}
