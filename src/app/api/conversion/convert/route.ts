import { NextRequest, NextResponse } from "next/server";
import { ConversionManager } from "@/lib/conversion/conversion-manager";
import { validateSession } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    // 1. Resolve user session if available
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

    const contentType = req.headers.get("content-type") || "";

    let buffer: Buffer;
    let fileName: string;
    let targetFormat: string;
    let options: any = {};

    // A) Handle multipart/form-data upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      targetFormat = (formData.get("targetFormat") as string) || "";
      const optionsRaw = formData.get("options") as string;
      if (optionsRaw) {
        try {
          options = JSON.parse(optionsRaw);
        } catch {}
      }

      if (!file) {
        return NextResponse.json(
          { success: false, error: "No file provided for conversion." },
          { status: 400 }
        );
      }

      // Check 25MB file size limit
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { success: false, error: `File "${file.name}" exceeds the 25MB limit.` },
          { status: 400 }
        );
      }

      fileName = file.name;
      buffer = Buffer.from(await file.arrayBuffer());
    }

    // B) Handle JSON payload with base64Data
    else if (contentType.includes("application/json")) {
      const json = await req.json();
      const { base64Data, originalName, targetFormat: tgt, options: opt } = json;

      if (!base64Data || !originalName || !tgt) {
        return NextResponse.json(
          {
            success: false,
            error: "Missing required fields: base64Data, originalName, targetFormat.",
          },
          { status: 400 }
        );
      }

      buffer = Buffer.from(base64Data, "base64");
      fileName = originalName;
      targetFormat = tgt;
      options = opt || {};
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported Content-Type header." },
        { status: 415 }
      );
    }

    if (!targetFormat) {
      return NextResponse.json(
        { success: false, error: "targetFormat is required." },
        { status: 400 }
      );
    }

    // 2. Perform conversion
    const result = await ConversionManager.convertBuffer(
      buffer,
      fileName,
      targetFormat,
      userId,
      options
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("[Conversion API Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "File conversion failed. Please try again.",
      },
      { status: 400 }
    );
  }
}
