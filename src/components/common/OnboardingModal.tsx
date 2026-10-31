"use client";

import React from "react";
import { X, Sparkles, Brain, Shield, ArrowRight, Zap, FolderOpen, Compass } from "lucide-react";
import { NovaOrb } from "./NovaOrb";

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[var(--surface)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-indigo-900/60 via-purple-900/40 to-black p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <NovaOrb size="md" />
            <div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[10px] font-mono uppercase tracking-wider border border-indigo-400/30">
                Public Beta Release 2.0
              </span>
              <h2 className="text-xl font-bold tracking-tight mt-1 text-white">
                Welcome to BOT BRO
              </h2>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Your conversational AI assistant powered directly by **Anthropic Claude 3.7 Sonnet**, featuring dynamic hybrid reasoning, live intelligence, and a personal AI workspace.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="p-6 space-y-4 bg-[var(--surface)]">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--foreground)]">
                Single Conversational Interface
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Interact exclusively through natural chat. Daily intelligence, task planning, reminders, and 7-agent swarms operate invisibly behind the scenes.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--foreground)]">
                Chat Project Folders
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Easily organize and group your conversations into custom project folders right from the chat sidebar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-[var(--foreground)]">
                User-Controlled Privacy & Memory
              </h4>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                Review, correct, disable, or delete what is remembered anytime. Your data is isolated with PostgreSQL Row Level Security.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 pt-2 bg-[var(--surface)] border-t border-[var(--border)] flex items-center justify-between">
          <span className="text-[11px] text-[var(--text-muted)]">
            Powered by official Anthropic Claude Messages API
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center gap-2 shadow-sm"
          >
            <span>Start Exploring</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
