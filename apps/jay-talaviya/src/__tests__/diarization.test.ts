import { describe, it, expect } from "vitest";
import { normalizeTranscriptDiarization } from "../lib/intelligence";
import { WhipScribeTranscriptResult } from "../lib/whipscribe";

describe("Multi-Speaker Diarization Normalization Engine", () => {
  it("preserves legitimate multi-speaker labels when already provided by WhipScribe", () => {
    const rawTranscript: WhipScribeTranscriptResult = {
      text: "Hello Sarah. Hi Alex, let's review the API.",
      duration: 12,
      segments: [
        { start: 0, end: 5, text: "Hello Sarah.", speaker: "Alex" },
        { start: 6, end: 12, text: "Hi Alex, let's review the API.", speaker: "Sarah" },
      ],
    };

    const normalized = normalizeTranscriptDiarization(rawTranscript);
    expect(normalized.segments).toHaveLength(2);
    expect(normalized.segments[0].speaker).toBe("Alex");
    expect(normalized.segments[1].speaker).toBe("Sarah");
  });

  it("gracefully resolves null or undefined speaker labels on short multi-turn audio", () => {
    const rawTranscript: WhipScribeTranscriptResult = {
      text: "Hey Alex, are we ready for the migration? Yes Sarah, database schema is locked.",
      duration: 20,
      segments: [
        { start: 0, end: 8, text: "Hey Alex, are we ready for the migration?", speaker: null as any },
        { start: 9, end: 20, text: "Yes Sarah, database schema is locked.", speaker: undefined as any },
      ],
    };

    const normalized = normalizeTranscriptDiarization(rawTranscript);
    expect(normalized.segments).toHaveLength(2);
    expect(normalized.segments[0].speaker).toBeTruthy();
    expect(normalized.segments[1].speaker).toBeTruthy();
    expect(normalized.segments[0].speaker).not.toBe(normalized.segments[1].speaker);
  });

  it("corrects generic single-speaker 'Speaker' labels when multiple parties alternate", () => {
    const rawTranscript: WhipScribeTranscriptResult = {
      text: "How is the Airtable sync progressing? The sync pipeline is passing all 6 tests now.",
      duration: 30,
      segments: [
        { start: 0, end: 14, text: "How is the Airtable sync progressing?", speaker: "Speaker" },
        { start: 15, end: 30, text: "The sync pipeline is passing all 6 tests now.", speaker: "Speaker" },
      ],
    };

    const normalized = normalizeTranscriptDiarization(rawTranscript);
    expect(normalized.segments).toHaveLength(2);
    expect(normalized.segments[0].speaker).not.toBe("Speaker");
    expect(normalized.segments[1].speaker).not.toBe("Speaker");
  });

  it("handles empty segment arrays without throwing runtime errors", () => {
    const rawTranscript: WhipScribeTranscriptResult = {
      text: "",
      duration: 0,
      segments: [],
    };

    const normalized = normalizeTranscriptDiarization(rawTranscript);
    expect(normalized.segments).toEqual([]);
    expect(normalized.text).toBe("");
  });

  it("handles single-speaker monologue without creating artificial phantom speakers", () => {
    const rawTranscript: WhipScribeTranscriptResult = {
      text: "Good morning team. This is the weekly architecture overview. We completed Phase 1.",
      duration: 25,
      segments: [
        { start: 0, end: 10, text: "Good morning team. This is the weekly architecture overview.", speaker: "Lead" },
        { start: 11, end: 25, text: "We completed Phase 1.", speaker: "Lead" },
      ],
    };

    const normalized = normalizeTranscriptDiarization(rawTranscript);
    expect(normalized.segments).toHaveLength(2);
    expect(normalized.segments[0].speaker).toBe("Lead");
    expect(normalized.segments[1].speaker).toBe("Lead");
  });

  it("enforces strict timestamp chronological monotonicity across turns", () => {
    const rawTranscript: WhipScribeTranscriptResult = {
      text: "Turn 1. Turn 2. Turn 3.",
      duration: 45,
      segments: [
        { start: 0, end: 12, text: "Turn 1.", speaker: "Speaker 1" },
        { start: 13, end: 27, text: "Turn 2.", speaker: "Speaker 2" },
        { start: 28, end: 45, text: "Turn 3.", speaker: "Speaker 1" },
      ],
    };

    const normalized = normalizeTranscriptDiarization(rawTranscript);
    for (let i = 1; i < normalized.segments.length; i++) {
      expect(normalized.segments[i].start).toBeGreaterThanOrEqual(normalized.segments[i - 1].start);
      expect(normalized.segments[i].end).toBeGreaterThan(normalized.segments[i].start);
    }
  });

  it("preserves segment text integrity without altering words or casing", () => {
    const rawText = "WhipScribe API & Temporal Gemini 3.5 Flash pipeline.";
    const rawTranscript: WhipScribeTranscriptResult = {
      text: rawText,
      duration: 15,
      segments: [
        { start: 0, end: 15, text: rawText, speaker: "Engineer" },
      ],
    };

    const normalized = normalizeTranscriptDiarization(rawTranscript);
    expect(normalized.segments[0].text).toBe(rawText);
  });

  it("handles transcripts with 3+ alternating speakers seamlessly", () => {
    const rawTranscript: WhipScribeTranscriptResult = {
      text: "Alex: I agree. Sarah: Let's test it. Marcus: Deployed.",
      duration: 35,
      segments: [
        { start: 0, end: 10, text: "I agree on the plan.", speaker: "Alex" },
        { start: 11, end: 22, text: "Let's test it thoroughly.", speaker: "Sarah" },
        { start: 23, end: 35, text: "Deployed to Vercel edge.", speaker: "Marcus" },
      ],
    };

    const normalized = normalizeTranscriptDiarization(rawTranscript);
    const speakers = new Set(normalized.segments.map((s) => s.speaker));
    expect(speakers.size).toBe(3);
    expect(speakers.has("Alex")).toBe(true);
    expect(speakers.has("Sarah")).toBe(true);
    expect(speakers.has("Marcus")).toBe(true);
  });
});
