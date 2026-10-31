"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  Globe,
} from "lucide-react";
import { NovaOrb } from "@/components/common/NovaOrb";

interface SharedMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

interface SharedData {
  token: string;
  title: string;
  model: string;
  createdAt: string;
  messages: SharedMessage[];
}

export default function SharedConversationPage() {
  const params = useParams();
  const token = params?.token as string;

  const [data, setData] = useState<SharedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    fetch(`/api/share/${token}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(
            json.error || "This shared conversation is no longer available or has been revoked."
          );
        }
        setData(json.conversation);
      })
      .catch((err: any) => {
        setError(err.message || "Failed to load shared conversation.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token]);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Simple Markdown renderer for code blocks, bold, headers and lists
  const renderFormattedContent = (content: string, msgId: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return (
      <div className="space-y-3 leading-relaxed text-sm">
        {parts.map((part, i) => {
          if (part.startsWith("```") && part.endsWith("```")) {
            const lines = part.slice(3, -3).split("\n");
            const firstLine = lines[0].trim();
            const language = firstLine || "text";
            const code = firstLine ? lines.slice(1).join("\n") : lines.join("\n");
            const codeId = `${msgId}-code-${i}`;

            return (
              <div
                key={i}
                className="my-3 rounded-xl border border-[var(--border)] bg-[#14151C] text-zinc-100 overflow-hidden font-mono text-xs shadow-md"
              >
                <div className="flex items-center justify-between px-3.5 py-1.5 bg-black/40 border-b border-white/10 text-zinc-400">
                  <span className="text-[11px] font-semibold uppercase">{language}</span>
                  <button
                    onClick={() => handleCopyCode(code, codeId)}
                    className="flex items-center gap-1.5 hover:text-white transition text-[11px] p-1"
                  >
                    {copiedCodeId === codeId ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 overflow-x-auto leading-normal whitespace-pre">
                  <code>{code}</code>
                </pre>
              </div>
            );
          }

          // Process normal paragraphs, headers and bullet points
          const paragraphs = part.split("\n\n");
          return paragraphs.map((p, pIdx) => {
            if (!p.trim()) return null;

            // Headers
            if (p.startsWith("### ")) {
              return (
                <h3 key={`${i}-${pIdx}`} className="text-base font-bold text-[var(--foreground)] mt-3 mb-1">
                  {p.replace("### ", "")}
                </h3>
              );
            }
            if (p.startsWith("## ")) {
              return (
                <h2 key={`${i}-${pIdx}`} className="text-lg font-bold text-[var(--foreground)] mt-4 mb-1">
                  {p.replace("## ", "")}
                </h2>
              );
            }
            if (p.startsWith("# ")) {
              return (
                <h1 key={`${i}-${pIdx}`} className="text-xl font-bold text-[var(--foreground)] mt-4 mb-2">
                  {p.replace("# ", "")}
                </h1>
              );
            }

            // Bullet Lists
            if (p.includes("\n- ") || p.startsWith("- ")) {
              const items = p.split("\n- ").map((item) => item.replace(/^- /, ""));
              return (
                <ul key={`${i}-${pIdx}`} className="list-disc pl-5 space-y-1 text-[var(--foreground)]">
                  {items.map((it, itIdx) => (
                    <li key={itIdx}>{it}</li>
                  ))}
                </ul>
              );
            }

            return (
              <p key={`${i}-${pIdx}`} className="text-[var(--foreground)] whitespace-pre-wrap">
                {p}
              </p>
            );
          });
        })}
      </div>
    );
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-[var(--background)] text-[var(--foreground)] select-none">
        <NovaOrb size="lg" />
        <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Loading shared conversation on BOT BRO...</span>
        </div>
      </div>
    );
  }

  // Revoked / Error State
  if (error || !data) {
    return (
      <div className="min-h-screen w-screen flex flex-col justify-between bg-[var(--background)] text-[var(--foreground)] font-sans">
        {/* Top Header */}
        <header className="h-14 border-b border-[var(--border)] px-6 flex items-center justify-between bg-[var(--surface)] sticky top-0 z-20">
          <Link href="/" className="flex items-center gap-2.5">
            <NovaOrb size="sm" />
            <span className="font-bold text-sm tracking-tight">BOT BRO</span>
          </Link>
          <Link
            href="/login"
            className="text-xs px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition"
          >
            Sign in
          </Link>
        </header>

        {/* Error Card */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md p-8 rounded-3xl border border-[var(--border)] bg-[var(--surface)] text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">
              Conversation Unavailable
            </h1>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              {error || "This shared conversation has been revoked by the owner or does not exist."}
            </p>
            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#202020] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black text-xs font-semibold shadow-xs transition"
              >
                <span>Go to BOT BRO Home</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </main>

        <footer className="py-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border)]">
          © 2026 BOT BRO Inc. All rights reserved.
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-screen flex flex-col justify-between bg-[var(--background)] text-[var(--foreground)] font-sans">
      {/* Top Fixed Header */}
      <header className="h-14 border-b border-[var(--border)] px-4 sm:px-8 flex items-center justify-between bg-[var(--surface)]/90 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <NovaOrb size="sm" />
            <span className="font-bold text-sm tracking-tight text-[var(--foreground)]">
              BOT BRO
            </span>
          </Link>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            <Globe className="w-3 h-3" />
            <span>Shared Read-Only Snapshot</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white text-xs font-semibold shadow-xs transition"
          >
            <span>Start your own chat</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Conversation Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Conversation Header Banner */}
        <div className="pb-6 border-b border-[var(--border)] space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--foreground)]">
            {data.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{new Date(data.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{data.messages.length} messages</span>
            </div>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-semibold">
              {data.model}
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="space-y-6">
          {data.messages.map((message, idx) => {
            const isUser = message.role === "user";

            return (
              <div
                key={message.id || idx}
                className={`flex gap-3 sm:gap-4 items-start ${
                  isUser ? "bg-[var(--surface-subtle)]/40 p-4 rounded-2xl border border-[var(--border)]" : ""
                }`}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-0.5">
                  {isUser ? (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-xs">
                      U
                    </div>
                  ) : (
                    <NovaOrb size="sm" />
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[var(--foreground)]">
                      {isUser ? "User" : "BOT BRO"}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="text-sm text-[var(--foreground)]">
                    {renderFormattedContent(message.content, message.id || `msg-${idx}`)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Card for Visitors */}
        <div className="mt-12 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] text-center space-y-3 shadow-lg">
          <NovaOrb size="md" className="mx-auto" />
          <h3 className="text-base font-bold text-[var(--foreground)]">
            Experience BOT BRO AI Yourself
          </h3>
          <p className="text-xs text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
            Chat with BOT BRO, analyze documents, write code, run live research, and create interactive artifacts with zero subscription limits.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-semibold text-xs shadow-md transition hover:opacity-95"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-6 border-t border-[var(--border)] bg-[var(--surface)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] max-w-7xl mx-auto w-full gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Shared via BOT BRO • Read-only snapshot</span>
        </div>
        <div>© 2026 BOT BRO Inc. All rights reserved.</div>
      </footer>
    </div>
  );
}
