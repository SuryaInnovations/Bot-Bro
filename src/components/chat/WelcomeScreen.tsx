"use client";

import React from "react";
import { FileText, Calendar, Layers, Sparkles } from "lucide-react";
import { NovaOrb } from "../common/NovaOrb";
import { MessageComposer } from "./MessageComposer";
import { Attachment } from "@/types";

interface WelcomeScreenProps {
  userName?: string;
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  selectedModel: string;
  onSelectModel: (m: string) => void;
  enableWebSearch: boolean;
  setEnableWebSearch: (enabled: boolean) => void;
  enableCodeExecution: boolean;
  setEnableCodeExecution: (enabled: boolean) => void;
  enableThinking: boolean;
  setEnableThinking: (enabled: boolean) => void;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  onOpenDocs: () => void;
  onOpenCalendar: () => void;
  onOpenApi: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName = "Saleh",
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  selectedModel,
  onSelectModel,
  enableWebSearch,
  setEnableWebSearch,
  enableCodeExecution,
  setEnableCodeExecution,
  enableThinking,
  setEnableThinking,
  attachments,
  setAttachments,
  onOpenDocs,
  onOpenCalendar,
  onOpenApi,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 relative min-h-full overflow-hidden select-none">
      {/* Subtle Pastel Ambient Gradient Glow (From reference screenshot) */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        {/* Soft Lavender / Violet Glow top-right */}
        <div className="absolute top-[20%] right-[25%] w-[420px] h-[420px] rounded-full bg-purple-200/25 dark:bg-purple-900/10 blur-[100px]" />
        {/* Soft Mint / Emerald Glow bottom-left */}
        <div className="absolute bottom-[20%] left-[25%] w-[420px] h-[420px] rounded-full bg-emerald-100/35 dark:bg-emerald-950/15 blur-[110px]" />
        {/* Warm Pink Glow center */}
        <div className="absolute top-[35%] left-[45%] w-[320px] h-[320px] rounded-full bg-pink-100/20 dark:bg-pink-950/10 blur-[90px]" />
      </div>

      <div className="w-full max-w-3xl flex flex-col items-center z-10 my-auto py-8">
        {/* Brand Orb & Name */}
        <div className="flex items-center gap-3 mb-3">
          <NovaOrb size="lg" />
          <h1 className="text-xl font-bold tracking-tight text-[var(--foreground)]">
            BOT BRO
          </h1>
        </div>

        {/* Personalized Greeting */}
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-normal text-[var(--text-muted)] tracking-tight">
            Hey 👋 <span className="font-semibold text-[var(--foreground)]">{userName ? `${userName}!` : "there!"}</span> How can I help you today?
          </h2>
        </div>

        {/* Advanced Message Composer */}
        <div className="w-full">
          <MessageComposer
            input={input}
            setInput={setInput}
            onSend={onSend}
            onStop={onStop}
            isStreaming={isStreaming}
            selectedModel={selectedModel}
            onSelectModel={onSelectModel}
            enableWebSearch={enableWebSearch}
            setEnableWebSearch={setEnableWebSearch}
            enableCodeExecution={enableCodeExecution}
            setEnableCodeExecution={setEnableCodeExecution}
            enableThinking={enableThinking}
            setEnableThinking={setEnableThinking}
            attachments={attachments}
            setAttachments={setAttachments}
          />
        </div>

        {/* Conversational Quick Starters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
          <button
            onClick={() => {
              setInput("Plan my day");
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-xs text-xs font-medium text-[var(--foreground)]"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-500" />
            <span>"Plan my day"</span>
          </button>

          <button
            onClick={() => {
              setInput("What's the weather today?");
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-xs text-xs font-medium text-[var(--foreground)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>"What's the weather today?"</span>
          </button>

          <button
            onClick={() => {
              setInput("Give me today's important updates");
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-xs text-xs font-medium text-[var(--foreground)]"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>"Today's updates"</span>
          </button>

          <button
            onClick={() => {
              setInput("What is today's gold price in India?");
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] hover:border-zinc-300 dark:hover:border-zinc-700 transition shadow-xs text-xs font-medium text-[var(--foreground)]"
          >
            <Layers className="w-3.5 h-3.5 text-purple-500" />
            <span>"Today's gold price"</span>
          </button>
        </div>

        {/* Footer Disclaimer (From screenshot) */}
        <p className="text-[11px] text-[var(--text-muted)] text-center mt-12 max-w-lg leading-relaxed">
          BOT BRO can err. BOT BRO does not use private data from your workspace for model training.
        </p>
      </div>
    </div>
  );
};
