/**
 * Google Gemini AI Service
 * Adopts robust parsing, multi-tier regex extraction, exponential backoff retries,
 * model fallbacks, and schema validation inspired by production-grade LLM services.
 */

import { ExtractedIntelligence, HighlightMoment } from "./intelligence";
import { WhipScribeTranscriptResult } from "./whipscribe";

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
 * Helper to identify model unavailability, rate limits, or transient 5xx errors
 */
function isModelUnavailableOrRetryable(err: unknown): boolean {
  const errorStr = String(err).toLowerCase();
  const indicators = [
    "model not found",
    "unavailable",
    "not available",
    "service unavailable",
    "does not exist",
    "invalid model",
    "overloaded",
    "503",
    "500",
    "429",
    "resource exhausted",
    "quota",
    "timeout",
    "timed out",
    "abort",
    "the operation was aborted",
    "aborterror",
    "fetch failed",
    "econnreset",
  ];
  return indicators.some((i) => errorStr.includes(i));
}

/**
 * Execute a single HTTP call to Gemini with timeout
 */
async function callGeminiEndpoint(
  model: string,
  apiKey: string,
  prompt: string,
  timeoutMs: number = 60000
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
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
 * Main Gemini synthesis function with primary/backup models and exponential backoff
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


  const prompt = `You are an elite Executive Chief of Staff and Principal Intelligence Analyst at a top-tier technology company.
Analyze the following diarized transcript and produce an extraordinary, publication-grade intelligence briefing in the style of Google Meet AI notes, featuring BOTH a SHORT high-level snapshot and a DETAILED long-form breakdown.

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
        "Failure modes evaluated, fallback redundancy plans (e.g. dual-write period), and risk mitigation strategies."
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
  ]
}

STRICT QUALITY RULES:
1. Provide BOTH the concise high-level short summary and the comprehensive multi-topic detailed breakdown.
2. Group the detailed breakdown into 2 to 6 distinct, meaningful topic themes. Every detail bullet must be substantive, informative, and concrete with any concepts, tools, steps, numbers, latency figures, costs, or timelines mentioned.
3. Ground every point directly in the transcript text. Do not invent details not supported by the transcript.
4. Extract 4 to 10 key timeline anchor moments with exact timestamps corresponding to the speaker turns.
5. Write all action items, decisions, and questions cleanly in natural language without bracket tags like [DECISION] or [UNRESOLVED / RISK] or 'Unassigned'.`;

  for (const model of models) {
    // Retry loop with exponential backoff (up to 3 attempts per model)
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const rawText = await callGeminiEndpoint(model, apiKey, prompt, 60000);
        if (!rawText) throw new Error("Empty response from Gemini API");

        const parsed = extractJsonFromResponse(rawText);
        if (!parsed) {
          throw new Error("JSON parsing failed across all extraction stages");
        }

        // Schema validation and default fallbacks
        const title = (typeof parsed.title === "string" && parsed.title.trim())
          ? parsed.title.trim()
          : fallbackTitle;

        const overview = (typeof parsed.short_summary?.overview === "string" && parsed.short_summary.overview.trim())
          ? parsed.short_summary.overview.trim()
          : (typeof parsed.overview === "string" && parsed.overview.trim() ? parsed.overview.trim() : undefined);

        let quickTakeaways: string[] = [];
        if (Array.isArray(parsed.short_summary?.quick_takeaways)) {
          quickTakeaways = parsed.short_summary.quick_takeaways
            .map(String)
            .filter((t) => t.trim().length > 0);
        }

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

        // Format for Airtable columns with both Short and Long summaries
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

        console.log(`[Gemini] Synthesis successfully completed using '${model}' (${summaryText.length} chars summary, ${detailedTopics.length} topics, ${keyMoments.length} moments)`);

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
          airtablePayload: {
            summaryText,
            actionItemsText,
            timestampsText,
          },
        };
      } catch (err) {
        console.warn(`[Gemini] Model '${model}' Attempt ${attempt}/${maxAttempts} failed:`, err);

        if (attempt < maxAttempts && isModelUnavailableOrRetryable(err)) {
          // Exponential backoff: 1s, 2s, 4s...
          const backoffMs = Math.pow(2, attempt - 1) * 1000;
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        // If all attempts for this model failed, break out of retry loop to try backup model
        break;
      }
    }
  }

  // Graceful fallback to null so caller invokes rule-based engine
  console.warn(`[Gemini] All AI models failed. Falling back to offline rule-based extractor.`);
  return null;
}
