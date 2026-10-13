import { NextResponse } from "next/server";
import { getARCPAYPriceUsd } from "@/lib/price";

export const dynamic = "force-dynamic";

export async function GET() {
  const priceUsd = await getARCPAYPriceUsd();
  if (priceUsd === null) {
    return NextResponse.json(
      { error: "ARCPAY price unavailable", priceUsd: null },
      { status: 502 },
    );
  }
  return NextResponse.json({
    symbol: "ARCPAY",
    priceUsd,
    source: "GeckoTerminal",
    network: "arc",
    fetchedAt: Date.now(),
  });
}
