import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ConversionManager } from "@/lib/conversion/conversion-manager";
import { validateSession } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  { params }: { params: { conversionId: string } }
) {
  try {
    const { conversionId } = params;

    if (!conversionId) {
      return NextResponse.json(
        { success: false, error: "conversionId is required." },
        { status: 400 }
      );
    }

    // Resolve user session if available
    let userId: string | undefined = undefined;
    const sessionToken =
      req.cookies.get("nova_session_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    if (sessionToken) {
      const user = validateSession(sessionToken);
      if (user) {
        userId = user.id;
      }
    }

    const record = ConversionManager.getConversion(conversionId, userId);
    if (!record || !fs.existsSync(record.filePath)) {
      return NextResponse.json(
        { success: false, error: "Converted file not found or has expired." },
        { status: 404 }
      );
    }

    // Prevent directory traversal: verify file is strictly inside conversions directory
    const resolvedPath = path.resolve(record.filePath);
    const conversionsDir = path.resolve(path.join(process.cwd(), ".data", "conversions"));
    if (!resolvedPath.startsWith(conversionsDir)) {
      return NextResponse.json(
        { success: false, error: "Access denied." },
        { status: 403 }
      );
    }

    const fileBuffer = fs.readFileSync(resolvedPath);

    const headers = new Headers();
    headers.set("Content-Type", record.mimeType || "application/octet-stream");
    headers.set("Content-Length", fileBuffer.length.toString());
    headers.set(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(record.convertedFileName)}"`
    );
    headers.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error("[Download API Error]:", err);
    return NextResponse.json(
      { success: false, error: "Failed to download file." },
      { status: 500 }
    );
  }
}
