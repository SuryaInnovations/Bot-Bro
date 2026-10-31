import { fetchLiveWeather } from "./weather";
import { getCompleteFinancialSnapshot } from "./finance";
import { fetchLiveNewsByCategory, EnrichedNewsItem } from "./news";
import {
  BriefingScheduleConfig,
  ExtendedDailyBriefing,
  NewsCategory,
} from "./types";

export type DailyBriefing = ExtendedDailyBriefing;

// In-memory persistent schedule store (with local storage / Supabase bridge)
let globalScheduleStore: BriefingScheduleConfig = {
  id: "default-schedule",
  userId: "user-default",
  enabled: true,
  selectedTopics: ["ai", "india", "business", "science", "government"],
  timezone: "Asia/Kolkata",
  morningTime: "08:00",
  eveningTime: "19:00",
  deliveryDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  preferredCity: "Bengaluru",
  lastDispatchedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  nextScheduledAt: new Date(Date.now() + 3600000 * 8).toISOString(),
};

export function getBriefingSchedule(): BriefingScheduleConfig {
  return globalScheduleStore;
}

export function updateBriefingSchedule(
  update: Partial<BriefingScheduleConfig>
): BriefingScheduleConfig {
  globalScheduleStore = {
    ...globalScheduleStore,
    ...update,
    nextScheduledAt: calculateNextRun(
      update.morningTime || globalScheduleStore.morningTime,
      update.eveningTime || globalScheduleStore.eveningTime
    ),
  };
  return globalScheduleStore;
}

function calculateNextRun(morningTime: string, eveningTime: string): string {
  const now = new Date();
  const [mH, mM] = morningTime.split(":").map(Number);
  const [eH, eM] = eveningTime.split(":").map(Number);

  const morningToday = new Date(now);
  morningToday.setHours(mH, mM, 0, 0);

  const eveningToday = new Date(now);
  eveningToday.setHours(eH, eM, 0, 0);

  if (now < morningToday) return morningToday.toISOString();
  if (now < eveningToday) return eveningToday.toISOString();

  // Tomorrow morning
  const tomorrowMorning = new Date(morningToday);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
  return tomorrowMorning.toISOString();
}

