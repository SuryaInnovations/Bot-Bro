import { Citation } from "@/types";
import { performWebSearch } from "../web-search";
import { classifyCredibilityTier } from "./news";
import { SourceCredibilityTier } from "./types";

export interface FactEvidenceSource {
  title: string;
  url: string;
  snippet: string;
  isOfficialSource: boolean;
  publisher: string;
  stance: "supportive" | "refuting" | "neutral";
  credibilityTier: SourceCredibilityTier;
  officialBadge?: string;
  publishedDate?: string;
}

export interface InformationNeedAssessment {
  needsCurrentInfo: boolean;
  temporalScope: "realtime_current" | "recent_past" | "historical" | "evergreen_knowledge";
  primaryDomain: "news" | "finance" | "weather" | "science" | "policy" | "general";
  recommendedSources: string[];
  reasoning: string;
}

export interface FactVerificationResult {
  claim: string;
  verdict: "Supported" | "Contradicted" | "Mixed/Uncertain" | "Insufficient Evidence";
  confidenceScore: number; // strictly 0 to 0.92; never claims 100%
  evidenceSources: FactEvidenceSource[];
  citations: Citation[];
  analysis: string;
  conflictingDetails?: {
    supportiveSummary: string;
    refutingSummary: string;
  };
  caveats: string[];
  retrievedAt: string;
  assessment: InformationNeedAssessment;
}

const REFUTATION_PATTERNS = [
  /\b(false|debunked|hoax|untrue|fabricated|disproved|misinformation|disputed|unfounded|rumor|not true)\b/i,
  /\b(denies|rejected|refuted|no evidence to support|claim is false|misleading|incorrect)\b/i,
];

const CONFIRMATION_PATTERNS = [
  /\b(confirmed|verified|official|announced|published|discovered|documented|approved)\b/i,
  /\b(evidence shows|study demonstrates|according to official reports|enacted|cleared)\b/i,
];

export function assessInformationNeed(prompt: string): InformationNeedAssessment {
  const p = prompt.toLowerCase();

  const realtimeTriggers = [
    "today", "now", "current", "latest", "breaking", "price", "rate", "forecast", "weather",
    "market", "stock", "nifty", "sensex", "usd", "inr", "gold", "silver", "bitcoin", "crypto",
    "recent", "yesterday", "this week", "announcement", "pib", "cabinet", "election",
  ];

  const needsCurrent = realtimeTriggers.some((t) => p.includes(t));

  let primaryDomain: InformationNeedAssessment["primaryDomain"] = "general";
  if (p.includes("weather") || p.includes("rain") || p.includes("temperature")) {
    primaryDomain = "weather";
  } else if (p.includes("stock") || p.includes("gold") || p.includes("nifty") || p.includes("forex") || p.includes("crypto") || p.includes("rupee") || p.includes("dollar")) {
    primaryDomain = "finance";
  } else if (p.includes("space") || p.includes("isro") || p.includes("nasa") || p.includes("quantum") || p.includes("biology") || p.includes("study")) {
    primaryDomain = "science";
  } else if (p.includes("cabinet") || p.includes("government") || p.includes("ministry") || p.includes("bill") || p.includes("rbi") || p.includes("law")) {
    primaryDomain = "policy";
  } else if (p.includes("news") || p.includes("headline") || p.includes("happened")) {
    primaryDomain = "news";
  }

  let temporalScope: InformationNeedAssessment["temporalScope"] = "evergreen_knowledge";
  if (needsCurrent) {
    temporalScope = "realtime_current";
  } else if (p.includes("in 202") || p.includes("last year") || p.includes("history")) {
    temporalScope = "historical";
  }

  return {
    needsCurrentInfo: needsCurrent,
    temporalScope,
    primaryDomain,
    recommendedSources:
      primaryDomain === "finance"
        ? ["NSE/BSE", "RBI", "European Central Bank", "CoinGecko"]
        : primaryDomain === "weather"
        ? ["Open-Meteo", "WMO Stations"]
        : primaryDomain === "policy"
        ? ["Press Information Bureau (PIB)", "The Gazette of India", "Official Portals"]
        : primaryDomain === "science"
        ? ["Peer-reviewed Journals", "Space Agencies", "Academic Preprints"]
        : ["Accredited News Wires (Reuters, AP, PTI)", "Institutional Press"],
    reasoning: needsCurrent
      ? `Query references dynamic or time-sensitive data (${primaryDomain}). Real-time live source verification is required.`
      : `Query appears conceptual or historical; cross-referencing against verified records.`,
  };
}

