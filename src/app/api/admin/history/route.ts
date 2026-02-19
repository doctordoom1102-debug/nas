import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { Log } from "@/lib/models/Log";
import { User } from "@/lib/models/User";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    // Filter by seller if not admin/master_admin
    const isSellerRole = session.role === "seller";
    const isSuperRole = session.role === "super";

    if (type === "paid") {
        // Paid & Renew History: only truly approved/paid licenses
        const filter: any = { approvedBy: { $ne: null } };
        if (isSellerRole) filter.createdBy = session.userId;
        if (isSuperRole) {
            // super sees keys of their sellers — get all sellers created by this super
            const { User } = await import("@/lib/models/User");
            const sellers = await User.find({ createdBy: session.userId, role: "seller" }).select("_id").lean();
            const sellerIds = sellers.map((s: any) => s._id);
            filter.createdBy = { $in: [session.userId, ...sellerIds] };
        }

        const records = await License.find(filter)
            .populate("createdBy", "username")
            .populate("approvedBy", "username")
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        return NextResponse.json({
            records: records.map((r: any) => ({
                _id: r._id,
                key: r.key,
                notes: r.notes || "",
                createdAt: r.createdAt,
                expiresAt: r.expiresAt,
                approvedAt: r.updatedAt || r.createdAt,  // updatedAt = when status changed to active
                approvedBy: r.approvedBy,
                createdBy: r.createdBy,
                status: r.status,
            })),
        });
    }

    if (type === "payment") {
        // Payment History: Only manual balance payments (Add Payment button)
        const filter: any = { action: "paid" };

        const sellerId = searchParams.get("sellerId");

        try {
            if (sellerId && (session.role === "master_admin" || session.role === "admin" || session.role === "super")) {
                const sId = new mongoose.Types.ObjectId(sellerId);
                filter.$or = [
                    { performedBy: sId },
                    { targetUser: sId }
                ];
            } else {
                const myId = new mongoose.Types.ObjectId(session.userId);
                filter.$or = [
                    { performedBy: myId },
                    { targetUser: myId }
                ];
            }
        } catch (e) {
            console.error("Invalid ID in history query:", e);
            return NextResponse.json({ records: [] });
        }

        const logs = await Log.find(filter)
            .populate("performedBy", "username role")
            .populate("targetUser", "username role")
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        return NextResponse.json({
            records: logs.map((l: any) => ({
                _id: l._id,
                targetKey: l.licenseKey,
                action: l.action,
                amount: l.amount || 2400,
                details: l.details,
                createdAt: l.createdAt,
                performedBy: l.performedBy || null,
                targetUser: l.targetUser || null,
            })),
        });
    }

    if (type === "renew") {
        // Renew History: logs with action = renew/recharge/reset/renew_request
        const filter: any = { action: { $in: ["renew", "recharge", "reset", "hwid_reset", "renew_request"] } };
        if (isSellerRole) filter.performedBy = session.userId;

        const logs = await Log.find(filter)
            .populate("performedBy", "username")
            .sort({ createdAt: -1 })
            .limit(500)
            .lean();

        return NextResponse.json({
            records: logs.map((l: any) => ({
                _id: l._id,
                targetKey: l.licenseKey,
                action: l.action,
                details: l.details,
                createdAt: l.createdAt,
                performedBy: l.performedBy || null,
            })),
        });
    }

    return NextResponse.json({ error: "Invalid type. Use: paid, payment, or renew" }, { status: 400 });
}
