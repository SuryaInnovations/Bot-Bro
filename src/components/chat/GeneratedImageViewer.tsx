"use client";

import React, { useState } from "react";
import {
  Download,
  RefreshCw,
  Sparkles,
  Maximize2,
  X,
  Share2,
  Check,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { GeneratedImage } from "@/lib/images/image-types";

interface GeneratedImageViewerProps {
  image: GeneratedImage;
  onGenerateVariation?: (originalPrompt: string, style?: string, aspectRatio?: string) => void;
  onEditImage?: (image: GeneratedImage, editInstruction: string) => void;
}

export const GeneratedImageViewer: React.FC<GeneratedImageViewerProps> = ({
  image,
  onGenerateVariation,
  onEditImage,
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [showEditInput, setShowEditInput] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.origin + image.url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleVariationClick = () => {
    if (onGenerateVariation) {
      setIsRegenerating(true);
      onGenerateVariation(image.prompt, image.style, image.aspectRatio);
      setTimeout(() => setIsRegenerating(false), 2500);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editPrompt.trim() && onEditImage) {
      onEditImage(image, editPrompt.trim());
      setEditPrompt("");
      setShowEditInput(false);
    }
  };

  const aspectClass =
    image.aspectRatio === "16:9"
      ? "aspect-video"
      : image.aspectRatio === "9:16"
      ? "aspect-[9/16] max-w-xs"
      : image.aspectRatio === "4:3"
      ? "aspect-[4/3]"
      : image.aspectRatio === "3:4"
      ? "aspect-[3/4] max-w-xs"
      : "aspect-square max-w-md";

  return (
    <div className="my-3 space-y-2.5 max-w-xl animate-fadeIn">
      {/* Image Container Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-subtle group relative">
        {/* Top Meta Bar */}
        <div className="px-3.5 py-2 border-b border-[var(--border)] bg-[var(--surface-subtle)] flex items-center justify-between text-xs text-[var(--text-muted)] select-none">
          <div className="flex items-center gap-2 truncate pr-2">
            <Sparkles className="w-3.5 h-3.5 text-nova-500 shrink-0" />
            <span className="font-semibold text-[var(--foreground)] truncate capitalize">
              {image.style.replace("-", " ")}
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/5 border border-[var(--border)]">
              {image.aspectRatio}
            </span>
          </div>

          <span className="text-[10px] font-mono opacity-70 shrink-0">
            {image.provider.includes("Pollinations") ? "Flux / SDXL" : image.provider}
          </span>
        </div>

        {/* Main Image Display */}
        <div
          onClick={() => setIsZoomed(true)}
          className={`relative w-full ${aspectClass} bg-black/5 dark:bg-black/40 overflow-hidden cursor-zoom-in flex items-center justify-center`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.prompt}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />

          {/* Hover Zoom Button Overlay */}
          <div className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>

        {/* Prompt Caption */}
        <div className="p-3 bg-[var(--surface)] border-t border-[var(--border)]">
          <p className="text-xs text-[var(--foreground)] leading-relaxed italic line-clamp-2">
            "{image.prompt}"
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="p-2.5 bg-[var(--surface-subtle)]/60 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            {/* Download Button */}
            <a
              href={image.downloadUrl || `${image.url}?download=true`}
              download
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--foreground)] font-medium transition shadow-xs"
              title="Download full resolution image"
            >
              <Download className="w-3.5 h-3.5 text-emerald-500" />
              <span>Download</span>
            </a>

            {/* Generate Variation Button */}
            <button
              onClick={handleVariationClick}
              disabled={isRegenerating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--foreground)] font-medium transition shadow-xs disabled:opacity-50"
              title="Generate another variation with a new seed"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-indigo-500 ${isRegenerating ? "animate-spin" : ""}`} />
              <span>{isRegenerating ? "Generating..." : "Variation"}</span>
            </button>

            {/* Edit / Variations Toggle */}
            <button
              onClick={() => setShowEditInput(!showEditInput)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface)] hover:bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--foreground)] font-medium transition shadow-xs"
              title="Request modifications or style edits"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500" />
              <span>Modify</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Copy Direct Link */}
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-black/5 dark:hover:bg-white/5 transition"
              title="Copy image link"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Inline Edit Form */}
        {showEditInput && (
          <form
            onSubmit={handleEditSubmit}
            className="p-2.5 bg-[var(--surface)] border-t border-[var(--border)] flex items-center gap-2 text-xs animate-fadeIn"
          >
            <input
              type="text"
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              placeholder="e.g. Change background to starry night, add neon sunglasses..."
              className="flex-1 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl px-3 py-1.5 text-xs text-[var(--foreground)] focus:outline-none focus:border-zinc-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={!editPrompt.trim()}
              className="px-3 py-1.5 rounded-xl bg-nova-500 text-white font-medium text-xs disabled:opacity-30"
            >
              Apply Edit
            </button>
          </form>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isZoomed && (
        <div
          onClick={() => setIsZoomed(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fadeIn"
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.url}
              alt={image.prompt}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={image.downloadUrl}
                download
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-zinc-900 font-semibold text-xs shadow-lg hover:bg-zinc-100 transition"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res</span>
              </a>
              <span className="text-xs text-zinc-300 font-mono">
                {image.dimensions.width} × {image.dimensions.height} px
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
