import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User, canManageRole, type UserRole } from "@/lib/models/User";
import { getSession } from "@/lib/auth";

// GET /api/admin/users — list users (filtered by what you can see)
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const roleFilter = searchParams.get("role");

  const filter: any = {};
  const myRole = session.role as string;

  if (myRole === "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (myRole === "master_admin") {
    // Can see all: admin, super, seller
    const allowed = ["admin", "super", "seller"];
    filter.role = roleFilter && allowed.includes(roleFilter) ? roleFilter : { $in: allowed };
  } else if (myRole === "admin") {
    // Can see super and seller
    const allowed = ["super", "seller"];
    filter.role = roleFilter && allowed.includes(roleFilter) ? roleFilter : { $in: allowed };
  } else if (myRole === "super") {
    // Can ONLY see sellers they personally created
    filter.role = "seller";
    filter.createdBy = session.userId;
  }

  const usersRaw = await User.find(filter)
    .select("username displayName email role displayPassword isActive createdAt lastLoginAt paymentDue todaySold activeSold totalSold todayPaid totalPaid totalUnpaid createdBy")
    .populate("createdBy", "displayName username")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Enrich users with Master-view stats
  const users = await Promise.all(usersRaw.map(async (u: any) => {
    const stats: any = {
      superCount: 0,
      sellerCount: 0,
      totalKey: 0,
      totalActive: 0,
      totalPaid: 0,
      todayCreated: 0,
      todayPaid: 0
    };

    if (myRole === "master_admin" || myRole === "admin") {
      const { License } = require("@/lib/models/License");

      if (u.role === "admin") {
        // Admin's children are Supers
        const supers = await User.find({ createdBy: u._id, role: "super" }).select("_id").lean();
        stats.superCount = supers.length;
        const superIds = supers.map((s: any) => s._id);

        // Admin's grandchildren are Sellers
        const sellers = await User.find({ createdBy: { $in: superIds }, role: "seller" }).select("_id").lean();
        stats.sellerCount = sellers.length;
        const sellerIds = sellers.map((s: any) => s._id);

        // All descendants
        const allCreators = [u._id, ...superIds, ...sellerIds];

        const [tk, ta, tp, tc, tpaid] = await Promise.all([
          License.countDocuments({ createdBy: { $in: allCreators } }),
          License.countDocuments({ createdBy: { $in: allCreators }, status: "active" }),
          License.countDocuments({ createdBy: { $in: allCreators }, status: { $ne: "pending" } }),
          License.countDocuments({ createdBy: { $in: allCreators }, createdAt: { $gte: startOfToday } }),
          License.countDocuments({ createdBy: { $in: allCreators }, status: { $ne: "pending" }, createdAt: { $gte: startOfToday } }), // This is today paid
        ]);
        stats.totalKey = tk;
        stats.totalActive = ta;
        stats.totalPaid = tp;
        stats.todayCreated = tc;
        stats.todayPaid = tpaid;

      } else if (u.role === "super") {
        // Super's children are Sellers
        const sellers = await User.find({ createdBy: u._id, role: "seller" }).select("_id").lean();
        stats.sellerCount = sellers.length;
        const sellerIds = sellers.map((s: any) => s._id);

        const allCreators = [u._id, ...sellerIds];
        const [tk, ta, tp, tc, tpaid] = await Promise.all([
          License.countDocuments({ createdBy: { $in: allCreators } }),
          License.countDocuments({ createdBy: { $in: allCreators }, status: "active" }),
          License.countDocuments({ createdBy: { $in: allCreators }, status: { $ne: "pending" } }),
          License.countDocuments({ createdBy: { $in: allCreators }, createdAt: { $gte: startOfToday } }),
          License.countDocuments({ createdBy: { $in: allCreators }, status: { $ne: "pending" }, createdAt: { $gte: startOfToday } }),
        ]);
        stats.totalKey = tk;
        stats.totalActive = ta;
        stats.totalPaid = tp;
        stats.todayCreated = tc;
        stats.todayPaid = tpaid;

      } else if (u.role === "seller") {
        const [tk, ta, tp, tc, tpaid] = await Promise.all([
          License.countDocuments({ createdBy: u._id }),
          License.countDocuments({ createdBy: u._id, status: "active" }),
          License.countDocuments({ createdBy: u._id, status: { $ne: "pending" } }),
          License.countDocuments({ createdBy: u._id, createdAt: { $gte: startOfToday } }),
          License.countDocuments({ createdBy: u._id, status: { $ne: "pending" }, createdAt: { $gte: startOfToday } }),
        ]);
        stats.totalKey = tk;
        stats.totalActive = ta;
        stats.totalPaid = tp;
        stats.todayCreated = tc;
        stats.todayPaid = tpaid;
      }
    }

    return { ...u, ...stats };
  }));

  return NextResponse.json({ users });
}

// POST /api/admin/users — create a new user
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { username, displayName, email, password: providedPassword, role } = await req.json();
  const lowerEmail = email ? email.toLowerCase() : `${username}@launcher.local`;

  if (!username || !displayName || !role) {
    return NextResponse.json(
      { error: "username, displayName, and role are required" },
      { status: 400 }
    );
  }

  const password = (providedPassword && providedPassword.trim()) 
    ? providedPassword.trim() 
    : generateRandomPassword(6);

  if (password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  // Check permission
  if (!canManageRole(session.role, role as UserRole)) {
    return NextResponse.json(
      { error: `Your role (${session.role}) cannot create ${role} users` },
      { status: 403 }
    );
  }

  // Check duplicates
  const existing = await User.findOne({
    $or: [{ email: lowerEmail }, { username }],
  });
  if (existing) {
    return NextResponse.json(
      { error: "Username or email already taken" },
      { status: 409 }
    );
  }

  const hash = await bcrypt.hash(password, 12);

  const user = await User.create({
    username,
    displayName,
    email: lowerEmail,
    password: hash,
    displayPassword: password, // Store plain password for display in table
    role,
    createdBy: session.userId,
  });


  return NextResponse.json({
    success: true,
    user: {
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      password: password,
    },
  });
}

function generateRandomPassword(length: number): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}
