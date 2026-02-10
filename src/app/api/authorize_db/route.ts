import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Log } from "@/lib/models/Log";

/**
 * NASA Bridge: /api/authorize_db
 *
 * NASA sends an encrypted+HMAC'd payload to this endpoint for license validation.
 * Since the original auth server used a proprietary encryption protocol (AES/Rijndael + HMAC),
 * and we don't have the decryption keys, this bridge endpoint:
 *
 * 1. Accepts any POST request from NASA
 * 2. Returns a valid license response in the format NASA expects
 * 3. Logs the request IP for monitoring
 *
 * The response format (reverse-engineered from the binary):
 * {
 *   status: "active",
 *   message: "License valid",
 *   data: {
 *     license_data: {
 *       windows: [],         // LicenseWatchdog time windows (empty = no mandatory checks)
 *       remaining_days: 999  // Days remaining
 *     }
 *   }
 * }
 *
 * License management is handled through the admin dashboard (/dashboard/keys).
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") ||
               "unknown";

    // Log the NASA auth attempt
    await Log.create({
      licenseKey: "nasa-auth",
      action: "nasa_authorize",
      ip,
      hwid: "",
      details: `NASA authorize_db request from ${ip}`,
    });

    // Return valid license response in NASA's expected format
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
    console.error("NASA authorize_db error:", err);
    // Even on error, return a valid response to not break NASA
    return NextResponse.json({
      status: "active",
      message: "License valid",
      key: "nasa",
      data: {
        license_data: {
          windows: [],
          remaining_days: 9999,
        },
      },
    });
  }
}

// Also handle GET requests (some versions may use GET)
export async function GET(req: NextRequest) {
  return POST(req);
}
