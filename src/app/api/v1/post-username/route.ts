import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { IrctcToken } from "@/lib/models/IrctcToken";
import { encryptToken } from "@/lib/tokenCrypto";

/**
 * NASA Control: POST /api/v1/post-username
 * Exe (Token_count) calls this to fetch tokens by clientID.
 * Compatible with auth5.taslats.com/api/v1/post-username format.
 *
 * Request: POST with header "username" (encrypted clientID) and body {"usernamee": clientID}
 * Response: [{ data: "<encrypted_token>" }, ...] or []
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const usernameHeader = req.headers.get("username") || "";
    let body: { usernamee?: string } = {};
    try {
      body = await req.json();
    } catch {
      // ignore
    }
    const clientID = body.usernamee || "";

    if (!clientID) {
      return NextResponse.json([]);
    }

    const tokens = await IrctcToken.find({ clientID })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const result = tokens.map((t) => ({
      id: 0,
      username: clientID,
      data: encryptToken(t.token),
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("post-username error:", err);
    return NextResponse.json([]);
  }
}
