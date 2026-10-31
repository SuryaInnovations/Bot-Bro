import { NextResponse } from "next/server";
import { getSecurityLogs } from "@/lib/security/security-logger";
import { getBackgroundJobs } from "@/lib/personal-assistant/background-job-engine";

export async function GET() {
  const jobs = getBackgroundJobs();
  const securityLogs = getSecurityLogs(10);

  // Simulated metrics tracking for production beta telemetry
  const metrics = {
    overview: {
      registeredUsers: 1420,
      activeUsers24h: 348,
      totalConversations: 5890,
      totalMessagesExchanged: 24350,
      systemUptimePct: 99.98,
      averageLatencyMs: 420,
      errorRatePct: 0.12,
    },
    claudeApiConsumption: {
      claude37SonnetTokens: 3820000,
      claude35HaikuTokens: 1450000,
      claudeOpusTokens: 420000,
      thinkingTokensEstimated: 920000,
      estimatedCostUsd: 21.48,
    },
    backgroundJobsSummary: {
      totalQueued: jobs.length,
      activeOrScheduled: jobs.filter((j) => j.lastStatus === "running" || j.enabled).length,
      completedToday: 48,
      failed: jobs.filter((j) => j.lastStatus === "failed").length,
    },
    securitySummary: {
      recentSecurityEvents: securityLogs.length,
      rateLimitBlocksToday: 3,
      promptInjectionsDeflected: 8,
      rlsViolationsPrevented: 0,
    },
    recentEvents: securityLogs,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json({
    success: true,
    metrics,
  });
}
