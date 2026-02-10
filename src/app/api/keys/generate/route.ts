import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { generateKey } from "@/lib/keygen";

// Rate-limit: max 3 keys per IP per hour (in-memory, resets on restart)
const ipLimits = new Map<string, { count: number; resetAt: number }>();
const MAX_PER_HOUR = 3;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    ipLimits.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= MAX_PER_HOUR) return false;
  entry.count++;
  return true;
}

// POST — public key generation (no auth, free demo)
export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Max 3 keys per hour." },
        { status: 429 }
      );
    }

    await connectDB();

    const key = generateKey();

    await License.create({
      key,
      status: "active",
      tier: "basic",
      notes: "FREE_DEMO",
      expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days expiry
      createdBy: null,
      approvedBy: null,
    });

    return NextResponse.json({
      success: true,
      key,
      expiresIn: "7 days",
      message: "Your free demo key has been generated!",
    });
  } catch (err: any) {
    console.error("Key generate error:", err);
    return NextResponse.json(
      { error: "Failed to generate key. Try again." },
      { status: 500 }
    );
  }
}
