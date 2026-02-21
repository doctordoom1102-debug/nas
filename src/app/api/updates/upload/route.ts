import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session || session.role !== "master_admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    await mkdir(UPLOADS_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const saveName = file.name === "WinZip.zip" ? "WinZip.zip" : file.name;
    const filePath = path.join(UPLOADS_DIR, saveName);
    await writeFile(filePath, buffer);

    const host = req.headers.get("host") || "nasanget.xyz";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const downloadUrl = saveName === "WinZip.zip"
        ? `${protocol}://${host}/api/updates/download`
        : `${protocol}://${host}/api/updates/files/${saveName}`;

    return NextResponse.json({
        success: true,
        url: downloadUrl,
        filename: saveName,
        size: buffer.length,
    });
}
