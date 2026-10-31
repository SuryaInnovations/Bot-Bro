/**
 * NOVA AI — Intelligent Conversational Request Classifier
 * Analyzes incoming user queries to determine the underlying intent and task category.
 */

export type RequestIntentCategory =
  | "general_conversation"
  | "file_conversion"
  | "image_generation"
  | "data_visualization"
  | "weather"
  | "finance"
  | "news_briefing"
  | "fact_check"
  | "personal_tasks"
  | "reminders"
  | "calendar"
  | "email"
  | "topic_monitoring"
  | "memory"
  | "background_job"
  | "complex_autonomous_task"
  | "coding"
  | "document_analysis"
  | "knowledge_search"
  | "document_comparison"
  | "artifact_export";

import { detectImageIntent } from "../images/image-intent";

export interface IntentClassificationResult {
  category: RequestIntentCategory;
  confidence: number;
  extractedParameters: Record<string, any>;
  reasoning: string;
}

export function classifyUserMessage(
  message: string,
  hasAttachments = false
): IntentClassificationResult {
  const m = message.toLowerCase().trim();

  // 0. AI Image Generation Check
  const imageIntent = detectImageIntent(message);
  if (imageIntent.isImageRequest || imageIntent.isVariationRequest || imageIntent.isEditRequest) {
    return {
      category: "image_generation",
      confidence: imageIntent.confidence,
      extractedParameters: {
        prompt: imageIntent.prompt,
        style: imageIntent.style,
        aspectRatio: imageIntent.aspectRatio,
        isVariation: imageIntent.isVariationRequest,
        isEdit: imageIntent.isEditRequest,
      },
      reasoning: `User requested AI image generation: "${imageIntent.prompt}"`,
    };
  }

  // 0.1 Data Visualization & Interactive Analytics Check
  const vizKeywords = [
    "chart",
    "plot",
    "graph",
    "visualize",
    "visualise",
    "histogram",
    "scatter plot",
    "bar chart",
    "line chart",
    "pie chart",
    "donut chart",
    "heatmap",
    "boxplot",
    "box plot",
    "radar chart",
    "waterfall chart",
    "trendline",
    "correlation matrix",
    "data visualization",
    "plot this",
    "create a chart",
    "show a chart",
  ];
  const hasVizKeyword = vizKeywords.some((k) => m.includes(k));
  const hasTabularData =
    m.includes(",") && m.includes("\n") ||
    m.includes("|") && m.includes("\n") ||
    m.startsWith("[") ||
    m.startsWith("{");

  if (hasVizKeyword || (hasAttachments && (m.includes("plot") || m.includes("chart") || m.includes("visualize")))) {
    return {
      category: "data_visualization",
      confidence: 0.97,
      extractedParameters: {
        query: message,
        hasAttachments,
        hasTabularData,
      },
      reasoning: "User requested data visualization or interactive chart generation.",
    };
  }

  // 0.2 File Conversion & Table Extraction Check
  const conversionKeywords = [
    "convert",
    "to csv",
    "to excel",
    "to xlsx",
    "to pdf",
    "to word",
    "to docx",
    "to markdown",
    "to md",
    "to txt",
    "to json",
    "to html",
    "to png",
    "to jpg",
    "extract tables",
    "table extraction",
    "turn into pdf",
  ];
  if (conversionKeywords.some((k) => m.includes(k))) {
    return {
      category: "file_conversion",
      confidence: 0.98,
      extractedParameters: { hasAttachments },
      reasoning: "User is requesting file format conversion or table extraction.",
    };
  }

  // 1. Document Analysis check
  if (hasAttachments || m.includes("uploaded pdf") || m.includes("attached document") || m.includes("spreadsheet data")) {
    return {
      category: "document_analysis",
      confidence: 0.95,
      extractedParameters: { hasAttachments },
      reasoning: "User is asking to examine or process attached documents or data files.",
    };
  }

  // 2. Weather Requests
  const weatherKeywords = ["weather", "forecast", "temperature", "rain", "sunny", "climate in", "humidity", "aqi"];
  if (weatherKeywords.some((w) => m.includes(w)) && !m.includes("whether")) {
    // Extract potential city
    let city = "Bengaluru";
    const inMatch = m.match(/(?:in|for|at)\s+([a-zA-Z\s]+)(?:\?|$|\.|\,)/i);
    if (inMatch && inMatch[1]) {
      city = inMatch[1].trim();
    }
    return {
      category: "weather",
      confidence: 0.96,
      extractedParameters: { city },
      reasoning: `User requested live meteorological forecast for ${city}.`,
    };
  }

  // 3. Finance & Bullion & Stock Markets
  const financeKeywords = [
    "gold price",
    "silver price",
    "nifty",
    "sensex",
    "stock price",
    "market index",
    "crypto",
    "bitcoin",
    "exchange rate",
    "usd inr",
    "bullion",
    "share market",
  ];
  if (financeKeywords.some((f) => m.includes(f))) {
    return {
      category: "finance",
      confidence: 0.97,
      extractedParameters: { query: message },
      reasoning: "User requested real-time financial, currency, or commodity indicators.",
    };
  }

  // 4. News & Daily Briefings
  const newsKeywords = [
    "important updates",
    "today's updates",
    "today's news",
    "daily news",
    "breaking news",
    "morning briefing",
    "evening wrap",
    "ai news",
    "tech news",
    "headlines",
    "what happened today",
  ];
  if (newsKeywords.some((n) => m.includes(n))) {
    let category = "breaking";
    if (m.includes("ai") || m.includes("technology")) category = "technology";
    if (m.includes("science") || m.includes("isro")) category = "science";
    if (m.includes("government") || m.includes("policy")) category = "government";
    return {
      category: "news_briefing",
      confidence: 0.95,
      extractedParameters: { category },
      reasoning: "User requested a daily news briefing or categorized updates.",
    };
  }

  // 5. Fact Verification
  if (
    m.startsWith("is it true that") ||
    m.startsWith("verify claim") ||
    m.startsWith("verify that") ||
    m.includes("fact check") ||
    m.startsWith("is that true")
  ) {
    const claim = message
      .replace(/^(is it true that|verify claim|verify that|fact check|is that true)[:\s]*/i, "")
      .trim();
    return {
      category: "fact_check",
      confidence: 0.94,
      extractedParameters: { claim },
      reasoning: "User requested formal verification of a factual statement.",
    };
  }

  // 6. Reminders
  if (
    m.startsWith("remind me") ||
    m.includes("set a reminder") ||
    m.includes("snooze reminder") ||
    m.includes("show my reminders")
  ) {
    return {
      category: "reminders",
      confidence: 0.96,
      extractedParameters: { command: message },
      reasoning: "User requested creating, checking, or modifying a smart reminder.",
    };
  }

  // 7. Daily Planner & Task Management
  const taskKeywords = [
    "plan my day",
    "plan today",
    "daily schedule",
    "move unfinished tasks",
    "reschedule unfinished",
    "show my important tasks",
    "urgent tasks",
    "create task",
    "add task",
    "complete task",
  ];
  if (taskKeywords.some((t) => m.includes(t))) {
    return {
      category: "personal_tasks",
      confidence: 0.96,
      extractedParameters: { command: message },
      reasoning: "User requested scheduling, reorganizing, or viewing personal planner tasks.",
    };
  }

  // 8. Calendar Operations
  const calendarKeywords = [
    "meetings today",
    "my schedule today",
    "calendar events",
    "find an open slot",
    "available slot",
    "schedule meeting",
    "free time between",
  ];
  if (calendarKeywords.some((c) => m.includes(c))) {
    return {
      category: "calendar",
      confidence: 0.93,
      extractedParameters: { command: message },
      reasoning: "User requested calendar event query, conflict check, or appointment creation.",
    };
  }

  // 9. Email Operations
  const emailKeywords = [
    "check my email",
    "summarize email",
    "extract tasks from email",
    "draft a reply",
    "draft reply to",
    "send email reply",
  ];
  if (emailKeywords.some((e) => m.includes(e))) {
    return {
      category: "email",
      confidence: 0.94,
      extractedParameters: { command: message },
      reasoning: "User requested email summarization, task extraction, or reply drafting.",
    };
  }

  // 10. Topic Monitoring
  if (
    m.startsWith("follow developments in") ||
    m.startsWith("monitor topic") ||
    m.startsWith("track developments") ||
    m.includes("monitor new developments")
  ) {
    const topic = message
      .replace(/^(follow developments in|monitor topic|track developments|monitor new developments about)[:\s]*/i, "")
      .trim();
    return {
      category: "topic_monitoring",
      confidence: 0.92,
      extractedParameters: { topic },
      reasoning: "User requested ongoing topic tracking and automated research crawling.",
    };
  }

  // 11. Memory Operations
  if (
    m.includes("what do you remember about my preferences") ||
    m.includes("what do you remember about me") ||
    m.includes("remember that i") ||
    m.includes("update my preferences") ||
    m.includes("don't use that information anymore") ||
    m.includes("forget that i")
  ) {
    return {
      category: "memory",
      confidence: 0.96,
      extractedParameters: { query: message },
      reasoning: "User requested inspecting, updating, or deleting user-approved memory records.",
    };
  }

  // 12. Background Execution & Scheduled Jobs
  if (
    m.includes("send me a daily briefing at") ||
    m.includes("run a topic crawl every") ||
    m.includes("background job") ||
    m.includes("notify me when finished")
  ) {
    return {
      category: "background_job",
      confidence: 0.91,
      extractedParameters: { query: message },
      reasoning: "User requested configuring or triggering a persistent background job queue.",
    };
  }

  // 13. Complex Autonomous Multi-Agent Swarm Tasks
  const swarmKeywords = [
    "build a website",
    "create a landing page",
    "debug this codebase",
    "debug this repository",
    "prepare a report on this company",
    "due diligence report",
    "compare products and services",
    "generate a presentation",
    "pitch deck",
  ];
  if (swarmKeywords.some((s) => m.includes(s))) {
    return {
      category: "complex_autonomous_task",
      confidence: 0.95,
      extractedParameters: { goal: message },
      reasoning: "User requested an end-to-end mission requiring autonomous multi-agent decomposition.",
    };
  }

  // 14. Coding
  if (
    m.startsWith("write code") ||
    m.startsWith("write a python") ||
    m.startsWith("write a javascript") ||
    m.includes("fix this bug") ||
    m.includes("implement function")
  ) {
    return {
      category: "coding",
      confidence: 0.88,
      extractedParameters: { prompt: message },
      reasoning: "User requested code generation or isolated sandbox execution.",
    };
  }

  // 14. Personal Workspace 2.0: Knowledge Search & Vector Retrieval
  if (
    m.includes("search library") ||
    m.includes("search knowledge") ||
    m.includes("search my docs") ||
    m.includes("search documents") ||
    m.includes("what do my project docs say") ||
    m.includes("what does my document say") ||
    m.includes("in my library") ||
    m.startsWith("find in library") ||
    m.includes("cross document")
  ) {
    return {
      category: "knowledge_search",
      confidence: 0.95,
      extractedParameters: { query: message },
      reasoning: "User requested semantic vector search across personal knowledge documents.",
    };
  }

  // 15. Personal Workspace 2.0: Document Comparison
  if (
    m.includes("compare document") ||
    m.includes("compare docs") ||
    m.includes("compare my files") ||
    m.includes("difference between the two documents") ||
    m.includes("difference between documents")
  ) {
    return {
      category: "document_comparison",
      confidence: 0.94,
      extractedParameters: { query: message },
      reasoning: "User requested semantic and entity comparison between knowledge documents.",
    };
  }

  // 16. Personal Workspace 2.0: Artifact Multi-Format Export
  if (
    (m.includes("export") || m.includes("download")) &&
    (m.includes("pdf") || m.includes("docx") || m.includes("markdown") || m.includes("code file"))
  ) {
    let format = "markdown";
    if (m.includes("pdf")) format = "pdf";
    if (m.includes("docx") || m.includes("word")) format = "docx";
    if (m.includes("code")) format = "code";

    return {
      category: "artifact_export",
      confidence: 0.96,
      extractedParameters: { format },
      reasoning: `User requested exporting artifact in ${format} format.`,
    };
  }

  // Default: General Conversation with full Claude reasoning
  return {
    category: "general_conversation",
    confidence: 0.85,
    extractedParameters: { query: message },
    reasoning: "General user inquiry or conversational dialogue.",
  };
}
