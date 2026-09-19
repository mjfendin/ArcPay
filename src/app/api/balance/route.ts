import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { arc, arcTestnet } from "viem/chains";
import { getServerRpcUrl, USDC_ADDRESS, ARCPAY_ADDRESS, ARCPAY_DECIMALS } from "@/lib/arc";
import { isValidAddress } from "@/lib/usdc";

/**
 * GET /api/balance?address=0x...&token=USDC|ARCPAY
 *
 * Server-side token balance lookup on Arc. This is the authoritative path for
 * showing balances in the UI — the browser never needs to talk to the public
 * RPC directly, which avoids wallet RPC inconsistencies, CORS edge cases, and
 * public endpoint throttling.
 */
export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address || !isValidAddress(address)) {
    return NextResponse.json({ error: "Invalid address" }, { status: 400 });
  }

  const token = (request.nextUrl.searchParams.get("token") || "USDC").toUpperCase();
  if (token !== "USDC" && token !== "ARCPAY") {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  const isTestnet = process.env.NEXT_PUBLIC_NETWORK === "arc-testnet";
  const client = createPublicClient({
    chain: isTestnet ? arcTestnet : arc,
    transport: http(getServerRpcUrl()),
  });

  const tokenAddress = token === "ARCPAY" ? ARCPAY_ADDRESS : USDC_ADDRESS;
  const decimals = token === "ARCPAY" ? ARCPAY_DECIMALS : 6;

  try {
    const raw = await client.readContract({
      address: tokenAddress,
      abi: [
        {
          type: "function",
          name: "balanceOf",
          stateMutability: "view",
          inputs: [{ name: "account", type: "address" }],
          outputs: [{ type: "uint256" }],
        },
      ] as const,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    const value = (raw as bigint).toString();
    return NextResponse.json({
      address,
      balanceRaw: value,
      decimals,
      symbol: token,
      network: isTestnet ? "arc-testnet" : "arc-mainnet",
    });
  } catch (e) {
    console.error("balance lookup failed", e);
    return NextResponse.json(
      { error: "Failed to read balance" },
      { status: 502 },
    );
  }
}
