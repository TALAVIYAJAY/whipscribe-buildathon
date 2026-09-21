"use client";

import React, { useState, useMemo } from "react";
import {
  FileText,
  CheckCircle2,
  HelpCircle,
  Clock,
  MessageSquare,
  Copy,
  Check,
  Search,
  Sparkles,
  Lightbulb,
  AlertCircle,
  Tag,
  ListTodo,
} from "lucide-react";
import { ExtractedIntelligence, HighlightMoment } from "@/lib/intelligence";
import { WhipScribeTranscriptResult } from "@/lib/whipscribe";

interface IntelligenceViewProps {
  intelligence: ExtractedIntelligence;
  transcript: WhipScribeTranscriptResult;
}

export const IntelligenceView: React.FC<IntelligenceViewProps> = ({
  intelligence,
  transcript,
}) => {
  // Clean 2-Tab Navigation: Executive Intelligence Brief vs. Full Diarized Transcript
  const [activeTab, setActiveTab] = useState<"brief" | "transcript">("brief");
  const [copied, setCopied] = useState(false);
  const [copiedSegmentIdx, setCopiedSegmentIdx] = useState<number | null>(null);

  // Transcript tab search & filter controls
  const [transcriptSearch, setTranscriptSearch] = useState("");
  const [selectedSpeaker, setSelectedSpeaker] = useState("all");

  const copyToClipboard = () => {
    const textToCopy = `TITLE: ${intelligence.title}\n\nEXECUTIVE SUMMARY:\n${intelligence.overview || ""}\n\nSUMMARY & TOPIC BREAKDOWN:\n${intelligence.airtablePayload.summaryText}\n\nACTION ITEMS & DECISIONS:\n${intelligence.airtablePayload.actionItemsText}\n\nKEY TIMESTAMPS & AUDIO EVIDENCE:\n${intelligence.airtablePayload.timestampsText}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copySegment = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedSegmentIdx(idx);
    setTimeout(() => setCopiedSegmentIdx(null), 1500);
  };

  // Distinct speakers list
  const uniqueSpeakers = useMemo(() => {
    const speakers = new Set<string>();
    (transcript.segments || []).forEach((s) => {
      if (s.speaker) speakers.add(s.speaker);
    });
    return Array.from(speakers);
  }, [transcript.segments]);

  // Filtered transcript turns
  const filteredSegments = useMemo(() => {
    return (transcript.segments || []).filter((seg) => {
      const speaker = seg.speaker || "Speaker";
      const matchesSpeaker = selectedSpeaker === "all" || speaker === selectedSpeaker;
      const matchesSearch =
        !transcriptSearch.trim() ||
        seg.text.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
        speaker.toLowerCase().includes(transcriptSearch.toLowerCase());
      return matchesSpeaker && matchesSearch;
    });
  }, [transcript.segments, selectedSpeaker, transcriptSearch]);

  // Distinct pastel speaker badge styles
  const getSpeakerColor = (speaker: string) => {
    const colors = [
      "bg-indigo-50 text-indigo-700 border-indigo-200",
      "bg-emerald-50 text-emerald-700 border-emerald-200",
      "bg-purple-50 text-purple-700 border-purple-200",
      "bg-amber-50 text-amber-700 border-amber-200",
      "bg-cyan-50 text-cyan-700 border-cyan-200",
      "bg-rose-50 text-rose-700 border-rose-200",
    ];
    let hash = 0;
    for (let i = 0; i < speaker.length; i++) {
      hash = speaker.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % colors.length;
    return colors[idx];
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-whip-100 shadow-xl overflow-hidden mb-8">
      {/* Header Bar */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-whip-50/60 via-purple-50/20 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-whip-100 text-whip-800 border border-whip-200 uppercase tracking-wide">
              Intelligence Briefing
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Gemini + WhipScribe
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-950 mt-2 tracking-tight">
            {intelligence.title}
          </h2>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
            <span>
              <strong>Diarization:</strong> {transcript.segments?.length || 0} speaker turns
            </span>
            <span>•</span>
            <span>
              <strong>Speakers:</strong> {uniqueSpeakers.length > 0 ? uniqueSpeakers.join(", ") : "Single Speaker"}
            </span>
            <span>•</span>
            <span>
              <strong>Decisions:</strong> {intelligence.keyDecisions?.length || 0} confirmed
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={copyToClipboard}
          className="self-start md:self-auto inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 text-xs font-semibold shadow-xs transition-all shrink-0"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-500" />}
          <span>{copied ? "Copied All Briefing" : "Copy Complete Briefing"}</span>
        </button>
      </div>

      {/* Streamlined 2-Tab Navigation */}
      <div className="flex border-b border-gray-100 px-6 gap-8 bg-slate-50/50">
        <button
          type="button"
          onClick={() => setActiveTab("brief")}
          className={`flex items-center space-x-2.5 py-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === "brief"
              ? "border-whip-700 text-whip-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-whip-700" />
          <span>Executive Intelligence Brief</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-whip-100 text-whip-800 border border-whip-200 hidden sm:inline">
            Unified View
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("transcript")}
          className={`flex items-center space-x-2.5 py-4 text-xs font-bold border-b-2 transition-all ${
            activeTab === "transcript"
              ? "border-whip-700 text-whip-800"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <MessageSquare className="w-4 h-4 text-purple-600" />
          <span>Full Diarized Transcript</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 hidden sm:inline">
            {transcript.segments?.length || 0} turns
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* ======================================================== */}
        {/* TAB 1: UNIFIED EXECUTIVE INTELLIGENCE BRIEF               */}
        {/* ======================================================== */}
        {activeTab === "brief" && (
          <div className="space-y-8">
            {/* 1. EXECUTIVE SUMMARY */}
            {intelligence.overview && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-whip-50/90 via-indigo-50/40 to-white border border-whip-200 shadow-xs">
                <div className="flex items-center space-x-2 text-whip-900 mb-2.5">
                  <Sparkles className="w-4 h-4 text-whip-700" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Executive Summary
                  </h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-whip-200/70 text-whip-900">
                    Overview
                  </span>
                </div>
                <p className="text-sm sm:text-base text-gray-900 leading-relaxed font-normal">
                  {intelligence.overview}
                </p>

                {/* Quick 3 Takeaway Cards */}
                {intelligence.quickTakeaways && intelligence.quickTakeaways.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-whip-200/60 grid grid-cols-1 md:grid-cols-3 gap-3">
                    {intelligence.quickTakeaways.map((takeaway, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white/80 border border-whip-100 shadow-2xs flex items-start space-x-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-whip-100 text-whip-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-gray-800 leading-normal font-medium">
                          {takeaway}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. DECISIONS & ACTION ITEMS */}
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-gray-400" />
                  <span>Decisions & Action Items</span>
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">
                  Outcomes
                </span>
              </div>

              {/* Key Decisions Reached (Green Card) */}
              {intelligence.keyDecisions && intelligence.keyDecisions.length > 0 && (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white border border-emerald-200 shadow-xs">
                  <div className="flex items-center space-x-2 text-emerald-900 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Key Decisions ({intelligence.keyDecisions.length})
                    </h4>
                  </div>

                  <div className="space-y-2.5">
                    {intelligence.keyDecisions.map((dec, idx) => {
                      const cleanDec = dec
                        .replace(/^\[(UNRESOLVED\s*\/?\s*RISK|UNRESOLVED|RISK|DECISION|DIRECTION|AGREEMENT|ACTION|TASK)\]\s*/gi, "")
                        .replace(/\[Owner:\s*(Unassigned|Unknown|None)\]\s*/gi, "")
                        .replace(/\[Unassigned\]\s*/gi, "")
                        .replace(/^Unassigned:\s*/gi, "")
                        .replace(/\s*-\s*Unassigned$/gi, "")
                        .trim();

                      return (
                        <div
                          key={idx}
                          className="flex items-start space-x-3 p-3.5 rounded-xl bg-white/90 border border-emerald-100 shadow-2xs"
                        >
                          <span className="text-emerald-700 font-bold mt-0.5">✓</span>
                          <p className="text-sm text-gray-900 font-medium leading-relaxed">
                            {cleanDec}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Items */}
              <div className="space-y-2.5">
                {intelligence.actionItems.map((action, idx) => {
                  const cleanAction = action
                    .replace(/^\[(UNRESOLVED\s*\/?\s*RISK|UNRESOLVED|RISK|DECISION|DIRECTION|AGREEMENT|ACTION|TASK)\]\s*/gi, "")
                    .replace(/\[(HIGH|MEDIUM|LOW)\s*PRIORITY\]\s*/gi, "")
                    .replace(/\[Owner:\s*(Unassigned|Unknown|None)\]\s*/gi, "")
                    .replace(/\[Unassigned\]\s*/gi, "")
                    .replace(/^Unassigned:\s*/gi, "")
                    .replace(/\s*-\s*Unassigned$/gi, "")
                    .trim();

                  return (
                    <div
                      key={idx}
                      className="flex items-start space-x-3 p-3.5 rounded-xl bg-white border border-gray-200/80 hover:border-gray-300 shadow-2xs transition-all"
                    >
                      <div className="w-4 h-4 rounded-md border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="w-2.5 h-2.5 text-emerald-700 stroke-[3]" />
                      </div>

                      <div className="flex-1 text-sm text-gray-800 leading-relaxed font-normal">
                        {cleanAction}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Key Questions & Considerations (Amber Card) */}
              {intelligence.openQuestions && intelligence.openQuestions.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 shadow-xs">
                  <div className="flex items-center space-x-2 text-amber-900 mb-2.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Key Questions & Considerations ({intelligence.openQuestions.length})
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {intelligence.openQuestions.map((q, idx) => {
                      const cleanQ = q
                        .replace(/^\[(UNRESOLVED\s*\/?\s*RISK|UNRESOLVED|RISK|DECISION|DIRECTION|AGREEMENT|ACTION|TASK)\]\s*/gi, "")
                        .replace(/\[Owner:\s*(Unassigned|Unknown|None)\]\s*/gi, "")
                        .replace(/\[Unassigned\]\s*/gi, "")
                        .replace(/^Unassigned:\s*/gi, "")
                        .replace(/\s*-\s*Unassigned$/gi, "")
                        .trim();

                      return (
                        <div
                          key={idx}
                          className="flex items-start space-x-2.5 p-3 rounded-lg bg-white/90 border border-amber-200/70 text-xs text-gray-800 leading-relaxed"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{cleanQ}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. COMPREHENSIVE DISCUSSION BREAKDOWN (By Topic) */}
            <div>
              <div className="flex items-center justify-between mb-3.5 border-b border-gray-100 pb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span>Detailed Discussion Breakdown (By Topic)</span>
                </h3>
                <span className="text-[11px] text-gray-400 font-medium">
                  Deep Technical & Strategic Context
                </span>
              </div>

              {intelligence.detailedTopics && intelligence.detailedTopics.length > 0 ? (
                <div className="space-y-4">
                  {intelligence.detailedTopics.map((dt, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs hover:border-whip-200 transition-all"
                    >
                      <div className="flex items-center space-x-2.5 mb-3">
                        <span className="w-6 h-6 rounded-lg bg-whip-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900 tracking-tight">
                          {dt.topic}
                        </h4>
                      </div>

                      <div className="space-y-2 pl-8 border-l-2 border-whip-100 ml-3">
                        {dt.details.map((detail, dIdx) => (
                          <div key={dIdx} className="flex items-start space-x-2">
                            <span className="text-whip-600 font-bold mt-1 text-xs">•</span>
                            <p className="text-sm text-gray-800 leading-relaxed font-normal">
                              {detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3.5">
                  {intelligence.summaryBulletPoints.map((bullet, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/70 hover:border-whip-200 hover:bg-white transition-all shadow-2xs text-sm text-gray-800 leading-relaxed"
                    >
                      {bullet}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. PIVOTAL AUDIO EVIDENCE & TIMESTAMP ANCHORS */}
            {intelligence.keyMoments && intelligence.keyMoments.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3.5 border-b border-gray-100 pb-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Pivotal Audio Evidence & Timestamp Anchors</span>
                  </h3>
                  <span className="text-[11px] text-gray-400 font-mono font-semibold">
                    {intelligence.keyMoments.length} verified moments
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {intelligence.keyMoments.map((moment: HighlightMoment, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-gray-200/80 bg-slate-50/40 hover:bg-white hover:border-whip-300 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-whip-100 text-whip-800 font-mono text-xs font-bold border border-whip-200">
                            <Clock className="w-3 h-3 text-whip-600" />
                            <span>{moment.timestamp}</span>
                          </span>

                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${getSpeakerColor(moment.speaker)}`}>
                            {moment.speaker}
                          </span>

                          {moment.topic && (
                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 truncate max-w-[140px]">
                              {moment.topic}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-gray-800 italic font-serif leading-relaxed pl-2 border-l-2 border-whip-300 my-1.5">
                          &ldquo;{moment.quote}&rdquo;
                        </p>
                      </div>

                      {moment.significance && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex items-start space-x-1.5 text-[11px] text-gray-600">
                          <Lightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                          <span>{moment.significance}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: FULL DIARIZED TRANSCRIPT                          */}
        {/* ======================================================== */}
        {activeTab === "transcript" && (
          <div className="space-y-4">
            {/* Interactive Search & Speaker Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search transcript by keyword or phrase..."
                  value={transcriptSearch}
                  onChange={(e) => setTranscriptSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-whip-500"
                />
              </div>

              {/* Speaker Filter Pills */}
              {uniqueSpeakers.length > 1 && (
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedSpeaker("all")}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                      selectedSpeaker === "all"
                        ? "bg-whip-700 text-white"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    All ({transcript.segments?.length || 0})
                  </button>
                  {uniqueSpeakers.map((spk) => (
                    <button
                      key={spk}
                      type="button"
                      onClick={() => setSelectedSpeaker(spk)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                        selectedSpeaker === spk
                          ? "bg-whip-700 text-white"
                          : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {spk}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Transcript Turns List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {filteredSegments.length > 0 ? (
                filteredSegments.map((segment, idx) => {
                  const speaker = segment.speaker || "SPEAKER";
                  const startMins = Math.floor(segment.start / 60);
                  const startSecs = Math.floor(segment.start % 60);
                  const startTime = `${startMins.toString().padStart(2, "0")}:${startSecs.toString().padStart(2, "0")}`;

                  const endMins = Math.floor(segment.end / 60);
                  const endSecs = Math.floor(segment.end % 60);
                  const endTime = `${endMins.toString().padStart(2, "0")}:${endSecs.toString().padStart(2, "0")}`;
                  const durationSecs = Math.round(segment.end - segment.start);

                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-gray-200/70 hover:border-whip-300 hover:bg-slate-50/50 transition-all flex items-start space-x-3.5 group bg-white shadow-2xs"
                    >
                      {/* Timestamp range & duration */}
                      <div className="shrink-0 flex flex-col items-center">
                        <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                          {startTime}
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {durationSecs}s
                        </span>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-md border ${getSpeakerColor(
                              speaker
                            )}`}
                          >
                            {speaker}
                          </span>

                          <button
                            type="button"
                            onClick={() => copySegment(segment.text, idx)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-700 text-xs inline-flex items-center space-x-1"
                          >
                            {copiedSegmentIdx === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span className="text-[10px] text-emerald-600">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span className="text-[10px]">Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <p className="text-sm text-gray-800 leading-relaxed font-normal">
                          {segment.text}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-gray-500 text-sm">
                  No matching transcript turns found for &ldquo;{transcriptSearch}&rdquo;.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
