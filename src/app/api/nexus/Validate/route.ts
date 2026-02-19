import { NextRequest, NextResponse } from "next/server";

// Proxy endpoint for IRCommDLL validation bypass
// The DLL calls spacex-apiserver.com/api/nexus/Validate — we intercept it here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
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
