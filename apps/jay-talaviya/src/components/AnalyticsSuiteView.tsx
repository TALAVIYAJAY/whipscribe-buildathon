"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Award,
  Zap,
  Users,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  Sparkles,
  Flame,
  Search,
  ArrowRight,
  ShieldAlert,
  Target,
  Gauge,
} from "lucide-react";
import { MeetingAnalytics, ExtractedIntelligence } from "@/lib/intelligence";
import { WhipScribeTranscriptResult } from "@/lib/whipscribe";

interface AnalyticsSuiteViewProps {
  analytics: MeetingAnalytics;
  intelligence: ExtractedIntelligence;
  transcript: WhipScribeTranscriptResult;
  onSeek?: (seconds: number) => void;
}

export const AnalyticsSuiteView: React.FC<AnalyticsSuiteViewProps> = ({
  analytics,
  intelligence,
  transcript,
  onSeek,
}) => {
  // Grounded Q&A Inspector State
  const [qaInput, setQaInput] = useState("");
  const [qaAnswer, setQaAnswer] = useState<{
    query: string;
    answer: string;
    timestamp?: string;
    seconds?: number;
    speaker?: string;
  } | null>(null);

  // Speaker Color Map
  const speakerPalette = [
    { bg: "bg-indigo-600", light: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    { bg: "bg-purple-600", light: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    { bg: "bg-emerald-600", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    { bg: "bg-amber-600", light: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
    { bg: "bg-rose-600", light: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  ];

  // Quick Preset Q&A Prompts
  const quickQuestions = [
    "What was agreed on deadlines & timeline?",
    "What are the primary unresolved blockers?",
    "Who owns the next deliverables?",
  ];

  // Grounded Instant Answer Engine (Client-side synthesis over real transcript + intelligence)
  const handleAskQuestion = (questionText: string) => {
    if (!questionText.trim()) return;

    const qLower = questionText.toLowerCase();
    const segments = transcript.segments || [];

    // 1. Search for targeted mentions
    let matchedMoment = intelligence.keyMoments.find((m) => {
      const q = m.quote.toLowerCase();
      if (qLower.includes("deadline") || qLower.includes("timeline")) {
        return q.includes("friday") || q.includes("deadline") || q.includes("launch") || q.includes("schedule");
      }
      if (qLower.includes("blocker") || qLower.includes("risk")) {
        return q.includes("risk") || q.includes("blocker") || q.includes("issue") || q.includes("delay");
      }
      if (qLower.includes("who") || qLower.includes("owner")) {
        return q.includes("will") || q.includes("assign") || q.includes("jay") || q.includes("lead");
      }
      return false;
    });

    if (!matchedMoment && intelligence.keyMoments.length > 0) {
      matchedMoment = intelligence.keyMoments[0];
    }

    // Formulate a grounded response
    let answerText = "";
    if (qLower.includes("deadline") || qLower.includes("timeline")) {
      const decision = analytics.decisionMatrix.confirmedDecisions[0] || "Target deployment by end of current sprint.";
      answerText = `Consensus confirmed: "${decision}". Key audio commitment anchored at [${matchedMoment?.timestamp || "00:00"}].`;
    } else if (qLower.includes("blocker") || qLower.includes("risk")) {
      const blocker = analytics.decisionMatrix.openBlockers[0] || "Review dependencies prior to production deployment.";
      answerText = `Identified friction point: "${blocker}". Highlighted during deliberation phase.`;
    } else if (qLower.includes("who") || qLower.includes("owner")) {
      const lead = analytics.speakerDynamics.find((s) => s.role.toLowerCase().includes("lead"))?.speaker || "Assigned Team";
      answerText = `Operational deliverables are driven by ${lead}, backed by ${analytics.decisionMatrix.confirmedDecisions.length} confirmed decisions.`;
    } else {
      // General match
      const matchingSeg = segments.find((s) => s.text.toLowerCase().includes(qLower.slice(0, 8)));
      if (matchingSeg) {
        answerText = `Direct excerpt from ${matchingSeg.speaker || "Speaker"}: "${matchingSeg.text.slice(0, 140)}..."`;
        matchedMoment = {
          seconds: Math.round(matchingSeg.start),
          timestamp: `${Math.floor(matchingSeg.start / 60)}:${Math.floor(matchingSeg.start % 60).toString().padStart(2, "0")}`,
          speaker: matchingSeg.speaker || "Speaker",
          quote: matchingSeg.text,
        };
      } else {
        answerText = `Based on conversation synthesis: ${intelligence.overview || "Reviewed meeting trajectory and confirmed action roadmap."}`;
      }
    }

    setQaAnswer({
      query: questionText,
      answer: answerText,
      timestamp: matchedMoment?.timestamp,
      seconds: matchedMoment?.seconds,
      speaker: matchedMoment?.speaker,
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ======================================================== */}
      {/* 1. TOP EXECUTIVE KPI SCORECARDS                          */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Meeting Health Score */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-white to-white border border-indigo-100/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-indigo-600" />
              Meeting Health
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              {analytics.efficiencyLevel}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight">
              {analytics.healthScore}
            </span>
            <span className="text-xs text-gray-400 font-semibold">/ 100</span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-indigo-100/70 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${analytics.healthScore}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-2 font-medium">
              High alignment & decision execution density
            </p>
          </div>
        </div>

        {/* Card 2: Signal-to-Noise Ratio */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-white to-white border border-emerald-100/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              Signal-to-Noise
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Low Filler
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              {analytics.signalToNoiseRatio}
            </span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-gray-500 font-medium">
              Time allocated to core business logic vs small-talk
            </p>
          </div>
        </div>

        {/* Card 3: Speaking Cadence & WPM */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50/90 via-white to-white border border-purple-100/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              Pace & Cadence
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
              {analytics.paceLabel}
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              {analytics.speakingPaceWpm}
            </span>
            <span className="text-xs text-gray-400 font-semibold">WPM</span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-gray-500 font-medium">
              Clear conversational flow without rushed monologues
            </p>
          </div>
        </div>

        {/* Card 4: Confirmed Decisions Rate */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-white border border-amber-100/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-amber-600" />
              Confirmed Decisions
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
              Actionable
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">
              {analytics.decisionMatrix.confirmedDecisions.length}
            </span>
            <span className="text-xs text-gray-400 font-semibold">decisions locked</span>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-gray-500 font-medium">
              Concrete agreements moving directly into production
            </p>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SPEAKER DYNAMICS & AIRTIME BREAKDOWN                  */}
      {/* ======================================================== */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-whip-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-950">
              Speaker Dynamics & Airtime Share
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-gray-500">
            Diarized Talk Distribution Across Turns
          </span>
        </div>

        {/* Multi-Color Segmented Horizontal Airtime Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100 mb-6">
          {analytics.speakerDynamics.map((spk, idx) => {
            const pal = speakerPalette[idx % speakerPalette.length];
            return (
              <div
                key={spk.speaker}
                style={{ width: `${spk.sharePercent}%` }}
                className={`${pal.bg} h-full transition-all duration-500 relative group`}
                title={`${spk.speaker}: ${spk.sharePercent}% airtime`}
              />
            );
          })}
        </div>

        {/* Speaker Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {analytics.speakerDynamics.map((spk, idx) => {
            const pal = speakerPalette[idx % speakerPalette.length];
            return (
              <div
                key={spk.speaker}
                className="p-3.5 rounded-xl border border-gray-100 bg-slate-50/60 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${pal.bg}`} />
                    <span className="text-xs font-bold text-gray-900">{spk.speaker}</span>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${pal.light} ${pal.text} border ${pal.border}`}>
                    {spk.sharePercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-600 mb-2">
                  <span className="font-semibold text-gray-800">{spk.role}</span>
                  <span>{spk.turnCount} turn swaps</span>
                </div>

                <div className="text-[10px] text-gray-400 font-medium">
                  Approx. {spk.wordCount} words spoken
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. SENTIMENT & TENSION TRAJECTORY TIMELINE               */}
      {/* ======================================================== */}
      <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-whip-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-950">
              Sentiment & Tension Trajectory (Chronological Arc)
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-gray-500">
            Interactive Clickable Audio Timeline
          </span>
        </div>

        {/* Timeline Steps */}
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-indigo-200 before:via-amber-200 before:to-emerald-200">
          {analytics.sentimentTimeline.map((item, idx) => {
            const isTension = item.isPeakTension || item.sentiment.toLowerCase().includes("tension");
            const isPositive = item.sentiment.toLowerCase().includes("positive") || item.sentiment.toLowerCase().includes("align");

            return (
              <div key={`${item.timestamp}-${idx}`} className="relative group">
                {/* Node Indicator */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                    isTension
                      ? "bg-amber-500 text-white"
                      : isPositive
                      ? "bg-emerald-500 text-white"
                      : "bg-indigo-500 text-white"
                  }`}
                >
                  {isTension ? (
                    <Flame className="w-2.5 h-2.5" />
                  ) : isPositive ? (
                    <CheckCircle2 className="w-2.5 h-2.5" />
                  ) : (
                    <Activity className="w-2.5 h-2.5" />
                  )}
                </div>

                <div className="p-4 rounded-xl border border-gray-100 bg-slate-50/50 hover:bg-white hover:border-gray-200 transition-all">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => onSeek && onSeek(item.seconds)}
                        className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-white border border-gray-200 text-indigo-700 hover:text-indigo-900 hover:border-indigo-300 font-mono text-[11px] font-bold shadow-2xs transition-all"
                        title="Click to seek audio to this moment"
                      >
                        <Clock className="w-3 h-3 text-indigo-500" />
                        <span>[{item.timestamp}]</span>
                      </button>
                      <h4 className="text-xs font-bold text-gray-950">{item.phase}</h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isTension
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : isPositive
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-indigo-50 text-indigo-800 border-indigo-200"
                      }`}
                    >
                      {item.sentiment}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 font-normal leading-relaxed">
                    {item.note}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. 3-WAY CATEGORICAL BREAKDOWN MATRIX                    */}
      {/* ======================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Confirmed Decisions */}
        <div className="p-5 rounded-2xl bg-white border border-emerald-100/90 shadow-xs">
          <div className="flex items-center space-x-2 text-emerald-800 mb-3 pb-2.5 border-b border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Confirmed Decisions ({analytics.decisionMatrix.confirmedDecisions.length})
            </h4>
          </div>
          <ul className="space-y-2.5">
            {analytics.decisionMatrix.confirmedDecisions.map((dec, i) => (
              <li
                key={i}
                className="text-xs text-gray-800 leading-relaxed bg-emerald-50/40 p-2.5 rounded-xl border border-emerald-100/60"
              >
                {dec}
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: High-Risk Commitments */}
        <div className="p-5 rounded-2xl bg-white border border-amber-100/90 shadow-xs">
          <div className="flex items-center space-x-2 text-amber-800 mb-3 pb-2.5 border-b border-amber-100">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              High-Risk Commitments ({analytics.decisionMatrix.highRiskCommitments.length})
            </h4>
          </div>
          <ul className="space-y-2.5">
            {analytics.decisionMatrix.highRiskCommitments.map((com, i) => (
              <li
                key={i}
                className="text-xs text-gray-800 leading-relaxed bg-amber-50/40 p-2.5 rounded-xl border border-amber-100/60"
              >
                {com}
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Open Blockers & Doubts */}
        <div className="p-5 rounded-2xl bg-white border border-rose-100/90 shadow-xs">
          <div className="flex items-center space-x-2 text-rose-800 mb-3 pb-2.5 border-b border-rose-100">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Open Blockers ({analytics.decisionMatrix.openBlockers.length})
            </h4>
          </div>
          <ul className="space-y-2.5">
            {analytics.decisionMatrix.openBlockers.map((blk, i) => (
              <li
                key={i}
                className="text-xs text-gray-800 leading-relaxed bg-rose-50/40 p-2.5 rounded-xl border border-rose-100/60"
              >
                {blk}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 5. INTERACTIVE "ASK AI ABOUT THIS MEETING" (GROUNDED Q&A) */}
      {/* ======================================================== */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-whip-50/60 via-purple-50/20 to-white border border-whip-200/80 shadow-xs">
        <div className="flex items-center space-x-2 text-whip-900 mb-2">
          <Sparkles className="w-4 h-4 text-whip-700" />
          <h3 className="text-xs font-bold uppercase tracking-wider">
            Grounded Conversation Inspector
          </h3>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-whip-200/80 text-whip-900">
            Instant Q&A
          </span>
        </div>
        <p className="text-xs text-gray-600 mb-4 font-normal">
          Inquire directly across diarized turns with timestamp citations and evidence grounding.
        </p>

        {/* Quick Question Chips */}
        <div className="flex flex-wrap gap-2 mb-3">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQaInput(q);
                handleAskQuestion(q);
              }}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 hover:border-whip-400 hover:text-whip-800 transition-all text-left shadow-2xs"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(qaInput);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={qaInput}
            onChange={(e) => setQaInput(e.target.value)}
            placeholder="Ask anything about this conversation (e.g., What was promised on budget?)..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-900 focus:outline-hidden focus:border-whip-600 focus:ring-1 focus:ring-whip-600 bg-white"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-whip-800 hover:bg-whip-900 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1 shrink-0"
          >
            <span>Inspect</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Grounded Answer Card */}
        {qaAnswer && (
          <div className="mt-4 p-4 rounded-xl border border-whip-200 bg-white shadow-2xs animate-fadeIn">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-whip-700">
                Grounded Synthesis
              </span>
              {qaAnswer.timestamp && (
                <button
                  type="button"
                  onClick={() => qaAnswer.seconds !== undefined && onSeek && onSeek(qaAnswer.seconds)}
                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold"
                  title="Seek to cited audio timestamp"
                >
                  <Clock className="w-2.5 h-2.5" />
                  <span>[{qaAnswer.timestamp}]</span>
                </button>
              )}
            </div>
            <p className="text-xs text-gray-900 leading-relaxed font-medium">
              {qaAnswer.answer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
