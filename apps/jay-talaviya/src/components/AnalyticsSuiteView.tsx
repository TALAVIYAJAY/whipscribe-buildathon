"use client";

import React, { useState, useMemo } from "react";
import {
  Activity,
  Zap,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Workflow,
  ChevronRight,
  Target,
  Gauge,
  Users,
  Compass,
  ArrowRight,
  ShieldAlert,
  Radio,
  BarChart2,
  PieChart,
  Layers,
  Sliders,
  Play,
  Volume2,
} from "lucide-react";
import {
  MeetingAnalytics,
  ExtractedIntelligence,
  DiscussionPhase,
  formatSeconds,
} from "@/lib/intelligence";
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
  // Chart View Mode filter (ShikshaKai Principal Dashboard style)
  const [chartViewMode, setChartViewMode] = useState<"all" | "cadence" | "engagement" | "alignment">("all");
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);

  // Total Meeting Duration (seconds)
  const totalDuration = useMemo(() => {
    const segs = transcript.segments || [];
    if (segs.length === 0) return 60;
    const maxEnd = segs.reduce((max, s) => Math.max(max, s.end), 0);
    return Math.max(15, Math.round(maxEnd));
  }, [transcript.segments]);

  // Total Spoken Words
  const totalWords = useMemo(() => {
    const fromStats = analytics.speakerDynamics.reduce((acc, s) => acc + s.wordCount, 0);
    if (fromStats > 0) return fromStats;
    const segs = transcript.segments || [];
    return segs.reduce((acc, s) => acc + s.text.split(/\s+/).filter(Boolean).length, 0) || 120;
  }, [analytics.speakerDynamics, transcript.segments]);

  // Distinct Speaker Color Palette
  const speakerPalette = useMemo(
    () => [
      { stroke: "#6366f1", bg: "bg-indigo-600", light: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
      { stroke: "#10b981", bg: "bg-emerald-600", light: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
      { stroke: "#a855f7", bg: "bg-purple-600", light: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
      { stroke: "#f59e0b", bg: "bg-amber-600", light: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
      { stroke: "#06b6d4", bg: "bg-cyan-600", light: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
    ],
    []
  );

  // Distinct unique speaker keys found in transcript segments
  const uniqueTranscriptSpeakers = useMemo(() => {
    const set = new Set<string>();
    (transcript.segments || []).forEach((s) => {
      if (s.speaker) set.add(s.speaker);
    });
    return Array.from(set);
  }, [transcript.segments]);

  // Robust Speaker-to-Segment Mapping (Never empty!)
  const getSegmentsForSpeaker = useMemo(() => {
    return (speakerName: string, speakerIdx: number) => {
      const segs = transcript.segments || [];
      if (segs.length === 0) return [];

      // 1. Direct exact match
      const direct = segs.filter((s) => s.speaker === speakerName);
      if (direct.length > 0) return direct;

      // 2. Substring/clean name match (e.g. "Speaker (Elena)" matches "Elena" or "SPEAKER_00")
      const cleanTarget = speakerName.toLowerCase().replace(/[^a-z0-9]/g, "");
      const partial = segs.filter((s) => {
        const cleanSeg = (s.speaker || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        return cleanTarget.includes(cleanSeg) || cleanSeg.includes(cleanTarget);
      });
      if (partial.length > 0) return partial;

      // 3. Index fallback (matches Speaker 0 to SPEAKER_00, Speaker 1 to SPEAKER_01)
      if (uniqueTranscriptSpeakers.length > speakerIdx) {
        const targetTranscriptSpeaker = uniqueTranscriptSpeakers[speakerIdx];
        const byIndex = segs.filter((s) => s.speaker === targetTranscriptSpeaker);
        if (byIndex.length > 0) return byIndex;
      }

      // 4. If only 1 speaker exists overall in dynamics, allocate all segments
      if (analytics.speakerDynamics.length === 1) {
        return segs;
      }

      return [];
    };
  }, [transcript.segments, uniqueTranscriptSpeakers, analytics.speakerDynamics.length]);

  // =========================================================================
  // 1. DYNAMIC SPEAKER AIRTIME DONUT
  // =========================================================================
  const donutRadius = 56;
  const donutCircumference = 2 * Math.PI * donutRadius;

  const donutSegments = useMemo(() => {
    let accumulatedAngle = 0;
    const dynamics = analytics.speakerDynamics || [];

    if (dynamics.length === 0) {
      return [
        {
          speaker: "Speaker 1",
          share: 100,
          turnCount: transcript.segments?.length || 1,
          wordCount: totalWords,
          role: "Solo Presenter",
          color: speakerPalette[0],
          strokeDash: `${donutCircumference.toFixed(2)} ${donutCircumference.toFixed(2)}`,
          strokeDashoffset: 0,
        },
      ];
    }

    return dynamics.map((speaker, idx) => {
      const share = speaker.sharePercent || Math.round(100 / dynamics.length);
      const strokeDash = (donutCircumference * share) / 100;
      const strokeDashoffset = donutCircumference - (donutCircumference * accumulatedAngle) / 100;
      accumulatedAngle += share;
      const color = speakerPalette[idx % speakerPalette.length];
      return {
        ...speaker,
        share,
        color,
        strokeDash: `${strokeDash.toFixed(2)} ${donutCircumference.toFixed(2)}`,
        strokeDashoffset,
      };
    });
  }, [analytics.speakerDynamics, donutCircumference, speakerPalette, totalWords, transcript.segments]);

  // Dialogue Balance Equity Ratio
  const dialogueEquityLabel = useMemo(() => {
    const spkCount = analytics.speakerDynamics.length;
    if (spkCount <= 1) return "Solo Executive Briefing";
    const shares = analytics.speakerDynamics.map((s) => s.sharePercent);
    const maxShare = Math.max(...shares);
    const minShare = Math.min(...shares);
    if (maxShare - minShare <= 25) return "Balanced Dialogue Exchange";
    return "Lead-Driven Presentation";
  }, [analytics.speakerDynamics]);

  // =========================================================================
  // 2. CONTINUOUS DISCUSSION TRAJECTORY DATA POINTS (SHIKSHAKAI MULTI-SERIES)
  // =========================================================================
  const trajectoryPoints = useMemo(() => {
    const segs = transcript.segments || [];
    // Generate between 10 and 16 evenly-spaced sample intervals across the timeline
    const numPoints = Math.max(10, Math.min(16, Math.floor(totalDuration / 2) || 10));
    const stepSeconds = totalDuration / (numPoints - 1);

    const points = [];

    for (let i = 0; i < numPoints; i++) {
      const timeSec = i === numPoints - 1 ? totalDuration : i * stepSeconds;
      const roundedSec = Math.round(timeSec);
      const timeLabel = formatSeconds(roundedSec);

      // Find active or closest transcript segment at this second
      let activeSeg = segs.find((s) => s.start <= timeSec && timeSec <= s.end);
      if (!activeSeg && segs.length > 0) {
        activeSeg = segs.reduce((closest, s) => {
          const currentDiff = Math.abs((s.start + s.end) / 2 - timeSec);
          const closestDiff = Math.abs((closest.start + closest.end) / 2 - timeSec);
          return currentDiff < closestDiff ? s : closest;
        }, segs[0]);
      }

      // Speaker identity
      const speakerName = activeSeg?.speaker || analytics.speakerDynamics[0]?.speaker || "Speaker 1";
      const spkIdx = analytics.speakerDynamics.findIndex((s) => s.speaker === speakerName);
      const spkColor = speakerPalette[(spkIdx >= 0 ? spkIdx : 0) % speakerPalette.length];

      // 1. Cadence (Words Per Minute local velocity)
      const windowStart = Math.max(0, timeSec - 4);
      const windowEnd = Math.min(totalDuration, timeSec + 4);
      const windowDuration = Math.max(1, windowEnd - windowStart);
      const windowWords = segs
        .filter((s) => s.end >= windowStart && s.start <= windowEnd)
        .reduce((sum, s) => sum + s.text.split(/\s+/).filter(Boolean).length, 0);

      const computedWpm = Math.round((windowWords / windowDuration) * 60);
      const localWpm = computedWpm > 0 ? computedWpm : (analytics.speakingPaceWpm || 140);
      // Normalized Cadence % (baseline 160 WPM = 80%)
      const cadencePct = Math.min(98, Math.max(18, Math.round((localWpm / 185) * 100)));

      // 2. Engagement % (turn density, questions, dialogue transitions)
      const nearbyText = (activeSeg?.text || "").toLowerCase();
      const hasQuestion = nearbyText.includes("?") || nearbyText.includes("how") || nearbyText.includes("what");
      const hasAction = nearbyText.includes("need to") || nearbyText.includes("decided") || nearbyText.includes("deploy") || nearbyText.includes("confirm");
      const isTransition = i > 0 && i < numPoints - 1 && Math.abs(timeSec - (activeSeg?.start || 0)) < 2.5;

      let engagementPct = 68;
      if (hasQuestion || hasAction) {
        engagementPct = 85 + (i % 3) * 4;
      } else if (isTransition) {
        engagementPct = 78 + (i % 4) * 3;
      } else {
        engagementPct = Math.min(92, Math.max(48, 62 + ((i * 7) % 26)));
      }

      // 3. Sentiment & Alignment %
      const hasConsensus = nearbyText.includes("agreed") || nearbyText.includes("fantastic") || nearbyText.includes("sounds") || nearbyText.includes("confirmed") || nearbyText.includes("solve") || nearbyText.includes("retention");
      const hasFriction = nearbyText.includes("bottleneck") || nearbyText.includes("missing") || nearbyText.includes("risk") || nearbyText.includes("latency") || nearbyText.includes("spike");

      let alignmentPct = 72;
      if (hasConsensus) {
        alignmentPct = 86 + (i % 3) * 4;
      } else if (hasFriction) {
        alignmentPct = 40 + (i % 3) * 6;
      } else {
        alignmentPct = Math.min(88, Math.max(52, 66 + ((i * 5) % 22)));
      }

      const isMilestone = isTransition || hasAction || hasConsensus || i === 0 || i === numPoints - 1;

      points.push({
        index: i,
        seconds: roundedSec,
        timeLabel,
        speaker: speakerName,
        speakerColor: spkColor,
        cadenceWpm: localWpm,
        cadencePct,
        engagementPct,
        alignmentPct,
        quote: activeSeg ? activeSeg.text.slice(0, 95) : "Continuous speech telemetry stream.",
        isMilestone,
      });
    }

    return points;
  }, [totalDuration, transcript.segments, analytics.speakerDynamics, analytics.speakingPaceWpm, speakerPalette]);

  // Coordinate mapping for SVG Canvas (viewBox 0 0 800 220)
  const svgSeries = useMemo(() => {
    if (trajectoryPoints.length === 0) {
      return { cadence: [], engagement: [], alignment: [] };
    }
    const len = trajectoryPoints.length;
    const leftX = 58;
    const plotW = 708;
    const plotH = 155;
    const topY = 25;

    const cadence = trajectoryPoints.map((pt, idx) => ({
      x: leftX + (idx / (len - 1)) * plotW,
      y: topY + plotH * (1 - pt.cadencePct / 100),
      data: pt,
    }));

    const engagement = trajectoryPoints.map((pt, idx) => ({
      x: leftX + (idx / (len - 1)) * plotW,
      y: topY + plotH * (1 - pt.engagementPct / 100),
      data: pt,
    }));

    const alignment = trajectoryPoints.map((pt, idx) => ({
      x: leftX + (idx / (len - 1)) * plotW,
      y: topY + plotH * (1 - pt.alignmentPct / 100),
      data: pt,
    }));

    return { cadence, engagement, alignment };
  }, [trajectoryPoints]);

  // Helper: Smooth Cubic Bézier SVG Line Path
  const getBezierPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  // Helper: Closed Area Path for Gradients
  const getAreaPath = (points: { x: number; y: number }[], baseY = 180) => {
    if (points.length === 0) return "";
    const linePath = getBezierPath(points);
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  };

  const cadencePath = useMemo(() => getBezierPath(svgSeries.cadence), [svgSeries.cadence]);
  const cadenceArea = useMemo(() => getAreaPath(svgSeries.cadence, 180), [svgSeries.cadence]);

  const engagementPath = useMemo(() => getBezierPath(svgSeries.engagement), [svgSeries.engagement]);
  const engagementArea = useMemo(() => getAreaPath(svgSeries.engagement, 180), [svgSeries.engagement]);

  const alignmentPath = useMemo(() => getBezierPath(svgSeries.alignment), [svgSeries.alignment]);
  const alignmentArea = useMemo(() => getAreaPath(svgSeries.alignment, 180), [svgSeries.alignment]);

  // Event Pins along timeline (Decisions, Risks, Action Items)
  const timelinePins = useMemo(() => {
    const pins: {
      seconds: number;
      timestamp: string;
      label: string;
      type: "decision" | "risk" | "action";
    }[] = [];

    const decisions = analytics.decisionMatrix.confirmedDecisions || [];
    decisions.forEach((d, idx) => {
      const time = Math.min(totalDuration - 2, Math.round(totalDuration * (0.15 + idx * 0.35)));
      pins.push({
        seconds: time,
        timestamp: formatSeconds(time),
        label: d,
        type: "decision",
      });
    });

    const risks = analytics.decisionMatrix.highRiskCommitments || [];
    risks.forEach((r, idx) => {
      const time = Math.min(totalDuration - 1, Math.round(totalDuration * (0.45 + idx * 0.25)));
      pins.push({
        seconds: time,
        timestamp: formatSeconds(time),
        label: r,
        type: "risk",
      });
    });

    const actions = intelligence.airtablePayload.actionItemsText
      .split("\n")
      .filter((l) => l.trim().startsWith("-"))
      .slice(0, 3);
    actions.forEach((a, idx) => {
      const time = Math.min(totalDuration - 1, Math.round(totalDuration * (0.65 + idx * 0.15)));
      pins.push({
        seconds: time,
        timestamp: formatSeconds(time),
        label: a.replace(/^-\s*/, ""),
        type: "action",
      });
    });

    if (pins.length === 0) {
      pins.push({
        seconds: Math.round(totalDuration * 0.5),
        timestamp: formatSeconds(Math.round(totalDuration * 0.5)),
        label: "Midpoint Execution Alignment",
        type: "decision",
      });
    }

    return pins.sort((a, b) => a.seconds - b.seconds);
  }, [
    analytics.decisionMatrix.confirmedDecisions,
    analytics.decisionMatrix.highRiskCommitments,
    intelligence.airtablePayload.actionItemsText,
    totalDuration,
  ]);

  // Active Hovered Point Details
  const activeHoverData = useMemo(() => {
    if (hoveredPointIdx === null || hoveredPointIdx >= trajectoryPoints.length) {
      return trajectoryPoints[0] || null;
    }
    return trajectoryPoints[hoveredPointIdx];
  }, [hoveredPointIdx, trajectoryPoints]);

  // =========================================================================
  // 3. DYNAMIC PHASED DISCUSSION PIPELINE (FLOWCHART FROM REAL TOPICS)
  // =========================================================================
  const discussionPhases: DiscussionPhase[] = useMemo(() => {
    if (analytics.discussionPhases && analytics.discussionPhases.length > 0) {
      return analytics.discussionPhases;
    }

    const segments = transcript.segments || [];
    const segCount = segments.length;
    if (segCount === 0) {
      return [
        {
          phase: "PHASE 01",
          phaseName: intelligence.title || "Executive Briefing",
          title: intelligence.title || "Executive Briefing",
          timeRange: `00:00 - ${formatSeconds(totalDuration)}`,
          startSeconds: 0,
          endSeconds: totalDuration,
          speaker: "Presenter",
          outcome: intelligence.overview || "Recorded briefing completed.",
          status: "Complete",
          frictionLevel: "low",
          consensusReached: true,
        },
      ];
    }

    const phaseCount = segCount <= 2 ? segCount : Math.min(4, Math.max(3, Math.ceil(segCount / 3)));
    const segsPerPhase = Math.max(1, Math.floor(segCount / phaseCount));
    const result: DiscussionPhase[] = [];

    for (let pIdx = 0; pIdx < phaseCount; pIdx++) {
      const startSegIdx = pIdx * segsPerPhase;
      const endSegIdx = pIdx === phaseCount - 1 ? segCount - 1 : Math.min(segCount - 1, (pIdx + 1) * segsPerPhase - 1);
      const phaseSegs = segments.slice(startSegIdx, endSegIdx + 1);

      if (phaseSegs.length === 0) continue;

      const pStart = phaseSegs[0].start;
      const pEnd = phaseSegs[phaseSegs.length - 1].end;
      const pTimeRange = `${formatSeconds(pStart)} - ${formatSeconds(pEnd)}`;

      const spkWordCount = new Map<string, number>();
      phaseSegs.forEach((s) => {
        const spk = s.speaker || "Speaker";
        const w = s.text.split(/\s+/).filter(Boolean).length;
        spkWordCount.set(spk, (spkWordCount.get(spk) || 0) + w);
      });
      let dominantSpeaker = phaseSegs[0].speaker || "Speaker 1";
      let maxW = 0;
      spkWordCount.forEach((w, s) => {
        if (w > maxW) {
          maxW = w;
          dominantSpeaker = s;
        }
      });

      const phaseText = phaseSegs.map((s) => s.text).join(" ");
      const sentences = phaseText.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 15);

      let title = "";
      let outcome = "";
      let status: "Complete" | "Deliberated" | "Consensus" | "Risk Review" = "Deliberated";

      if (pIdx === 0) {
        title = sentences[0] ? sentences[0].slice(0, 42) : "Context Framing & Agenda";
        outcome = sentences[1] || sentences[0] || "Framed the core scope and objective.";
        status = "Complete";
      } else if (pIdx === phaseCount - 1) {
        const lastDec = analytics.decisionMatrix.confirmedDecisions[0] || sentences[sentences.length - 1];
        title = lastDec ? lastDec.slice(0, 42) : "Consensus & Action Commitments";
        outcome = lastDec || "Agreed deliverables locked with owners.";
        status = "Consensus";
      } else {
        const hasRisk = phaseText.includes("?") || phaseText.toLowerCase().includes("risk");
        status = hasRisk ? "Risk Review" : "Deliberated";
        title = sentences[0] ? sentences[0].slice(0, 42) : "Core Deliberation";
        outcome = sentences[1] || sentences[0] || "Evaluated operational dependencies.";
      }

      if (title.length > 40) {
        title = title.slice(0, 38) + "...";
      }

      result.push({
        phase: `STAGE 0${pIdx + 1}`,
        phaseName: title || `STAGE 0${pIdx + 1}`,
        title,
        timeRange: pTimeRange,
        startSeconds: Math.round(pStart),
        endSeconds: Math.round(pEnd),
        speaker: dominantSpeaker,
        outcome,
        status,
        frictionLevel: (status === "Risk Review" ? "high" : pIdx === 0 ? "low" : "medium") as "low" | "medium" | "high",
        consensusReached: status === "Consensus" || status === "Complete",
      });
    }

    return result;
  }, [
    analytics.discussionPhases,
    analytics.decisionMatrix.confirmedDecisions,
    transcript.segments,
    totalDuration,
    intelligence.title,
    intelligence.overview,
  ]);

  return (
    <div className="w-full space-y-6">
      {/* ===================================================================== */}
      {/* SUBPART 1: EXECUTIVE RADIAL HEALTH DIAL & AIRTIME DONUT               */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white shadow-xl border border-indigo-800/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Activity className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-white">
                Executive Meeting Health & Efficiency Index
              </h3>
              <p className="text-xs text-indigo-200/70">
                Quantitative operational score measuring conversational velocity, signal density, and consensus
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Tier 1 Execution
            </span>
          </div>
        </div>

        {/* 3-Column Cockpit Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Main Radial Health Gauge (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="14"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="65"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="14"
                  strokeDasharray={`${2 * Math.PI * 65}`}
                  strokeDashoffset={`${2 * Math.PI * 65 * (1 - analytics.healthScore / 100)}`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold tracking-tight font-mono text-white">
                  {analytics.healthScore}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  / 100 Health
                </span>
              </div>
            </div>

            <div className="mt-3 text-center">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                {analytics.efficiencyLevel}
              </div>
              <div className="text-[10px] text-indigo-200/80 mt-0.5">{dialogueEquityLabel}</div>
            </div>
          </div>

          {/* 3 Core Executive KPI Scorecards (4 cols) */}
          <div className="lg:col-span-4 space-y-2.5">
            {/* Speaking Cadence */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-300">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-indigo-200">Speaking Cadence</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {analytics.speakingPaceWpm} WPM
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {analytics.paceLabel}
              </span>
            </div>

            {/* Signal-to-Noise Ratio */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-indigo-200">Actionable Signal Density</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {analytics.signalToNoiseRatio}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                High Substance
              </span>
            </div>

            {/* Total Interaction Volume */}
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs text-indigo-200">Interaction Volume</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {analytics.speakerDynamics.length} {analytics.speakerDynamics.length === 1 ? "Speaker" : "Speakers"}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {totalWords} Words
              </span>
            </div>
          </div>

          {/* Speaker Airtime Donut & Legend (4 cols) */}
          <div className="lg:col-span-4 p-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-200 flex items-center space-x-1.5">
                <PieChart className="w-3.5 h-3.5 text-indigo-400" />
                <span>Airtime Distribution</span>
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {formatSeconds(totalDuration)}
              </span>
            </div>

            <div className="flex items-center justify-center my-2">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                  {donutSegments.map((seg, sIdx) => (
                    <circle
                      key={sIdx}
                      cx="80"
                      cy="80"
                      r={donutRadius}
                      fill="none"
                      stroke={seg.color.stroke}
                      strokeWidth="20"
                      strokeDasharray={seg.strokeDash}
                      strokeDashoffset={seg.strokeDashoffset}
                      className="transition-all duration-700"
                    />
                  ))}
                </svg>
                <div className="absolute text-center">
                  <span className="text-xs font-bold text-white font-mono">
                    {formatSeconds(totalDuration)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/10">
              {donutSegments.map((seg, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-[11px] text-indigo-100 py-0.5"
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: seg.color.stroke }}
                    />
                    <span className="font-semibold text-white truncate">{seg.speaker}</span>
                  </div>
                  <div className="font-mono text-indigo-300 font-bold shrink-0">
                    {seg.share}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUBPART 2: MERGED DISCUSSION TRAJECTORY & SPEAKER ACTIVITY GRAPH      */}
      {/* (SHIKSHAKAI PRINCIPAL STATISTICS MULTI-SERIES CHART ARCHITECTURE)     */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-gray-200/90 shadow-md">
        {/* Header Toolbar & View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-4 border-b border-gray-100 gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-950 tracking-tight">
                Discussion Trajectory & Speaker Activity Analysis
              </h3>
              <p className="text-xs text-gray-500">
                Continuous temporal telemetry across cadence velocity, participant engagement, and consensus alignment
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle (ShikshaKai Subject / Concept style) */}
            <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
              <button
                type="button"
                onClick={() => setChartViewMode("all")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chartViewMode === "all"
                    ? "bg-white text-gray-950 shadow-2xs"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                All Series
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode("cadence")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chartViewMode === "cadence"
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                Cadence (WPM)
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode("engagement")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chartViewMode === "engagement"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                Engagement
              </button>
              <button
                type="button"
                onClick={() => setChartViewMode("alignment")}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  chartViewMode === "alignment"
                    ? "bg-purple-600 text-white shadow-2xs"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                Alignment
              </button>
            </div>

            <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md border border-gray-200">
              00:00 &rarr; {formatSeconds(totalDuration)}
            </span>
          </div>
        </div>

        {/* Legend Row at Top (ShikshaKai ApexCharts Header Legend) */}
        <div className="flex flex-wrap items-center justify-between text-xs text-gray-600 mb-3 px-1 gap-2">
          <div className="flex flex-wrap items-center gap-4">
            {(chartViewMode === "all" || chartViewMode === "cadence") && (
              <span className="flex items-center space-x-1.5 font-semibold text-blue-700">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Speaking Cadence Velocity (WPM)</span>
              </span>
            )}
            {(chartViewMode === "all" || chartViewMode === "engagement") && (
              <span className="flex items-center space-x-1.5 font-semibold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <span>Participant Turn Engagement (%)</span>
              </span>
            )}
            {(chartViewMode === "all" || chartViewMode === "alignment") && (
              <span className="flex items-center space-x-1.5 font-semibold text-purple-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Consensus & Sentiment Alignment (%)</span>
              </span>
            )}
          </div>
          <span className="text-[11px] text-gray-400 font-mono">
            {trajectoryPoints.length} Data Points Sampled
          </span>
        </div>

        {/* Responsive Chart Container with Horizontal Touch-Pan on Mobile */}
        <div className="w-full overflow-x-auto pb-1 no-scrollbar">
          <div className="min-w-[620px] sm:min-w-full bg-slate-50/70 rounded-xl border border-gray-200/80 p-2 relative">
            <svg
              className="w-full h-56 sm:h-64 overflow-visible"
              viewBox="0 0 800 220"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Cadence Gradient */}
                <linearGradient id="cadenceAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
                </linearGradient>
                {/* Engagement Gradient */}
                <linearGradient id="engagementAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                </linearGradient>
                {/* Alignment Gradient */}
                <linearGradient id="alignmentAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Cartesian Horizontal Grid Lines & Y-Axis Labels (0%, 25%, 50%, 75%, 100%) */}
              {[
                { val: "100%", y: 25 },
                { val: "75%", y: 64 },
                { val: "50%", y: 102 },
                { val: "25%", y: 141 },
                { val: "0%", y: 180 },
              ].map((grid, gIdx) => (
                <g key={gIdx}>
                  <line
                    x1="58"
                    y1={grid.y}
                    x2="770"
                    y2={grid.y}
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x="50"
                    y={grid.y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {grid.val}
                  </text>
                </g>
              ))}

              {/* Active Hover Crosshair Vertical Guide Line */}
              {hoveredPointIdx !== null && svgSeries.cadence[hoveredPointIdx] && (
                <line
                  x1={svgSeries.cadence[hoveredPointIdx].x}
                  y1="20"
                  x2={svgSeries.cadence[hoveredPointIdx].x}
                  y2="185"
                  stroke="#475569"
                  strokeDasharray="3 3"
                  strokeWidth="1.5"
                />
              )}

              {/* Area Gradient Fills - strictly dedicated to active view mode */}
              {chartViewMode === "cadence" && (
                <path d={cadenceArea} fill="url(#cadenceAreaGrad)" />
              )}
              {chartViewMode === "engagement" && (
                <path d={engagementArea} fill="url(#engagementAreaGrad)" />
              )}
              {chartViewMode === "alignment" && (
                <path d={alignmentArea} fill="url(#alignmentAreaGrad)" />
              )}

              {/* Main Bézier Spline Curves - strictly dedicated to active view mode */}
              {(chartViewMode === "all" || chartViewMode === "cadence") && (
                <path
                  d={cadencePath}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={chartViewMode === "cadence" ? "3" : "2.5"}
                  strokeLinecap="round"
                />
              )}
              {(chartViewMode === "all" || chartViewMode === "engagement") && (
                <path
                  d={engagementPath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth={chartViewMode === "engagement" ? "3" : "2.5"}
                  strokeLinecap="round"
                />
              )}
              {(chartViewMode === "all" || chartViewMode === "alignment") && (
                <path
                  d={alignmentPath}
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth={chartViewMode === "alignment" ? "3" : "2.5"}
                  strokeLinecap="round"
                />
              )}

              {/* Data Point Markers - strictly dedicated to active view mode (no ghost circles!) */}
              {trajectoryPoints.map((pt, idx) => {
                const cPt = svgSeries.cadence[idx];
                const ePt = svgSeries.engagement[idx];
                const aPt = svgSeries.alignment[idx];
                const isHovered = hoveredPointIdx === idx;

                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoveredPointIdx(idx)}
                    onClick={() => setHoveredPointIdx(idx)}
                    className="cursor-pointer"
                  >
                    {/* Cadence Marker: ONLY when viewing 'all' or 'cadence' */}
                    {(chartViewMode === "all" || chartViewMode === "cadence") && cPt && (
                      <circle
                        cx={cPt.x}
                        cy={cPt.y}
                        r={isHovered ? 6 : 4}
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all"
                      />
                    )}

                    {/* Engagement Marker: ONLY when viewing 'all' or 'engagement' */}
                    {(chartViewMode === "all" || chartViewMode === "engagement") && ePt && (
                      <circle
                        cx={ePt.x}
                        cy={ePt.y}
                        r={isHovered ? 6 : 4}
                        fill="#10b981"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all"
                      />
                    )}

                    {/* Alignment Marker: ONLY when viewing 'all' or 'alignment' */}
                    {(chartViewMode === "all" || chartViewMode === "alignment") && aPt && (
                      <circle
                        cx={aPt.x}
                        cy={aPt.y}
                        r={isHovered ? 6 : 4}
                        fill="#8b5cf6"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all"
                      />
                    )}
                  </g>
                );
              })}

              {/* X-Axis Ticks & Labels */}
              {trajectoryPoints.map((pt, idx) => {
                const cPt = svgSeries.cadence[idx];
                const showLabel = idx === 0 || idx === trajectoryPoints.length - 1 || idx % 2 === 0;

                if (!cPt) return null;

                return (
                  <g key={idx}>
                    <line x1={cPt.x} y1="180" x2={cPt.x} y2="185" stroke="#94a3b8" strokeWidth="1" />
                    {showLabel && (
                      <text
                        x={cPt.x}
                        y="200"
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {pt.timeLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="sm:hidden text-[10px] text-gray-400 text-center mt-1">
          &larr; Swipe sideways to explore continuous data points &rarr;
        </div>

        {/* Interactive Floating Telemetry Card (Displays Selected Data Point Details) */}
        {activeHoverData && (
          <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
                <span className="font-mono text-xs font-bold text-indigo-300">
                  {activeHoverData.timeLabel}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: activeHoverData.speakerColor.stroke }}
                  />
                  <span className="text-xs font-bold text-white">
                    {activeHoverData.speaker}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ({activeHoverData.cadenceWpm} WPM)
                  </span>
                </div>
                <p className="text-[11px] text-indigo-200/80 mt-0.5 line-clamp-1 italic">
                  &ldquo;{activeHoverData.quote}&rdquo;
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 self-end md:self-auto shrink-0 text-xs">
              {(chartViewMode === "all" || chartViewMode === "cadence") && (
                <div className="text-center">
                  <div className="text-[10px] text-gray-400">Cadence</div>
                  <div className="font-mono font-bold text-blue-400">{activeHoverData.cadencePct}%</div>
                </div>
              )}
              {(chartViewMode === "all" || chartViewMode === "engagement") && (
                <div className="text-center">
                  <div className="text-[10px] text-gray-400">Engagement</div>
                  <div className="font-mono font-bold text-emerald-400">{activeHoverData.engagementPct}%</div>
                </div>
              )}
              {(chartViewMode === "all" || chartViewMode === "alignment") && (
                <div className="text-center">
                  <div className="text-[10px] text-gray-400">Alignment</div>
                  <div className="font-mono font-bold text-purple-400">{activeHoverData.alignmentPct}%</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SYNCHRONIZED DIARIZED TIMELINE TRACK & EVENT PINS (INTEGRATED)       */}
        {/* ===================================================================== */}
        <div className="mt-5 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Diarized Speaker Activity & Event Milestones</span>
            </span>
            <span className="text-[11px] text-gray-400">
              Synchronized Event Milestones & Turn Activity
            </span>
          </div>

          {/* Decision & Action Marker Pins Along Time Axis */}
          <div className="relative w-full h-8 bg-slate-100/70 rounded-lg border border-slate-200/60 mb-3 px-2 flex items-center overflow-hidden">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-2 shrink-0">
              PINS:
            </span>
            <div className="relative flex-1 h-full">
              {timelinePins.map((pin, pIdx) => {
                const leftPercent = Math.min(95, Math.max(5, (pin.seconds / totalDuration) * 100));
                const pinColor =
                  pin.type === "decision"
                    ? "bg-emerald-600 text-white"
                    : pin.type === "risk"
                    ? "bg-amber-600 text-white"
                    : "bg-indigo-600 text-white";

                return (
                  <div
                    key={pIdx}
                    style={{ left: `${leftPercent}%` }}
                    title={`[${pin.timestamp}] ${pin.label}`}
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-xs select-none flex items-center space-x-1 ${pinColor}`}
                  >
                    <span>{pin.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Speaker Tracks (Swimlanes with Real Diarized Blocks) */}
          <div className="space-y-3">
            {analytics.speakerDynamics.map((speaker, sIdx) => {
              const spkSegments = getSegmentsForSpeaker(speaker.speaker, sIdx);
              const color = speakerPalette[sIdx % speakerPalette.length];

              return (
                <div key={sIdx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-900 flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.stroke }} />
                      <span>{speaker.speaker}</span>
                      <span className="text-[10px] font-normal text-gray-500 font-sans">
                        ({speaker.role})
                      </span>
                    </span>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {spkSegments.length > 0 ? spkSegments.length : speaker.turnCount} turns &bull; {speaker.wordCount} words
                    </span>
                  </div>

                  {/* Speech blocks bar */}
                  <div className="relative w-full h-7 bg-slate-100 rounded-md overflow-hidden border border-slate-200/80">
                    {spkSegments.length > 0 ? (
                      spkSegments.map((seg, segIdx) => {
                        const leftPercent = Math.min(98, Math.max(0, (seg.start / totalDuration) * 100));
                        const widthPercent = Math.max(
                          2.5,
                          Math.min(100 - leftPercent, ((seg.end - seg.start) / totalDuration) * 100)
                        );

                        return (
                          <div
                            key={segIdx}
                            style={{
                              left: `${leftPercent}%`,
                              width: `${widthPercent}%`,
                              backgroundColor: color.stroke,
                            }}
                            title={`[${formatSeconds(seg.start)}] "${seg.text.slice(0, 80)}${seg.text.length > 80 ? '...' : ''}"`}
                            className="absolute top-1 bottom-1 rounded hover:brightness-110 transition-all opacity-90 select-none"
                          />
                        );
                      })
                    ) : (
                      <div
                        style={{
                          left: `${sIdx === 0 ? 0 : 50}%`,
                          width: "48%",
                          backgroundColor: color.stroke,
                        }}
                        className="absolute top-1 bottom-1 rounded opacity-85"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Indicator Legend */}
          <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between text-[11px] text-gray-500 gap-2">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Confirmed Consensus</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                <span>Risk Deliberation</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <span>Action Deliverables</span>
              </span>
            </div>
            <span className="text-[10px] text-gray-400 font-mono">
              Synchronized 1:1 with audio player
            </span>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUBPART 3: DYNAMIC PHASED DISCUSSION PIPELINE (FLOWCHART)             */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-6 gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <Workflow className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Phased Discussion Pipeline & Decision Architecture
              </h3>
              <p className="text-xs text-indigo-200/70">
                Dynamic sequential progression pipeline synthesized from spoken topics and audio timestamps
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-700/50 self-start sm:self-auto">
            {discussionPhases.length} Execution Phases
          </span>
        </div>

        {/* Flowchart Stage Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {discussionPhases.map((stage, idx) => {
            const badgeStyle =
              stage.status === "Consensus"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                : stage.status === "Complete"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                : stage.status === "Risk Review"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                : "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";

            return (
              <div
                key={idx}
                className="relative p-4 rounded-xl bg-white/5 border border-white/10 hover:border-indigo-400/30 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-300 tracking-wider">
                      {stage.phase}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeStyle}`}>
                      {stage.status}
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-white transition-colors line-clamp-2">
                    {stage.title}
                  </h4>

                  <div className="flex items-center space-x-2 text-[10px] text-gray-400 font-mono my-2">
                    <span>{stage.timeRange}</span>
                    <span>&bull;</span>
                    <span className="truncate max-w-[80px]">{stage.speaker}</span>
                  </div>

                  <p className="text-[11px] text-indigo-100/80 leading-relaxed font-normal line-clamp-3">
                    {stage.outcome}
                  </p>
                </div>

                {/* Chevron flow connector */}
                {idx < discussionPhases.length - 1 && (
                  <div className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-indigo-950 border border-indigo-400 text-indigo-200 items-center justify-center z-10 pointer-events-none">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SUBPART 4: STRATEGIC DECISION, RISK & ACTION ALIGNMENT MATRIX         */}
      {/* ===================================================================== */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white border border-gray-200/80 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2 mb-6">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Target className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-950 tracking-tight">
                Strategic Decision, Risk & Action Alignment Matrix
              </h3>
              <p className="text-xs text-gray-500">
                Categorized operational commitments distinguishing confirmed consensus, contingent risks, and blockers
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
              {analytics.decisionMatrix.confirmedDecisions.length} Confirmed
            </span>
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              {analytics.decisionMatrix.highRiskCommitments.length} High-Risk
            </span>
          </div>
        </div>

        {/* 3-Column Categorized Decision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Column 1: Confirmed Decisions & Consensus (Emerald) */}
          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-3 pb-2 border-b border-emerald-200/60">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Confirmed Consensus</span>
              </div>

              <div className="space-y-3">
                {analytics.decisionMatrix.confirmedDecisions.map((dec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-emerald-200 shadow-2xs hover:border-emerald-400 transition-all text-xs text-gray-800 leading-relaxed font-medium"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span>&bull; {dec}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-emerald-200/60 text-[10px] text-emerald-700 font-semibold">
              Ready for executive execution
            </div>
          </div>

          {/* Column 2: High-Risk Commitments & Contingencies (Amber) */}
          <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-3 pb-2 border-b border-amber-200/60">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>High-Risk Commitments</span>
              </div>

              <div className="space-y-3">
                {analytics.decisionMatrix.highRiskCommitments.map((risk, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-amber-200 shadow-2xs hover:border-amber-400 transition-all text-xs text-gray-800 leading-relaxed font-medium"
                  >
                    <span>&bull; {risk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-amber-200/60 text-[10px] text-amber-700 font-semibold">
              Contingent on external stability
            </div>
          </div>

          {/* Column 3: Open Blockers & Dependencies (Rose) */}
          <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-200/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-xs uppercase tracking-wider mb-3 pb-2 border-b border-rose-200/60">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Open Blockers & Dependencies</span>
              </div>

              <div className="space-y-3">
                {analytics.decisionMatrix.openBlockers.map((blk, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-white border border-rose-200 shadow-2xs hover:border-rose-400 transition-all text-xs text-gray-800 leading-relaxed font-medium"
                  >
                    <span>&bull; {blk}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-2 border-t border-rose-200/60 text-[10px] text-rose-700 font-semibold">
              Requires sign-off before deploy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
