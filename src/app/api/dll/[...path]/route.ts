import { NextRequest, NextResponse } from "next/server";

// Catch-all handler for any DLL endpoint not explicitly handled
// This ensures the DLL never gets a connection error from our server
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const fullPath = params.path?.join("/") || "";
  console.log(`[DLL Catch-All] GET /${fullPath}`);

  // ViewNews / news endpoints
  if (fullPath.includes("ViewNews") || fullPath.includes("news")) {
    return new NextResponse(
      "<html><body><h2>NASA Control - All Systems Go</h2><p>No announcements at this time.</p></body></html>",
      { status: 200, headers: { "Content-Type": "text/html" } }
    );
  }

  return NextResponse.json({ success: true, message: "OK", path: fullPath });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const fullPath = params.path?.join("/") || "";
  console.log(`[DLL Catch-All] POST /${fullPath}`);

  // OTP delete endpoints
  if (fullPath.includes("deleteotp")) {
    return NextResponse.json({ success: true, message: "OTP deleted" });
  }

  // Screenshot upload
  if (fullPath.includes("ScreenShot")) {
    return NextResponse.json({ success: true, message: "Screenshot received" });
  }

  // Analytics / rum
  if (fullPath.includes("rum") || fullPath.includes("vld")) {
    return NextResponse.json({ success: true });
  }

  // Default success
  return NextResponse.json({ success: true, message: "OK", path: fullPath });
}
