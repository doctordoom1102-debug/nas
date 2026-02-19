import { NextRequest, NextResponse } from "next/server";

// Handles all DLL validation requests (license check, user validation, nexus login)
// Returns success response so the app proceeds normally
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log("[DLL Validate] POST:", JSON.stringify(body).substring(0, 200));
    
    return NextResponse.json({
      success: true,
      message: "Success",
      MSG: "true",
      leftDays: 999,
      mac_address: "",
      status: 1,
      version: "303.0",
    });
  } catch {
    return NextResponse.json({
      success: true,
      message: "Success",
      MSG: "true",
    });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Success",
    MSG: "true",
  });
}
