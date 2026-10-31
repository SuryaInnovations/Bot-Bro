export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type ImageStyle =
  | "natural"
  | "photorealistic"
  | "3d-cartoon"
  | "digital-art"
  | "logo"
  | "anime"
  | "watercolor"
  | "cyberpunk"
  | "cinematic";

export interface GenerateImageOptions {
  prompt: string;
  aspectRatio?: AspectRatio;
  style?: ImageStyle;
  seed?: number;
  sourceImageUrl?: string;
  editInstruction?: string;
  userId?: string;
  conversationId?: string;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  revisedPrompt: string;
  url: string;
  downloadUrl: string;
  aspectRatio: AspectRatio;
  dimensions: {
    width: number;
    height: number;
  };
  width?: number;
  height?: number;
  style: ImageStyle;
  seed: number;
  provider: string;
  model?: string;
  fileSizeBytes: number;
  format: "png" | "jpeg" | "webp";
  createdAt: string;
  userId?: string;
  conversationId?: string;
}

export interface ImageGenerationResult {
  success: boolean;
  image?: GeneratedImage;
  error?: string;
  cooldownSeconds?: number;
  provider?: string;
}
