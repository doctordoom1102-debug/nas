import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";

// POST — public key generation (no auth, unlimited, custom key name)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json().catch(() => ({}));
    const customKey = (body.key || "").trim().toUpperCase();

    if (!customKey) {
      return NextResponse.json(
        { error: "Please enter a key name." },
        { status: 400 }
      );
    }

    // Must be at least 6 chars so final key (NASA-XXXXXX) is > 10 chars
    // which is required for the desktop app to detect it
    if (customKey.length < 6 || customKey.length > 50) {
      return NextResponse.json(
        { error: "Key must be between 6 and 50 characters." },
        { status: 400 }
      );
    }

    // Format the key: add NASA- prefix if not present
    let finalKey = customKey;
    if (!finalKey.startsWith("NASA-")) {
      finalKey = "NASA-" + finalKey;
    }

    // Check if key already exists
    const existing = await License.findOne({ key: finalKey });
    if (existing) {
      return NextResponse.json(
        { error: `Key "${finalKey}" already exists. Choose a different name.` },
        { status: 409 }
      );
    }

    await License.create({
      key: finalKey,
      status: "active",
      tier: "basic",
      notes: "GENERATED",
      expiresAt: null,
      createdBy: null,
      approvedBy: null,
    });

    return NextResponse.json({
      success: true,
      key: finalKey,
      message: "Key generated successfully!",
    });
  } catch (err: any) {
    console.error("Key generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate key. Try again." },
      { status: 500 }
    );
  }
}
