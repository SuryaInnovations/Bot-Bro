/**
 * BOT BRO — Image Converter Module
 * High-quality image transcoding (PNG, JPG, WEBP) and single/multi-image PDF compilation.
 */

import { runPythonConversion } from "./python-runner";

export async function pngToJpg(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "png", "jpg");
}

export async function jpgToPng(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "jpg", "png");
}

export async function imageToPdf(sourcePath: string, targetPath: string) {
  return runPythonConversion(sourcePath, targetPath, "png", "pdf");
}

export async function multipleImagesToPdf(imagePaths: string[], targetPath: string) {
  if (imagePaths.length === 0) {
    throw new Error("No images provided for PDF generation.");
  }
  return runPythonConversion(imagePaths[0], targetPath, "png", "pdf", { images: imagePaths });
}
