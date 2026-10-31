export type QuestionIntent =
  | "general_knowledge"
  | "current_info"
  | "news_events"
  | "financial_info"
  | "weather_utilities"
  | "technical_coding"
  | "mathematical_calc"
  | "deep_research"
  | "personal_advice"
  | "verification_needed";

export interface ClassificationResult {
  intent: QuestionIntent;
  confidence: number;
  needsLiveWeb: boolean;
  needsWeather: boolean;
  needsFinance: boolean;
  needsCodeSandbox: boolean;
  cityForWeather?: string;
  suggestedTools: string[];
  reasoning: string;
}

export function classifyUserQuestion(prompt: string): ClassificationResult {
  const p = prompt.toLowerCase().trim();

  // 1. Weather & Utilities Detection
  const weatherKeywords = ["weather", "temperature", "forecast", "rain", "humidity", "hot outside", "cold outside"];
  if (weatherKeywords.some((w) => p.includes(w))) {
    // Extract candidate city
    const words = p.replace(/[^a-z0-9 ]/g, "").split(" ");
    let detectedCity = "Bengaluru";
    const cities = ["mumbai", "delhi", "bengaluru", "bangalore", "hyderabad", "chennai", "kolkata", "london", "new york", "tokyo", "dubai", "singapore"];
    for (const city of cities) {
      if (p.includes(city)) {
        detectedCity = city;
        break;
      }
    }

    return {
      intent: "weather_utilities",
      confidence: 0.95,
      needsLiveWeb: false,
      needsWeather: true,
      needsFinance: false,
      needsCodeSandbox: false,
      cityForWeather: detectedCity,
      suggestedTools: ["live_weather"],
      reasoning: "User is asking about atmospheric conditions or local forecasts.",
    };
  }

  // 2. Financial, Forex, Stock, Crypto, Gold/Silver Detection
  const financeKeywords = [
    "stock", "share price", "nifty", "sensex", "nasdaq", "s&p 500", "forex", "exchange rate",
    "dollar to inr", "usd inr", "gold price", "silver rate", "crypto", "bitcoin", "btc", "ethereum", "solana",
  ];
  if (financeKeywords.some((f) => p.includes(f))) {
    return {
      intent: "financial_info",
      confidence: 0.94,
      needsLiveWeb: false,
      needsWeather: false,
      needsFinance: true,
      needsCodeSandbox: false,
      suggestedTools: ["financial_data"],
      reasoning: "Query targets live market prices, currency conversions, bullion rates, or indices.",
    };
  }

  // 3. News, Breaking Updates, Current Events
  const newsKeywords = [
    "today", "latest news", "breaking news", "what happened today", "india news", "ai news",
    "headlines", "announcement", "election", "update on", "recent developments",
  ];
  if (newsKeywords.some((n) => p.includes(n))) {
    return {
      intent: "news_events",
      confidence: 0.92,
      needsLiveWeb: true,
      needsWeather: false,
      needsFinance: false,
      needsCodeSandbox: false,
      suggestedTools: ["web_search", "web_fetch"],
      reasoning: "Query demands time-sensitive real-time news retrieval.",
    };
  }

  // 4. Code & Technical Computation
  const codeKeywords = ["write code", "fix error", "debug", "typescript", "python", "react", "sql query", "algorithm", "implement", "function"];
  if (codeKeywords.some((c) => p.includes(c))) {
    return {
      intent: "technical_coding",
      confidence: 0.9,
      needsLiveWeb: false,
      needsWeather: false,
      needsFinance: false,
      needsCodeSandbox: true,
      suggestedTools: ["execute_code", "create_artifact"],
      reasoning: "Programming or software engineering task that benefits from sandbox execution.",
    };
  }

  // 5. Mathematical Calculation & Complex Statistics
  const mathKeywords = ["calculate", "solve equation", "derivative", "integral", "matrix", "fibonacci", "exponential growth", "percentile"];
  if (mathKeywords.some((m) => p.includes(m))) {
    return {
      intent: "mathematical_calc",
      confidence: 0.88,
      needsLiveWeb: false,
      needsWeather: false,
      needsFinance: false,
      needsCodeSandbox: true,
      suggestedTools: ["execute_code"],
      reasoning: "Rigorous math problem that requires deterministic computation.",
    };
  }

  // 6. Deep Research or Comparison
  const researchKeywords = ["compare", "in-depth research", "comprehensive analysis", "competitor breakdown", "systematic review", "history of"];
  if (researchKeywords.some((r) => p.includes(r))) {
    return {
      intent: "deep_research",
      confidence: 0.86,
      needsLiveWeb: true,
      needsWeather: false,
      needsFinance: false,
      needsCodeSandbox: false,
      suggestedTools: ["web_search", "web_fetch", "cross_check"],
      reasoning: "Multi-step exploratory or comparative inquiry.",
    };
  }

  // 7. General Knowledge (No search required)
  return {
    intent: "general_knowledge",
    confidence: 0.85,
    needsLiveWeb: false,
    needsWeather: false,
    needsFinance: false,
    needsCodeSandbox: false,
    suggestedTools: [],
    reasoning: "Standard conceptual, educational, or conversational prompt; answered via internal knowledge without search latency.",
  };
}
