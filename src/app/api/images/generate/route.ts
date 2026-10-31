import { NextRequest, NextResponse } from "next/server";
import { generateImage } from "@/lib/images/image-engine";
import { GenerateImageOptions } from "@/lib/images/image-types";
import { validateSession } from "@/lib/auth/auth-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cookieToken = req.cookies.get("nova_session_token")?.value;
    const token = authHeader?.replace(/^Bearer\s+/i, "") || cookieToken;

    let user = null;
    if (token) {
      user = validateSession(token);
    }

    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      aspectRatio = "1:1",
      style = "natural",
      seed,
      sourceImageUrl,
      editInstruction,
      conversationId,
    } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a valid image description or prompt." },
        { status: 400 }
      );
    }

    const options: GenerateImageOptions = {
      prompt: prompt.trim(),
      aspectRatio,
      style,
      seed: typeof seed === "number" ? seed : undefined,
      sourceImageUrl,
      editInstruction,
      userId: user?.id,
      conversationId,
    };

    const result = await generateImage(options);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to generate image.",
          cooldownSeconds: result.cooldownSeconds,
        },
        { status: result.cooldownSeconds ? 429 : 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        image: result.image,
        provider: result.provider,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[API Image Generate Error]:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error during image generation." },
      { status: 500 }
    );
  }
}
