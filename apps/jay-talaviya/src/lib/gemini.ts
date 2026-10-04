/**
 * Google Gemini AI Service
 * Adopts robust parsing, multi-tier regex extraction, exponential backoff retries,
 * model fallbacks, schema validation, and behavioral meeting analytics extraction.
 */

import {
  ExtractedIntelligence,
  HighlightMoment,
  MeetingAnalytics,
  SpeakerDynamic,
  SentimentMoment,
  formatSeconds,
} from "./intelligence";
import { WhipScribeTranscriptResult } from "./whipscribe";

interface RawGeminiAnalytics {
  health_score?: number;
  efficiency_level?: string;
  signal_to_noise?: string;
  speaking_pace_wpm?: number;
  pace_label?: string;
  speaker_dynamics?: Array<{
    speaker?: string;
    share_percent?: number;
    turn_count?: number;
    word_count?: number;
    role?: string;
  }>;
  sentiment_timeline?: Array<{
    timestamp?: string;
    phase?: string;
    sentiment?: string;
    note?: string;
    is_peak_tension?: boolean;
  }>;
  decision_matrix?: {
    confirmed_decisions?: string[];
    high_risk_commitments?: string[];
    open_blockers?: string[];
  };
}

interface RawGeminiOutput {
  title?: string;
  short_summary?: {
    overview?: string;
    quick_takeaways?: string[];
  };
  detailed_topics?: Array<{
    topic?: string;
    details?: string[];
  }>;
  overview?: string;
  summary?: string[] | string;
  action_items?: string[] | string;
  key_decisions?: string[] | string;
  open_questions?: string[] | string;
  key_moments?: Array<{
    timestamp?: string;
    speaker?: string;
    topic?: string;
    quote?: string;
    significance?: string;
  }>;
  analytics?: RawGeminiAnalytics;
}

/**
 * 1. Clean Markdown code blocks (```json ... ```)
 */
export function cleanGeminiResponse(rawResponse: string): string {
  if (!rawResponse) return "";
  let text = rawResponse.trim();
  const mdMatch = text.match(/```(?:json)?([\s\S]*?)```/);
  if (mdMatch && mdMatch[1]) {
    text = mdMatch[1].trim();
  }
  return text;
}

/**
 * 2. Multi-stage resilient JSON extraction:
 * Stage 1: Standard JSON.parse
 * Stage 2: Substring slice from first '{' to last '}'
 * Stage 3: Regex pattern match for structured blocks
 */
export function extractJsonFromResponse(rawResponse: string): RawGeminiOutput | null {
  const cleanedText = cleanGeminiResponse(rawResponse);

  // Stage 1: Direct parse
  try {
    return JSON.parse(cleanedText);
  } catch {
    // Stage 1 failed, proceed to Stage 2
  }

  // Stage 2: Locate outer braces
  try {
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const slice = cleanedText.slice(firstBrace, lastBrace + 1);
      return JSON.parse(slice);
    }
  } catch {
    // Stage 2 failed, proceed to Stage 3
  }

  // Stage 3: Regex pattern matching for key fields
  try {
    const pattern = /\{[\s\S]*?"title"[\s\S]*?"summary"[\s\S]*?\}/;
    const match = cleanedText.match(pattern);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {
    // Stage 3 failed
  }

  return null;
}

/**
 * Strip confusing tags like [UNRESOLVED / RISK], [Owner: Unassigned], [DECISION], etc.
 */
export function stripConfusingTags(str: string): string {
  if (!str) return "";
  return str
    .replace(/^\[(UNRESOLVED\s*\/?\s*RISK|UNRESOLVED|RISK|DECISION|DIRECTION|AGREEMENT|ACTION|TASK)\]\s*/gi, "")
    .replace(/\[Owner:\s*(Unassigned|Unknown|None)\]\s*/gi, "")
    .replace(/\[Unassigned\]\s*/gi, "")
    .replace(/^Unassigned:\s*/gi, "")
    .replace(/\s*-\s*Unassigned$/gi, "")
    .replace(/\[(HIGH|MEDIUM|LOW)\s*PRIORITY\]\s*/gi, "")
    .trim();
}

/**
 * Identify retryable Gemini errors (e.g., 429, 503, model overloaded)
 */
export function isModelUnavailableOrRetryable(error: unknown): boolean {
  const errStr = String(error).toLowerCase();
  return (
    errStr.includes("429") ||
    errStr.includes("quota") ||
    errStr.includes("rate limit") ||
    errStr.includes("503") ||
    errStr.includes("overloaded") ||
    errStr.includes("resource_exhausted") ||
    errStr.includes("temporarily unavailable") ||
    errStr.includes("timed out") ||
    errStr.includes("aborterror")
  );
}

