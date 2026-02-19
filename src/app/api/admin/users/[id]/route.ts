import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getSession } from "@/lib/auth";

// PUT /api/admin/users/[id] — update user (password change)
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { password, displayName, isActive, isBanned } = await req.json();

    const target = await User.findById(params.id);
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Permission check: super can only edit their own sellers
    if (session.role === "super") {
        const createdByStr = target.createdBy?.toString();
        if (createdByStr !== session.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    const updates: any = {};
    if (password && password.length >= 6) {
        updates.password = await bcrypt.hash(password, 12);
        updates.displayPassword = password;
    }
    if (displayName) {
        updates.displayName = displayName;
    }
    if (typeof isActive === "boolean") {
        updates.isActive = isActive;
    }
    if (typeof isBanned === "boolean") {
        updates.isBanned = isBanned;
    }

    if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await User.findByIdAndUpdate(params.id, { $set: updates });

    return NextResponse.json({ success: true });
}
