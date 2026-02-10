import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Log } from "@/lib/models/Log";

/**
 * NASA Bridge: /api/token
 *
 * Handles IRCTC token/cookie exchange.
 * NASA calls: GET /token?key={license_key}
 *   - To fetch stored IRCTC session tokens from the server
 * NASA calls: POST /token?key={license_key}
 *   - To send captured IRCTC session tokens to the server
 *
 * For now, this returns empty (no tokens on server) for GET,
 * and accepts/logs any POSTed tokens.
 */

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const key = req.nextUrl.searchParams.get("key") || "unknown";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") ||
               "unknown";

    await Log.create({
      licenseKey: key,
      action: "nasa_token_get",
      ip,
      hwid: "",
      details: `Token request for key: ${key}`,
    });

    // Return empty — no tokens on server
    return NextResponse.json({
      tokens: [],
      count: 0,
    });
  } catch (err: any) {
    console.error("Token GET error:", err);
    return NextResponse.json({ tokens: [], count: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const key = req.nextUrl.searchParams.get("key") || "unknown";
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") ||
               "unknown";

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // might not be JSON
    }

    await Log.create({
      licenseKey: key,
      action: "nasa_token_post",
      ip,
      hwid: "",
      details: `Token submission for key: ${key}, data: ${JSON.stringify(body).slice(0, 2000)}`,
    });

    return NextResponse.json({
      success: true,
      message: "Tokens received",
    });
  } catch (err: any) {
    console.error("Token POST error:", err);
    return NextResponse.json({ success: true });
  }
}
