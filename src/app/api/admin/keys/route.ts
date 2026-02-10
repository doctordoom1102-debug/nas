import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/models/User";
import { generateBulkKeys } from "@/lib/keygen";

// GET — list all keys
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tier = searchParams.get("tier");
  const search = searchParams.get("search");

  const filter: any = {};
  if (status) filter.status = status;
  if (tier) filter.tier = tier;
  if (search) filter.key = { $regex: search, $options: "i" };

  // Sellers can only see keys they created
  if (session.role === "seller") {
    filter.createdBy = session.userId;
  }

  const keys = await License.find(filter)
    .populate("createdBy", "username role")
    .populate("approvedBy", "username role")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  const total = await License.countDocuments(filter);

  return NextResponse.json({ keys, total });
}

// POST — generate keys
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!hasPermission(session.role, "create_keys")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();
  const { count = 1, tier = "basic", expiresInDays, notes = "" } = await req.json();

  const num = Math.min(Math.max(1, count), 100);
  const keys = generateBulkKeys(num);
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 86400000) : null;

  // Sellers create keys as "pending", others create as "active"
  const initialStatus = session.role === "seller" ? "pending" : "active";

  const docs = keys.map((key) => ({
    key,
    tier,
    expiresAt,
    notes,
    status: initialStatus,
    createdBy: session.userId,
    approvedBy: initialStatus === "active" ? session.userId : null,
  }));

  await License.insertMany(docs);

  return NextResponse.json({
    success: true,
    keys,
    count: keys.length,
    status: initialStatus,
  });
}
