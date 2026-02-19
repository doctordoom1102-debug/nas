const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb+srv://aditya:adityaaditya@cluster0.u9yyv.mongodb.net/launcher?retryWrites=true&w=majority&appName=Cluster0');

    const users = await mongoose.connection.db.collection('users')
        .find({ role: 'seller' })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();

    console.log('Last 3 Sellers:');
    users.forEach(u => {
        console.log(`ID: ${u._id}`);
        console.log(`  Username: ${u.username}`);
        console.log(`  DisplayName: ${u.displayName}`);
        console.log(`  DisplayPassword: ${u.displayPassword}`);
        console.log(`  CreatedAt: ${u.createdAt}`);
    });

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
