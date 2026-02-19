import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { Setting } from "@/lib/models/Setting";

// POST — public key generation (no auth, unlimited, custom key name)
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const genSetting = await Setting.findOne({ key: "generate_page_enabled" }).lean();
    if (genSetting?.value === "false") {
      return NextResponse.json(
        { error: "Generate page access is currently disabled." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const finalKey = (body.key || "").trim();

    if (!finalKey) {
      return NextResponse.json(
        { error: "Please enter a key name." },
        { status: 400 }
      );
    }

    if (finalKey.length < 1 || finalKey.length > 100) {
      return NextResponse.json(
        { error: "Key must be between 1 and 100 characters." },
        { status: 400 }
      );
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
