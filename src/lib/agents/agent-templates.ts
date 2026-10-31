import { AgentTeamTemplate, AgentConfig } from "./agent-types";

export const DEFAULT_AGENT_ROSTER: Record<string, AgentConfig> = {
  planner: {
    id: "agent-planner",
    name: "Dr. Aris Thorne (Strategic Planner)",
    role: "planner",
    title: "Chief Task Decomposition Architect",
    avatarColor: "#CC5A36",
    systemPrompt:
      "You are the Strategic Planner Agent. Understand complex user goals, decompose them into an optimal sequential execution plan, identify tool dependencies, and delegate to specialized agents.",
    preferredModel: "claude-3-7-sonnet-20250219",
    allowedTools: [],
    permissions: {
      allowNetwork: false,
      allowCodeExecution: false,
      allowFileSystem: false,
      requireApprovalForTools: false,
      maxExecutionTimeoutSec: 20,
    },
    maxIterations: 3,
    temperature: 0.2,
    requiresHumanApproval: false,
  },
  researcher: {
    id: "agent-researcher",
    name: "Scout-X (Live Web Researcher)",
    role: "researcher",
    title: "Empirical Evidence & Web Gatherer",
    avatarColor: "#2563EB",
    systemPrompt:
      "You are the Research Agent. Search live web indices, retrieve authoritative articles, extract empirical facts, and compile source-attributed citations.",
    preferredModel: "claude-3-5-haiku-20241022",
    allowedTools: ["web_search", "web_fetch"],
    permissions: {
      allowNetwork: true,
      allowCodeExecution: false,
      allowFileSystem: false,
      requireApprovalForTools: false,
      maxExecutionTimeoutSec: 30,
    },
    maxIterations: 5,
    temperature: 0.1,
    requiresHumanApproval: false,
  },
  coder: {
    id: "agent-coder",
    name: "DevCore (Sandbox Software Engineer)",
    role: "coder",
    title: "Full-Stack & Sandbox Coding Specialist",
    avatarColor: "#7C3AED",
    systemPrompt:
      "You are the Coding Agent. Write, test, refactor, and execute code inside the sandboxed environment. Fix errors and produce clean, modular software.",
    preferredModel: "claude-3-7-sonnet-20250219",
    allowedTools: ["code_execution", "create_artifact"],
    permissions: {
      allowNetwork: false,
      allowCodeExecution: true,
      allowFileSystem: true,
      requireApprovalForTools: false,
      maxExecutionTimeoutSec: 45,
    },
    maxIterations: 6,
    temperature: 0.1,
    requiresHumanApproval: false,
  },
  analyst: {
    id: "agent-analyst",
    name: "DataMetrics (Analytical Specialist)",
    role: "analyst",
    title: "Quantitative Data & Matrix Analyst",
    avatarColor: "#059669",
    systemPrompt:
      "You are the Analyst Agent. Process datasets, spreadsheets, metrics, financial numbers, and comparison points. Derive structured tabular insights and statistical conclusions.",
    preferredModel: "claude-3-5-sonnet-20241022",
    allowedTools: ["data_analysis", "file_reader"],
    permissions: {
      allowNetwork: false,
      allowCodeExecution: true,
      allowFileSystem: false,
      requireApprovalForTools: false,
      maxExecutionTimeoutSec: 30,
    },
    maxIterations: 4,
    temperature: 0.2,
    requiresHumanApproval: false,
  },
  critic: {
    id: "agent-critic",
    name: "Prof. Marcus Drake (Adversarial Critic)",
    role: "critic",
    title: "Adversarial Reviewer & Logic Inspector",
    avatarColor: "#D97706",
    systemPrompt:
      "You are the Critic Agent. Review intermediate outputs with uncompromising rigor. Detect logical holes, code edge-case bugs, unsupported claims, and formatting oversights.",
    preferredModel: "claude-3-7-sonnet-20250219",
    allowedTools: [],
    permissions: {
      allowNetwork: false,
      allowCodeExecution: false,
      allowFileSystem: false,
      requireApprovalForTools: false,
      maxExecutionTimeoutSec: 25,
    },
    maxIterations: 3,
    temperature: 0.1,
    requiresHumanApproval: true,
  },
  verifier: {
    id: "agent-verifier",
    name: "Sentinel (Fact & Security Verifier)",
    role: "verifier",
    title: "Empirical Fact & Policy Validator",
    avatarColor: "#DC2626",
    systemPrompt:
      "You are the Verification Agent. Cross-examine claims against official institutional databases and enforce security boundaries. Calculate honest confidence bounds.",
    preferredModel: "claude-3-7-sonnet-20250219",
    allowedTools: ["fact_verifier"],
    permissions: {
      allowNetwork: true,
      allowCodeExecution: false,
      allowFileSystem: false,
      requireApprovalForTools: true,
      maxExecutionTimeoutSec: 30,
    },
    maxIterations: 3,
    temperature: 0.1,
    requiresHumanApproval: true,
  },
  synthesizer: {
    id: "agent-synthesizer",
    name: "Clara Bennett (Chief Synthesizer)",
    role: "synthesizer",
    title: "Executive Deliverable Producer",
    avatarColor: "#0D9488",
    systemPrompt:
      "You are the Synthesizer Agent. Take all validated evidence, code, analysis, and critique, and assemble the final publication-ready deliverable.",
    preferredModel: "claude-3-7-sonnet-20250219",
    allowedTools: ["create_artifact"],
    permissions: {
      allowNetwork: false,
      allowCodeExecution: false,
      allowFileSystem: false,
      requireApprovalForTools: false,
      maxExecutionTimeoutSec: 25,
    },
    maxIterations: 2,
    temperature: 0.3,
    requiresHumanApproval: false,
  },
};

