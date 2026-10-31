/**
 * BOT BRO — CSV Converter Module
 * Converts CSV data to Excel (.xlsx), JSON, PDF, and HTML.
 */

import { runPythonConversion } from "./python-runner";

export async function csvToExcel(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "csv", "xlsx");
}

export async function csvToJson(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "csv", "json");
}

export async function csvToPdf(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "csv", "pdf");
}

export async function csvToHtml(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "csv", "html");
}
