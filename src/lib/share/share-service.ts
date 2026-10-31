import crypto from "crypto";
import fs from "fs";
import path from "path";
import { SharedConversation, SharedConversationMessage } from "@/types";

// Persistent store file path
const DATA_DIR = path.join(process.cwd(), ".data");
const SHARES_FILE = path.join(DATA_DIR, "shares.json");

// In-memory store
let sharedStore: SharedConversation[] = [];

// Load initial records from disk if available
function loadFromDisk(): void {
  try {
    if (fs.existsSync(SHARES_FILE)) {
      const data = fs.readFileSync(SHARES_FILE, "utf-8");
      sharedStore = JSON.parse(data);
    }
  } catch (err) {
    console.warn("[ShareService] Note reading shares from disk:", err);
  }
}

// Persist store to disk
function saveToDisk(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SHARES_FILE, JSON.stringify(sharedStore, null, 2), "utf-8");
  } catch (err) {
    console.warn("[ShareService] Note persisting shares to disk:", err);
  }
}

// Initialize on module load
loadFromDisk();

export interface CreateShareParams {
  conversationId: string;
  userId?: string;
  title: string;
  model: string;
  messages: Array<{
    id?: string;
    role: "user" | "assistant" | "system";
    content: string;
    createdAt?: string;
  }>;
  forceRegenerate?: boolean;
}

/**
 * Generate a cryptographically secure, unguessable 32-character token
 */
export function generateShareToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Create or retrieve an active shareable link for a conversation
 */
export function createShare(params: CreateShareParams): SharedConversation {
  const { conversationId, userId, title, model, messages, forceRegenerate } = params;

  // Sanitize message objects for public view
  const sanitizedMessages: SharedConversationMessage[] = (messages || []).map((m, idx) => ({
    id: m.id || `msg-${idx}`,
    role: m.role,
    content: m.content || "",
    createdAt: m.createdAt || new Date().toISOString(),
  }));

  const existingIdx = sharedStore.findIndex(
    (s) => s.conversationId === conversationId && !s.isRevoked
  );

  // If active share exists and user doesn't request a new token, reuse existing active link
  if (existingIdx !== -1 && !forceRegenerate) {
    const existing = sharedStore[existingIdx];
    // Update the snapshot of messages and title in case new messages were sent
    existing.title = title || existing.title;
    existing.model = model || existing.model;
    existing.messages = sanitizedMessages;
    existing.updatedAt = new Date().toISOString();
    saveToDisk();
    return existing;
  }

  // If forceRegenerate, revoke any previous active link first
  if (existingIdx !== -1 && forceRegenerate) {
    sharedStore[existingIdx].isRevoked = true;
    sharedStore[existingIdx].updatedAt = new Date().toISOString();
  }

  const token = generateShareToken();
  const now = new Date().toISOString();

  const newShare: SharedConversation = {
    id: `share-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
    token,
    conversationId,
    userId,
    title: title || "Shared Chat",
    model: model || "gemini-flash-lite-latest",
    messages: sanitizedMessages,
    isRevoked: false,
    createdAt: now,
    updatedAt: now,
  };

  sharedStore.unshift(newShare);
  saveToDisk();
  return newShare;
}

/**
 * Retrieve public conversation by token. Returns null if token is missing, not found, or revoked.
 */
export function getShareByToken(token: string): {
  token: string;
  conversationId: string;
  title: string;
  model: string;
  createdAt: string;
  messages: SharedConversationMessage[];
} | null {
  if (!token) return null;

  const share = sharedStore.find((s) => s.token === token && !s.isRevoked);
  if (!share) return null;

  // Return strictly sanitized data (no userId, no emails, no private account details)
  return {
    token: share.token,
    conversationId: share.conversationId,
    title: share.title,
    model: share.model,
    createdAt: share.createdAt,
    messages: share.messages,
  };
}

/**
 * Revoke/disable an active share link
 */
export function revokeShare(
  conversationId: string,
  userId?: string
): { success: boolean; message: string } {
  const share = sharedStore.find((s) => s.conversationId === conversationId && !s.isRevoked);

  if (!share) {
    return { success: false, message: "No active share link found for this conversation." };
  }

  // Authorization check: if share was created by a specific user, verify owner
  if (share.userId && userId && share.userId !== userId) {
    return { success: false, message: "Unauthorized: only the conversation owner can revoke this link." };
  }

  share.isRevoked = true;
  share.updatedAt = new Date().toISOString();
  saveToDisk();

  return { success: true, message: "Share link has been revoked. The public link is now deactivated." };
}

/**
 * Retrieve share status for a conversation
 */
export function getShareStatus(
  conversationId: string,
  userId?: string
): SharedConversation | null {
  const share = sharedStore.find((s) => s.conversationId === conversationId && !s.isRevoked);
  if (!share) return null;

  if (share.userId && userId && share.userId !== userId) {
    return null;
  }

  return share;
}