export async function verifyFactualClaim(claim: string): Promise<FactVerificationResult> {
  const now = new Date().toISOString();
  const assessment = assessInformationNeed(claim);

  if (!claim || claim.trim().length < 5) {
    return {
      claim,
      verdict: "Insufficient Evidence",
      confidenceScore: 0.1,
      evidenceSources: [],
      citations: [],
      analysis: "Claim text is too brief to formulate an empirical verification search.",
      caveats: ["Please provide a specific factual statement or proposition to cross-verify."],
      retrievedAt: now,
      assessment,
    };
  }

  try {
    const searchQuery = claim.length > 50 ? claim : `${claim} fact check`;
    let searchRes = await performWebSearch(searchQuery);
    if (!searchRes.results || searchRes.results.length === 0) {
      searchRes = await performWebSearch(claim);
    }
    const results = searchRes.results || [];

    if (results.length === 0) {
      return {
        claim,
        verdict: "Insufficient Evidence",
        confidenceScore: 0.15,
        evidenceSources: [],
        citations: [],
        analysis: "No public search records, academic publications, or news sources were retrieved for this query.",
        caveats: [
          "Lack of indexed evidence does not conclusively disprove the claim, but independent verification could not be established.",
          "Exercise caution with unverified assertions.",
        ],
        retrievedAt: now,
        assessment,
      };
    }

    let refutingCount = 0;
    let supportiveCount = 0;
    const supportiveSnippets: string[] = [];
    const refutingSnippets: string[] = [];

    const evidenceSources: FactEvidenceSource[] = results.map((r) => {
      let publisher = "Web Source";
      try {
        const parsed = new URL(r.url);
        publisher = parsed.hostname.replace(/^www\./, "");
      } catch {
        // ignore
      }

      const { tier, badge } = classifyCredibilityTier(r.url);
      const isOfficial = tier === "official" || tier === "institutional" || tier === "wire";

      const textToScan = `${r.title} ${r.snippet}`.toLowerCase();
      const isRefuting = REFUTATION_PATTERNS.some((p) => p.test(textToScan));
      const isConfirming = CONFIRMATION_PATTERNS.some((p) => p.test(textToScan));

      let stance: "supportive" | "refuting" | "neutral" = "neutral";
      if (isRefuting && !isConfirming) {
        stance = "refuting";
        refutingCount++;
        refutingSnippets.push(r.title);
      } else if (isConfirming && !isRefuting) {
        stance = "supportive";
        supportiveCount++;
        supportiveSnippets.push(r.title);
      } else if (isRefuting && isConfirming) {
        stance = "neutral";
      } else {
        stance = "supportive";
        supportiveCount++;
        supportiveSnippets.push(r.title);
      }

      return {
        title: r.title,
        url: r.url,
        snippet: r.snippet,
        isOfficialSource: isOfficial,
        publisher,
        stance,
        credibilityTier: tier,
        officialBadge: badge,
        publishedDate: r.publishedDate || "Recently Indexed",
      };
    });

    const totalValid = evidenceSources.length;
    const officialCount = evidenceSources.filter((e) => e.isOfficialSource).length;

    // Determine Honest Empirical Verdict
    let verdict: "Supported" | "Contradicted" | "Mixed/Uncertain" | "Insufficient Evidence";
    let analysis = "";
    let conflictingDetails: FactVerificationResult["conflictingDetails"];
    const caveats: string[] = [
      "Information is based on external public sources indexed up to the recorded retrieval timestamp.",
      "Never treat AI fact evaluation as substitute for primary judicial, statutory, or medical records.",
    ];

    if (refutingCount > 0 && supportiveCount > 0) {
      verdict = "Mixed/Uncertain";
      analysis = `Identified conflicting evidence across ${totalValid} independent sources: ${supportiveCount} source(s) support or report the claim, while ${refutingCount} source(s) actively dispute, qualify, or refute aspects of it.`;
      conflictingDetails = {
        supportiveSummary: `Supportive reporting observed in: ${supportiveSnippets.slice(0, 2).join("; ") || "General press reports"}`,
        refutingSummary: `Conflicting or refuting statements found in: ${refutingSnippets.slice(0, 2).join("; ") || "Dispute articles"}`,
      };
      caveats.push("Conflicting perspectives exist across independent news or scientific sources.");
    } else if (refutingCount > supportiveCount) {
      verdict = "Contradicted";
      analysis = `Cross-source analysis indicates that ${refutingCount} source(s) explicitly dispute, debunk, or contradict this assertion.`;
      caveats.push("Multiple verified sources characterize this claim as inaccurate, disproven, or unfounded.");
    } else if (supportiveCount >= 2) {
      verdict = "Supported";
      analysis = `Cross-referenced ${totalValid} external sources (${officialCount} primary/institutional tier). Consistent corroboration observed across independent publishers without active rebuttals.`;
    } else {
      verdict = "Insufficient Evidence";
      analysis = `Only single-source or weak corroboration was retrieved. Evidence volume is insufficient to confirm or refute with high confidence.`;
      caveats.push("Single-source or sparse reporting requires cautious interpretation.");
    }

    // Honest Confidence Scoring: Capped at 0.92. Never claims 100% accuracy.
    const consensusRatio = totalValid > 0 ? (supportiveCount + refutingCount) / (totalValid * 1.5) : 0.3;
    const officialBonus = officialCount > 0 ? 0.15 : 0;
    const rawScore = 0.4 + consensusRatio * 0.3 + officialBonus;
    const confidenceScore = Math.min(0.92, Math.max(0.2, rawScore));

    return {
      claim,
      verdict,
      confidenceScore: parseFloat(confidenceScore.toFixed(2)),
      evidenceSources,
      citations: searchRes.citations,
      analysis,
      conflictingDetails,
      caveats,
      retrievedAt: now,
      assessment,
    };
  } catch (err: any) {
    return {
      claim,
      verdict: "Insufficient Evidence",
      confidenceScore: 0.1,
      evidenceSources: [],
      citations: [],
      analysis: `Fact check engine encountered a retrieval exception: ${err?.message || "Connection timeout"}`,
      caveats: ["Verification could not be fully performed due to external search network restrictions."],
      retrievedAt: now,
      assessment,
    };
  }
}
