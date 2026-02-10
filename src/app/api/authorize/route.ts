import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Log } from "@/lib/models/Log";

/**
 * NASA Bridge: /api/authorize
 * Secondary authorize endpoint (some versions call this instead of authorize_db).
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") ||
               "unknown";

    await Log.create({
      licenseKey: "nasa-auth",
      action: "nasa_authorize",
      ip,
      hwid: "",
      details: `NASA authorize request from ${ip}`,
    });

    return NextResponse.json({
      status: "active",
      message: "License valid",
      key: "nasa",
      data: {
        license_data: {
          windows: [],
          remaining_days: 9999,
          plan: "ultimate",
          tier: "ultimate",
        },
      },
    });
  } catch (err: any) {
    console.error("NASA authorize error:", err);
    return NextResponse.json({
      status: "active",
      message: "License valid",
      key: "nasa",
      data: {
        license_data: { windows: [], remaining_days: 9999 },
      },
    });
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
