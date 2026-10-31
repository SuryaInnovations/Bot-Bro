import React from "react";
import Link from "next/link";
import { Shield, ArrowLeft, Lock, Database, EyeOff, UserCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
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
            Public Beta Policy • Effective October 2026
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mt-2">
            BOT BRO Privacy Policy
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            How we protect your data, safeguard persistent memory, and isolate your personal workspace.
          </p>
        </div>

        <div className="space-y-6 text-sm text-[var(--text-muted)] leading-relaxed">
          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-indigo-500" />
              1. Zero Model Training on User Data
            </h2>
            <p>
              We interact strictly with the official Anthropic Claude Messages API under enterprise API data retention guidelines. Your prompts, uploaded documents, artifacts, and outputs are **never** used to train foundation models.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-500" />
              2. User-Controlled Long-Term Memory
            </h2>
            <p>
              BOT BRO allows users to view, edit, disable, or delete every single piece of remembered information. You have complete transparency through the Personal Workspace Memory tab. You can clear your memories at any time with a single click.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              3. Database Isolation & Row Level Security (RLS)
            </h2>
            <p>
              All personal tasks, calendar events, email drafts, knowledge documents, and vector embeddings are stored in PostgreSQL protected by strict Row Level Security policies (<code>auth.uid() = user_id</code>). Cross-user access is impossible at the database layer.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold text-[var(--foreground)] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-indigo-500" />
              4. GDPR & Right to Erasure
            </h2>
            <p>
              You maintain full ownership of your data. You may download a complete, machine-readable JSON archive of all your conversations and personal workspace records via <code>/api/auth/export-data</code>, or permanently delete your account and all associated records via <code>/api/auth/delete-account</code>.
            </p>
          </section>
        </div>

        <div className="pt-6 border-t border-[var(--border)] text-xs text-[var(--text-muted)] flex justify-between">
          <span>BOT BRO — Powered by Anthropic Claude</span>
          <Link href="/terms" className="hover:underline">
            View Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
