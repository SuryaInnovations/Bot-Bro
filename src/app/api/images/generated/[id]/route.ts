import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { getGeneratedImagePath, getGeneratedImageRecord } from "@/lib/images/image-store";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const fileInfo = getGeneratedImagePath(id);

    if (!fileInfo || !fs.existsSync(fileInfo.filePath)) {
      return NextResponse.json(
        { error: "Generated image not found" },
        { status: 404 }
      );
    }

    const buffer = fs.readFileSync(fileInfo.filePath);
    const searchParams = req.nextUrl.searchParams;
    const isDownload = searchParams.get("download") === "true";

    const record = getGeneratedImageRecord(id);
    const filename = `${(record?.prompt || "bot_bro_image").slice(0, 30).replace(/[^a-z0-9]/gi, "_")}.${fileInfo.format}`;

    const contentType =
      fileInfo.format === "png"
        ? "image/png"
        : fileInfo.format === "webp"
        ? "image/webp"
        : fileInfo.format === "svg"
        ? "image/svg+xml"
        : "image/jpeg";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": buffer.length.toString(),
    };

    if (isDownload) {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
    } else {
      headers["Content-Disposition"] = `inline; filename="${filename}"`;
    }

    return new NextResponse(buffer, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error("[Serve Image Error]:", err);
    return NextResponse.json(
      { error: "Failed to read generated image" },
      { status: 500 }
    );
  }
}
