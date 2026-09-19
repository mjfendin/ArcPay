import { NextRequest, NextResponse } from "next/server";
import { getPaymentLink, updatePaymentLink } from "@/lib/store";
import { toPublicPaymentLink } from "@/lib/types";

/**
 * GET /api/payments/[id]
 * Public: the pay page needs this data without auth.
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

  // Expire stale links lazily on read.
  if (link.status === "pending" && link.expiresAt && link.expiresAt < Date.now()) {
    const updated = await updatePaymentLink(id, { status: "expired" });
    if (updated) return NextResponse.json(toPublicPaymentLink(updated));
  }

  return NextResponse.json(toPublicPaymentLink(link));
}

/**
 * PATCH /api/payments/[id]
 * Recipient-only controls (MVP: cancel). Auth arrives in a later phase with
 * the merchant dashboard login; for now cancellation is explicitly opt-in
 * and requires the exact recipient address to discourage abuse.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const link = await getPaymentLink(id);
  if (!link) {
    return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
  }

  const action = String(body?.action ?? "");
  if (action === "cancel") {
    if (link.status !== "pending") {
      return NextResponse.json(
        { error: `Cannot cancel a ${link.status} payment` },
        { status: 409 },
      );
    }
    const updated = await updatePaymentLink(id, { status: "cancelled" });
    return NextResponse.json(toPublicPaymentLink(updated!));
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
