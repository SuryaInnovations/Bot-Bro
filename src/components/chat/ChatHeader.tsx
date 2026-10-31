"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Share2,
  Archive,
  Flag,
  Menu,
  Check,
  Sparkles,
  Zap,
  Sliders,
  ExternalLink,
  Download,
  Copy,
} from "lucide-react";
import { Conversation, ModelInfo, Message } from "@/types";
import { CLAUDE_MODELS } from "@/lib/anthropic/client";
import { NovaOrb } from "../common/NovaOrb";
import { ShareModal } from "./ShareModal";

interface ChatHeaderProps {
  conversation: Conversation;
  messages?: Message[];
  onUpdateConversation: (updates: Partial<Conversation>) => void;
  onToggleSidebar: () => void;
  onToggleArtifacts: () => void;
  isArtifactsOpen: boolean;
  hasArtifacts: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  onExport: () => void;
  availableModels?: ModelInfo[];
  isSidebarOpen?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  conversation,
  messages = [],
  onUpdateConversation,
  onToggleSidebar,
  onToggleArtifacts,
  isArtifactsOpen,
  hasArtifacts,
  selectedModel,
  onSelectModel,
  onExport,
  availableModels,
  isSidebarOpen = true,
}) => {
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [reported, setReported] = useState(false);

  const modelsList =
    availableModels && availableModels.length > 0 ? availableModels : CLAUDE_MODELS;

  const currentModel =
    modelsList.find((m) => m.id === selectedModel) || modelsList[0] || {
      id: "claude-3-7-sonnet-20250219",
      name: "Claude 3.7 Sonnet",
    };

  const handleShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleArchive = () => {
    onUpdateConversation({ isArchived: true });
  };

  const handleReport = () => {
    setReported(true);
    setTimeout(() => setReported(false), 2500);
  };

  return (
    <>
      <header className="h-13 border-b border-[var(--border)] px-2.5 sm:px-4 md:px-6 flex items-center justify-between bg-[var(--background)] sticky top-0 z-20 select-none pt-[env(safe-area-inset-top,0px)]">
        {/* Left: Mobile Toggle & Model Selector */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {/* Mobile Sidebar Toggle */}
          <button
            onClick={onToggleSidebar}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition lg:hidden shrink-0"
            title="Toggle Sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Desktop Toggle when sidebar is closed */}
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="hidden lg:flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition shrink-0"
              title="Open Sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          {/* Brand Logo - visible on mobile, and on desktop when sidebar is closed */}
          <div className={`items-center gap-1.5 sm:gap-2 mr-1 shrink-0 ${isSidebarOpen ? "hidden xs:flex lg:hidden" : "flex"}`}>
            <NovaOrb size="xs" />
            <span className="font-bold text-xs sm:text-sm tracking-tight text-[var(--foreground)] hidden sm:inline">
              BOT BRO
            </span>
          </div>

          {/* Model Selector Dropdown Button (Styled like reference screenshot) */}
          <div className="relative shrink min-w-0">
            <button
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 text-xs font-semibold text-[var(--foreground)] hover:text-black dark:hover:text-white px-1.5 sm:px-2 py-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition max-w-full"
            >
              <span className="max-w-[100px] xs:max-w-[140px] sm:max-w-[200px] md:max-w-none truncate">
                {currentModel.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
              {/* Soft magenta/red live status dot from screenshot */}
              <span className="w-1.5 h-1.5 rounded-full bg-[#E05688] ml-0.5 shrink-0" />
            </button>

            {/* Model Dropdown Menu */}
            {isModelDropdownOpen && (
              <div className="absolute left-0 top-9 w-72 rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-dropdown z-50 p-1.5 flex flex-col gap-1 text-xs animate-fadeIn">
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">
                  Select Intelligence Engine
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                  {modelsList.map((model) => {
                    const isSelected = model.id === selectedModel;
                    return (
                      <button
                        key={model.id}
                        onClick={() => {
                          onSelectModel(model.id);
                          onUpdateConversation({ model: model.id });
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-xl transition flex items-start justify-between ${
                          isSelected
                            ? "bg-[#202020] text-white"
                            : "hover:bg-[var(--surface-subtle)] text-[var(--foreground)]"
                        }`}
                      >
                        <div className="flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs">{model.name}</span>
                            {model.badge && (
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                                }`}
                              >
                                {model.badge}
                              </span>
                            )}
                          </div>
                          {model.description && (
                            <p
                              className={`text-[11px] mt-0.5 line-clamp-1 ${
                                isSelected ? "text-zinc-300" : "text-[var(--text-muted)]"
                              }`}
                            >
                              {model.description}
                            </p>
                          )}
                        </div>
                        {isSelected && <Check className="w-4 h-4 shrink-0 text-white mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Buttons: Share, Archive, Report */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Share Button */}
          <button
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs font-medium text-[var(--foreground)] transition shadow-xs"
            title="Share chat"
          >
            <Share2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Archive Button */}
          <button
            onClick={handleArchive}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs font-medium text-[var(--foreground)] transition shadow-xs"
            title="Archive this chat"
          >
            <Archive className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="hidden sm:inline">Archive</span>
          </button>

          {/* Report Button */}
          <button
            onClick={handleReport}
            className="flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs font-medium text-[var(--foreground)] transition shadow-xs"
            title="Report or give feedback"
          >
            {reported ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Flag className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            )}
            <span className="hidden sm:inline">{reported ? "Reported" : "Report"}</span>
          </button>

          {/* Artifacts Split-Screen Toggle (if artifacts generated) */}
          {hasArtifacts && (
            <button
              onClick={onToggleArtifacts}
              className={`flex items-center gap-1.5 p-1.5 sm:px-3 sm:py-1.5 rounded-full text-xs font-medium transition shadow-xs ${
                isArtifactsOpen
                  ? "bg-[#202020] text-white"
                  : "border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--foreground)]"
              }`}
              title="Toggle Artifacts"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Artifacts</span>
            </button>
          )}
        </div>
      </header>

      {/* Fully Functional Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        conversation={conversation}
        messages={messages}
      />
    </>
  );
};
