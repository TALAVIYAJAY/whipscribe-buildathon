"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  MoreVertical,
  Share2,
  Download,
  Edit2,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  X,
  Check,
  Sparkles,
  Clock,
  Users,
  Volume2,
  Copy,
  ExternalLink,
  MessageSquare,
  FileText,
  Lightbulb,
  FolderDown,
  CheckCircle2,
  Send,
  Sliders,
  Type,
  CheckSquare
} from "lucide-react";

// The real transcript data matching user's recording
const TRANSCRIPT_DATA = [
  {
    id: 1,
    speaker: "Sarah Jenkins",
    role: "Product Lead",
    color: "bg-indigo-600 text-white",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    time: "0:00",
    seconds: 0,
    text: "Good morning everyone. Let's do a quick sync on our Sprint deliverables."
  },
  {
    id: 2,
    speaker: "Sarah Jenkins",
    role: "Product Lead",
    color: "bg-indigo-600 text-white",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    time: "0:05",
    seconds: 5,
    text: "Alex, what is the status of our WhipScribe transcription pipeline and speaker diarization?"
  },
  {
    id: 3,
    speaker: "Alex Rivera",
    role: "Backend Lead",
    color: "bg-emerald-600 text-white",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    time: "0:11",
    seconds: 11,
    text: "Morning Sarah. The pipeline is running smoothly. We completed the REST integration with WhipScribe."
  },
  {
    id: 4,
    speaker: "Alex Rivera",
    role: "Backend Lead",
    color: "bg-emerald-600 text-white",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    time: "0:19",
    seconds: 19,
    text: "It handles speaker diarization and word timestamps with high accuracy."
  },
  {
    id: 5,
    speaker: "Alex Rivera",
    role: "Backend Lead",
    color: "bg-emerald-600 text-white",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    time: "0:24",
    seconds: 24,
    text: "I also finished the automated Airtable synchronization."
  },
  {
    id: 6,
    speaker: "Sarah Jenkins",
    role: "Product Lead",
    color: "bg-indigo-600 text-white",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    time: "0:28",
    seconds: 28,
    text: "That is great progress. When will the staging build be ready for product review?"
  },
  {
    id: 7,
    speaker: "Alex Rivera",
    role: "Backend Lead",
    color: "bg-emerald-600 text-white",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    time: "0:36",
    seconds: 36,
    text: "It is deploying on Vercel now. Marcus and Priya can test on mobile by 2 PM."
  },
  {
    id: 8,
    speaker: "Marcus Vance",
    role: "QA Engineer",
    color: "bg-amber-600 text-white",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    time: "0:44",
    seconds: 44,
    text: "I will run the audio playback and subtitle export testing on iPhone SE."
  }
];

