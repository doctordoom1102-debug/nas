import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Log } from "@/lib/models/Log";

/**
 * NASA Bridge: /pd (short alias for postData)
 * Short URL needed because binary patching requires same-length or shorter URLs.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ||
               req.headers.get("x-real-ip") ||
               "unknown";

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body might not be JSON
    }

    await Log.create({
      licenseKey: "nasa-operation",
      action: "nasa_postData",
      ip,
      hwid: "",
      details: JSON.stringify(body).slice(0, 5000),
    });

    return NextResponse.json({
      success: true,
      message: "Data received",
    });
  } catch (err: any) {
    console.error("NASA postData error:", err);
    return NextResponse.json({ success: true, message: "OK" });
  }
}
