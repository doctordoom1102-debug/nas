import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { News } from "@/lib/models/News";

export async function GET() {
    const session = await getSession();
    if (!session || !["master_admin", "admin"].includes(session.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const news = await News.find({}).sort({ priority: -1, createdAt: -1 }).lean();
    return NextResponse.json({ news });
}

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "master_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { title, content, isActive, priority } = await req.json();

    if (!title || !content) {
        return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const item = await News.create({
        title,
        content,
        isActive: isActive !== false,
        priority: priority || 0,
        createdBy: session.userId,
    });

    return NextResponse.json({ success: true, news: item });
}
