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

  // Restrict visibility based on role
  const myRole = session.role;
  if (myRole === "seller") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Show only roles you can manage + your own role
  const visibleRoles: UserRole[] = [];
  const allRoles: UserRole[] = ["admin", "super", "seller"];
  for (const r of allRoles) {
    if (canManageRole(myRole, r)) visibleRoles.push(r);
  }

  if (roleFilter && visibleRoles.includes(roleFilter as UserRole)) {
    filter.role = roleFilter;
  } else {
    filter.role = { $in: visibleRoles };
  }

  const users = await User.find(filter)
    .select("-password")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  return NextResponse.json({ users });
}

// POST /api/admin/users — create a new user
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { username, email, password, role } = await req.json();

  if (!username || !email || !password || !role) {
    return NextResponse.json(
      { error: "username, email, password, and role are required" },
      { status: 400 }
    );
  }

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
    $or: [{ email: email.toLowerCase() }, { username }],
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
    email: email.toLowerCase(),
    password: hash,
    role,
    createdBy: session.userId,
  });

  return NextResponse.json({
    success: true,
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
}
