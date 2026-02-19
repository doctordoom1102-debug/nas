const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb+srv://aditya:adityaaditya@cluster0.u9yyv.mongodb.net/launcher?retryWrites=true&w=majority&appName=Cluster0');
    const users = await mongoose.connection.db.collection('users').find({ role: 'seller' }).toArray();
    console.log('Sellers count:', users.length);
    users.slice(0, 5).forEach(u => {
        console.log(`User: ${u.username}, DisplayName: ${u.displayName}, DisplayPassword: ${u.displayPassword}`);
    });
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
