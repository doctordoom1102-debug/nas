import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { News } from "@/lib/models/News";
import { Setting } from "@/lib/models/Setting";

/**
 * GET /api/news
 * Public endpoint called by the desktop EXE to fetch latest news and channel links.
 * No auth required.
 */
export async function GET() {
    try {
        await connectDB();

        const [newsItems, settings] = await Promise.all([
            News.find({ isActive: true }).sort({ priority: -1, createdAt: -1 }).limit(10).lean(),
            Setting.find({ key: { $in: ["whatsapp_link", "telegram_link"] } }).lean(),
        ]);

        const links: Record<string, string> = {};
        for (const s of settings) {
            links[s.key] = s.value;
        }

        return NextResponse.json({
            success: true,
            news: newsItems.map((n: any) => ({
                id: n._id,
                title: n.title,
                content: n.content,
                date: n.createdAt,
            })),
            whatsapp_link: links.whatsapp_link || "https://whatsapp.com/channel/0029Vb7qq7ZElagvIZ8YGd2s",
            telegram_link: links.telegram_link || "https://telegram.me/NASAControl",
        });
    } catch (err) {
        console.error("News API error:", err);
        return NextResponse.json({ success: false, news: [], whatsapp_link: "", telegram_link: "" });
    }
}
