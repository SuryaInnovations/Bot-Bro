import React from "react";
import Link from "next/link";
import { Scale, ArrowLeft, FileCheck, AlertCircle } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--foreground)] transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to BOT BRO</span>
        </Link>

        <div>
          <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-semibold">
            Public Beta Terms • Effective October 2026
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            BOT BRO Terms of Service
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Rules, acceptable use, and limitations governing participation in the Public Beta.
          </p>
        </div>

        <div className="space-y-6 text-sm text-[var(--text-muted)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-500" />
              1. Public Beta Services
            </h2>
            <p>
              BOT BRO is currently provided as a controlled Public Beta. While we maintain a 99.9% uptime target and rigorous security standards, features are subject to continuous improvements, performance optimizations, and updates.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Scale className="w-4 h-4 text-indigo-500" />
              2. Acceptable Use Policy
            </h2>
            <p>
              Users agree not to utilize BOT BRO to generate malicious payloads, circumvent cybersecurity controls, conduct automated scraping without permission, or distribute harmful content. All queries pass through prompt sanitization boundaries to enforce safety guidelines.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-500" />
              3. Financial & Informational Disclaimers
            </h2>
            <p>
              Real-time intelligence indicators (such as bullion spot rates, weather forecasts, and stock indices) are provided as informative benchmarks retrieved from verified public sources. They do not constitute formal investment, judicial, or statutory advice.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-[var(--border)] text-xs text-[var(--text-muted)] flex justify-between">
          <span>BOT BRO — Powered by Anthropic Claude</span>
          <Link href="/privacy" className="hover:underline">
            View Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
