import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Setting } from "@/lib/models/Setting";

// GET /api/admin/settings — get all settings (public for login links)
export async function GET() {
    await connectDB();

    const settings = await Setting.find({}).lean();
    const result: { [key: string]: string } = {};
    for (const s of settings) {
        result[s.key] = s.value;
    }

    return NextResponse.json({ settings: result });
}

// PUT /api/admin/settings — update settings (master_admin only)
export async function PUT(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "master_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { settings } = await req.json();
    if (!settings || typeof settings !== "object") {
        return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
        await Setting.findOneAndUpdate(
            { key },
            { key, value: value as string, updatedAt: new Date() },
            { upsert: true }
        );
    }

    return NextResponse.json({ success: true });
}
