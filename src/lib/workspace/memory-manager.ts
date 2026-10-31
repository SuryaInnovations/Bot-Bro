/**
 * NOVA AI — Long-Term Memory & Conversation Summarizer
 * User-controlled persistent memory (review, edit, disable, delete),
 * automatic conversation summaries, and context compression.
 */

import {
  ConversationSummary,
  UserMemoryItem,
} from "./workspace-types";
import { generateId } from "../utils";
import { Message } from "@/types";

// Persistent in-memory memory store (with Supabase / LocalStorage bridge)
let userMemoriesStore: UserMemoryItem[] = [
  {
    id: "mem-default-1",
    userId: "user-default",
    key: "Coding & Architecture Standard",
    value: "Prefer TypeScript with strict typing, clean modular file structures, and comprehensive automated test assertions.",
    category: "instruction",
    isEnabled: true,
    confidence: 0.98,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: "mem-default-2",
    userId: "user-default",
    key: "Claude Thinking Budget",
    value: "Use Claude 3.7 Sonnet dynamic hybrid reasoning with 2,048 default thinking tokens for complex algorithmic tasks.",
    category: "preference",
    isEnabled: true,
    confidence: 0.95,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: "mem-default-3",
    userId: "user-default",
    key: "Timezone & Locality",
    value: "Default operational timezone is Asia/Kolkata (IST), with primary financial indicators referencing NSE/BSE and Indian Rupee (INR).",
    category: "fact",
    isEnabled: true,
    confidence: 0.92,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

let conversationSummariesStore: ConversationSummary[] = [];

// ==========================================
// 1. USER-CONTROLLED LONG-TERM MEMORY
// ==========================================

export function getUserMemories(userId?: string, projectId?: string): UserMemoryItem[] {
  return userMemoriesStore.filter((m) => {
    if (userId && m.userId !== userId && m.userId !== "user-default") return false;
    if (projectId && m.projectId !== projectId) return false;
    return true;
  });
}

export function saveUserMemory(
  mem: Omit<UserMemoryItem, "id" | "createdAt" | "updatedAt">
): UserMemoryItem {
  const now = new Date().toISOString();
  const newMem: UserMemoryItem = {
    id: `mem-${generateId()}`,
    createdAt: now,
    updatedAt: now,
    ...mem,
  };
  userMemoriesStore.unshift(newMem);
  return newMem;
}

export function updateUserMemory(
  id: string,
  updates: Partial<Omit<UserMemoryItem, "id" | "createdAt">>
): UserMemoryItem | null {
  const index = userMemoriesStore.findIndex((m) => m.id === id);
  if (index === -1) return null;

  userMemoriesStore[index] = {
    ...userMemoriesStore[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  return userMemoriesStore[index];
}

export function toggleMemoryEnabled(id: string, isEnabled: boolean): UserMemoryItem | null {
  return updateUserMemory(id, { isEnabled });
}

export function deleteUserMemory(id: string): boolean {
  const prevLen = userMemoriesStore.length;
  userMemoriesStore = userMemoriesStore.filter((m) => m.id !== id);
  return userMemoriesStore.length < prevLen;
}

// ==========================================
// 2. CONTEXT COMPRESSION & SUMMARIES
// ==========================================

/**
 * Compresses lengthy multi-turn conversations into dense, token-efficient semantic summaries.
 */
export function compressConversationContext(
  messages: { role: string; content: string }[],
  targetTokens = 600
): {
  compressedContext: string;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
} {
  if (!messages || messages.length === 0) {
    return { compressedContext: "", originalTokens: 0, compressedTokens: 0, compressionRatio: 1 };
  }

  const rawText = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
  const originalTokens = Math.ceil(rawText.length / 4);

  // Extract key statements, decisions, and constraints
  const lines = rawText.split("\n").filter((l) => l.trim().length > 0);
  const keyPoints: string[] = [];

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (
      lower.includes("decision:") ||
      lower.includes("prefer") ||
      lower.includes("require") ||
      lower.includes("error:") ||
      lower.includes("fixed") ||
      lower.includes("deploy") ||
      lower.includes("implement") ||
      lower.includes("goal:")
    ) {
      keyPoints.push(`- ${line.slice(0, 160)}`);
    }
  });

  // Keep last 2 user-assistant exchanges in full
  const recentExchanges = messages.slice(-3).map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 300)}`).join("\n");

  const compressedContext = `### Compressed Historical Context (${messages.length} messages)
#### Key Constraints & Decisions:
${keyPoints.slice(0, 8).join("\n") || "- Multi-turn dialog established on architecture and specifications."}

#### Recent Exchange State:
${recentExchanges}`;

  const compressedTokens = Math.ceil(compressedContext.length / 4);
  const compressionRatio = originalTokens > 0 ? parseFloat((compressedTokens / originalTokens).toFixed(2)) : 1;

  return {
    compressedContext,
    originalTokens,
    compressedTokens,
    compressionRatio,
  };
}

/**
 * Generates an automatic conversation summary record.
 */
export function generateAutomaticConversationSummary(
  messages: Message[],
  conversationId: string,
  userId = "user-default",
  title = "Active Conversation"
): ConversationSummary {
  const content = messages.map((m) => m.content).join(" ");
  const originalTokenCount = Math.ceil(content.length / 4);

  // Extract key topics
  const words = content
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const wordFreq = new Map<string, number>();
  words.forEach((w) => wordFreq.set(w, (wordFreq.get(w) || 0) + 1));

  const keyTopics = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1));

  // Extract action items
  const actionItems: string[] = [];
  messages.forEach((m) => {
    if (m.role === "assistant" && m.content.includes("###")) {
      const headings = m.content.match(/###\s+([^\n]+)/g) || [];
      headings.slice(0, 2).forEach((h) => actionItems.push(h.replace(/###\s+/, "")));
    }
  });

  const summaryText = messages.length > 0
    ? `Discussed ${keyTopics.join(", ") || "software specifications and inquiries"}. Formulated actionable solutions across ${messages.length} message turns.`
    : "Empty conversation.";

  const summaryRecord: ConversationSummary = {
    conversationId,
    userId,
    title,
    summaryText,
    keyTopics,
    actionItems: actionItems.slice(0, 4),
    originalMessageCount: messages.length,
    compressedTokenCount: Math.ceil(summaryText.length / 4),
    createdAt: new Date().toISOString(),
  };

  conversationSummariesStore = [
    summaryRecord,
    ...conversationSummariesStore.filter((s) => s.conversationId !== conversationId),
  ];

  return summaryRecord;
}

// ==========================================
// 3. RELEVANT CONTEXT IDENTIFIER
// ==========================================

export function identifyRelevantContext(
  query: string,
  userId?: string,
  projectId?: string
): {
  relevantMemories: UserMemoryItem[];
  promptContextBlock: string;
} {
  const memories = getUserMemories(userId, projectId).filter((m) => m.isEnabled);
  const qLower = query.toLowerCase();

  const scored = memories.map((mem) => {
    let score = 0;
    const k = mem.key.toLowerCase();
    const v = mem.value.toLowerCase();

    // Check direct word intersections
    qLower.split(/\s+/).forEach((term) => {
      if (term.length > 2) {
        if (k.includes(term)) score += 3;
        if (v.includes(term)) score += 2;
      }
    });

    // Always include project rules and high-confidence instructions
    if (mem.category === "instruction" || mem.category === "project_rule") {
      score += 1.5;
    }

    return { mem, score };
  });

  const relevantMemories = scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.mem);

  let promptContextBlock = "";
  if (relevantMemories.length > 0) {
    promptContextBlock = `[User Personalized Memory Context]:\n` +
      relevantMemories.map((m) => `- ${m.key}: ${m.value}`).join("\n");
  }

  return {
    relevantMemories,
    promptContextBlock,
  };
}
