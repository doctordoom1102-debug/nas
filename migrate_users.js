const mongoose = require('mongoose');

async function migrate() {
    await mongoose.connect('mongodb+srv://aditya:adityaaditya@cluster0.u9yyv.mongodb.net/launcher?retryWrites=true&w=majority&appName=Cluster0');
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Total users:', users.length);

    let updated = 0;
    for (const u of users) {
        const updates = {};
        if (!u.displayName) {
            updates.displayName = u.username;
        }
        if (!u.displayPassword) {
            updates.displayPassword = u.username; // Fallback for old encrypted passwords
        }

        if (Object.keys(updates).length > 0) {
            await mongoose.connection.db.collection('users').updateOne(
                { _id: u._id },
                { $set: updates }
            );
            updated++;
        }
    }

    console.log('Updated users:', updated);
    process.exit(0);
}

migrate().catch(err => {
    console.error(err);
    process.exit(1);
});
