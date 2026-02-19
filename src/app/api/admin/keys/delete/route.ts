import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { User } from "@/lib/models/User";
import { Log } from "@/lib/models/Log";

// GET /api/admin/keys/delete?search=xyz — search keys
export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "master_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const search = req.nextUrl.searchParams.get("search") || "";
    if (!search || search.length < 2) {
        return NextResponse.json({ keys: [] });
    }

    const keys = await License.find({
        key: { $regex: search, $options: "i" },
    })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("createdBy", "username role")
        .lean();

    return NextResponse.json({
        keys: keys.map((k: any) => ({
            _id: k._id,
            key: k.key,
            status: k.status,
            createdBy: k.createdBy?.username || "Unknown",
            createdByRole: k.createdBy?.role || "unknown",
            expiresAt: k.expiresAt,
            createdAt: k.createdAt,
        })),
    });
}

// DELETE /api/admin/keys/delete — delete a key
export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "master_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { key } = await req.json();
    if (!key) {
        return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const license = await License.findOne({ key });
    if (!license) {
        return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    await License.deleteOne({ key });

    // Log the deletion
    try {
        await Log.create({
            action: "key_deleted",
            performedBy: session.userId,
            licenseKey: key,
            details: `Key permanently deleted by Master Admin`,
            createdAt: new Date(),
        });
    } catch (e) {
        console.error("Log creation failed:", e);
    }

    return NextResponse.json({ success: true, message: "Key deleted successfully" });
}
