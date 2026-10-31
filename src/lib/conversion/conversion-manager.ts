/**
 * BOT BRO — Conversion Manager
 * Central orchestration, file validation, security, and lifecycle management.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  ConversionRecord,
  ConversionResult,
  ConversionOptions,
  SupportedSourceFormat,
  SupportedTargetFormat,
  ConversionMatrix,
} from "./conversion-types";
import { runPythonConversion } from "./python-runner";

// Persistent directories
const DATA_DIR = path.join(process.cwd(), ".data");
const CONVERSIONS_DIR = path.join(DATA_DIR, "conversions");
const REGISTRY_FILE = path.join(DATA_DIR, "conversions_registry.json");

// In-memory store
let conversionStore: ConversionRecord[] = [];

function ensureDirectories(): void {
  if (!fs.existsSync(CONVERSIONS_DIR)) {
    fs.mkdirSync(CONVERSIONS_DIR, { recursive: true });
  }
}

function loadRegistry(): void {
  try {
    ensureDirectories();
    if (fs.existsSync(REGISTRY_FILE)) {
      const data = fs.readFileSync(REGISTRY_FILE, "utf-8");
      conversionStore = JSON.parse(data);
    }
  } catch (err) {
    console.warn("[ConversionManager] Note reading registry:", err);
  }
}

function saveRegistry(): void {
  try {
    ensureDirectories();
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(conversionStore, null, 2), "utf-8");
  } catch (err) {
    console.warn("[ConversionManager] Note saving registry:", err);
  }
}

// Initialize on module load
loadRegistry();

export const SUPPORTED_CONVERSIONS: ConversionMatrix = {
  pdf: ["csv", "xlsx", "docx", "txt", "md", "png", "jpg"],
  xlsx: ["csv", "pdf", "json", "html"],
  xls: ["csv", "pdf", "json", "html"],
  csv: ["xlsx", "json", "pdf", "html"],
  docx: ["pdf", "txt", "html", "md"],
  doc: ["pdf", "txt", "html", "md"],
  png: ["jpg", "pdf"],
  jpg: ["png", "pdf"],
  jpeg: ["png", "pdf"],
  webp: ["jpg", "png", "pdf"],
  txt: ["pdf", "docx"],
  json: ["csv", "xlsx", "pdf"],
  md: ["pdf", "html"],
  html: ["pdf"],
};

export class ConversionManager {
  /**
   * Determine source format from filename extension or MIME
   */
  public static detectSourceFormat(fileName: string, mimeType?: string): SupportedSourceFormat | null {
    const ext = path.extname(fileName).toLowerCase().replace(".", "") as SupportedSourceFormat;
    if (ext in SUPPORTED_CONVERSIONS) {
      return ext;
    }

    if (mimeType) {
      if (mimeType === "application/pdf") return "pdf";
      if (mimeType.includes("spreadsheetml") || mimeType.includes("excel")) return "xlsx";
      if (mimeType === "text/csv") return "csv";
      if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) return "docx";
      if (mimeType === "image/png") return "png";
      if (mimeType === "image/jpeg") return "jpg";
      if (mimeType === "text/plain") return "txt";
      if (mimeType === "application/json") return "json";
      if (mimeType === "text/markdown") return "md";
      if (mimeType === "text/html") return "html";
    }

    return null;
  }

  /**
   * Check if a specific conversion path is genuinely supported
   */
  public static isSupported(sourceFormat: string, targetFormat: string): boolean {
    const src = sourceFormat.toLowerCase().replace(".", "");
    const tgt = targetFormat.toLowerCase().replace(".", "") as SupportedTargetFormat;
    const allowed = SUPPORTED_CONVERSIONS[src];
    return Boolean(allowed && allowed.includes(tgt));
  }

  /**
   * Extract conversion intent and requested target format from natural user prompts
   */
  public static parseConversionIntent(
    prompt: string,
    sourceFileName?: string
  ): { targetFormat: SupportedTargetFormat | null; confidence: number } {
    const p = prompt.toLowerCase();

    // Check explicit target formats mentioned
    if (p.includes("to csv") || p.includes("as csv") || p.includes("extract tables to csv") || p.includes("table to csv")) {
      return { targetFormat: "csv", confidence: 0.95 };
    }
    if (p.includes("to excel") || p.includes("as excel") || p.includes("to xlsx") || p.includes("spreadsheet")) {
      return { targetFormat: "xlsx", confidence: 0.95 };
    }
    if (p.includes("to word") || p.includes("as word") || p.includes("to docx") || p.includes("word doc")) {
      return { targetFormat: "docx", confidence: 0.95 };
    }
    if (p.includes("to pdf") || p.includes("as pdf") || p.includes("make a pdf") || p.includes("convert to pdf")) {
      return { targetFormat: "pdf", confidence: 0.95 };
    }
    if (p.includes("to text") || p.includes("as txt") || p.includes("plain text") || p.includes("to txt")) {
      return { targetFormat: "txt", confidence: 0.9 };
    }
    if (p.includes("to markdown") || p.includes("as markdown") || p.includes("to md")) {
      return { targetFormat: "md", confidence: 0.9 };
    }
    if (p.includes("to json") || p.includes("as json")) {
      return { targetFormat: "json", confidence: 0.9 };
    }
    if (p.includes("to html") || p.includes("as html")) {
      return { targetFormat: "html", confidence: 0.9 };
    }
    if (p.includes("to jpg") || p.includes("to jpeg") || p.includes("as jpg")) {
      return { targetFormat: "jpg", confidence: 0.9 };
    }
    if (p.includes("to png") || p.includes("as png")) {
      return { targetFormat: "png", confidence: 0.9 };
    }

    return { targetFormat: null, confidence: 0 };
  }

  /**
   * Execute real deterministic conversion on raw buffer
   */
  public static async convertBuffer(
    buffer: Buffer,
    originalFileName: string,
    targetFormat: string,
    userId?: string,
    options?: ConversionOptions
  ): Promise<ConversionResult> {
    ensureDirectories();

    const sourceFmt = this.detectSourceFormat(originalFileName);
    if (!sourceFmt) {
      throw new Error(`Unsupported source format for file "${originalFileName}".`);
    }

    const targetFmt = targetFormat.toLowerCase().replace(".", "") as SupportedTargetFormat;
    if (!this.isSupported(sourceFmt, targetFmt)) {
      throw new Error(
        `Conversion from "${sourceFmt.toUpperCase()}" to "${targetFmt.toUpperCase()}" is not supported.`
      );
    }

    // Generate safe, unguessable file IDs (prevent path traversal)
    const conversionId = `conv-${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const safeBaseName = path.basename(originalFileName, path.extname(originalFileName)).replace(/[^a-zA-Z0-9_\-\.]/g, "_");
    const convertedFileName = `${safeBaseName}.${targetFmt}`;

    const tempSourcePath = path.join(CONVERSIONS_DIR, `${conversionId}_in.${sourceFmt}`);
    const tempTargetPath = path.join(CONVERSIONS_DIR, `${conversionId}_out.${targetFmt}`);

    try {
      // 1. Write buffer to isolated temporary location
      fs.writeFileSync(tempSourcePath, buffer);

      // 2. Run deterministic Python converter
      const pyOutput = await runPythonConversion(
        tempSourcePath,
        tempTargetPath,
        sourceFmt,
        targetFmt,
        options
      );

      // 3. Verify output file exists and is non-empty
      if (!fs.existsSync(tempTargetPath)) {
        throw new Error("Conversion engine did not produce an output file.");
      }

      const convertedStat = fs.statSync(tempTargetPath);
      const convertedSize = convertedStat.size;

      // Extract preview snippet if text/csv/json/md
      let preview: string | undefined = undefined;
      if (pyOutput.metadata && pyOutput.metadata.preview) {
        preview = pyOutput.metadata.preview;
      } else if (["csv", "txt", "md", "json", "html"].includes(targetFmt)) {
        try {
          const textContent = fs.readFileSync(tempTargetPath, "utf-8");
          preview = textContent.slice(0, 2000);
        } catch {}
      }

      // 4. Save record to registry
      const record: ConversionRecord = {
        id: conversionId,
        originalFileName,
        convertedFileName,
        sourceFormat: sourceFmt,
        targetFormat: targetFmt,
        sourceSize: buffer.length,
        convertedSize,
        mimeType: this.getMimeType(targetFmt),
        filePath: tempTargetPath,
        downloadUrl: `/api/conversion/download/${conversionId}`,
        preview,
        metadata: pyOutput.metadata,
        createdAt: new Date().toISOString(),
        userId,
      };

      conversionStore.unshift(record);
      saveRegistry();

      // Clean up input file to save disk space
      try {
        if (fs.existsSync(tempSourcePath)) {
          fs.unlinkSync(tempSourcePath);
        }
      } catch {}

      return {
        success: true,
        conversionId,
        originalName: originalFileName,
        convertedName: convertedFileName,
        sourceFormat: sourceFmt,
        targetFormat: targetFmt,
        fileSize: convertedSize,
        downloadUrl: record.downloadUrl,
        preview,
        metadata: pyOutput.metadata,
      };
    } catch (err: any) {
      // Clean up any remaining temporary files on error
      try {
        if (fs.existsSync(tempSourcePath)) fs.unlinkSync(tempSourcePath);
        if (fs.existsSync(tempTargetPath)) fs.unlinkSync(tempTargetPath);
      } catch {}

      throw err;
    }
  }

  /**
   * Retrieve an authorized conversion record
   */
  public static getConversion(conversionId: string, userId?: string): ConversionRecord | null {
    if (!conversionId) return null;

    // Sanitize conversionId to prevent path traversal
    const safeId = path.basename(conversionId);
    const record = conversionStore.find((c) => c.id === safeId);
    if (!record) return null;

    // Optional user isolation check
    if (record.userId && userId && record.userId !== userId) {
      return null;
    }

    if (!fs.existsSync(record.filePath)) {
      return null;
    }

    return record;
  }

  /**
   * Safe MIME type mapper
   */
  public static getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case "csv":
        return "text/csv; charset=utf-8";
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "pdf":
        return "application/pdf";
      case "txt":
        return "text/plain; charset=utf-8";
      case "md":
        return "text/markdown; charset=utf-8";
      case "json":
        return "application/json; charset=utf-8";
      case "html":
        return "text/html; charset=utf-8";
      case "png":
        return "image/png";
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      default:
        return "application/octet-stream";
    }
  }

  /**
   * Cleanup older files older than maxAgeHours (default 24h)
   */
  public static cleanupOldFiles(maxAgeHours = 24): number {
    const now = Date.now();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    let deletedCount = 0;

    const remaining = [];
    for (const record of conversionStore) {
      const age = now - new Date(record.createdAt).getTime();
      if (age > maxAgeMs) {
        try {
          if (fs.existsSync(record.filePath)) {
            fs.unlinkSync(record.filePath);
            deletedCount++;
          }
        } catch {}
      } else {
        remaining.push(record);
      }
    }

    conversionStore = remaining;
    saveRegistry();
    return deletedCount;
  }
}
