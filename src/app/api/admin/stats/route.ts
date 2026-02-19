import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { Log } from "@/lib/models/Log";
import { User } from "@/lib/models/User";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // For super role: scope stats to their sellers only
  if (session.role === "super") {
    const mySellers = await User.find({ createdBy: session.userId, role: "seller" }).select("_id").lean();
    const sellerIds = mySellers.map((s: any) => s._id);
    const allCreators = [session.userId, ...sellerIds];

    const [
      totalKeys,
      activeKeys,
      pendingKeys,
      todaySoldKeys,
      todayPaidKeys,
    ] = await Promise.all([
      License.countDocuments({ createdBy: { $in: allCreators } }),
      License.countDocuments({ createdBy: { $in: allCreators }, status: "active" }),
      License.countDocuments({ createdBy: { $in: allCreators }, status: "pending" }),
      Log.countDocuments({
        action: { $regex: /success|activate|bound/i },
        createdAt: { $gte: startOfToday },
        performedBy: { $in: allCreators },
      }),
      License.countDocuments({
        createdBy: { $in: allCreators },
        status: { $ne: "pending" },
        createdAt: { $gte: startOfToday },
      }),
    ]);

    return NextResponse.json({
      total: totalKeys,
      active: activeKeys,
      expired: 0,
      banned: 0,
      inactive: 0,
      pending: pendingKeys,
      superSellers: 0,
      sellers: mySellers.length,
      todayPaidKeys,
      todaySoldKeys,
      recentLogs: [],
    });
  }

  // Admin / master_admin: global stats
  const [
    totalKeys,
    activeKeys,
    expiredKeys,
    bannedKeys,
    inactiveKeys,
    pendingKeys,
    superSellers,
    sellers,
  ] = await Promise.all([
    License.countDocuments(),
    License.countDocuments({ status: "active" }),
    License.countDocuments({ status: "expired" }),
    License.countDocuments({ status: "banned" }),
    License.countDocuments({ status: "inactive" }),
    License.countDocuments({ status: "pending" }),
    User.countDocuments({ role: "super" }),
    User.countDocuments({ role: "seller" }),
  ]);

  const [todayPaidKeys, todaySoldKeys] = await Promise.all([
    License.countDocuments({
      status: { $ne: "pending" },
      createdAt: { $gte: startOfToday },
    }),
    Log.countDocuments({
      action: { $regex: /success|activate|bound/i },
      createdAt: { $gte: startOfToday },
    }),
  ]);

  const recentLogs = await Log.find().sort({ createdAt: -1 }).limit(10).lean();

  return NextResponse.json({
    total: totalKeys,
    active: activeKeys,
    expired: expiredKeys,
    banned: bannedKeys,
    inactive: inactiveKeys,
    pending: pendingKeys,
    superSellers,
    sellers,
    miniAdmins: await User.countDocuments({ role: "admin" }),
    todayPaidKeys,
    todaySoldKeys,
    recentLogs,
  });
}
