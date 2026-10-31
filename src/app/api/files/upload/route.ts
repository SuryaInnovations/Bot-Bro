import { NextRequest, NextResponse } from "next/server";
import { processUploadedFile } from "@/lib/file-processor";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const attachments = [];
    for (const file of files) {
      // Validate file size limit: 25MB max
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds the 25MB size limit.` },
          { status: 400 }
        );
      }

      const attachment = await processUploadedFile(file);
      attachments.push(attachment);
    }

    return NextResponse.json({ attachments }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process uploaded file" },
      { status: 500 }
    );
  }
}
