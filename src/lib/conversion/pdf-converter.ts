/**
 * BOT BRO — PDF Converter Module
 * High-accuracy table extraction, text layout preservation, and document conversions.
 */

import { runPythonConversion } from "./python-runner";

export async function pdfToCsv(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "pdf", "csv");
}

export async function pdfToExcel(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "pdf", "xlsx");
}

export async function pdfToWord(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "pdf", "docx");
}

export async function pdfToText(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "pdf", "txt");
}

export async function pdfToMarkdown(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "pdf", "md");
}

export async function pdfToImages(
  sourcePath: string,
  targetPath: string,
  format: "png" | "jpg" = "png"
) {
  return runPythonConversion(sourcePath, targetPath, "pdf", format);
}
