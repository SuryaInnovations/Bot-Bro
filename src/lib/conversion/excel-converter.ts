/**
 * BOT BRO — Excel Converter Module
 * Converts spreadsheets (.xlsx / .xls) to CSV, PDF, JSON, and HTML.
 */

import { runPythonConversion } from "./python-runner";

export async function excelToCsv(
  sourcePath: string,
  targetPath: string,
  sheetName?: string
) {
  return runPythonConversion(sourcePath, targetPath, "xlsx", "csv", { sheet_name: sheetName });
}

export async function excelToPdf(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "xlsx", "pdf");
}

export async function excelToJson(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "xlsx", "json");
}

export async function excelToHtml(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "xlsx", "html");
}
