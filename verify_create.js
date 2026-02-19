const mongoose = require('mongoose');

async function check() {
    await mongoose.connect('mongodb+srv://aditya:adityaaditya@cluster0.u9yyv.mongodb.net/launcher?retryWrites=true&w=majority&appName=Cluster0');

    // Create a test user
    const UserSchema = new mongoose.Schema({
        username: String,
        displayName: String,
        displayPassword: String,
        role: String
    }, { strict: false });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const testUser = await User.create({
        username: 'testuser_' + Date.now(),
        displayName: 'Test Customer Name',
        displayPassword: 'testpassword123',
        role: 'seller'
    });

    console.log('Created user:', testUser.username);

    const u = await mongoose.connection.db.collection('users').findOne({ username: testUser.username });
    console.log(`Verified DB: DisplayName: ${u.displayName}, DisplayPassword: ${u.displayPassword}`);

    // Cleanup
    await User.deleteOne({ _id: testUser._id });
    process.exit(0);
}

check().catch(err => {
    console.error(err);
    process.exit(1);
});
