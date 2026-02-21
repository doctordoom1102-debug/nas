import { NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

export async function GET() {
    const filePath = path.join(UPLOADS_DIR, "WinZip.zip");

    try {
        const fileStat = await stat(filePath);
        const buffer = await readFile(filePath);

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": 'attachment; filename="WinZip.zip"',
                "Content-Length": fileStat.size.toString(),
            },
        });
    } catch {
        return NextResponse.json(
            { error: "No update file available" },
            { status: 404 }
        );
    }
}
