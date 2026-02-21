import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const MIME_MAP: Record<string, string> = {
    ".exe": "application/octet-stream",
    ".zip": "application/zip",
    ".dll": "application/octet-stream",
    ".txt": "text/plain",
};

export async function GET(
    req: NextRequest,
    { params }: { params: { path: string[] } }
) {
    const { path: segments } = await params;
    const filename = segments.join("/");

    if (filename.includes("..") || filename.includes("/")) {
        return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const filePath = path.join(UPLOADS_DIR, filename);

    try {
        const fileStat = await stat(filePath);
        const buffer = await readFile(filePath);
        const ext = path.extname(filename).toLowerCase();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": MIME_MAP[ext] || "application/octet-stream",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Content-Length": fileStat.size.toString(),
            },
        });
    } catch {
        return NextResponse.json(
            { error: "File not found" },
            { status: 404 }
        );
    }
}
