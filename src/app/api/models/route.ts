import { NextRequest, NextResponse } from "next/server";
import { providerRouter } from "@/lib/providers/provider-router";
import { CLAUDE_MODELS } from "@/lib/anthropic/client";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const customKey = req.headers.get("x-custom-api-key") || undefined;

    // Get free models from multi-provider router
    const freeModels = await providerRouter.getAvailableModels();

    // If user provided a custom Anthropic API key, allow Claude models as optional
    const allModels = [...freeModels];
    if (customKey) {
      allModels.push(
        ...CLAUDE_MODELS.map((m) => ({
          id: m.id,
          provider: "anthropic" as const,
          name: m.name,
          description: m.description,
          isFree: false,
          contextWindow: m.contextWindow,
          maxOutputTokens: m.maxOutputTokens,
          supportsStreaming: true,
          supportsTools: !!m.supportsTools,
          supportsVision: !!m.supportsVision,
          badge: "Anthropic (Paid)",
        }))
      );
    }

    return NextResponse.json({
      models: allModels,
      defaultModel: "gemini-flash-lite-latest",
      isLive: true,
      providerQuotas: providerRouter.getQuotaStatuses(),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to retrieve models" },
      { status: 500 }
    );
  }
}