export const AGENT_TEAM_TEMPLATES: AgentTeamTemplate[] = [
  {
    id: "company-intelligence-squad",
    name: "Company Research & Due Diligence Squad",
    missionType: "company_research",
    description:
      "Decomposes corporate research, gathers live financial & executive data, analyzes competitors, verifies filings, and synthesizes an executive dossier.",
    badge: "Due Diligence & Corporate Research",
    recommendedGoal:
      "Research Anthropic: business model, Claude 3.7 dynamic reasoning capabilities, institutional partnerships, and competitive landscape against OpenAI.",
    agents: [
      DEFAULT_AGENT_ROSTER.planner,
      DEFAULT_AGENT_ROSTER.researcher,
      DEFAULT_AGENT_ROSTER.analyst,
      DEFAULT_AGENT_ROSTER.critic,
      DEFAULT_AGENT_ROSTER.synthesizer,
    ],
  },
  {
    id: "website-builder-swarm",
    name: "Full-Stack Website & App Builder Swarm",
    missionType: "website_creation",
    description:
      "Architects responsive UI/UX, writes clean HTML5/CSS/JavaScript components, reviews code inside VM sandbox, and generates live interactive artifacts.",
    badge: "Website Builder & Front-End Swarm",
    recommendedGoal:
      "Create a responsive modern landing page for a Next-Gen Cloud AI Platform with live interactive pricing calculator, hero animations, and dark mode.",
    agents: [
      DEFAULT_AGENT_ROSTER.planner,
      DEFAULT_AGENT_ROSTER.coder,
      DEFAULT_AGENT_ROSTER.critic,
      DEFAULT_AGENT_ROSTER.synthesizer,
    ],
  },
  {
    id: "codebase-debugger-squad",
    name: "Codebase Debugger & Security Auditor",
    missionType: "codebase_debug",
    description:
      "Isolates software bugs, runs tests inside the sandbox, reviews logic flaws, validates security boundaries, and outputs verified patches.",
    badge: "Codebase Debugging & Security",
    recommendedGoal:
      "Debug an asynchronous rate-limiter and prompt injection sanitizer: test edge cases in sandbox, patch memory leaks, and verify zero regressions.",
    agents: [
      DEFAULT_AGENT_ROSTER.planner,
      DEFAULT_AGENT_ROSTER.coder,
      DEFAULT_AGENT_ROSTER.critic,
      DEFAULT_AGENT_ROSTER.verifier,
    ],
  },
  {
    id: "document-data-analyst-squad",
    name: "Document & Financial Data Analyst",
    missionType: "document_analysis",
    description:
      "Ingests spreadsheets and financial tables, computes percentage shifts, identifies anomalies, and generates structured analytical summaries.",
    badge: "Document & Spreadsheet Analysis",
    recommendedGoal:
      "Analyze quarterly corporate earnings data: extract revenue growth trends, compute gross margin variance, and identify key operational risks.",
    agents: [
      DEFAULT_AGENT_ROSTER.planner,
      DEFAULT_AGENT_ROSTER.analyst,
      DEFAULT_AGENT_ROSTER.critic,
      DEFAULT_AGENT_ROSTER.synthesizer,
    ],
  },
  {
    id: "product-comparison-swarm",
    name: "Product & Market Competitor Comparison",
    missionType: "product_comparison",
    description:
      "Cross-examines competing products, pricing tiers, hardware/software specs, and user sentiment to produce an objective comparison matrix.",
    badge: "Market Benchmarking & Comparison",
    recommendedGoal:
      "Compare top cloud AI model APIs (Claude 3.7 Sonnet vs GPT-4o vs Gemini 2.0 Flash) on reasoning, token pricing, latency, and tool use support.",
    agents: [
      DEFAULT_AGENT_ROSTER.planner,
      DEFAULT_AGENT_ROSTER.researcher,
      DEFAULT_AGENT_ROSTER.analyst,
      DEFAULT_AGENT_ROSTER.synthesizer,
    ],
  },
  {
    id: "presentation-generator-squad",
    name: "Presentation & Pitch Deck Generator",
    missionType: "presentation_generation",
    description:
      "Structures narrative arcs, develops slide-by-slide executive presentations with key metrics, visual layouts, and compelling talking points.",
    badge: "Presentations & Pitch Decks",
    recommendedGoal:
      "Generate an 8-slide executive pitch deck for an Autonomous Multi-Agent enterprise workflow platform, including problem, architecture, and ROI.",
    agents: [
      DEFAULT_AGENT_ROSTER.planner,
      DEFAULT_AGENT_ROSTER.analyst,
      DEFAULT_AGENT_ROSTER.coder,
      DEFAULT_AGENT_ROSTER.synthesizer,
    ],
  },
  {
    id: "daily-intelligence-swarm",
    name: "Daily Intelligence & Fact Verification Swarm",
    missionType: "daily_intelligence",
    description:
      "Scans live wires, verifies claims against primary records, spots conflicting coverage, and prepares executive morning intelligence briefings.",
    badge: "Live Intelligence & Verification",
    recommendedGoal:
      "Prepare a comprehensive daily intelligence briefing covering Indian economic policies, global semiconductor investments, and verified AI breakthroughs.",
    agents: [
      DEFAULT_AGENT_ROSTER.planner,
      DEFAULT_AGENT_ROSTER.researcher,
      DEFAULT_AGENT_ROSTER.verifier,
      DEFAULT_AGENT_ROSTER.synthesizer,
    ],
  },
];
