import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { Attachment } from "@/types";
import { estimateTokenCount, generateId } from "./utils";

const UPLOADS_DIR = path.join(process.cwd(), ".data", "uploads");

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export async function processUploadedFile(file: File): Promise<Attachment> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const name = file.name;
  const size = file.size;
  const id = generateId();

  // Save raw file to disk for conversions
  ensureUploadsDir();
  const safeName = path.basename(name).replace(/[^a-zA-Z0-9_\-\.]/g, "_");
  const tempPath = path.join(UPLOADS_DIR, `${id}_${safeName}`);
  try {
    fs.writeFileSync(tempPath, buffer);
  } catch (err) {
    console.warn("[FileProcessor] Note saving temp file to disk:", err);
  }

  let extractedText: string | undefined;
  let base64Data: string | undefined;

  // Always keep base64 for files up to 15MB for fast in-memory conversion
  if (size <= 15 * 1024 * 1024) {
    base64Data = buffer.toString("base64");
  }

  // Handle images
  if (mimeType.startsWith("image/")) {
    return {
      id,
      name,
      size,
      type: mimeType,
      base64Data,
      tempPath,
      tokensEstimate: 1600, // Standard image token estimate
    };
  }

  // Handle PDFs
  if (mimeType === "application/pdf" || name.toLowerCase().endsWith(".pdf")) {
    try {
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text.trim();
    } catch (e: any) {
      extractedText = `[PDF extraction note: ${e.message}]`;
    }
  }

  // Handle DOCX
  else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.toLowerCase().endsWith(".docx")
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value.trim();
    } catch (e: any) {
      extractedText = `[DOCX extraction note: ${e.message}]`;
    }
  }

  // Handle Excel / Spreadsheets
  else if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    mimeType === "application/vnd.ms-excel" ||
    name.toLowerCase().endsWith(".xlsx") ||
    name.toLowerCase().endsWith(".xls")
  ) {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetTexts: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        sheetTexts.push(`--- Sheet: ${sheetName} ---\n${csv}`);
      }
      extractedText = sheetTexts.join("\n\n");
    } catch (e: any) {
      extractedText = `[Spreadsheet extraction note: ${e.message}]`;
    }
  }

  // Handle CSV, Text, Markdown, JSON, XML, Code
  else {
    try {
      extractedText = buffer.toString("utf-8");
    } catch (e: any) {
      extractedText = `[Binary content, size ${size} bytes]`;
    }
  }

  return {
    id,
    name,
    size,
    type: mimeType,
    base64Data,
    tempPath,
    extractedText,
    tokensEstimate: extractedText ? estimateTokenCount(extractedText) : 0,
  };
}
