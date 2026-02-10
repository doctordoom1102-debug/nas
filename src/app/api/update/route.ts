import { NextRequest, NextResponse } from "next/server";

/**
 * NASA Bridge: /api/update
 * Replaces: https://github.com/chenAvengers/avengersUpdater/releases/download/updater/update.json
 *
 * Returns update info. Keep version at current to prevent update prompts.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    version: "1.86",
    zip_url: "",
  });
}
