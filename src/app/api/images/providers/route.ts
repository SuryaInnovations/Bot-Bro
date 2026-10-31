import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasStability = Boolean(process.env.STABILITY_API_KEY);

  const providers = [
    {
      id: "pollinations",
      name: "Pollinations AI (Flux / SDXL)",
      type: "Free Tier Generative AI",
      freeTierAvailable: true,
      costPerImage: "$0.00",
      requiresApiKey: false,
      aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
      status: "active",
    },
    {
      id: "vector-studio",
      name: "Bot Bro Generative Studio (Vector Engine)",
      type: "High-Precision Local Synthesizer",
      freeTierAvailable: true,
      costPerImage: "$0.00",
      requiresApiKey: false,
      aspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
      status: "active",
    },
    {
      id: "google-imagen",
      name: "Google Imagen 3",
      type: "Cloud Generative AI",
      freeTierAvailable: hasGemini,
      requiresApiKey: true,
      status: hasGemini ? "configured" : "missing_key",
    },
    {
      id: "dall-e-3",
      name: "OpenAI DALL-E 3",
      type: "Cloud Generative AI",
      freeTierAvailable: false,
      requiresApiKey: true,
      status: hasOpenAI ? "configured" : "unconfigured",
    },
  ];

  return NextResponse.json({
    success: true,
    activeProvider: "Pollinations AI (Flux/SDXL)",
    providers,
    cooldownPeriodSeconds: 45,
    supportedStyles: [
      "natural",
      "photorealistic",
      "3d-cartoon",
      "digital-art",
      "logo",
      "anime",
      "watercolor",
      "cyberpunk",
      "cinematic",
    ],
    supportedAspectRatios: ["1:1", "16:9", "9:16", "4:3", "3:4"],
  });
}