/**
 * Execute a single Gemini API request with timeout
 */
async function callGeminiApi(
  apiKey: string,
  model: string,
  prompt: string,
  timeoutMs: number = 30000
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const json = await res.json();
    return json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  } catch (err: unknown) {
    const errObj = err as { name?: string; message?: string };
    if (errObj?.name === "AbortError" || errObj?.message?.includes("aborted")) {
      throw new Error(`Gemini API request timed out after ${timeoutMs / 1000}s (AbortError)`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Main Gemini synthesis function with primary/backup models, exponential backoff,
 * and comprehensive behavioral meeting analytics extraction.
 */
export async function extractIntelligenceWithGemini(
  transcript: WhipScribeTranscriptResult,
  fallbackTitle: string = "Audio Intelligence Brief"
): Promise<ExtractedIntelligence | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const primaryModel = process.env.GEMINI_PRIMARY_MODEL || "gemini-3.5-flash-lite";
  const backupModel = process.env.GEMINI_BACKUP_MODEL || "gemini-3.5-flash";

  const models = [primaryModel, backupModel].filter(Boolean);

  // Format diarized transcript
  const formattedTranscript = (transcript.segments || [])
    .map((s) => {
      const mins = Math.floor(s.start / 60);
      const secs = Math.floor(s.start % 60);
      const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
      return `[${timeStr}] ${s.speaker || "Speaker"}: ${s.text}`;
    })
    .join("\n");

  const prompt = `You are an elite Executive Chief of Staff and Principal Meeting Intelligence Analyst at a top-tier technology company.
Analyze the following diarized transcript and produce an extraordinary, publication-grade intelligence briefing in the style of Google Meet AI notes and Gong.io executive analytics.
You must return BOTH the substantive briefing (overview, topics, decisions, action items, quotes) AND a complete behavioral analytics evaluation (health score, speaker dynamics, sentiment trajectory, and decision matrix).

TRANSCRIPT:
"""
${formattedTranscript.slice(0, 150000)}
"""

You MUST return ONLY a strictly valid JSON object matching this exact schema (no commentary outside the JSON):
{
  "title": "A compelling headline capturing the core objective and milestone (max 10 words)",
  "short_summary": {
    "overview": "A 2-3 sentence executive summary narrative explaining the trigger for this meeting, the core pivot or consensus reached, and the downstream business/engineering impact.",
    "quick_takeaways": [
      "Immediate takeaway 1 (e.g. Core architectural or strategic pivot agreed upon)",
      "Immediate takeaway 2 (e.g. Primary risk or blocker identified with mitigation)",
      "Immediate takeaway 3 (e.g. Next critical milestone deadline and owner)"
    ]
  },
  "detailed_topics": [
    {
      "topic": "Topic Heading 1 (e.g. Database Architecture & Cost Evaluation)",
      "details": [
        "In-depth analysis of the background challenge, inefficiencies, or user needs addressed.",
        "Specific options, tools, or designs evaluated, including hard metrics, percentages, costs, or benchmark figures cited.",
        "Key trade-offs, debates, or objections raised by attendees and how consensus was established."
      ]
    },
    {
      "topic": "Topic Heading 2 (e.g. Cutover Strategy, Risks & Safety Fallback)",
      "details": [
        "Comprehensive breakdown of operational execution steps, deadlines, and team dependencies.",
        "Failure modes evaluated, fallback redundancy plans, and risk mitigation strategies."
      ]
    }
  ],
  "action_items": [
    "Explicit deliverable with context and target timeframe (e.g. Write data migration script and coordinate with DevSecOps by Friday)"
  ],
  "key_decisions": [
    "Specific architectural, business, or operational choice agreed upon, including the rationale"
  ],
  "open_questions": [
    "Important question, risk, or consideration discussed during the call"
  ],
  "key_moments": [
    {
      "timestamp": "MM:SS",
      "speaker": "SPEAKER_XX",
      "topic": "Topic milestone (e.g. Architecture Pivot, Pricing Agreement, Root Cause)",
      "quote": "Exact verbatim quote from the transcript",
      "significance": "Why this specific statement was pivotal to the outcome of the discussion"
    }
  ],
  "analytics": {
    "health_score": 88,
    "efficiency_level": "High Execution",
    "signal_to_noise": "82% Actionable",
    "speaking_pace_wpm": 145,
    "pace_label": "Optimal",
    "speaker_dynamics": [
      {
        "speaker": "SPEAKER_00",
        "share_percent": 60,
        "turn_count": 12,
        "word_count": 480,
        "role": "Lead / Decision Maker"
      },
      {
        "speaker": "SPEAKER_01",
        "share_percent": 40,
        "turn_count": 10,
        "word_count": 320,
        "role": "Technical Contributor"
      }
    ],
    "sentiment_timeline": [
      {
        "timestamp": "00:00",
        "phase": "Kickoff & Alignment",
        "sentiment": "Positive",
        "note": "Clear agenda framing and goal alignment"
      },
      {
        "timestamp": "02:30",
        "phase": "Core Deliberation",
        "sentiment": "Tension",
        "note": "Pushback regarding execution timeline and capacity constraints",
        "is_peak_tension": true
      },
      {
        "timestamp": "04:50",
        "phase": "Consensus & Action",
        "sentiment": "High Alignment",
        "note": "Final sign-off confirmed on rollout plan"
      }
    ],
    "decision_matrix": {
      "confirmed_decisions": [
        "Deploy Next.js architecture to Vercel Edge with zero-downtime cutover",
        "Conduct weekly milestone reviews on Mondays"
      ],
      "high_risk_commitments": [
        "Deliver completed data validation suite before Friday deadline"
      ],
      "open_blockers": [
        "Pending security token approval from external vendor"
      ]
    }
  }
}

STRICT QUALITY RULES:
1. Provide BOTH the concise high-level short summary and the comprehensive multi-topic detailed breakdown.
2. Group the detailed breakdown into 2 to 6 distinct, meaningful topic themes. Every detail bullet must be substantive, informative, and concrete with any concepts, tools, steps, numbers, latency figures, costs, or timelines mentioned.
3. Ground every point directly in the transcript text. Do not invent details not supported by the transcript.
4. Calculate realistic analytics matching the transcript content: health_score between 70 and 98, accurate speaker share percentages summing to 100%, and genuine sentiment trajectory phases.`;

  // Attempt models sequentially with retry backoff
  for (const model of models) {
    const maxAttempts = 2;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const rawJsonText = await callGeminiApi(apiKey, model, prompt, 35000);
        if (!rawJsonText) {
          throw new Error("Received empty response candidate from Gemini");
        }

        const parsed = extractJsonFromResponse(rawJsonText);
        if (!parsed) {
          throw new Error("Failed to parse valid JSON from Gemini output");
        }

        // Title sanitization
        let title = fallbackTitle;
        if (parsed.title && typeof parsed.title === "string" && parsed.title.trim().length > 3) {
          title = parsed.title.trim();
        }

        // Short Summary fields
        const overview = parsed.short_summary?.overview?.trim() || parsed.overview?.trim() || "";
        const quickTakeaways = Array.isArray(parsed.short_summary?.quick_takeaways)
          ? parsed.short_summary.quick_takeaways.map(String).filter((t) => t.trim().length > 0)
          : [];

        // Detailed Topics
        const detailedTopics: Array<{ topic: string; details: string[] }> = [];
        if (Array.isArray(parsed.detailed_topics)) {
          parsed.detailed_topics.forEach((dt) => {
            if (dt && dt.topic) {
              const details = Array.isArray(dt.details)
                ? dt.details.map(String).filter((d) => d.trim().length > 0)
                : [];
              if (details.length > 0) {
                detailedTopics.push({
                  topic: String(dt.topic).trim(),
                  details,
                });
              }
            }
          });
        }

        let summaryBulletPoints: string[] = [];
        if (detailedTopics.length > 0) {
          detailedTopics.forEach((t) => {
            t.details.forEach((d) => {
              summaryBulletPoints.push(`${t.topic}: ${d}`);
            });
          });
        } else if (Array.isArray(parsed.summary)) {
          summaryBulletPoints = parsed.summary.map(String).filter((s) => s.trim().length > 0);
        } else if (typeof parsed.summary === "string" && parsed.summary.trim()) {
          summaryBulletPoints = [parsed.summary.trim()];
        }
        if (summaryBulletPoints.length === 0) {
          summaryBulletPoints = ["Executive briefing synthesized from diarized conversation."];
        }

        const actionItems: string[] = [];
        if (Array.isArray(parsed.action_items)) {
          parsed.action_items.forEach((item) => {
            if (item) {
              const cleaned = stripConfusingTags(String(item));
              if (cleaned) actionItems.push(cleaned);
            }
          });
        }
        if (actionItems.length === 0) {
          actionItems.push("Review transcript highlights and confirm next deliverables.");
        }

        const keyDecisions: string[] = [];
        if (Array.isArray(parsed.key_decisions)) {
          parsed.key_decisions.forEach((dec) => {
            if (dec) {
              const cleaned = stripConfusingTags(String(dec));
              if (cleaned) keyDecisions.push(cleaned);
            }
          });
        }

        let openQuestions: string[] = [];
        if (Array.isArray(parsed.open_questions)) {
          parsed.open_questions.forEach((q) => {
            if (q) {
              const cleaned = stripConfusingTags(String(q));
              if (cleaned) openQuestions.push(cleaned);
            }
          });
        }

        const keyMoments: HighlightMoment[] = [];
        if (Array.isArray(parsed.key_moments)) {
          parsed.key_moments.forEach((m) => {
            if (m && m.quote) {
              const ts = m.timestamp || "00:00";
              const parts = ts.split(":");
              const seconds = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
              keyMoments.push({
                seconds,
                timestamp: ts,
                speaker: m.speaker || "Speaker",
                topic: m.topic || "Discussion Milestone",
                quote: String(m.quote).trim(),
                significance: m.significance ? String(m.significance).trim() : undefined,
              });
            }
          });
        }

        // Parse and validate Meeting Analytics
        const rawAnalytics = parsed.analytics;
        const rawHealth = Number(rawAnalytics?.health_score);
        const healthScore = !isNaN(rawHealth) && rawHealth > 0 ? Math.min(98, Math.max(65, Math.round(rawHealth))) : 86;

        const efficiencyLevel =
          rawAnalytics?.efficiency_level?.trim() ||
          (healthScore >= 88 ? "High Execution" : healthScore >= 78 ? "Collaborative Sync" : "Exploratory");

        const signalToNoiseRatio =
          rawAnalytics?.signal_to_noise?.trim() ||
          `${Math.min(92, Math.max(70, Math.round(75 + actionItems.length * 3)))}% Actionable`;

        const rawWpm = Number(rawAnalytics?.speaking_pace_wpm);
        const speakingPaceWpm = !isNaN(rawWpm) && rawWpm > 0 ? Math.min(220, Math.max(90, Math.round(rawWpm))) : 142;
        const paceLabel = rawAnalytics?.pace_label?.trim() || (speakingPaceWpm > 165 ? "Rapid" : speakingPaceWpm < 120 ? "Deliberate" : "Optimal");

        // Speaker dynamics validation
        const speakerDynamics: SpeakerDynamic[] = [];
        if (Array.isArray(rawAnalytics?.speaker_dynamics) && rawAnalytics.speaker_dynamics.length > 0) {
          rawAnalytics.speaker_dynamics.forEach((sd) => {
            if (sd && sd.speaker) {
              speakerDynamics.push({
                speaker: String(sd.speaker).trim(),
                sharePercent: Math.min(100, Math.max(5, Math.round(Number(sd.share_percent) || 50))),
                turnCount: Math.max(1, Math.round(Number(sd.turn_count) || 4)),
                wordCount: Math.max(10, Math.round(Number(sd.word_count) || 200)),
                role: String(sd.role || "Collaborator").trim(),
              });
            }
          });
        }

        // If Gemini omitted speaker dynamics, derive fallback from transcript segments
        if (speakerDynamics.length === 0) {
          const segs = transcript.segments || [];
          const speakerSet = new Set<string>();
          segs.forEach((s) => speakerSet.add(s.speaker || "Speaker 1"));
          const speakers = Array.from(speakerSet);
          const perShare = Math.round(100 / (speakers.length || 1));
          speakers.forEach((spk, idx) => {
            speakerDynamics.push({
              speaker: spk,
              sharePercent: idx === 0 ? 100 - perShare * (speakers.length - 1) : perShare,
              turnCount: Math.max(2, Math.round(segs.filter((s) => s.speaker === spk).length)),
              wordCount: 250,
              role: idx === 0 ? "Lead / Decision Maker" : "Technical Contributor",
            });
          });
        }

        // Sentiment timeline validation
        const sentimentTimeline: SentimentMoment[] = [];
        if (Array.isArray(rawAnalytics?.sentiment_timeline) && rawAnalytics.sentiment_timeline.length > 0) {
          rawAnalytics.sentiment_timeline.forEach((st) => {
            if (st && st.phase) {
              const ts = st.timestamp || "00:00";
              const parts = ts.split(":");
              const seconds = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
              sentimentTimeline.push({
                timestamp: ts,
                seconds,
                phase: String(st.phase).trim(),
                sentiment: (st.sentiment as "Positive" | "Neutral" | "Tension" | "High Alignment") || "Neutral",
                note: String(st.note || "").trim(),
                isPeakTension: Boolean(st.is_peak_tension),
              });
            }
          });
        }

        // Decision matrix validation
        const confirmedDecisions =
          Array.isArray(rawAnalytics?.decision_matrix?.confirmed_decisions) &&
          rawAnalytics.decision_matrix.confirmed_decisions.length > 0
            ? rawAnalytics.decision_matrix.confirmed_decisions.map(String).map(stripConfusingTags)
            : keyDecisions.length > 0
            ? keyDecisions
            : ["Consensus reached on architecture and delivery scope.", "Proceed with scheduled execution roadmap."];

        const highRiskCommitments =
          Array.isArray(rawAnalytics?.decision_matrix?.high_risk_commitments) &&
          rawAnalytics.decision_matrix.high_risk_commitments.length > 0
            ? rawAnalytics.decision_matrix.high_risk_commitments.map(String).map(stripConfusingTags)
            : actionItems.slice(0, 2);

        const openBlockers =
          Array.isArray(rawAnalytics?.decision_matrix?.open_blockers) &&
          rawAnalytics.decision_matrix.open_blockers.length > 0
            ? rawAnalytics.decision_matrix.open_blockers.map(String).map(stripConfusingTags)
            : openQuestions.length > 0
            ? openQuestions
            : ["Confirm final stakeholder sign-off prior to production deployment."];

        const analytics: MeetingAnalytics = {
          healthScore,
          efficiencyLevel,
          signalToNoiseRatio,
          speakingPaceWpm,
          paceLabel,
          speakerDynamics,
          sentimentTimeline,
          decisionMatrix: {
            confirmedDecisions,
            highRiskCommitments,
            openBlockers,
          },
        };

        // Format for Airtable columns (100% UNTOUCHED SCHEMA)
        let summaryText = "";
        if (overview) {
          summaryText += `### Executive Summary\n${overview}\n\n`;
        }
        if (quickTakeaways.length > 0) {
          summaryText += `**Key Highlights:**\n` + quickTakeaways.map((t) => `• ${t}`).join("\n") + "\n\n";
        }
        if (detailedTopics.length > 0) {
          summaryText += `### Detailed Meeting Breakdown (By Topic)\n\n`;
          detailedTopics.forEach((t, i) => {
            summaryText += `#### ${i + 1}. ${t.topic}\n` + t.details.map((d) => `• ${d}`).join("\n") + "\n\n";
          });
        } else {
          summaryText += `### Key Strategic Takeaways\n` + summaryBulletPoints.map((b) => `• ${b}`).join("\n\n");
        }

        const actionParts: string[] = [];
        if (keyDecisions.length > 0) {
          actionParts.push(
            "### Key Decisions:\n" +
              keyDecisions.map((d, i) => `${i + 1}. ${d}`).join("\n")
          );
        }
        if (actionItems.length > 0) {
          actionParts.push(
            "### Action Items:\n" +
              actionItems.map((a, i) => `${i + 1}. ${a}`).join("\n")
          );
        }
        if (openQuestions.length > 0) {
          actionParts.push(
            "### Key Questions & Considerations:\n" +
              openQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")
          );
        }
        const actionItemsText = actionParts.join("\n\n");

        const timestampsText = keyMoments
          .map((m) => {
            let entry = `[${m.timestamp}] (${m.speaker})`;
            if (m.topic) entry += ` [${m.topic}]`;
            entry += `: "${m.quote}"`;
            if (m.significance) entry += `\n→ ${m.significance}`;
            return entry;
          })
          .join("\n\n");

        console.log(`[Gemini] Synthesis successfully completed using '${model}' with Meeting Analytics (health=${healthScore}, speakers=${speakerDynamics.length})`);

        return {
          title,
          overview,
          quickTakeaways,
          detailedTopics,
          summaryBulletPoints,
          actionItems,
          keyDecisions,
          openQuestions,
          keyMoments,
          analytics,
          airtablePayload: {
            summaryText,
            actionItemsText,
            timestampsText,
          },
        };
      } catch (err) {
        console.warn(`[Gemini] Model '${model}' Attempt ${attempt}/${maxAttempts} failed:`, err);

        if (attempt < maxAttempts && isModelUnavailableOrRetryable(err)) {
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        break;
      }
    }
  }

  // Graceful fallback to null so caller invokes rule-based engine
  console.warn(`[Gemini] All AI models failed. Falling back to offline rule-based extractor.`);
  return null;
}
