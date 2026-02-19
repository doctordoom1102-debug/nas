import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { IrctcToken } from "@/lib/models/IrctcToken";
import { Log } from "@/lib/models/Log";

/**
 * NASA Control: POST /api/v1/post-token
 * APK (GADAR overlay) calls this to submit tokens for a clientID.
 *
 * Request body: { username?: string, clientID?: string, tokens: string[] }
 * Token format: "6,a" prefixed sensor strings (>500 chars)
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ||
      req.headers.get("x-real-ip") ||
      "unknown";

    let body: { username?: string; clientID?: string; tokens?: string[] } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON" },
        { status: 400 }
      );
    }

    const clientID = body.clientID || body.username || "";
    const tokens = Array.isArray(body.tokens) ? body.tokens : [];

    if (!clientID) {
      return NextResponse.json(
        { success: false, message: "clientID or username required" },
        { status: 400 }
      );
    }

    let saved = 0;
    for (const t of tokens) {
      if (
        typeof t === "string" &&
        t.includes("6,a") &&
        t.length > 500
      ) {
        await IrctcToken.create({ clientID, token: t });
        saved++;
      }
    }

    await Log.create({
      licenseKey: clientID,
      action: "apk_token_post",
      ip,
      hwid: "",
      details: `APK sent ${saved} tokens for ${clientID}`,
    });

    return NextResponse.json({
      success: true,
      message: "Tokens received",
      count: saved,
    });
  } catch (err: any) {
    console.error("post-token error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
