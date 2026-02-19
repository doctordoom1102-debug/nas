const { MongoClient, ObjectId } = require('mongodb');
const fs = require('fs');

async function sync() {
    let uri;
    try {
        const env = fs.readFileSync('.env', 'utf8');
        const match = env.match(/MONGODB_URI=(.*)/);
        if (match) uri = match[1].trim();
    } catch (e) { }

    if (!uri) throw new Error("MONGODB_URI not found");

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const usersCol = db.collection('users');
        const licensesCol = db.collection('licenses');

        const users = await usersCol.find({}).toArray();
        console.log(`Found ${users.length} users`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const user of users) {
            const userId = user._id;

            const totalSold = await licensesCol.countDocuments({ createdBy: userId });
            const totalUnpaid = await licensesCol.countDocuments({ createdBy: userId, approvedBy: null });
            const todaySold = await licensesCol.countDocuments({ createdBy: userId, createdAt: { $gte: today } });
            const todayPaid = await licensesCol.countDocuments({ createdBy: userId, approvedBy: { $ne: null }, updatedAt: { $gte: today } });
            const activeSold = await licensesCol.countDocuments({ createdBy: userId, status: 'active' });
            const sellerCount = await usersCol.countDocuments({ createdBy: userId });

            let pricePerId = 2400;
            if (user.role === 'super') pricePerId = 2200;
            if (user.role === 'admin') pricePerId = 2000;

            const totalPaidCount = totalSold - totalUnpaid;

            // Note: paymentDue stays as currency. totalPaid/todayPaid are COUNTS of keys.
            await usersCol.updateOne({ _id: userId }, {
                $set: {
                    totalSold,
                    totalUnpaid,
                    todaySold,
                    todayPaid,
                    totalPaid: totalPaidCount,
                    activeSold,
                    sellerCount: sellerCount
                }
            });
            console.log(`Updated ${user.username}: Total Paid Count=${totalPaidCount}, Today Paid Count=${todayPaid}, Due=${user.paymentDue}`);
        }
    } finally {
        await client.close();
    }
}

sync().catch(console.error);
