const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb+srv://aditya:adityaaditya@cluster0.u9yyv.mongodb.net/launcher?retryWrites=true&w=majority&appName=Cluster0');

    const u = await mongoose.connection.db.collection('users')
        .find({ username: 'xx11' })
        .next();

    console.log('RAW DB RECORD for xx11:');
    console.log(JSON.stringify(u, null, 2));

    const u2 = await mongoose.connection.db.collection('users')
        .find({ username: 'acc' })
        .next();
    console.log('RAW DB RECORD for acc:');
    console.log(JSON.stringify(u2, null, 2));

    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
