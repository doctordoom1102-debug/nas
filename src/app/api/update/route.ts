import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Setting } from "@/lib/models/Setting";

/**
 * GET /api/update
 * Called by the desktop EXE on startup to check for updates.
 * Returns version, zip_url, and kill switch from Settings DB.
 *
 * Settings keys:
 *   app_version   - current version number (e.g. "303.0")
 *   app_zip_url   - URL to the update zip file
 *   app_kill      - "true" to force-kill all running EXEs
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const settings = await Setting.find({
            key: { $in: ["app_version", "app_zip_url", "app_kill"] },
        }).lean();

        const map: Record<string, string> = {};
        for (const s of settings) map[s.key] = s.value;

        return NextResponse.json({
            version: map.app_version || "303.0",
            zip_url: map.app_zip_url || "",
            kill: map.app_kill === "true",
        });
    } catch {
        return NextResponse.json({
            version: "303.0",
            zip_url: "",
            kill: false,
        });
    }
}
