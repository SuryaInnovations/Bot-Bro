import { Citation } from "@/types";

export type SourceCredibilityTier = "official" | "wire" | "institutional" | "specialized" | "general";

export type DataFreshness = "real-time" | "indicative" | "delayed" | "cached";

export type MarketTradingStatus = "open" | "closed" | "pre-market" | "weekend";

export type NewsCategory =
  | "breaking"
  | "india"
  | "world"
  | "ai"
  | "tech"
  | "business"
  | "science"
  | "government"
  | "cybersecurity"
  | "personalized";

export interface EnrichedNewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publisher: string;
  category: NewsCategory;
  publishedAt: string;
  retrievedAt: string;
  isVerified: boolean;
  isBreaking?: boolean;
  credibilityTier: SourceCredibilityTier;
  officialSourceBadge?: string;
}

export interface DayForecast {
  date: string;
  dayName: string;
  tempMaxC: number;
  tempMinC: number;
  condition: string;
  precipitationProb: number;
  uvIndex?: number;
}

export interface ExtendedWeatherReport {
  city: string;
  country: string;
  temperatureC: number;
  temperatureF: number;
  condition: string;
  humidity: number;
  windSpeedKmh: number;
  feelsLikeC: number;
  uvIndex: number;
  airQualityIndex?: string;
  sunrise?: string;
  sunset?: string;
  hourlyForecast: { time: string; tempC: number; condition: string }[];
  sevenDayForecast: DayForecast[];
  retrievedAt: string;
  source: string;
  timezone: string;
  dataFreshness: DataFreshness;
}

export interface ExtendedCurrencyRate {
  base: string;
  target: string;
  rate: number;
  inverseRate: number;
  retrievedAt: string;
  source: string;
  dataFreshness: DataFreshness;
}

export interface ExtendedCryptoPrice {
  id: string;
  symbol: string;
  name: string;
  priceUsd: number;
  priceInr: number;
  change24hPct: number;
  change7dPct?: number;
  marketCapUsd: number;
  volume24hUsd?: number;
  retrievedAt: string;
  source: string;
  dataStatus: DataFreshness;
}

export interface ExtendedMarketIndex {
  symbol: string;
  name: string;
  exchange: "NSE" | "BSE" | "NYSE" | "NASDAQ" | "LSE" | "TSE";
  region: "India" | "US" | "Global";
  currentValue: number;
  changePct: number;
  changeValue: number;
  tradingStatus: MarketTradingStatus;
  marketHoursNote: string;
  retrievedAt: string;
  source: string;
  dataStatus: DataFreshness;
}

export interface ExtendedBullionRate {
  commodity: "Gold (24K)" | "Gold (22K)" | "Gold (18K)" | "Silver";
  unit: string;
  priceInr: number;
  priceUsd: number;
  changePct: number;
  historical1MonthAgoInr?: number;
  historical1YearAgoInr?: number;
  retrievedAt: string;
  source: string;
  dataStatus: DataFreshness;
}

export interface HistoricalComparisonRecord {
  assetName: string;
  category: "Bullion" | "Stock Index" | "Crypto" | "Forex";
  currentPrice: number;
  unitOrCurrency: string;
  oneWeekAgo: number;
  oneWeekChangePct: number;
  oneMonthAgo: number;
  oneMonthChangePct: number;
  oneYearAgo: number;
  oneYearChangePct: number;
  trend: "up" | "down" | "flat";
  notes: string;
}

export interface ExtendedFinancialSnapshot {
  forex: Record<string, number>;
  detailedForex: ExtendedCurrencyRate[];
  crypto: ExtendedCryptoPrice[];
  indices: ExtendedMarketIndex[];
  bullion: ExtendedBullionRate[];
  historicalComparisons: HistoricalComparisonRecord[];
  retrievedAt: string;
  timezone: string;
  overallMarketSentiment: "Bullish" | "Bearish" | "Neutral" | "Mixed";
}

export interface BriefingScheduleConfig {
  id: string;
  userId: string;
  enabled: boolean;
  selectedTopics: string[];
  timezone: string;
  morningTime: string; // e.g. "08:00"
  eveningTime: string; // e.g. "19:00"
  deliveryDays: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  preferredCity: string;
  lastDispatchedAt?: string;
  nextScheduledAt?: string;
}

export interface ExtendedDailyBriefing {
  id: string;
  type: "morning" | "evening" | "weekly";
  title: string;
  generatedAt: string;
  timezone: string;
  selectedTopics: string[];
  weather: ExtendedWeatherReport;
  financialSnapshot: ExtendedFinancialSnapshot;
  breakingNews: EnrichedNewsItem[];
  topNews: EnrichedNewsItem[];
  scienceNews: EnrichedNewsItem[];
  governmentNews: EnrichedNewsItem[];
  executiveSummary: string;
  importantDates: { event: string; date: string; category: string }[];
  weeklyHighlights?: {
    marketRecap: string;
    geopoliticalMilestones: string;
    scienceBreakthroughs: string;
    strategicOutlook: string;
  };
}
