import { connectDB } from "../src/lib/db";
import { User } from "../src/lib/models/User";
import { License } from "../src/lib/models/License";
import mongoose from "mongoose";

async function sync() {
    await connectDB();
    console.log("Connected to DB");

    const users = await User.find({});
    console.log(`Found ${users.length} users`);

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
        let pricePerId = 2400; // Default seller
        if (user.role === "super") pricePerId = 2200;
        if (user.role === "admin") pricePerId = 2000;

        // Simple logic: paymentDue = totalUnpaid * price
        const paymentDue = totalUnpaid * pricePerId;

        await User.findByIdAndUpdate(userId, {
            $set: {
                totalSold,
                totalUnpaid,
                todaySold,
                paymentDue,
                // We don't easily know historical paid stats without detailed logs, 
                // but we can at least fill the unpaid/due stats.
                totalPaid: totalSold - totalUnpaid,
            }
        });

        console.log(`Updated ${user.username}: Sold=${totalSold}, Unpaid=${totalUnpaid}, Due=${paymentDue}`);
    }

    console.log("Sync complete");
    process.exit(0);
}

sync().catch(console.error);
