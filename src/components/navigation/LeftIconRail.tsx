"use client";

import React from "react";
import {
  MessageSquare,
  Sun,
  Moon,
  Settings,
  Shield,
  Plus,
} from "lucide-react";
import { NovaOrb } from "../common/NovaOrb";
import { ActivePlatformTab } from "./TopNav";

interface LeftIconRailProps {
  activeTab: ActivePlatformTab;
  onSelectTab: (tab: ActivePlatformTab) => void;
  onOpenSettings: () => void;
  onNewChat?: () => void;
  theme: "light" | "dark" | "system";
  onToggleTheme: () => void;
  userName?: string;
  isAdmin?: boolean;
}

export const LeftIconRail: React.FC<LeftIconRailProps> = ({
  activeTab,
  onSelectTab,
  onOpenSettings,
  onNewChat,
  theme,
  onToggleTheme,
  userName = "Saleh",
  isAdmin = false,
}) => {
  return (
    <aside className="w-[56px] h-full shrink-0 border-r border-[var(--border)] bg-[var(--rail-bg)] flex flex-col items-center justify-between py-4 select-none z-20">
      {/* Top: Logo Orb & New Chat */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => {
            onSelectTab("chat");
            if (onNewChat) onNewChat();
          }}
          className="focus:outline-none transition transform hover:scale-105 active:scale-95"
          title="NOVA AI Home (New Chat)"
        >
          <NovaOrb size="sm" />
        </button>

        {/* New Chat Quick Button */}
        <button
          onClick={() => {
            onSelectTab("chat");
            if (onNewChat) onNewChat();
          }}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-nova-500 hover:bg-[var(--surface)] transition"
          title="Start New Chat"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Chat Stream View */}
        <button
          onClick={() => onSelectTab("chat")}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition ${
            activeTab === "chat"
              ? "bg-[var(--surface)] text-nova-500 shadow-sm border border-[var(--border)]"
              : "text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)]/50"
          }`}
          title="Conversational AI Assistant"
        >
          <MessageSquare className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom: Theme, Settings & Profile */}
      <div className="flex flex-col items-center gap-2.5">
        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition"
          title="Settings, Account & Memory"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* User Profile Avatar */}
        <button
          onClick={onOpenSettings}
          className="relative group focus:outline-none mt-1"
          title={`Account (${userName})`}
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-nova-600 to-amber-500 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
        </button>
      </div>
    </aside>
  );
};
