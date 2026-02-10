import { NextRequest, NextResponse } from "next/server";

/**
 * NASA Bridge: /api/config
 *
 * Returns the config.json that the app fetches on startup via configServer().
 * This replaces the old GitHub-hosted config.
 *
 * The config tells the app where to connect for API calls (server_base_url),
 * what version to expect, and displays news messages in the UI.
 */

const PANEL_URL = "nasanget.xyz";

export async function GET(req: NextRequest) {
  const config = {
    server_base_url: PANEL_URL,
    otp_base_url: PANEL_URL,
    disha_base_url: "https://api.disha.corever.ai/dishaAPI",
    news: [
      "WELCOME TO NASA CONTROL",
      "INSTALL PORTABLE CHROME 143 IN SOFTWARE FOLDER.",
      "FOR SMOOTH OPERATIONS USE A CLEAN PC.",
      "@ TEAM NASA",
    ],
    sofTversion: "1.86",
    zip_url: "",
    getStatus: 1,
    selectTrain: 1,
    sendPassenger: 15,
    sendOtp: 20,
    submitOtp: 30,
    initiatingPayment: 30,
    pay_with_upi: 30,
    hittingPnr: 30,
    paymentDelay: 0,
    browserCall: false,
  };

  return NextResponse.json(config);
}
