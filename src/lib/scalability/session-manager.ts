/**
 * NOVA AI — Enterprise Scalable Session Manager
 * Provides stateless cryptographic session validation, per-user isolation,
 * stream resumption tokens, and network reconnection tracking for 100,000 concurrent users.
 */

import crypto from "crypto";

export interface EnterpriseSession {
  sessionId: string;
  userId: string;
  email: string;
  role: "user" | "admin" | "beta_tester";
  tenantId: string;
  createdAt: number;
  expiresAt: number;
  lastActive: number;
}

export interface StreamResumeToken {
  token: string;
  conversationId: string;
  lastEventId: number;
  accumulatedText: string;
  createdAt: number;
}

class EnterpriseSessionManager {
  private secretKey: string;
  private activeStreams: Map<string, StreamResumeToken> = new Map();
  private activeUserHeartbeats: Map<string, number> = new Map();

  constructor() {
    this.secretKey = process.env.JWT_SECRET || process.env.SUPABASE_JWT_SECRET || "nova-enterprise-cluster-secret-2026";
    // Periodic stream checkpoint cleanup
    setInterval(() => this.pruneOldResumptionTokens(), 300000);
  }

  /**
   * Generates a tamper-proof stateless session token.
   */
  public createStatelessToken(user: { id: string; email: string; role?: "user" | "admin" | "beta_tester" }): string {
    const payload: EnterpriseSession = {
      sessionId: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: user.id,
      email: user.email,
      role: user.role || "user",
      tenantId: `tenant-${user.id.substring(0, 8)}`,
      createdAt: Date.now(),
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
      lastActive: Date.now(),
    };

    const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const hmac = crypto.createHmac("sha256", this.secretKey).update(data).digest("base64url");
    return `${data}.${hmac}`;
  }

  /**
   * Validates stateless session token in O(1) time without database roundtrip.
   */
  public verifyStatelessToken(token: string): EnterpriseSession | null {
    if (!token || !token.includes(".")) return null;
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const expectedSig = crypto.createHmac("sha256", this.secretKey).update(data).digest("base64url");
    if (signature !== expectedSig) {
      return null;
    }

    try {
      const payload: EnterpriseSession = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
      if (Date.now() > payload.expiresAt) {
        return null;
      }
      this.activeUserHeartbeats.set(payload.userId, Date.now());
      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Registers stream progress checkpoint to enable zero-loss resumption on network drop.
   */
  public saveStreamCheckpoint(conversationId: string, eventId: number, accumulatedText: string): string {
    const token = `stream-resume-${conversationId}-${Date.now()}`;
    this.activeStreams.set(conversationId, {
      token,
      conversationId,
      lastEventId: eventId,
      accumulatedText,
      createdAt: Date.now(),
    });
    return token;
  }

  /**
   * Retrieves stream checkpoint for reconnection.
   */
  public getStreamCheckpoint(conversationId: string): StreamResumeToken | null {
    return this.activeStreams.get(conversationId) || null;
  }

  /**
   * Cleans up stream token once client confirms full stream completion.
   */
  public clearStreamCheckpoint(conversationId: string): void {
    this.activeStreams.delete(conversationId);
  }

  public recordHeartbeat(userId: string): void {
    this.activeUserHeartbeats.set(userId, Date.now());
  }

  public getActiveUserCount(): number {
    const cutoff = Date.now() - 5 * 60 * 1000; // Active within last 5 minutes
    let count = 0;
    this.activeUserHeartbeats.forEach((time) => {
      if (time > cutoff) count++;
    });
    return Math.max(count, 1);
  }

  private pruneOldResumptionTokens() {
    const cutoff = Date.now() - 3600000; // 1 hour
    for (const [convId, token] of this.activeStreams.entries()) {
      if (token.createdAt < cutoff) {
        this.activeStreams.delete(convId);
      }
    }
  }
}

export const sessionManager = new EnterpriseSessionManager();
