"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Image as ImageIcon,
  GitGraph,
  Volume2,
  Video,
  Download,
  Copy,
  Check,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  Layers,
  FileCode,
} from "lucide-react";
import {
  generateSvgGraphic,
  generateMermaidDiagram,
  analyzeVideoContext,
  GeneratedGraphic,
  VideoAnalysisResult,
} from "@/lib/multimodal/multimodal-engine";

export const MultimodalStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"svg" | "mermaid" | "voice" | "video">("svg");

  // SVG State
  const [svgPrompt, setSvgPrompt] = useState("Enterprise Multi-Agent Swarm with Dynamic Hybrid Reasoning");
  const [svgType, setSvgType] = useState<"architecture" | "flowchart" | "dashboard">("architecture");
  const [svgGraphic, setSvgGraphic] = useState<GeneratedGraphic>(() =>
    generateSvgGraphic("Enterprise Multi-Agent Swarm with Dynamic Hybrid Reasoning", "architecture")
  );
  const [copiedSvg, setCopiedSvg] = useState(false);

  // Mermaid State
  const [mermaidPrompt, setMermaidPrompt] = useState("Autonomous Question Classification & Real-Time Verification Flow");
  const [mermaidGraphic, setMermaidGraphic] = useState<GeneratedGraphic>(() =>
    generateMermaidDiagram("Autonomous Question Classification & Real-Time Verification Flow")
  );
  const [copiedMermaid, setCopiedMermaid] = useState(false);

  // Voice TTS State
  const [ttsText, setTtsText] = useState(
    "Good morning. This is your NOVA AI executive intelligence briefing. Live weather in Bengaluru is 24°C with pleasant skies, USD/INR is trading near ₹86.85, and global AI infrastructure continues rapid expansion."
  );
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);

  // Video State
  const [videoUrl, setVideoUrl] = useState("https://www.youtube.com/watch?v=claude-3-7-sonnet-keynote");
  const [videoResult, setVideoResult] = useState<VideoAnalysisResult>(() =>
    analyzeVideoContext("https://www.youtube.com/watch?v=claude-3-7-sonnet-keynote")
  );
  const [isAnalyzingVideo, setIsAnalyzingVideo] = useState(false);

  // SVG Generator Action
  const handleGenerateSvg = () => {
    const res = generateSvgGraphic(svgPrompt, svgType);
    setSvgGraphic(res);
  };

  const handleCopySvg = () => {
    navigator.clipboard.writeText(svgGraphic.content);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgGraphic.content], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nova-diagram-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Mermaid Generator Action
  const handleGenerateMermaid = () => {
    const res = generateMermaidDiagram(mermaidPrompt);
    setMermaidGraphic(res);
  };

  const handleCopyMermaid = () => {
    navigator.clipboard.writeText(mermaidGraphic.content);
    setCopiedMermaid(true);
    setTimeout(() => setCopiedMermaid(false), 2000);
  };

  // Web Speech Synthesis
  const handlePlayVoice = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech synthesis is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    utterance.onstart = () => setIsPlayingVoice(true);
    utterance.onend = () => setIsPlayingVoice(false);
    utterance.onerror = () => setIsPlayingVoice(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStopVoice = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingVoice(false);
  };

  // Video Analysis Action
  const handleAnalyzeVideo = () => {
    setIsAnalyzingVideo(true);
    setTimeout(() => {
      const res = analyzeVideoContext(videoUrl);
      setVideoResult(res);
      setIsAnalyzingVideo(false);
    }, 600);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)] overflow-hidden">
      {/* Studio Header */}
      <div className="h-14 border-b border-[var(--border)] px-6 flex items-center justify-between bg-[var(--surface-subtle)]/40 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-nova-500/10 flex items-center justify-center text-nova-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--foreground)]">
              NOVA Multimodal AI Studio
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Vector SVG architecture diagrams, Mermaid flowcharts, Neural TTS & Video analysis
            </p>
          </div>
        </div>

        {/* Studio Tabs */}
        <div className="flex items-center bg-[var(--surface)] rounded-lg p-0.5 border border-[var(--border)] text-xs">
          <button
            onClick={() => setActiveTab("svg")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === "svg"
                ? "bg-nova-500 text-white font-medium shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Vector SVG</span>
          </button>
          <button
            onClick={() => setActiveTab("mermaid")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === "mermaid"
                ? "bg-nova-500 text-white font-medium shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <GitGraph className="w-3.5 h-3.5" />
            <span>Mermaid Graph</span>
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === "voice"
                ? "bg-nova-500 text-white font-medium shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Voice & Audio TTS</span>
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
              activeTab === "video"
                ? "bg-nova-500 text-white font-medium shadow-sm"
                : "text-[var(--text-muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video Context</span>
          </button>
        </div>
      </div>

      {/* Studio Workspace Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* 1. VECTOR SVG GENERATOR */}
        {activeTab === "svg" && (
          <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Control Bar */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col md:flex-row gap-3 items-center justify-between">
              <input
                type="text"
                value={svgPrompt}
                onChange={(e) => setSvgPrompt(e.target.value)}
                placeholder="Describe architectural system or diagram..."
                className="flex-1 w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none"
              />
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={svgType}
                  onChange={(e) => setSvgType(e.target.value as any)}
                  className="bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg px-2.5 py-2 text-xs text-[var(--foreground)]"
                >
                  <option value="architecture">Architecture</option>
                  <option value="flowchart">Flowchart</option>
                  <option value="dashboard">Dashboard</option>
                </select>
                <button
                  onClick={handleGenerateSvg}
                  className="px-3.5 py-2 rounded-lg bg-nova-500 hover:bg-nova-600 text-white text-xs font-semibold shadow-sm transition"
                >
                  Generate SVG
                </button>
              </div>
            </div>

            {/* SVG Visual Canvas */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-subtle flex flex-col">
              <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-subtle)]/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium text-[var(--foreground)]">
                    Vector Canvas • Resolution Scalable (100% SVG)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySvg}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition"
                  >
                    {copiedSvg ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSvg ? "Copied" : "Copy SVG"}</span>
                  </button>
                  <button
                    onClick={handleDownloadSvg}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Rendered SVG */}
              <div
                className="p-6 flex items-center justify-center min-h-[460px] bg-[var(--background)]"
                dangerouslySetInnerHTML={{ __html: svgGraphic.content }}
              />
            </div>
          </div>
        )}

        {/* 2. MERMAID GRAPH STUDIO */}
        {activeTab === "mermaid" && (
          <div className="flex flex-col gap-6 max-w-5xl mx-auto">
            {/* Control Bar */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col md:flex-row gap-3 items-center justify-between">
              <input
                type="text"
                value={mermaidPrompt}
                onChange={(e) => setMermaidPrompt(e.target.value)}
                placeholder="Describe workflow or state graph..."
                className="flex-1 w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none"
              />
              <button
                onClick={handleGenerateMermaid}
                className="px-3.5 py-2 rounded-lg bg-nova-500 hover:bg-nova-600 text-white text-xs font-semibold shadow-sm transition"
              >
                Compile Diagram
              </button>
            </div>

            {/* Mermaid Code & Flow Editor */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-subtle flex flex-col">
              <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-subtle)]/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--foreground)]">
                  Mermaid DAG Definition
                </span>
                <button
                  onClick={handleCopyMermaid}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--surface-subtle)] transition"
                >
                  {copiedMermaid ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedMermaid ? "Copied" : "Copy Code"}</span>
                </button>
              </div>

              <div className="p-4">
                <textarea
                  value={mermaidGraphic.content}
                  onChange={(e) =>
                    setMermaidGraphic({ ...mermaidGraphic, content: e.target.value })
                  }
                  rows={10}
                  className="w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg p-3 font-mono text-xs text-[var(--foreground)] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. VOICE & AUDIO TTS */}
        {activeTab === "voice" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-4 shadow-subtle">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--foreground)]">
                    Neural Audio Speech Synthesis
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Natural client-side text-to-speech engine with customizable pitch and cadence
                  </p>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Web Audio Engine Ready
                </span>
              </div>

              {/* Text Input */}
              <textarea
                value={ttsText}
                onChange={(e) => setTtsText(e.target.value)}
                rows={5}
                className="w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg p-3 text-xs text-[var(--foreground)] focus:outline-none"
              />

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-6 text-xs text-[var(--text-muted)]">
                  <div className="flex items-center gap-2">
                    <label>Speed ({speechRate}x):</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-24 accent-nova-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label>Pitch ({speechPitch}):</label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.5"
                      step="0.1"
                      value={speechPitch}
                      onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                      className="w-24 accent-nova-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isPlayingVoice ? (
                    <button
                      onClick={handleStopVoice}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Audio</span>
                    </button>
                  ) : (
                    <button
                      onClick={handlePlayVoice}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-nova-500 hover:bg-nova-600 text-white text-xs font-semibold shadow-sm transition"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play Speech</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. VIDEO CONTEXT & ANALYSIS */}
        {activeTab === "video" && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            {/* Search Bar */}
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col md:flex-row gap-3 items-center justify-between shadow-subtle">
              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Enter YouTube or video presentation URL..."
                className="flex-1 w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--foreground)] focus:outline-none font-mono"
              />
              <button
                onClick={handleAnalyzeVideo}
                disabled={isAnalyzingVideo}
                className="px-4 py-2 rounded-lg bg-nova-500 hover:bg-nova-600 text-white text-xs font-semibold shadow-sm transition shrink-0 flex items-center gap-2"
              >
                {isAnalyzingVideo ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Video className="w-3.5 h-3.5" />
                    <span>Extract Chapters</span>
                  </>
                )}
              </button>
            </div>

            {/* Video Insights Report */}
            {videoResult && (
              <div className="flex flex-col gap-4">
                <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-[var(--foreground)]">
                      {videoResult.title}
                    </h3>
                    <span className="text-xs font-mono text-[var(--text-muted)]">
                      Duration: {videoResult.durationEstimate}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {videoResult.overallSummary}
                  </p>
                </div>

                {/* Key Chapters */}
                <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-3">
                  <h4 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                    Chapter Breakdown & Timestamps
                  </h4>
                  <div className="flex flex-col gap-2.5">
                    {videoResult.keyChapters.map((chap, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] flex items-start gap-3"
                      >
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--surface)] text-nova-500 border border-[var(--border)] font-semibold shrink-0">
                          {chap.timestamp}
                        </span>
                        <div>
                          <h5 className="text-xs font-semibold text-[var(--foreground)]">
                            {chap.title}
                          </h5>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {chap.summary}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Insights */}
                <div className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] flex flex-col gap-2.5">
                  <h4 className="text-xs font-semibold text-[var(--foreground)] uppercase tracking-wider">
                    Key Actionable Insights
                  </h4>
                  <ul className="list-disc list-inside text-xs text-[var(--text-muted)] space-y-1">
                    {videoResult.actionableInsights.map((insight, idx) => (
                      <li key={idx}>{insight}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
