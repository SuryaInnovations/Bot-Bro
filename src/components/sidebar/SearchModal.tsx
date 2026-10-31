"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, MessageSquare, X, ArrowRight } from "lucide-react";
import { Conversation, Message } from "@/types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  messages: Message[];
  onSelectConversation: (conversationId: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  conversations,
  messages,
  onSelectConversation,
}) => {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase())
  );

  const matchingMessages = query.trim().length > 1
    ? messages
        .filter((m) => m.content.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 10)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-dropdown overflow-hidden z-10 flex flex-col max-h-[70vh]">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations, topics, and messages..."
            className="w-full bg-transparent text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-[var(--text-muted)] hover:text-[var(--foreground)] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-[var(--surface-subtle)] border border-[var(--border)] rounded text-[var(--text-muted)]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-4">
          {/* Conversation Title Matches */}
          {filteredConversations.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 py-1 block">
                Conversations ({filteredConversations.length})
              </span>
              <div className="space-y-0.5">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--surface-subtle)] transition text-left group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <MessageSquare className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover:text-nova-500" />
                      <span className="text-xs font-medium text-[var(--foreground)] truncate">
                        {conv.title}
                      </span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Content Matches */}
          {matchingMessages.length > 0 && (
            <div>
              <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-3 py-1 block">
                Matching Messages
              </span>
              <div className="space-y-1">
                {matchingMessages.map((msg) => (
                  <button
                    key={msg.id}
                    onClick={() => {
                      onSelectConversation(msg.conversationId);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl hover:bg-[var(--surface-subtle)] transition text-left group border border-transparent hover:border-[var(--border)]"
                  >
                    <p className="text-xs text-[var(--foreground)] line-clamp-2 leading-relaxed">
                      {msg.content}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                      {new Date(msg.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredConversations.length === 0 && matchingMessages.length === 0 && (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              No conversations or messages found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
