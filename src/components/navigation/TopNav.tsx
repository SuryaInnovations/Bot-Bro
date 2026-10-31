"use client";

import React from "react";
import Link from "next/link";
import {
  MessageSquare,
  Sparkles,
  BookOpen,
  ShieldCheck,
  Zap,
} from "lucide-react";

export type ActivePlatformTab =
  | "chat"
  | "personal_assistant"
  | "daily_intel"
  | "agents"
  | "research"
  | "coding"
  | "knowledge"
  | "workflows"
  | "studio";

interface TopNavProps {
  activeTab: ActivePlatformTab;
  onSelectTab: (tab: ActivePlatformTab) => void;
  selectedModel?: string;
  onOpenSettings?: () => void;
  isAdminMode?: boolean;
  onToggleAdminMode?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  onSelectTab,
  selectedModel = "claude-3-7-sonnet-20250219",
  onOpenSettings,
  isAdminMode = false,
  onToggleAdminMode,
}) => {
  const modelShortName = selectedModel.includes("3-7-sonnet")
    ? "Claude 3.7 Sonnet"
    : selectedModel.includes("3-5-sonnet")
    ? "Claude 3.5 Sonnet"
    : selectedModel.includes("3-5-haiku")
    ? "Claude 3.5 Haiku"
    : "Claude 3.7 Sonnet";

  return (
    <nav className="h-11 border-b border-[var(--border)] bg-[var(--surface-subtle)]/70 px-4 flex items-center justify-between select-none shrink-0">
      {/* Left: Conversational Status & Active Intelligence Engine */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSelectTab("chat")}
          className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)] hover:text-nova-500 transition"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>BOT BRO</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-nova-500/10 text-nova-500 font-mono font-bold">
            {modelShortName}
          </span>
        </button>

        <span className="hidden md:inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] border-l border-[var(--border)] pl-3">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>Unified Conversational AI Engine Active</span>
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Admin Console Switcher (Only if enabled in Settings / Admin) */}
        {isAdminMode && (
          <div className="flex items-center gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-0.5 text-xs">
            <button
              onClick={() => onSelectTab("chat")}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                activeTab === "chat" ? "bg-nova-500 text-white font-medium" : "text-[var(--text-muted)]"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => onSelectTab("agents")}
              className={`px-2 py-0.5 rounded text-[11px] transition ${
                activeTab !== "chat" ? "bg-purple-600 text-white font-medium" : "text-[var(--text-muted)]"
              }`}
            >
              Admin Swarm
            </button>
          </div>
        )}

        {/* Documentation Reference Link */}
        <Link
          href="/docs"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-nova-500 hover:bg-[var(--surface)] transition"
          title="Open Official Anthropic Models & Tools Reference"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Docs</span>
        </Link>
      </div>
    </nav>
  );
};
