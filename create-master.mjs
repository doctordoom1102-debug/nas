import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = "mongodb+srv://aditya:adityaaditya@cluster0.u9yyv.mongodb.net/launcher?retryWrites=true&w=majority&appName=Cluster0";

const UserSchema = new mongoose.Schema({
    username: String,
    displayName: String,
    email: String,
    password: String,
    displayPassword: String,
    role: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    isActive: { type: Boolean, default: true },
    isBanned: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: { type: Date, default: null },
    paymentDue: { type: Number, default: 0 },
    todaySold: { type: Number, default: 0 },
    activeSold: { type: Number, default: 0 },
    totalSold: { type: Number, default: 0 },
    todayPaid: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
    totalUnpaid: { type: Number, default: 0 },
    dueSince: { type: Date, default: null },
    isLocked: { type: Boolean, default: false },
});

async function main() {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected!");

    const User = mongoose.model("User", UserSchema);

    const existing = await User.findOne({ role: "master_admin" });
    if (existing) {
        console.log(`Master admin already exists: ${existing.username} (${existing.email})`);
        console.log("Updating password...");
        const hash = await bcrypt.hash("NasaMaster2026", 12);
        existing.password = hash;
        existing.displayPassword = "NasaMaster2026";
        existing.isActive = true;
        existing.isBanned = false;
        existing.isLocked = false;
        await existing.save();
        console.log(`Updated master admin: ${existing.username}`);
        console.log(`  Email: ${existing.email}`);
        console.log(`  Password: NasaMaster2026`);
    } else {
        console.log("No master admin found. Creating new one...");
        const hash = await bcrypt.hash("NasaMaster2026", 12);
        const user = await User.create({
            username: "master",
            displayName: "Master Admin",
            email: "master@nasacontrol.com",
            password: hash,
            displayPassword: "NasaMaster2026",
            role: "master_admin",
            createdBy: null,
        });
        console.log(`Created master admin!`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Password: NasaMaster2026`);
    }

    await mongoose.disconnect();
    console.log("Done!");
}

main().catch(err => { console.error(err); process.exit(1); });
