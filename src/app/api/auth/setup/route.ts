import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

/**
 * POST /api/auth/setup
 * One-time setup: creates the master admin account.
 * Only works if no users exist in the database.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return NextResponse.json(
        { success: false, message: "Setup already completed. Users exist." },
        { status: 403 }
      );
    }

    const { username, email, password } = await req.json();
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, message: "username, email, and password required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 12);

    const masterAdmin = await User.create({
      username,
      email: email.toLowerCase(),
      password: hash,
      role: "master_admin",
      createdBy: null,
    });

    return NextResponse.json({
      success: true,
      message: "Master Admin created successfully",
      user: {
        username: masterAdmin.username,
        email: masterAdmin.email,
        role: masterAdmin.role,
      },
    });
  } catch (err: any) {
    console.error("Setup error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
