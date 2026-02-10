import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { Log } from "@/lib/models/Log";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const [total, active, expired, banned, inactive] = await Promise.all([
    License.countDocuments(),
    License.countDocuments({ status: "active" }),
    License.countDocuments({ status: "expired" }),
    License.countDocuments({ status: "banned" }),
    License.countDocuments({ status: "inactive" }),
  ]);

  const recentLogs = await Log.find().sort({ createdAt: -1 }).limit(20).lean();

  // Validations in last 24h
  const oneDayAgo = new Date(Date.now() - 86400000);
  const validationsToday = await Log.countDocuments({
    action: "validate_success",
    createdAt: { $gte: oneDayAgo },
  });

  return NextResponse.json({
    total,
    active,
    expired,
    banned,
    inactive,
    validationsToday,
    recentLogs,
  });
}