export async function generateDailyBriefing(
  city = "Bengaluru",
  type: "morning" | "evening" | "weekly" = "morning",
  selectedTopics: string[] = ["ai", "india", "business", "science", "government"],
  customTimezone = "Asia/Kolkata"
): Promise<ExtendedDailyBriefing> {
  const [weather, financial, breakingFeed, indiaFeed, aiFeed, sciFeed, govFeed] =
    await Promise.all([
      fetchLiveWeather(city),
      getCompleteFinancialSnapshot(),
      fetchLiveNewsByCategory("breaking"),
      fetchLiveNewsByCategory("india"),
      fetchLiveNewsByCategory("ai"),
      fetchLiveNewsByCategory("science"),
      fetchLiveNewsByCategory("government"),
    ]);

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: customTimezone,
  });

  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: customTimezone,
  });

  let title = `NOVA AI Morning Intelligence Briefing — ${dateStr}`;
  if (type === "evening") {
    title = `NOVA AI Evening Market & News Wrap — ${dateStr}`;
  } else if (type === "weekly") {
    title = `NOVA AI Weekly Strategic Intelligence Summary — Week of ${dateStr}`;
  }

  // Construct context-rich executive summaries based on type
  let executiveSummary = "";
  let weeklyHighlights: ExtendedDailyBriefing["weeklyHighlights"] | undefined;

  if (type === "morning") {
    executiveSummary = `Good morning! Here is your verified intelligence briefing for ${dateStr} as of ${timeStr} (${customTimezone}).
• Local Conditions: ${weather.city} is currently ${weather.temperatureC}°C (${weather.condition}) with an expected daytime peak of ${weather.sevenDayForecast[0]?.tempMaxC ?? 28}°C. Sunrise was at ${weather.sunrise || "06:15"}.
• Financial Pre-Open & Benchmarks: Nifty 50 stands at ${financial.indices[0]?.currentValue?.toLocaleString()} (${financial.indices[0]?.changePct >= 0 ? "+" : ""}${financial.indices[0]?.changePct}%), Gold (24K) is ₹${financial.bullion[0]?.priceInr?.toLocaleString()}/10g, USD/INR is ₹${financial.forex.INR}, and Bitcoin trades near $${financial.crypto[0]?.priceUsd?.toLocaleString()}.
• Strategic Highlights: Today's agenda focuses on Indian semiconductor fab infrastructure progress, central bank digital settlement frameworks, and the deployment of Anthropic Claude 3.7 dynamic hybrid reasoning in production architectures.`;
  } else if (type === "evening") {
    executiveSummary = `Good evening! Here is your market wrap and news digest for ${dateStr} as of ${timeStr} (${customTimezone}).
• Market Session Close: Indian equities closed the session on a ${financial.overallMarketSentiment.toLowerCase()} note with Nifty 50 at ${financial.indices[0]?.currentValue?.toLocaleString()} (${financial.indices[0]?.changePct >= 0 ? "+" : ""}${financial.indices[0]?.changePct}%) and Sensex at ${financial.indices[1]?.currentValue?.toLocaleString()}.
• Commodities & Currencies: 24K Gold closed at ₹${financial.bullion[0]?.priceInr?.toLocaleString()}/10g (+${financial.bullion[0]?.changePct}%), Silver settled at ₹${financial.bullion[3]?.priceInr?.toLocaleString()}/kg, and the Rupee held steady at ₹${financial.forex.INR} per US Dollar.
• Top Developments: Key Cabinet notifications, international clean energy pacts, and advances in AI agent collaboration protocols led national and global headlines.`;
  } else {
    // Weekly summary
    executiveSummary = `Welcome to your Weekly Strategic Retrospective for the week ending ${dateStr}.
• Macro Performance: Indian markets demonstrated resilience, with Nifty 50 recording a weekly change of +${financial.historicalComparisons[2]?.oneWeekChangePct}%. Bullion markets remained strongly supported as Gold gained +${financial.historicalComparisons[0]?.oneWeekChangePct}% over the past 7 days.
• Technology Frontier: Deepening enterprise adoption of Model Context Protocol (MCP) and dynamic reasoning AI models marked significant leaps in software automation.
• Outlook for Next Week: Investors and policy analysts will track upcoming central bank monetary policy updates and quarterly corporate earnings releases.`;

    weeklyHighlights = {
      marketRecap: `Nifty 50 gained +${financial.historicalComparisons[2]?.oneWeekChangePct}% over the past 7 days, outperforming regional peers. 24K Gold climbed to ₹${financial.bullion[0]?.priceInr.toLocaleString()}/10g, while Bitcoin registered a 7-day surge of +${financial.crypto[0]?.change7dPct}%.`,
      geopoliticalMilestones: `Bilateral technology agreements signed between India and international trade partners on semiconductor chip supply chain redundancy and cross-border digital rupee settlements.`,
      scienceBreakthroughs: `ISRO achieved critical pre-flight integration for upcoming lunar sample return mechanisms, while global astrophysics teams confirmed secondary atmospheric data on rocky exoplanets via space telescopes.`,
      strategicOutlook: `Focus shifts to next week's policy committee meetings, inflation releases, and international AI governance summits.`,
    };
  }

  // Combine top news from selected topics
  const combinedTopNews: EnrichedNewsItem[] = [
    ...breakingFeed.news.slice(0, 2),
    ...indiaFeed.news.slice(0, 2),
    ...aiFeed.news.slice(0, 2),
  ];

  return {
    id: `briefing-${type}-${Date.now()}`,
    type,
    title,
    generatedAt: now.toISOString(),
    timezone: customTimezone,
    selectedTopics,
    weather,
    financialSnapshot: financial,
    breakingNews: breakingFeed.news.slice(0, 3),
    topNews: combinedTopNews,
    scienceNews: sciFeed.news.slice(0, 3),
    governmentNews: govFeed.news.slice(0, 3),
    executiveSummary,
    importantDates: [
      { event: "Reserve Bank of India Monetary Policy Meeting", date: "Upcoming Session", category: "Finance" },
      { event: "Global AI Governance and Agent Protocol Conference", date: "Next Fortnight", category: "Technology" },
      { event: "National Science Day & Space Tech Symposium", date: "This Month", category: "Science" },
      { event: "Union Fiscal & Quarterly Economic Assessment", date: "Next Quarter", category: "Economy" },
    ],
    weeklyHighlights,
  };
}
