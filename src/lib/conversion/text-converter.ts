/**
 * BOT BRO — Text and Data Converter Module
 * TXT, JSON, Markdown, and HTML conversions to structured formats and PDFs.
 */

import { runPythonConversion } from "./python-runner";

export async function txtToPdf(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "txt", "pdf");
}

export async function txtToDocx(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "txt", "docx");
}

export async function jsonToCsv(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "json", "csv");
}

export async function jsonToExcel(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "json", "xlsx");
}

export async function jsonToPdf(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "json", "pdf");
}

export async function markdownToPdf(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "md", "pdf");
}

export async function markdownToHtml(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "md", "html");
}

export async function htmlToPdf(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "html", "pdf");
}
