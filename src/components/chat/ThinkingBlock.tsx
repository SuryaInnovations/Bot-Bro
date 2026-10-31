"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThinkingBlockProps {
  thinking: string;
  isGenerating?: boolean;
}

export const ThinkingBlock: React.FC<ThinkingBlockProps> = ({
  thinking,
  isGenerating = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!thinking) return null;

  return (
    <div className="my-2 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] text-xs overflow-hidden transition-all duration-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-[var(--text-muted)] hover:text-[var(--foreground)] transition-colors text-left"
      >
        <div className="flex items-center gap-1.5 font-medium">
          <Brain
            className={cn(
              "w-3.5 h-3.5 text-nova-500",
              isGenerating && "animate-pulse"
            )}
          />
          <span>{isGenerating ? "Thinking through problem..." : "Thought process"}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-[var(--text-muted)]">
            {thinking.length > 0 ? `~${Math.ceil(thinking.length / 4)} tokens` : ""}
          </span>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {isOpen && (
        <div className="px-3.5 py-2.5 border-t border-[var(--border)] text-[var(--text-muted)] font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
          {thinking}
        </div>
      )}
    </div>
  );
};
