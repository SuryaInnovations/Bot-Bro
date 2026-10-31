/**
 * BOT BRO — Word Converter Module
 * Converts Word (.docx) documents to PDF, TXT, HTML, and Markdown.
 */

import { runPythonConversion } from "./python-runner";

export async function wordToPdf(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "docx", "pdf");
}

export async function wordToText(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "docx", "txt");
}

export async function wordToHtml(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "docx", "html");
}

export async function wordToMarkdown(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "docx", "md");
}
