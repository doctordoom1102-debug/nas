import { NextRequest, NextResponse } from "next/server";

/**
 * NASA Bridge: /api/avatar-config
 * Replaces: https://github.com/chenAvengers/avatar/releases/download/avatar/config.json
 *
 * Returns avatar/secondary tool configuration.
 */

const PANEL_URL = "nasanget.xyz";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    server_base_url: PANEL_URL,
    otp_base_url: PANEL_URL,
    captcha_server_url: "",
    disha_base_url: "https://api.disha.coreover.ai/dishaAPI",
    news: [
      "WELCOME TO AVATAR - POWERED BY NASA",
    ],
    sofTversion: "0.06",
    zip_url: "",
  });
}
