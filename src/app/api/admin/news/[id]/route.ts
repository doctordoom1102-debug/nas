import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { News } from "@/lib/models/News";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || session.role !== "master_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { title, content, isActive, priority } = await req.json();
    const { id } = await params;

    const update: any = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (content !== undefined) update.content = content;
    if (isActive !== undefined) update.isActive = isActive;
    if (priority !== undefined) update.priority = priority;

    const item = await News.findByIdAndUpdate(id, update, { new: true });
    if (!item) {
        return NextResponse.json({ error: "News item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, news: item });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const session = await getSession();
    if (!session || session.role !== "master_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id } = await params;
    const item = await News.findByIdAndDelete(id);
    if (!item) {
        return NextResponse.json({ error: "News item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
