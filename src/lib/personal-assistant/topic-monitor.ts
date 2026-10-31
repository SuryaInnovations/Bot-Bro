import { MonitoredTopic } from "./assistant-types";
import { performWebSearch } from "../web-search";
import { generateId } from "../utils";

let monitoredTopicsStore: MonitoredTopic[] = [
  {
    id: "top-1",
    topic: "Anthropic Claude 3.7 & Dynamic Hybrid Reasoning",
    keywords: ["Anthropic", "Claude 3.7", "hybrid reasoning", "thinking budget"],
    category: "ai",
    intervalHours: 4,
    lastCheckedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    newDevelopmentsCount: 3,
    activeAlerts: [
      "Claude 3.7 Sonnet introduces hybrid dynamic reasoning mode combining instantaneous and deep thinking tokens.",
    ],
    latestHeadline: "Anthropic Unveils Claude 3.7 Sonnet Dynamic Hybrid Architecture",
    citations: [
      {
        id: "cit-top-1",
        title: "Anthropic Claude 3.7 Technical Documentation",
        url: "https://www.anthropic.com/news",
        snippet: "Claude 3.7 Sonnet delivers granular developer control over variable reasoning budgets up to 32,768 tokens.",
      },
    ],
    enabled: true,
  },
  {
    id: "top-2",
    topic: "India Semiconductor Mission & Domestic Chip Fabs",
    keywords: ["India semiconductor", "Cabinet approval", "Tata Electronics", "chip fab"],
    category: "government",
    intervalHours: 6,
    lastCheckedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    newDevelopmentsCount: 2,
    activeAlerts: [
      "Union Cabinet authorizes new semiconductor fabrication clusters in Gujarat and Assam.",
    ],
    latestHeadline: "Union Cabinet Clears Multi-Billion Dollar Semiconductor Expansion",
    citations: [
      {
        id: "cit-top-2",
        title: "Press Information Bureau: India Semiconductor Mission Approvals",
        url: "https://pib.gov.in",
        snippet: "Commercial pilot wafer production on track under India Semiconductor Mission.",
      },
    ],
    enabled: true,
  },
  {
    id: "top-3",
    topic: "ISRO Lunar Sample Return & Gaganyaan Flight Preparations",
    keywords: ["ISRO", "Chandrayaan-4", "Gaganyaan", "Sriharikota"],
    category: "research",
    intervalHours: 12,
    lastCheckedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    newDevelopmentsCount: 1,
    activeAlerts: [
      "ISRO validates orbital docking simulation tests for upcoming lunar sample return mission.",
    ],
    latestHeadline: "ISRO Successfully Validates Spacecraft Docking Protocols",
    citations: [
      {
        id: "cit-top-3",
        title: "ISRO Space Exploration Updates",
        url: "https://isro.gov.in",
        snippet: "Pre-flight validation checks completed for orbital docking mechanisms.",
      },
    ],
    enabled: true,
  },
];

export function getMonitoredTopics(): MonitoredTopic[] {
  return [...monitoredTopicsStore];
}

export function addMonitoredTopic(topic: string, keywords: string[], category: MonitoredTopic["category"]): MonitoredTopic {
  const newTopic: MonitoredTopic = {
    id: `top-${generateId()}`,
    topic: topic.trim(),
    keywords,
    category,
    intervalHours: 6,
    lastCheckedAt: new Date().toISOString(),
    newDevelopmentsCount: 0,
    activeAlerts: [],
    citations: [],
    enabled: true,
  };
  monitoredTopicsStore = [newTopic, ...monitoredTopicsStore];
  return newTopic;
}

export async function runTopicMonitoringCrawl(topicId?: string): Promise<{ summary: string; topic: MonitoredTopic | null }> {
  if (topicId) {
    const topic = monitoredTopicsStore.find((t) => t.id === topicId);
    if (!topic) return { summary: "Topic not found", topic: null };

    try {
      const searchRes = await performWebSearch(`${topic.topic} news updates latest`);
      const results = searchRes.results || [];

      if (results.length > 0) {
        topic.lastCheckedAt = new Date().toISOString();
        topic.newDevelopmentsCount = results.length;
        topic.latestHeadline = results[0]?.title || topic.latestHeadline;
        topic.activeAlerts = results.slice(0, 2).map((r) => r.snippet);
        topic.citations = searchRes.citations.slice(0, 4);
      }
    } catch (e) {
      console.warn("Topic crawl error:", e);
    }

    return { summary: `Updated tracking data for ${topic.topic}`, topic };
  }

  // If no topicId provided, refresh all enabled topics
  let updatedCount = 0;
  for (const t of monitoredTopicsStore.filter((t) => t.enabled)) {
    try {
      const searchRes = await performWebSearch(`${t.topic} news updates latest`);
      const results = searchRes.results || [];

      if (results.length > 0) {
        t.lastCheckedAt = new Date().toISOString();
        t.newDevelopmentsCount = results.length;
        t.latestHeadline = results[0]?.title || t.latestHeadline;
        t.activeAlerts = results.slice(0, 2).map((r) => r.snippet);
        t.citations = searchRes.citations.slice(0, 4);
        updatedCount++;
      }
    } catch (e) {
      console.warn("Topic crawl error:", e);
    }
  }

  return {
    summary: `Refreshed tracking data across ${updatedCount} active research areas with live web indicators.`,
    topic: monitoredTopicsStore[0] || null,
  };
}
