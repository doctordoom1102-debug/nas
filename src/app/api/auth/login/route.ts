import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by email or username (case-insensitive)
    const user = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: { $regex: new RegExp(`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
      ],
    });

    if (!user || !user.isActive || user.isBanned) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Grace period helper
    const shouldLock = (pd: number, ds: Date | null, r: string): boolean => {
      if (pd <= 0 || !ds) return false;
      const dueDate = new Date(ds);
      const startOfDueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
      const startOfToday = new Date();
      const todayMid = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), startOfToday.getDate());
      const daysDiff = Math.floor((todayMid.getTime() - startOfDueDay.getTime()) / 86400000);
      if (r === "seller" && daysDiff >= 1) return true;
      if (r === "super" && daysDiff >= 2) return true;
      if (r === "admin" && daysDiff >= 4) return true;
      return false;
    }

    // Recursive Parent Lock Check — deactivation + grace periods
    let currentId: any = user._id;
    while (currentId) {
      const parent = await User.findById(currentId).select("_id paymentDue dueSince role createdBy username isActive").lean();
      if (!parent || parent.role === "master_admin") break;

      // Check 1: Deactivation
      if (parent.isActive === false) {
        const isSelf = parent._id.toString() === user._id.toString();
        const isAdmin = parent.role === "admin";
        return NextResponse.json(
          {
            success: false,
            message: isSelf
              ? "Your account has been deactivated. Please contact your admin."
              : `ACCESS DENIED! Your ${isAdmin ? "Mini Admin" : "Super Seller"} (${parent.username}) has been deactivated. All sub-panels are locked.`
          },
          { status: 403 }
        );
      }

      // Check 2: Grace period dues
      if (shouldLock(parent.paymentDue, parent.dueSince, parent.role)) {
        const isSelf = parent._id.toString() === user._id.toString();
        const isAdmin = parent.role === "admin";
        return NextResponse.json(
          {
            success: false,
            message: isSelf
              ? `Panel Locked! Total Due: ₹${parent.paymentDue}. Please clear your balance to login.`
              : `ACCESS DENIED! Your ${isAdmin ? "Mini Admin" : "Super Seller"} (${parent.username}) has outstanding dues. Please contact them.`
          },
          { status: 403 }
        );
      }
      currentId = parent.createdBy;
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
    });

    const res = NextResponse.json({
      success: true,
      user: {
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });

    res.cookies.set("nasa_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return res;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
