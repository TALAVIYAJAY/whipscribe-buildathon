/**
 * Intelligence Extraction Engine
 * Processes WhipScribe transcript segments into structured takeaways,
 * action items, decisions, and timestamped highlights.
 */

import { WhipScribeSegment, WhipScribeTranscriptResult } from "./whipscribe";

export interface DetailedTopic {
  topic: string;
  details: string[];
}

export interface HighlightMoment {
  seconds: number;
  timestamp: string; // "MM:SS" or "HH:MM:SS"
  speaker: string;
  quote: string;
  topic?: string;
  significance?: string;
}

export interface ExtractedIntelligence {
  title: string;
  overview?: string; // Executive overview narrative
  quickTakeaways?: string[]; // 3 quick glance bullet points
  detailedTopics?: DetailedTopic[]; // Deep dive broken down by topic
  summaryBulletPoints: string[];
  actionItems: string[];
  keyDecisions?: string[];
  openQuestions: string[];
  keyMoments: HighlightMoment[];
  airtablePayload: {
    summaryText: string;
    actionItemsText: string;
    timestampsText: string;
  };
}

/**
 * Format seconds into MM:SS or HH:MM:SS
 */
export function formatSeconds(totalSeconds: number): string {
  const secs = Math.floor(totalSeconds);
  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainingSeconds = secs % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
}

/**
 * Extract intelligence from transcript text and segments
 */
export function extractIntelligence(
  transcript: WhipScribeTranscriptResult,
  fallbackTitle: string = "Audio Intelligence Brief"
): ExtractedIntelligence {
  const segments = transcript.segments || [];
  const fullText = transcript.text || segments.map((s) => s.text).join(" ");

  // 1. Identify key highlights and moments with exact timestamps
  const keyMoments: HighlightMoment[] = [];
  const actionCandidates: string[] = [];
  const questionCandidates: string[] = [];
  const summarySentences: string[] = [];

  // Keywords that indicate actions, decisions, or commitments
  const actionRegex = /\b(will|should|need to|must|action item|follow up|let's|going to|deadline|assign|take care of)\b/i;
  const decisionRegex = /\b(decided|agreed|conclusion|we decided|consensus|chosen|plan is)\b/i;

  segments.forEach((seg, idx) => {
    const text = seg.text.trim();
    if (!text) return;

    // Check for questions
    if (text.includes("?")) {
      const questions = text.split("?").filter((q) => q.trim().length > 10);
      questions.forEach((q) => questionCandidates.push(`${q.trim()}?`));
    }

    // Check for actions / commitments
    if (actionRegex.test(text) || decisionRegex.test(text)) {
      actionCandidates.push(`[${formatSeconds(seg.start)}] ${seg.speaker ? `${seg.speaker}: ` : ""}${text}`);
    }

    // Select high-value moments across the timeline (beginning, middle milestones, end)
    const isFirst = idx === 0;
    const isLast = idx === segments.length - 1;
    const isSignificant = text.length > 50 && (actionRegex.test(text) || decisionRegex.test(text) || idx % 4 === 0);

    if (isFirst || isLast || isSignificant) {
      if (keyMoments.length < 10) {
        keyMoments.push({
          seconds: Math.round(seg.start),
          timestamp: formatSeconds(seg.start),
          speaker: seg.speaker || "Speaker",
          quote: text,
        });
      }
    }
  });

  // 2. Generate Executive Summary
  // Group sentences and extract the most prominent ideas
  const rawSentences = fullText
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  if (rawSentences.length > 0) {
    summarySentences.push(rawSentences[0]);
    if (rawSentences.length > 2) {
      const mid = Math.floor(rawSentences.length / 2);
      summarySentences.push(rawSentences[mid]);
    }
    if (rawSentences.length > 4) {
      summarySentences.push(rawSentences[rawSentences.length - 2]);
    }
    if (rawSentences.length > 1 && !summarySentences.includes(rawSentences[rawSentences.length - 1])) {
      summarySentences.push(rawSentences[rawSentences.length - 1]);
    }
  } else {
    summarySentences.push("Transcript processed successfully with speaker diarization.");
  }

  // 3. Deduplicate and limit candidates
  const actionItems = Array.from(new Set(actionCandidates)).slice(0, 6);
  if (actionItems.length === 0) {
    actionItems.push("Review transcript highlights and confirm next milestone deliverables.");
    actionItems.push("Share intelligence brief with relevant stakeholders.");
  }

  const openQuestions = Array.from(new Set(questionCandidates)).slice(0, 4);

  // 4. Format strings for Airtable fields
  const summaryText = summarySentences.map((s) => `• ${s}.`).join("\n\n");

  const actionParts: string[] = [];
  if (actionItems.length > 0) {
    actionParts.push("### Action Items & Next Steps:\n" + actionItems.map((a, i) => `${i + 1}. ${a}`).join("\n"));
  }
  if (openQuestions.length > 0) {
    actionParts.push("### Key Questions Discussed:\n" + openQuestions.map((q) => `? ${q}`).join("\n"));
  }
  const actionItemsText = actionParts.join("\n\n");

  const timestampsText = keyMoments
    .map((m) => `[${m.timestamp}] (${m.speaker}): "${m.quote.slice(0, 120)}${m.quote.length > 120 ? "..." : ""}"`)
    .join("\n\n");

  // Derive a smart title if available
  let title = fallbackTitle;
  if (rawSentences[0] && rawSentences[0].length < 80) {
    title = rawSentences[0];
  }

  return {
    title,
    summaryBulletPoints: summarySentences,
    actionItems,
    openQuestions,
    keyMoments,
    airtablePayload: {
      summaryText,
      actionItemsText,
      timestampsText,
    },
  };
}
