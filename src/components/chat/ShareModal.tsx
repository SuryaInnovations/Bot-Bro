"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  ShieldCheck,
  Loader2,
  Link as LinkIcon,
  Globe,
  AlertCircle,
} from "lucide-react";
import { Conversation, Message } from "@/types";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  messages: Message[];
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  conversation,
  messages,
}) => {
  const [token, setToken] = useState<string>("");
  const [isRevoked, setIsRevoked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const shareUrl = token ? `${origin}/share/${token}` : "";

  // Automatically generate or retrieve the active shareable link as soon as the modal opens
  useEffect(() => {
    if (isOpen && conversation?.id) {
      setCopied(false);
      setStatusMessage("");
      setErrorMessage("");
      loadOrCreateShare(false);
    }
  }, [isOpen, conversation?.id]);

  const loadOrCreateShare = async (forceRegenerate = false) => {
    setIsLoading(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: forceRegenerate ? "regenerate" : "create",
          conversationId: conversation.id,
          title: conversation.title,
          model: conversation.model,
          messages: (messages || []).map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && data.share) {
        setToken(data.share.token);
        setIsRevoked(Boolean(data.share.isRevoked));
        if (forceRegenerate) {
          setStatusMessage("Generated a new unique shareable link.");
        }
      } else {
        setErrorMessage(data.error || "Failed to generate share link.");
      }
    } catch (err) {
      console.error("Failed to initialize share link:", err);
      setErrorMessage("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback for non-secure contexts
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    if (!shareUrl) return;
    const text = `Check out this conversation on BOT BRO: "${conversation.title}"\n\n${shareUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareGmail = () => {
    if (!shareUrl) return;
    const subject = `BOT BRO: ${conversation.title}`;
    const body = `Hi,\n\nI wanted to share this conversation from BOT BRO with you:\n\n"${conversation.title}"\n\nView the conversation here:\n${shareUrl}\n\nShared via BOT BRO.`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    // Open Gmail web compose; fallback to mailto if blocked
    const win = window.open(gmailUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      window.location.href = `mailto:?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
    }
  };

  const handleRevokeShare = async () => {
    setIsLoading(true);
    setStatusMessage("");
    setErrorMessage("");
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "revoke",
          conversationId: conversation.id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsRevoked(true);
        setToken("");
        setStatusMessage("Share link revoked. This conversation is now private.");
      } else {
        setErrorMessage(data.message || "Failed to revoke share link.");
      }
    } catch (err) {
      console.error("Failed to revoke share link:", err);
      setErrorMessage("Unable to connect. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--surface)] text-[var(--foreground)] w-full max-w-md rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-black/5 dark:bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-xs">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-[var(--foreground)] uppercase">
                Share this chat
              </h3>
              <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[240px] sm:max-w-[280px]">
                {conversation.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* 1. All Three Sharing Options Visible Immediately */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            {/* WhatsApp */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              disabled={isLoading || !shareUrl}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-emerald-500/10 hover:border-emerald-500/30 text-[var(--foreground)] transition group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Share on WhatsApp"
            >
              <div className="w-9 h-9 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.073-2.127-.514-1.579-.646-2.58-2.26-2.658-2.366-.079-.105-.644-.858-.644-1.637 0-.78.406-1.164.55-1.32.144-.155.313-.194.417-.194.104 0 .209.002.3.007.098.006.229-.037.359.274.135.324.462 1.127.502 1.209.04.082.067.178.013.285-.054.107-.081.174-.162.268-.08.095-.169.212-.241.285-.08.082-.164.17-.07.332.094.161.417.689.896 1.116.616.549 1.135.719 1.296.8.161.082.256.069.351-.041.095-.109.406-.473.514-.636.108-.163.216-.136.365-.082.149.055.946.446 1.109.527.163.082.271.123.311.191.04.068.04.394-.104.799z" />
                </svg>
              </div>
              <span className="text-xs font-semibold mt-2 text-center leading-tight">
                Share on WhatsApp
              </span>
            </button>

            {/* Gmail */}
            <button
              type="button"
              onClick={handleShareGmail}
              disabled={isLoading || !shareUrl}
              className="flex flex-col items-center justify-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-rose-500/10 hover:border-rose-500/30 text-[var(--foreground)] transition group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Share via Gmail"
            >
              <div className="w-9 h-9 rounded-full bg-[#EA4335] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <span className="text-xs font-semibold mt-2 text-center leading-tight">
                Share via Gmail
              </span>
            </button>

            {/* Copy Chat Link */}
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={isLoading || !shareUrl}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border transition group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                copied
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  : "border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-indigo-500/10 hover:border-indigo-500/30 text-[var(--foreground)]"
              }`}
              title="Copy Chat Link"
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform ${
                  copied ? "bg-emerald-600 text-white" : "bg-indigo-600 text-white"
                }`}
              >
                {copied ? <Check className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
              </div>
              <span className="text-xs font-semibold mt-2 text-center leading-tight">
                {copied ? "Link Copied!" : "Copy Chat Link"}
              </span>
            </button>
          </div>

          {/* 2. Shareable link section with Copy button */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--text-muted)] block">
              Shareable link:
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <LinkIcon className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  readOnly
                  value={
                    isLoading
                      ? "Generating shareable link..."
                      : isRevoked
                      ? "Link has been revoked"
                      : shareUrl
                  }
                  onClick={(e) => {
                    if (shareUrl && !isRevoked) {
                      (e.target as HTMLInputElement).select();
                    }
                  }}
                  placeholder="https://..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--foreground)] font-mono truncate focus:outline-none focus:ring-1 focus:ring-indigo-500/40 select-all"
                />
                {isLoading && (
                  <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                disabled={isLoading || !shareUrl || isRevoked}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed ${
                  copied
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-[#202020] hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 3. Notice: Anyone with this link can view this conversation */}
          <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Anyone with this link can view this conversation.</span>
          </p>

          {/* Revocation State / Status Message */}
          {statusMessage && (
            <div className="text-xs text-indigo-400 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 leading-relaxed">
              {statusMessage}
            </div>
          )}

          {errorMessage && (
            <div className="text-xs text-rose-400 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => loadOrCreateShare(false)}
                className="underline font-semibold hover:text-rose-300 ml-2"
              >
                Retry
              </button>
            </div>
          )}

          {isRevoked && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>Public access is disabled.</span>
              <button
                type="button"
                onClick={() => loadOrCreateShare(true)}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Create New Link</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer: Revoke Link on the left, Close on the right */}
        <div className="px-6 py-3.5 bg-[var(--surface-subtle)] border-t border-[var(--border)] flex items-center justify-between">
          {!isRevoked && shareUrl ? (
            <button
              type="button"
              onClick={handleRevokeShare}
              disabled={isLoading}
              className="text-xs text-rose-500 hover:text-rose-600 font-medium transition flex items-center gap-1.5 p-1 disabled:opacity-50 cursor-pointer"
              title="Immediately deactivate public link"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Revoke Link</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 text-xs font-semibold text-[var(--foreground)] transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
