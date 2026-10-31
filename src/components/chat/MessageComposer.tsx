"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Sparkles,
  Paperclip,
  Mic,
  MicOff,
  Volume2,
  Send,
  Square,
  Globe,
  Brain,
  Terminal,
  Sliders,
  X,
  FileSpreadsheet,
  FileText,
  FileCode,
  Loader2,
} from "lucide-react";
import { Attachment } from "@/types";
import { formatBytes } from "@/lib/utils";

interface MessageComposerProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
  enableWebSearch: boolean;
  setEnableWebSearch: (enabled: boolean) => void;
  enableCodeExecution: boolean;
  setEnableCodeExecution: (enabled: boolean) => void;
  enableThinking: boolean;
  setEnableThinking: (enabled: boolean) => void;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  onVoiceTrigger?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  input,
  setInput,
  onSend,
  onStop,
  isStreaming,
  enableWebSearch,
  setEnableWebSearch,
  enableCodeExecution,
  setEnableCodeExecution,
  enableThinking,
  setEnableThinking,
  attachments,
  setAttachments,
  onVoiceTrigger,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettingsTray, setShowSettingsTray] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-grow textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        220
      )}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || attachments.length > 0)) {
        onSend();
      }
    }
  };

  // Web SpeechRecognition for Dictate button
  const handleToggleDictate = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isDictating) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsDictating(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsDictating(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(input ? `${input} ${transcript}` : transcript);
        }
      };

      recognition.onerror = () => {
        setIsDictating(false);
      };

      recognition.onend = () => {
        setIsDictating(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsDictating(false);
    }
  };

  // File Upload Handlers
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const res = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.attachments) {
          setAttachments((prev) => [...prev, ...data.attachments]);
        }
      }
    } catch {
      // Graceful error
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 select-none">
      {/* Outer Composer Rounded Card (Direct recreation of reference screenshot) */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileUpload(e.dataTransfer.files);
        }}
        className={`relative rounded-[26px] border bg-[var(--surface)] transition-all shadow-sm ${
          isDragging
            ? "border-purple-500 ring-2 ring-purple-500/20"
            : "border-[var(--border)] hover:border-zinc-300 dark:hover:border-zinc-700"
        }`}
      >
        {/* Hidden File Input */}
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          accept=".pdf,.docx,.txt,.csv,.xlsx,.json,.js,.ts,.py,image/*"
        />

        {/* Attachment Chips Preview with Quick Conversion Options */}
        {attachments.length > 0 && (
          <div className="flex flex-col gap-2 px-4 pt-3">
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-medium text-[var(--foreground)]"
                >
                  {att.type.includes("sheet") ? (
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                  ) : att.type.includes("pdf") ? (
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                  ) : att.type.includes("image") ? (
                    <div className="w-3.5 h-3.5 rounded bg-blue-500" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {formatBytes(att.size)}
                  </span>
                  <button
                    onClick={() => removeAttachment(att.id)}
                    className="hover:text-rose-500 transition ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Conversion Suggestions */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
                <span className="font-semibold text-purple-400">Quick Convert:</span>
                {attachments[0].name.toLowerCase().endsWith(".pdf") && (
                  <>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to CSV`)}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition cursor-pointer"
                    >
                      Extract Tables to CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to Excel`)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                    >
                      To Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to Word`)}
                      className="px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition cursor-pointer"
                    >
                      To Word (.docx)
                    </button>
                  </>
                )}
                {(attachments[0].name.toLowerCase().endsWith(".xlsx") ||
                  attachments[0].name.toLowerCase().endsWith(".xls")) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to CSV`)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                    >
                      To CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to PDF`)}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                    >
                      To PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to JSON`)}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition cursor-pointer"
                    >
                      To JSON
                    </button>
                  </>
                )}
                {attachments[0].name.toLowerCase().endsWith(".csv") && (
                  <>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to Excel`)}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition cursor-pointer"
                    >
                      To Excel (.xlsx)
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to PDF`)}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                    >
                      To PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to JSON`)}
                      className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition cursor-pointer"
                    >
                      To JSON
                    </button>
                  </>
                )}
                {attachments[0].name.toLowerCase().endsWith(".docx") && (
                  <>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to PDF`)}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                    >
                      To PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to Markdown`)}
                      className="px-2 py-0.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition cursor-pointer"
                    >
                      To Markdown
                    </button>
                  </>
                )}
                {(attachments[0].type.startsWith("image/") ||
                  attachments[0].name.toLowerCase().endsWith(".png") ||
                  attachments[0].name.toLowerCase().endsWith(".jpg")) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setInput(`Convert ${attachments[0].name} to PDF`)}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition cursor-pointer"
                    >
                      To PDF
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setInput(
                          attachments[0].name.toLowerCase().endsWith(".png")
                            ? `Convert ${attachments[0].name} to JPG`
                            : `Convert ${attachments[0].name} to PNG`
                        )
                      }
                      className="px-2 py-0.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition cursor-pointer"
                    >
                      {attachments[0].name.toLowerCase().endsWith(".png") ? "To JPG" : "To PNG"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Input Area with Sparkles Icon */}
        <div className="px-4 pt-3.5 pb-2 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-purple-400 mt-1 shrink-0" />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={2}
            className="w-full bg-transparent border-none text-sm text-[var(--foreground)] placeholder-[var(--text-muted)] focus:outline-none resize-none leading-relaxed font-sans"
          />
        </div>

        {/* Dictation Status Banner */}
        {isDictating && (
          <div className="mx-4 mb-2 p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Listening to your voice... Speak naturally.</span>
            </span>
            <button
              onClick={handleToggleDictate}
              className="text-[11px] font-semibold underline hover:text-purple-700"
            >
              Stop
            </button>
          </div>
        )}

        {/* Expandable Advanced Controls Tray */}
        {showSettingsTray && (
          <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--surface-subtle)]/40 flex flex-wrap items-center gap-2 text-xs">
            {/* Web Search Toggle */}
            <button
              onClick={() => setEnableWebSearch(!enableWebSearch)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition text-[11px] font-medium ${
                enableWebSearch
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Globe className="w-3 h-3" />
              <span>Web Search</span>
            </button>

            {/* Thinking Budget Toggle */}
            <button
              onClick={() => setEnableThinking(!enableThinking)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition text-[11px] font-medium ${
                enableThinking
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Brain className="w-3 h-3" />
              <span>Extended Thinking</span>
            </button>

            {/* Code Execution Sandbox Toggle */}
            <button
              onClick={() => setEnableCodeExecution(!enableCodeExecution)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition text-[11px] font-medium ${
                enableCodeExecution
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Terminal className="w-3 h-3" />
              <span>Code Sandbox</span>
            </button>
          </div>
        )}

        {/* Bottom Control Row (Exact match to screenshot) */}
        <div className="px-3 pb-3 pt-1 flex items-center justify-between">
          {/* Left: Attach Button */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs font-medium text-[var(--foreground)] transition shadow-xs"
              title="Attach documents or images"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Paperclip className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              )}
              <span>Attach</span>
            </button>

            {/* Advanced Settings Toggle Button */}
            <button
              type="button"
              onClick={() => setShowSettingsTray(!showSettingsTray)}
              className={`p-1.5 rounded-full border transition ${
                showSettingsTray
                  ? "bg-purple-500 text-white border-purple-500"
                  : "border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
              }`}
              title="Advanced reasoning & tools"
            >
              <Sliders className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Dictate, Voice, Send Pill Buttons */}
          <div className="flex items-center gap-2">
            {/* Dictate Button */}
            <button
              type="button"
              onClick={handleToggleDictate}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition text-xs font-medium shadow-xs ${
                isDictating
                  ? "bg-purple-500 text-white border-purple-500"
                  : "border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-[var(--foreground)]"
              }`}
              title="Voice Speech-to-Text Dictation"
            >
              {isDictating ? (
                <MicOff className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <Mic className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              )}
              <span>Dictate</span>
            </button>

            {/* Voice Button */}
            <button
              type="button"
              onClick={() => {
                if (onVoiceTrigger) {
                  onVoiceTrigger();
                } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  const utt = new SpeechSynthesisUtterance(
                    input || "BOT BRO voice synthesis is ready. Ask me anything!"
                  );
                  window.speechSynthesis.speak(utt);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] text-xs font-medium text-[var(--foreground)] transition shadow-xs"
              title="Audio Voice Synthesis"
            >
              <Volume2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span>Voice</span>
            </button>

            {/* Send / Stop Generation Black Pill Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
                title="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSend}
                disabled={!input.trim() && attachments.length === 0}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold shadow-xs transition ${
                  input.trim() || attachments.length > 0
                    ? "bg-[#202020] hover:bg-black text-white dark:bg-white dark:text-[#202020] dark:hover:bg-zinc-200 cursor-pointer"
                    : "bg-[#202020]/40 text-white/70 dark:bg-white/30 dark:text-zinc-400 cursor-not-allowed"
                }`}
                title="Send message (Enter)"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
