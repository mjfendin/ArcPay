import { NextRequest, NextResponse } from "next/server";
import { getPaymentLink, updatePaymentLink } from "@/lib/store";
import { toPublicPaymentLink } from "@/lib/types";
import { confirmTransaction } from "@/lib/verify";
import { dispatchWebhook } from "@/lib/webhook";
import { amountToRaw } from "@/lib/usdc";

/**
 * POST /api/payments/[id]/confirm
 *
 * Client submits the transaction hash after the wallet signs. The server
 * checks the receipt and the decoded Transfer logs — the authoritative path
 * for marking a payment paid. Never trust client-side status.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const txHash = String(body?.txHash ?? "").trim();

  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return NextResponse.json(
      { error: "Invalid transaction hash" },
      { status: 400 },
    );
  }

  const link = await getPaymentLink(id);
  if (!link) {
    return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
  }

  if (link.status === "paid") {
    return NextResponse.json({ ...toPublicPaymentLink(link), duplicate: true });
  }
  if (link.status !== "pending") {
    return NextResponse.json(
      { error: `Payment is ${link.status}` },
      { status: 409 },
    );
  }

  try {
    const amountRaw = amountToRaw(link.amount, link.currency);
    const result = await confirmTransaction(link, amountRaw, txHash as `0x${string}`);

    if (result.confirmed && result.matched) {
      const updated = await updatePaymentLink(id, {
        status: "paid",
        payer: result.payer,
        txHash: result.txHash,
        paidAt: Date.now(),
        paidAmountRaw: result.actualAmountRaw?.toString(),
      });
      if (updated) {
        void dispatchWebhook(updated, "payment.completed");
        return NextResponse.json(toPublicPaymentLink(updated));
      }
    }

    if (result.confirmed && !result.matched) {
      return NextResponse.json(
        {
          error:
            "Transaction confirmed, but it did not transfer the exact USDC amount to the recipient.",
          status: "pending",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Transaction not confirmed yet. The payment will be detected automatically once confirmed.",
        status: "pending",
      },
      { status: 409 },
    );
  } catch (e) {
    console.error("confirm failed", e);
    return NextResponse.json(
      { error: "Failed to confirm transaction" },
      { status: 500 },
    );
  }
}
