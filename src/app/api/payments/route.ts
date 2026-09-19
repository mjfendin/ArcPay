import { NextRequest, NextResponse } from "next/server";
import { parseUnits } from "viem";
import { createAndIndexPaymentLink } from "@/lib/store";
import { toPublicPaymentLink } from "@/lib/types";
import { isValidAddress, usdcToRaw } from "@/lib/usdc";
import { isMainnet } from "@/lib/arc";

/**
 * POST /api/payments
 *
 * Create a payment link. The generated page is public (no auth required to
 * pay), but creation validates the recipient + amount before persisting.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 },
      );
    }

    const recipient = String(body.recipient ?? "").trim();
    const amount = String(body.amount ?? "").trim();
    const currency = String(body.currency ?? "USDC").toUpperCase();
    const description = String(body.description ?? "").trim().slice(0, 280);
    const recipientName = String(body.recipientName ?? "").trim().slice(0, 80);
    const customerName = String(body.customerName ?? "").trim().slice(0, 80);
    const reference = String(body.reference ?? "").trim().slice(0, 120);
    const successMessage = String(body.successMessage ?? "")
      .trim()
      .slice(0, 280);
    const type = String(body.type ?? "request").slice(0, 20);

    if (currency !== "USDC" && currency !== "ARCPAY") {
      return NextResponse.json(
        { error: "Currency must be USDC or ARCPAY." },
        { status: 400 },
      );
    }

    if (!isValidAddress(recipient)) {
      return NextResponse.json(
        { error: "Invalid recipient address — must be a 0x... EVM address." },
        { status: 400 },
      );
    }

    let amountRaw: bigint;
    try {
      amountRaw = currency === "USDC" ? usdcToRaw(amount) : parseUnits(amount, 18);
    } catch {
      return NextResponse.json(
        {
          error:
            currency === "USDC"
              ? "Amount must be a positive number with up to 6 decimals."
              : "Amount must be a positive number with up to 18 decimals.",
        },
        { status: 400 },
      );
    }
    if (amountRaw <= 0n) {
      return NextResponse.json(
        { error: "Amount must be greater than zero." },
        { status: 400 },
      );
    }

    let expiresAt: number | null = null;
    if (body.expiresAt != null) {
      const n = Number(body.expiresAt);
      if (Number.isFinite(n) && n > Date.now()) expiresAt = n;
    }

    const link = await createAndIndexPaymentLink({
      type: ["request", "payme", "donation", "invoice", "checkout", "tip"].includes(
        type,
      )
        ? (type as Parameters<typeof createAndIndexPaymentLink>[0]["type"])
        : "request",
      recipient: recipient.toLowerCase(),
      recipientName: recipientName || undefined,
      amount,
      currency: currency as "USDC" | "ARCPAY",
      description,
      customerName: customerName || undefined,
      reference: reference || undefined,
      expiresAt,
      successMessage: successMessage || undefined,
      tipEnabled: Boolean(body.tipEnabled),
      presetAmounts: Array.isArray(body.presetAmounts)
        ? body.presetAmounts.map(String).slice(0, 8)
        : undefined,
      createdBy: body.createdBy ? String(body.createdBy) : undefined,
    });

    const url = `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/pay/${link.id}`;

    return NextResponse.json({
      ...toPublicPaymentLink(link),
      url,
      network: isMainnet() ? "arc-mainnet" : "arc-testnet",
    });
  } catch (e) {
    console.error("POST /api/payments failed", e);
    return NextResponse.json(
      { error: "Failed to create payment request" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // GET /api/payments?recipient=0x... — per-user dashboard.
  const recipient = request.nextUrl.searchParams.get("recipient");
  if (recipient) {
    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      return NextResponse.json({ error: "Invalid recipient" }, { status: 400 });
    }
    const { listPaymentsByRecipient } = await import("@/lib/store");
    const links = await listPaymentsByRecipient(recipient, 50);
    return NextResponse.json({ payments: links.map(toPublicPaymentLink) });
  }

  // GET /api/payments?list=1 — recent links (legacy/admin).
  if (request.nextUrl.searchParams.get("list") === "1") {
    const { listRecentPayments } = await import("@/lib/store");
    const links = await listRecentPayments(50);
    return NextResponse.json({ payments: links.map(toPublicPaymentLink) });
  }
  return NextResponse.json(
    { error: "Method not allowed" },
    { status: 405 },
  );
}
