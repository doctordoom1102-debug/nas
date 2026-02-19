import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { IrctcToken } from "@/lib/models/IrctcToken";

/**
 * NASA Control: GET /api/v1/get-tokens?clientID=xxx
 * Exe (GetTokenFromServer/staticstore) calls this to fetch plain tokens.
 * Returns { tokens: string[] }
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const clientID =
      req.nextUrl.searchParams.get("clientID") ||
      req.nextUrl.searchParams.get("username") ||
      "";

    if (!clientID) {
      return NextResponse.json({ tokens: [] });
    }

    const docs = await IrctcToken.find({ clientID })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const tokens = docs.map((d) => d.token);

    return NextResponse.json({ tokens });
  } catch (err: any) {
    console.error("get-tokens error:", err);
    return NextResponse.json({ tokens: [] });
  }
}