export default function MobileReaderPage() {
  // Device simulator state (for desktop testing)
  const [deviceWidth, setDeviceWidth] = useState<"320" | "375" | "390" | "full">("375");

  // Active section tabs: "transcript" | "intelligence" | "chat" | "resources"
  const [activeTab, setActiveTab] = useState<"transcript" | "intelligence" | "chat" | "resources">("transcript");

  // State toggles
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionsSheetOpen, setActionsSheetOpen] = useState(false);
  const [settingsSheetOpen, setSettingsSheetOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(11); // seconds
  const [speed, setSpeed] = useState<"1x" | "1.25x" | "1.5x">("1x");

  // Reading preferences
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [showTimestamps, setShowTimestamps] = useState(true);

  // Chat tab state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: "user" | "ai"; text: string; time?: string }>>([
    {
      sender: "ai",
      text: "Hi! I've analyzed this standup recording. Ask me about deliverables, timelines, or speaker commitments."
    }
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = (textToSend?: string) => {
    const q = textToSend || chatInput;
    if (!q.trim()) return;

    const newMsgs = [...chatMessages, { sender: "user" as const, text: q }];
    setChatMessages(newMsgs);
    if (!textToSend) setChatInput("");

    // Generate smart context-aware answer
    setTimeout(() => {
      let reply = "Based on the recording, the team completed the WhipScribe REST pipeline and Airtable sync.";
      const lower = q.toLowerCase();
      if (lower.includes("alex") || lower.includes("commit") || lower.includes("status")) {
        reply = "Alex Rivera reported that the WhipScribe REST pipeline & speaker diarization are complete. He also finished automated Airtable sync and committed to a 2 PM staging deployment [0:24-0:36].";
      } else if (lower.includes("marcus") || lower.includes("qa") || lower.includes("iphone")) {
        reply = "Marcus Vance will run audio playback and export testing on iPhone SE once the staging build deploys [0:44].";
      } else if (lower.includes("deliverable") || lower.includes("sprint")) {
        reply = "Sprint deliverables include: 1) WhipScribe REST integration, 2) Airtable auto-sync, 3) Vercel staging deployment by 2 PM.";
      }

      setChatMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 400);
  };

  // Filter transcript
  const filteredTranscript = searchQuery
    ? TRANSCRIPT_DATA.filter(
        (t) =>
          t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.speaker.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : TRANSCRIPT_DATA;

  // Scroll container ref to smoothly reset scroll position on tab switch
  const contentContainerRef = useRef<HTMLDivElement>(null);

  const handleTabChange = (tab: "transcript" | "intelligence" | "chat" | "resources") => {
    setActiveTab(tab);
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0;
    }
  };

  // Audio progress percentage (53s total)
  const totalSeconds = 53;
  const progressPercent = Math.min(100, Math.round((currentTime / totalSeconds) * 100));

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center select-none sm:select-auto">
      {/* Top Reviewer Bar */}
      <div className="w-full bg-slate-800 border-b border-slate-700 px-3 sm:px-4 py-2 sticky top-0 z-50 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 shrink-0">
            <Link
              href="/"
              className="inline-flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 font-medium whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-white tracking-wide flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="sm:hidden">Challenge 01 Pass</span>
              <span className="hidden sm:inline">Challenge 01: Complete Mobile Reader</span>
            </span>
          </div>

          {/* Device resolution switcher (Desktop only) */}
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-slate-400">Device width:</span>
            <div className="inline-flex bg-slate-900 rounded-lg p-0.5 border border-slate-700">
              <button
                onClick={() => setDeviceWidth("320")}
                className={`px-2.5 py-1 rounded font-mono text-[11px] transition-all ${
                  deviceWidth === "320"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                320px
              </button>
              <button
                onClick={() => setDeviceWidth("375")}
                className={`px-2.5 py-1 rounded font-mono text-[11px] transition-all ${
                  deviceWidth === "375"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                375px (iPhone)
              </button>
              <button
                onClick={() => setDeviceWidth("390")}
                className={`px-2.5 py-1 rounded font-mono text-[11px] transition-all ${
                  deviceWidth === "390"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                390px
              </button>
              <button
                onClick={() => setDeviceWidth("full")}
                className={`px-2.5 py-1 rounded font-mono text-[11px] transition-all ${
                  deviceWidth === "full"
                    ? "bg-indigo-600 text-white font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Full
              </button>
            </div>
          </div>

          {/* Quick State Toggle */}
          <button
            onClick={() => setIsProcessing(!isProcessing)}
            className={`px-2 py-1 rounded text-[11px] font-medium border transition-colors shrink-0 whitespace-nowrap ${
              isProcessing
                ? "bg-amber-500/30 text-amber-300 border-amber-500/50"
                : "bg-slate-700/50 text-slate-400 border-slate-600 hover:text-white"
            }`}
          >
            {isProcessing ? "Processing [ON]" : "Preview: Processing"}
          </button>
        </div>
      </div>

      {/* Metric comparison banner (hidden on tiny screens) */}
      <div className="hidden sm:flex w-full max-w-xl px-4 py-2 mt-2 items-center justify-between text-xs bg-slate-800/80 border border-slate-700 rounded-lg">
        <div className="flex items-center gap-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>
            Screen Chrome: <strong className="text-emerald-400">18%</strong> (~120px)
          </span>
        </div>
        <span className="text-slate-400 text-[11px]">
          WhipScribe Original: <strong className="text-rose-400 line-through">41%</strong> (-23% bloat removed)
        </span>
      </div>

      {/* Main Mobile Frame: Full-bleed native view on mobile, phone frame simulator on desktop */}
      <div className="w-full flex justify-center items-center flex-1 md:py-4">
        <div
          style={{
            maxWidth:
              deviceWidth === "full"
                ? "100%"
                : deviceWidth === "320"
                ? "320px"
                : deviceWidth === "375"
                ? "375px"
                : "390px",
            height: deviceWidth === "full" ? "100%" : "667px"
          }}
          className="relative bg-white text-slate-900 w-full min-h-[calc(100vh-42px)] md:min-h-0 md:rounded-3xl md:shadow-2xl overflow-hidden md:border-4 md:border-slate-700 flex flex-col transition-all duration-300"
        >
          {/* 1. SLIM 1-ROW UNIFIED HEADER (48px) - PERMANENTLY PINNED */}
          <header className="h-12 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 flex items-center justify-between shrink-0 z-30">
            <div className="flex items-center space-x-2 min-w-0 flex-1 mr-2">
              <Link
                href="/"
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-slate-600 shrink-0"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <div className="min-w-0 flex-1">
                <h1 className="text-xs font-bold text-slate-900 truncate tracking-tight">
                  Standup Meeting Sprint Update
                </h1>
                <p className="text-[10px] text-slate-500 font-mono truncate">
                  0m 53s · EN · Saved
                </p>
              </div>
            </div>

            {/* Quick Header Icons */}
            <div className="flex items-center space-x-0.5 shrink-0">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  searchOpen ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100"
                }`}
                title="Search transcript"
              >
                <Search className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100"
                title="Copy share link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => setActionsSheetOpen(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-100"
                title="Recording actions"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          {/* Search Bar (slides down when 🔍 tapped) */}
          {searchOpen && (
            <div className="bg-slate-50 border-b border-slate-200 px-3 py-1.5 flex items-center gap-2 shrink-0 animate-in slide-in-from-top-1 duration-150">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search in transcript..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setSearchQuery("");
                }}
                className="text-xs text-indigo-600 font-semibold px-1"
              >
                Done
              </button>
            </div>
          )}

          {/* 2. THE 4 SEGMENTED FUNCTIONAL TABS (Permanently Pinned, Full word "Resources", zero clipping!) */}
          <div className="bg-white border-b border-slate-200 px-2 py-1.5 shrink-0 z-20">
            <div className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 rounded-xl text-center">
              <button
                onClick={() => handleTabChange("transcript")}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "transcript"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Transcript
              </button>
              <button
                onClick={() => handleTabChange("intelligence")}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "intelligence"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Intelligence
              </button>
              <button
                onClick={() => handleTabChange("chat")}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "chat"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => handleTabChange("resources")}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "resources"
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Resources
              </button>
            </div>
          </div>

          {/* 3. DYNAMIC CONTENT AREA - Smooth independent scrolling with padding */}
          <div
            ref={contentContainerRef}
            className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3 pb-24 select-text"
          >
            {/* STATE: PROCESSING SCREEN */}
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-10 px-4 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Transcribing Audio...</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Analyzing speech &amp; detecting speaker turns (~40s remaining)
                  </p>
                </div>
                <div className="w-full max-w-xs space-y-1.5">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div className="bg-amber-500 h-full rounded-full w-2/3 animate-pulse" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>68% completed</span>
                    <span>WhipScribe API v1</span>
                  </div>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left w-full max-w-xs">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <Volume2 className="w-4 h-4 text-emerald-600" />
                    <span>Listen While It Works</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                    Audio stream is ready. You can play and seek through the recording immediately while diarization completes.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* TAB 1: TRANSCRIPT */}
                {activeTab === "transcript" && (
                  <div className="space-y-2.5">
                    {filteredTranscript.map((turn) => {
                      const isSelected = selectedLine === turn.id;
                      const isCurrentlyPlaying = currentTime >= turn.seconds && currentTime < turn.seconds + 7;

                      return (
                        <div
                          key={turn.id}
                          onClick={() => setSelectedLine(isSelected ? null : turn.id)}
                          className={`rounded-xl p-2.5 transition-all cursor-pointer ${
                            isCurrentlyPlaying
                              ? "bg-emerald-50/70 border border-emerald-300 shadow-sm"
                              : isSelected
                              ? "bg-indigo-50/70 border border-indigo-200"
                              : "hover:bg-slate-50 border border-transparent"
                          }`}
                        >
                          {/* Speaker Tag + Timestamp */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center space-x-1.5 min-w-0">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${turn.color} shrink-0`}
                              >
                                {turn.speaker.charAt(0)}
                              </div>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                {turn.speaker}
                              </span>
                              <span
                                className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full border ${turn.badge}`}
                              >
                                {turn.role}
                              </span>
                            </div>

                            {showTimestamps && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentTime(turn.seconds);
                                  setIsPlaying(true);
                                }}
                                className="font-mono text-[10px] text-slate-400 hover:text-indigo-600 px-1 py-0.5 rounded hover:bg-white flex items-center gap-0.5 shrink-0"
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>{turn.time}</span>
                              </button>
                            )}
                          </div>

                          {/* Speech body */}
                          <p
                            className={`text-slate-700 leading-relaxed ${
                              fontSize === "sm"
                                ? "text-[12px]"
                                : fontSize === "lg"
                                ? "text-[15px]"
                                : "text-[13px]"
                            }`}
                          >
                            {turn.text}
                          </p>

                          {/* Contextual quick menu on tap */}
                          {isSelected && (
                            <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-indigo-700">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentTime(turn.seconds);
                                  setIsPlaying(true);
                                }}
                                className="flex items-center space-x-1 font-semibold hover:underline"
                              >
                                <Play className="w-3 h-3 fill-current" />
                                <span>Play here</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(`"${turn.text}" — ${turn.speaker} [${turn.time}]`);
                                  setSelectedLine(null);
                                }}
                                className="flex items-center space-x-1 font-semibold hover:underline"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy Quote</span>
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {filteredTranscript.length === 0 && (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        No matches found for &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: INTELLIGENCE */}
                {activeTab === "intelligence" && (
                  <div className="space-y-4">
                    {/* Executive Summary */}
                    <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span>Executive Briefing</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        The engineering team completed the end-to-end WhipScribe REST integration with high-accuracy speaker diarization and automated Airtable syncing. A staging build is deploying on Vercel for 2 PM mobile validation.
                      </p>
                    </div>

                    {/* Action Items */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Action Items &amp; Commitments</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">3 identified</span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-start space-x-2 text-xs">
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-800">
                              WhipScribe REST API &amp; Airtable Sync
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="font-semibold text-emerald-700">Alex Rivera</span> · 
                              <span className="font-mono text-slate-400">[0:24]</span> · 
                              <span className="text-emerald-600 font-bold">Completed</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-start space-x-2 text-xs">
                          <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-800">
                              Deploy Vercel staging build by 2 PM
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="font-semibold text-amber-700">Alex Rivera</span> · 
                              <span className="font-mono text-slate-400">[0:36]</span> · 
                              <span className="text-amber-600 font-bold">In Progress</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-start space-x-2 text-xs">
                          <Clock className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-slate-800">
                              Run mobile QA on iPhone SE &amp; subtitle exports
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span className="font-semibold text-indigo-700">Marcus Vance</span> · 
                              <span className="font-mono text-slate-400">[0:44]</span> · 
                              <span className="text-indigo-600 font-bold">Scheduled</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Chapters */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        <Clock className="w-4 h-4 text-slate-600" />
                        <span>Timeline Chapters</span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <button
                          onClick={() => {
                            setCurrentTime(0);
                            setIsPlaying(true);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-left"
                        >
                          <span className="font-medium text-slate-800">0:00 — Sprint Overview &amp; Check-in</span>
                          <span className="text-[10px] font-mono text-slate-400">0:00</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentTime(11);
                            setIsPlaying(true);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-left"
                        >
                          <span className="font-medium text-slate-800">0:11 — WhipScribe REST Pipeline</span>
                          <span className="text-[10px] font-mono text-slate-400">0:11</span>
                        </button>
                        <button
                          onClick={() => {
                            setCurrentTime(36);
                            setIsPlaying(true);
                          }}
                          className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-100 text-left"
                        >
                          <span className="font-medium text-slate-800">0:36 — Vercel Staging &amp; Mobile QA</span>
                          <span className="text-[10px] font-mono text-slate-400">0:36</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: CHAT ("Ask this recording") */}
                {activeTab === "chat" && (
                  <div className="flex flex-col h-full space-y-3">
                    {/* Starter Prompt Chips */}
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      <button
                        onClick={() => handleSendChat("What are the key action items?")}
                        className="text-[11px] bg-indigo-50 border border-indigo-200 text-indigo-700 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors"
                      >
                        ⚡ Action items?
                      </button>
                      <button
                        onClick={() => handleSendChat("What did Alex commit to?")}
                        className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full hover:bg-slate-200 transition-colors"
                      >
                        👤 Alex&apos;s commitments?
                      </button>
                      <button
                        onClick={() => handleSendChat("When is the deployment ready?")}
                        className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-full hover:bg-slate-200 transition-colors"
                      >
                        🚀 Deployment time?
                      </button>
                    </div>

                    {/* Messages list */}
                    <div className="space-y-2.5 flex-1 overflow-y-auto">
                      {chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                              msg.sender === "user"
                                ? "bg-indigo-600 text-white rounded-br-none"
                                : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none shadow-sm"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message input */}
                    <div className="pt-2 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="Ask anything about this recording..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSendChat();
                        }}
                        className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => handleSendChat()}
                        className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: RESOURCES & EXPORTS */}
                {activeTab === "resources" && (
                  <div className="space-y-3.5">
                    {/* Audio file details */}
                    <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">Audio Source</span>
                        <span className="font-mono text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-1.5 py-0.5 rounded">
                          Verified Mono 44.1kHz
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 font-mono space-y-0.5">
                        <div>File: standup_sprint_update.mp3</div>
                        <div>Duration: 0m 53s · Size: 1.24 MB</div>
                      </div>
                    </div>

                    {/* Direct 1-tap download cards */}
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-900">Export &amp; Subtitles</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          onClick={() => alert("Downloading .SRT Subtitles with timecodes")}
                          className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 text-left transition-all shadow-sm"
                        >
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <Download className="w-3.5 h-3.5 text-indigo-600" />
                            <span>.SRT Subtitle</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">Video captions format</div>
                        </button>

                        <button
                          onClick={() => alert("Downloading .VTT Web Subtitles")}
                          className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 text-left transition-all shadow-sm"
                        >
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <Download className="w-3.5 h-3.5 text-emerald-600" />
                            <span>.VTT Web</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">HTML5 video track</div>
                        </button>

                        <button
                          onClick={() => alert("Downloading Plain Text with timestamps")}
                          className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 text-left transition-all shadow-sm"
                        >
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-amber-600" />
                            <span>Text (.TXT)</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">With speaker tags</div>
                        </button>

                        <button
                          onClick={() => alert("Exporting to Google Drive (.txt + .srt)")}
                          className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/50 text-left transition-all shadow-sm"
                        >
                          <div className="font-bold text-slate-900 flex items-center gap-1">
                            <FolderDown className="w-3.5 h-3.5 text-blue-600" />
                            <span>Google Drive</span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">1-click cloud sync</div>
                        </button>
                      </div>
                    </div>

                    {/* Developer JSON payload */}
                    <div className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">Developer API JSON</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(TRANSCRIPT_DATA, null, 2));
                            alert("Copied full JSON payload to clipboard!");
                          }}
                          className="text-[10px] text-indigo-600 hover:underline font-semibold"
                        >
                          Copy JSON
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Raw Whisper output with word offsets, speaker IDs, and confidence ratios.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* 4. SMART DOCKING FLOATING AUDIO PLAYER (52px normal, 32px mini-dock during search) */}
          <div
            className={`border-t border-slate-200 bg-white/95 backdrop-blur-md px-3 flex items-center justify-between shrink-0 shadow-lg z-20 transition-all duration-200 ${
              searchOpen ? "h-8 py-0.5" : "h-13 py-1.5"
            }`}
          >
            {searchOpen ? (
              /* Mini-Dock Player Mode (keeps 240px+ available for keyboard!) */
              <div className="w-full flex items-center justify-between text-xs">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex items-center space-x-1.5 font-medium text-slate-700 hover:text-indigo-600"
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current text-indigo-600" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current text-indigo-600" />
                  )}
                  <span className="font-mono text-[11px]">
                    0:{currentTime < 10 ? `0${currentTime}` : currentTime} / 0:53
                  </span>
                </button>
                <span className="text-[10px] text-slate-400 font-mono">Player Docked</span>
              </div>
            ) : (
              /* Full Scrubbing Audio Player */
              <div className="w-full flex items-center gap-2.5">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors shrink-0 shadow-sm"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Interactive scrubber */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>0:{currentTime < 10 ? `0${currentTime}` : currentTime}</span>
                    <span>0:53</span>
                  </div>
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const pct = Math.max(0, Math.min(1, clickX / rect.width));
                      setCurrentTime(Math.round(pct * totalSeconds));
                    }}
                    className="w-full bg-slate-200 rounded-full h-1.5 cursor-pointer relative overflow-hidden"
                  >
                    <div
                      style={{ width: `${progressPercent}%` }}
                      className="bg-indigo-600 h-full rounded-full transition-all duration-100"
                    />
                  </div>
                </div>

                {/* Rewind / Fast Forward 5s & Speed */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => setCurrentTime((t) => Math.max(0, t - 5))}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 text-[10px] font-mono"
                    title="Rewind 5s"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setCurrentTime((t) => Math.min(totalSeconds, t + 5))}
                    className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100 text-[10px] font-mono"
                    title="Forward 5s"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => {
                      const next = speed === "1x" ? "1.25x" : speed === "1.25x" ? "1.5x" : "1x";
                      setSpeed(next);
                    }}
                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                  >
                    {speed}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. CLEAN 4-ITEM ACTIONS BOTTOM SHEET (Replaces the 11-item mess!) */}
          {actionsSheetOpen && (
            <div
              onClick={() => setActionsSheetOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex flex-col justify-end animate-in fade-in duration-150"
            >
              <div
                className="bg-white rounded-t-2xl p-4 shadow-2xl space-y-2 border-t border-slate-200 animate-in slide-in-from-bottom duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 tracking-tight">
                    Recording Actions
                  </span>
                  <button
                    onClick={() => setActionsSheetOpen(false)}
                    className="text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* 1. Share */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setActionsSheetOpen(false);
                    alert("Public link copied to clipboard!");
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-medium text-left"
                >
                  <Share2 className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Copy Share Link</div>
                    <div className="text-[10px] text-slate-500">Public web link to transcript</div>
                  </div>
                </button>

                {/* 2. Export */}
                <button
                  onClick={() => {
                    setActionsSheetOpen(false);
                    setActiveTab("resources");
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-medium text-left"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Export &amp; Subtitles</div>
                    <div className="text-[10px] text-slate-500">.SRT, .VTT, TXT, DOCX, Drive</div>
                  </div>
                </button>

                {/* 3. Rename */}
                <button
                  onClick={() => {
                    setActionsSheetOpen(false);
                    alert("Renaming recording modal");
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-medium text-left"
                >
                  <Edit2 className="w-4 h-4 text-slate-600" />
                  <div>
                    <div className="font-semibold text-slate-900">Rename Recording</div>
                    <div className="text-[10px] text-slate-500">Change title and metadata</div>
                  </div>
                </button>

                {/* 4. Delete */}
                <button
                  onClick={() => {
                    setActionsSheetOpen(false);
                    alert("Delete confirmation modal");
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-medium text-left"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-semibold text-rose-700">Delete Recording</div>
                    <div className="text-[10px] text-rose-500">Remove from library permanently</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
