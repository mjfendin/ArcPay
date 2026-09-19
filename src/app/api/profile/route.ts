import { NextRequest, NextResponse } from "next/server";
import { getProfile, saveProfile } from "@/lib/store";
import { isValidAddress } from "@/lib/usdc";

/**
 * POST /api/profile
 * Create or update a "Pay Me" profile — one permanent link users put in
 * their bio. Recipient address is required; handle is slugified.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const name = String(body.name ?? "").trim().slice(0, 80);
    const recipient = String(body.recipient ?? "").trim();
    const bio = String(body.bio ?? "").trim().slice(0, 200);
    const handleRaw = String(body.handle ?? name ?? "")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }
    if (!isValidAddress(recipient)) {
      return NextResponse.json(
        { error: "Invalid recipient address" },
        { status: 400 },
      );
    }
    if (!handleRaw) {
      return NextResponse.json(
        { error: "Could not derive a handle from the name" },
        { status: 400 },
      );
    }

    const profile = await saveProfile({
      handle: handleRaw,
      name,
      recipient: recipient.toLowerCase(),
      bio: bio || undefined,
      presetAmounts: Array.isArray(body.presetAmounts)
        ? body.presetAmounts.map(String).slice(0, 6)
        : ["5", "10", "25"],
      createdAt: Date.now(),
    });

    return NextResponse.json({
      ...profile,
      url: `${
        process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
      }/${profile.handle}`,
    });
  } catch (e) {
    console.error("POST /api/profile failed", e);
    return NextResponse.json(
      { error: "Failed to save profile" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const handle = request.nextUrl.searchParams.get("handle");
  if (!handle) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }
  const profile = await getProfile(handle.toLowerCase());
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
