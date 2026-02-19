import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/lib/models/User";
import { License } from "@/lib/models/License";
import { getSession } from "@/lib/auth";

export async function GET() {
    const session = await getSession();
    if (!session || session.role !== "master_admin" && session.role !== "admin" && session.role !== "super") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const users = await User.find({});
    const results = [];

    for (const user of users) {
        const userId = user._id;

        // Total Sold
        const totalSold = await License.countDocuments({ createdBy: userId });

        // Total Unpaid
        const totalUnpaid = await License.countDocuments({
            createdBy: userId,
            approvedBy: null
        });

        // Today Sold
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySold = await License.countDocuments({
            createdBy: userId,
            createdAt: { $gte: today }
        });

        // Payment Due
        let pricePerId = 2400;
        if (user.role === "super") pricePerId = 2200;
        if (user.role === "admin") pricePerId = 2000;

        const paymentDue = totalUnpaid * pricePerId;

        await User.findByIdAndUpdate(userId, {
            $set: {
                totalSold,
                totalUnpaid,
                todaySold,
                paymentDue,
                totalPaid: totalSold - totalUnpaid,
            }
        });

        results.push({ username: user.username, totalSold, totalUnpaid, paymentDue });
    }

    return NextResponse.json({ success: true, results });
}
