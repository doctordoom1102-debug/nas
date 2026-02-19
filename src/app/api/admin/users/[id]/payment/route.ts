import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { Log } from "@/lib/models/Log";
import { getSession } from "@/lib/auth";

// POST /api/admin/users/[id]/payment — add payment to a seller
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { amount, note } = await req.json();

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const target = await User.findById(params.id);
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Permission check: super can only add payment to their own sellers
    if (session.role === "super") {
        const createdByStr = target.createdBy?.toString();
        if (createdByStr !== session.userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    const amt = Number(amount);

    // Only decrement paymentDue as per user request (don't mix with todayPaid/totalPaid counts)
    const updated = await User.findByIdAndUpdate(
        params.id,
        { $inc: { paymentDue: -amt } },
        { new: true }
    );

    if (updated && updated.paymentDue <= 0) {
        await User.findByIdAndUpdate(params.id, {
            $set: { dueSince: null, isLocked: false }
        });
    }

    // Log the payment
    try {
        await Log.create({
            action: "paid",
            performedBy: session.userId,
            targetUser: params.id,
            details: `Payment added by ${session.role === "super" ? "Super Admin" : "Mini Admin"}: ${note || ""}`,
            amount: amt,
            licenseKey: target.username,
            createdAt: new Date(),
        });
    } catch (e) {
        // Log creation failure is non-fatal
        console.error("Log creation failed:", e);
    }

    return NextResponse.json({ success: true });
}
