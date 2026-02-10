import { NextRequest, NextResponse } from "next/server";

/**
 * NASA Bridge: /api/updater-config
 * Replaces: https://github.com/chenAvengers/avengersUpdater/releases/download/updater/config.json
 *
 * Returns updater configuration. Setting empty zip_url disables auto-updates.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    version: "1.86",
    zip_url: "",
    news: [
      "POWERED BY NASA CONTROL",
    ],
  });
}
