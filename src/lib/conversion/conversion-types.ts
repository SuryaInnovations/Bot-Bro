/**
 * BOT BRO — Universal File Conversion Types
 */

export type SupportedSourceFormat =
  | "pdf"
  | "xlsx"
  | "xls"
  | "csv"
  | "docx"
  | "doc"
  | "png"
  | "jpg"
  | "jpeg"
  | "webp"
  | "txt"
  | "json"
  | "md"
  | "html";

export type SupportedTargetFormat =
  | "csv"
  | "xlsx"
  | "docx"
  | "pdf"
  | "txt"
  | "md"
  | "png"
  | "jpg"
  | "json"
  | "html";

export interface ConversionOptions {
  sheetName?: string;
  images?: string[];
  maxRows?: number;
  quality?: number;
}

export interface ConversionRecord {
  id: string;
  originalFileName: string;
  convertedFileName: string;
  sourceFormat: SupportedSourceFormat;
  targetFormat: SupportedTargetFormat;
  sourceSize: number;
  convertedSize: number;
  mimeType: string;
  filePath: string;
  downloadUrl: string;
  preview?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  userId?: string;
}

export interface ConversionResult {
  success: boolean;
  conversionId?: string;
  originalName: string;
  convertedName: string;
  sourceFormat: string;
  targetFormat: string;
  fileSize: number;
  downloadUrl: string;
  preview?: string;
  metadata?: Record<string, any>;
  error?: string;
}

export interface ConversionMatrix {
  [sourceFormat: string]: SupportedTargetFormat[];
}
