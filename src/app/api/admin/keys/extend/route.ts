import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { License } from "@/lib/models/License";
import { Log } from "@/lib/models/Log";

// PATCH /api/admin/keys/extend — extend a key's expiry
export async function PATCH(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "master_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { key, days } = await req.json();
    if (!key || !days || isNaN(Number(days)) || Number(days) <= 0) {
        return NextResponse.json({ error: "Key and valid days are required" }, { status: 400 });
    }

    const license = await License.findOne({ key });
    if (!license) {
        return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    // Calculate new expiry
    const daysToAdd = Number(days);
    const currentExpiry = license.expiresAt ? new Date(license.expiresAt) : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    license.expiresAt = newExpiry;

    // If key was expired, reactivate it
    if (license.status === "expired") {
        license.status = "active";
    }

    await license.save();

    // Log the extension
    try {
        await Log.create({
            action: "key_extended",
            performedBy: session.userId,
            licenseKey: key,
            details: `Key extended by ${daysToAdd} days by Master Admin. New expiry: ${newExpiry.toISOString()}`,
            createdAt: new Date(),
        });
    } catch (e) {
        console.error("Log creation failed:", e);
    }

    return NextResponse.json({
        success: true,
        message: `Key extended by ${daysToAdd} days`,
        newExpiry: newExpiry.toISOString(),
    });
}
