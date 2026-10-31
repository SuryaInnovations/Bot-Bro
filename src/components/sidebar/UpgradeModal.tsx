"use client";

import React, { useState } from "react";
import { Check, Sparkles, X, Zap, Shield, Bot, ArrowRight } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [isActivated, setIsActivated] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--surface)] text-[var(--foreground)] w-full max-w-lg rounded-3xl border border-[var(--border)] shadow-dropdown overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[var(--foreground)]">Upgrade to NOVA AI Pro</h3>
              <p className="text-xs text-[var(--text-muted)]">Unlimited frontier Claude intelligence & reasoning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Plan Interval Switcher */}
          <div className="flex items-center justify-center p-1 bg-[var(--surface-subtle)] rounded-xl border border-[var(--border)] text-xs">
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`flex-1 py-1.5 rounded-lg font-medium transition ${
                selectedPlan === "monthly"
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--text-muted)]"
              }`}
            >
              Monthly Billing ($20/mo)
            </button>
            <button
              onClick={() => setSelectedPlan("yearly")}
              className={`flex-1 py-1.5 rounded-lg font-medium transition flex items-center justify-center gap-1.5 ${
                selectedPlan === "yearly"
                  ? "bg-[var(--surface)] text-[var(--foreground)] shadow-xs"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <span>Annual Billing ($16/mo)</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full">
                Save 20%
              </span>
            </button>
          </div>

          {/* Features List */}
          <div className="space-y-3">
            <PlanFeature title="Unlimited Claude 3.7 Sonnet & Extended Thinking" desc="Access 64k token reasoning budgets without hourly throttles" />
            <PlanFeature title="Autonomous Multi-Agent Swarms" desc="Deploy 5-agent engineering and deep research pipelines" />
            <PlanFeature title="Interactive Split-Screen Artifacts" desc="Live React preview, vector SVG export, and code execution" />
            <PlanFeature title="Full RAG Knowledge Engine" desc="Index unlimited documents with semantic search & context compression" />
            <PlanFeature title="Zero Data Model Training" desc="Enterprise privacy: your proprietary code and chats are never used for training" />
          </div>

          {/* Success Banner */}
          {isActivated && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>30-Day Pro Trial activated successfully! Enjoy unlimited access.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex flex-col gap-2">
          <button
            onClick={() => setIsActivated(true)}
            className="w-full py-3 rounded-xl bg-[#202020] hover:bg-black text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>{isActivated ? "Trial Active" : "Start 30-Day Free Trial"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[11px] text-center text-[var(--text-muted)]">
            No charge for 30 days. Cancel anytime with a single click.
          </p>
        </div>
      </div>
    </div>
  );
};

function PlanFeature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5">
        <Check className="w-3 h-3" />
      </div>
      <div>
        <h4 className="text-xs font-semibold text-[var(--foreground)]">{title}</h4>
        <p className="text-[11px] text-[var(--text-muted)]">{desc}</p>
      </div>
    </div>
  );
}
