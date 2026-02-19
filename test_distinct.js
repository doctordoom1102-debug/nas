const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb+srv://aditya:adityaaditya@cluster0.u9yyv.mongodb.net/launcher?retryWrites=true&w=majority&appName=Cluster0');

    // Create a test user with DISTINCT values
    const UserSchema = new mongoose.Schema({
        username: String,
        displayName: String,
        displayPassword: String,
        role: String,
        password: String,
        email: String
    }, { strict: false });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const unique = Date.now();
    const testData = {
        username: 'user_' + unique,
        displayName: 'Customer_' + unique,
        displayPassword: 'Pass_' + unique,
        password: 'hashed_pass_' + unique,
        email: 'email_' + unique + '@test.com',
        role: 'seller'
    };

    const testUser = await User.create(testData);
    console.log('Created user with distinct values.');

    const u = await mongoose.connection.db.collection('users').findOne({ _id: testUser._id });
    console.log('--- DB RECORD ---');
    console.log('Username:', u.username);
    console.log('DisplayName:', u.displayName);
    console.log('DisplayPassword:', u.displayPassword);

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
