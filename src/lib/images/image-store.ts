import fs from "fs";
import path from "path";
import crypto from "crypto";
import { GeneratedImage } from "./image-types";

const DATA_DIR = path.join(process.cwd(), ".data");
const IMAGES_DIR = path.join(DATA_DIR, "generated_images");
const REGISTRY_FILE = path.join(IMAGES_DIR, "registry.json");

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
  }
  if (!fs.existsSync(REGISTRY_FILE)) {
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify([]), "utf8");
  }
}

export function saveGeneratedImageFile(
  buffer: Buffer,
  meta: Omit<GeneratedImage, "id" | "url" | "downloadUrl" | "fileSizeBytes">
): GeneratedImage {
  ensureDirectories();

  const id = `img-${crypto.randomBytes(8).toString("hex")}`;
  const ext = meta.format === "jpeg" ? "jpg" : meta.format;
  const filename = `${id}.${ext}`;
  const filePath = path.join(IMAGES_DIR, filename);

  fs.writeFileSync(filePath, buffer);

  const imageRecord: GeneratedImage = {
    ...meta,
    id,
    url: `/api/images/generated/${id}`,
    downloadUrl: `/api/images/generated/${id}?download=true`,
    fileSizeBytes: buffer.length,
  };

  try {
    const raw = fs.readFileSync(REGISTRY_FILE, "utf8");
    const registry: GeneratedImage[] = JSON.parse(raw);
    registry.unshift(imageRecord);
    fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), "utf8");
  } catch (err) {
    console.error("[Image Store] Failed to update registry:", err);
  }

  return imageRecord;
}

export function getGeneratedImageRecord(id: string): GeneratedImage | null {
  ensureDirectories();
  try {
    const raw = fs.readFileSync(REGISTRY_FILE, "utf8");
    const registry: GeneratedImage[] = JSON.parse(raw);
    return registry.find((img) => img.id === id) || null;
  } catch {
    return null;
  }
}

export function getGeneratedImagePath(id: string): { filePath: string; format: string } | null {
  ensureDirectories();
  const extensions = ["png", "jpg", "jpeg", "webp"];
  for (const ext of extensions) {
    const candidate = path.join(IMAGES_DIR, `${id}.${ext}`);
    if (fs.existsSync(candidate)) {
      return {
        filePath: candidate,
        format: ext === "jpg" ? "jpeg" : ext,
      };
    }
  }
  return null;
}

export function listUserGeneratedImages(userId?: string): GeneratedImage[] {
  ensureDirectories();
  try {
    const raw = fs.readFileSync(REGISTRY_FILE, "utf8");
    const registry: GeneratedImage[] = JSON.parse(raw);
    if (!userId) return registry.slice(0, 50);
    return registry.filter((img) => !img.userId || img.userId === userId).slice(0, 50);
  } catch {
    return [];
  }
}
