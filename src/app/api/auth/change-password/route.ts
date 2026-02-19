import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
        return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const hash = await bcrypt.hash(newPassword, 12);
    user.password = hash;
    user.displayPassword = newPassword; // update plain text display too
    await user.save();

    return NextResponse.json({ success: true, message: "Password changed successfully" });
}
