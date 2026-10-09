import { describe, it, expect } from "vitest";
import { extractIntelligence, formatSeconds } from "../lib/intelligence";
import { WhipScribeTranscriptResult } from "../lib/whipscribe";

describe("Meeting Intelligence & Health Suite Engine", () => {
  const sampleMeetingTranscript: WhipScribeTranscriptResult = {
    text: "Alex: Welcome everyone. Today we are deciding on the database schema migration to PostgreSQL. Sarah: I have reviewed the indexes, and we can execute the migration on Thursday night at 11 PM. Alex: Perfect, Sarah will own the migration script and Marcus will verify the backup snapshots. Let's make sure downtime is under 5 minutes.",
    duration: 120,
    segments: [
      { start: 0, end: 35, text: "Welcome everyone. Today we are deciding on the database schema migration to PostgreSQL.", speaker: "Alex" },
      { start: 36, end: 75, text: "I have reviewed the indexes, and we can execute the migration on Thursday night at 11 PM.", speaker: "Sarah" },
      { start: 76, end: 120, text: "Perfect, Sarah will own the migration script and Marcus will verify the backup snapshots. Let's make sure downtime is under 5 minutes.", speaker: "Alex" },
    ],
  };

  it("calculates deterministic Meeting Health Score bounded strictly between 0 and 100", () => {
    const intelligence = extractIntelligence(sampleMeetingTranscript, "Database Migration Sync");
    expect(intelligence.analytics).toBeDefined();
    const health = intelligence.analytics!.healthScore;
    expect(health).toBeGreaterThanOrEqual(0);
    expect(health).toBeLessThanOrEqual(100);
    expect(typeof health).toBe("number");
  });

  it("computes alignment, execution clarity, and signal-to-noise sub-metrics within valid ranges", () => {
    const intelligence = extractIntelligence(sampleMeetingTranscript, "Database Migration Sync");
    const analytics = intelligence.analytics!;

    expect(analytics.alignmentScore).toBeGreaterThanOrEqual(0);
    expect(analytics.alignmentScore).toBeLessThanOrEqual(100);

    expect(analytics.executionClarityScore).toBeGreaterThanOrEqual(0);
    expect(analytics.executionClarityScore).toBeLessThanOrEqual(100);

    expect(analytics.signalToNoiseRatio).toBeGreaterThanOrEqual(0);
    expect(analytics.signalToNoiseRatio).toBeLessThanOrEqual(100);
  });

  it("calculates realistic conversation pacing (Words Per Minute) based on audio duration", () => {
    const intelligence = extractIntelligence(sampleMeetingTranscript, "Database Migration Sync");
    const analytics = intelligence.analytics!;

    expect(analytics.pacingWPM).toBeGreaterThan(0);
    expect(analytics.pacingWPM).toBeLessThan(350); // Human speech upper threshold
    expect(["deliberate", "moderate", "fast"]).toContain(analytics.overallPacing);
  });

  it("extracts 3-way decision architecture categories: confirmed decisions, high-risk commitments, open blockers", () => {
    const intelligence = extractIntelligence(sampleMeetingTranscript, "Database Migration Sync");
    const decArch = intelligence.analytics!.decisionsArchitecture;

    expect(decArch).toBeDefined();
    expect(Array.isArray(decArch.confirmedDecisions)).toBe(true);
    expect(Array.isArray(decArch.highRiskCommitments)).toBe(true);
    expect(Array.isArray(decArch.openBlockers)).toBe(true);

    if (decArch.confirmedDecisions.length > 0) {
      const dec = decArch.confirmedDecisions[0];
      expect(dec).toHaveProperty("decision");
      expect(dec).toHaveProperty("consensusLevel");
    }
  });

  it("extracts action items with assignees, urgency levels, and effort estimates", () => {
    const intelligence = extractIntelligence(sampleMeetingTranscript, "Database Migration Sync");
    expect(intelligence.actionItems).toBeDefined();
    expect(intelligence.actionItems.length).toBeGreaterThan(0);

    intelligence.actionItems.forEach((act: any) => {
      expect(act.task).toBeTruthy();
      expect(act.assignee).toBeTruthy();
      expect(["high", "medium", "low"]).toContain(act.urgency);
      expect(act.effort).toBeTruthy();
    });
  });

  it("extracts chronological discussion phases mapping meeting evolution", () => {
    const intelligence = extractIntelligence(sampleMeetingTranscript, "Database Migration Sync");
    const phases = intelligence.analytics!.discussionPhases;

    expect(phases).toBeDefined();
    expect(phases.length).toBeGreaterThanOrEqual(1);

    phases.forEach((p) => {
      expect(p.phaseName).toBeTruthy();
      expect(p.timeRange).toBeTruthy();
      expect(["low", "medium", "high"]).toContain(p.frictionLevel);
      expect(typeof p.consensusReached).toBe("boolean");
    });
  });

  it("extracts key moments with valid [MM:SS] timestamp formatting and speaker attribution", () => {
    const intelligence = extractIntelligence(sampleMeetingTranscript, "Database Migration Sync");
    const moments = intelligence.keyMoments;

    expect(moments).toBeDefined();
    expect(moments.length).toBeGreaterThan(0);

    moments.forEach((km) => {
      expect(km.timestamp).toMatch(/^\d{2}:\d{2}$/);
      expect(km.quote).toBeTruthy();
      expect(km.label).toBeTruthy();
      expect(km.seconds).toBeGreaterThanOrEqual(0);
    });
  });

  it("validates Airtable synchronization payload contract adheres strictly to field specifications", () => {
    const intelligence = extractIntelligence(sampleMeetingTranscript, "Database Migration Sync");
    const payload = intelligence.airtablePayload;

    expect(payload).toBeDefined();
    expect(payload.summaryText).toContain("•");
    expect(payload.actionItemsText).toContain("Action Items");
    expect(payload.timestampsText).toMatch(/\[\d{2}:\d{2}\]/);
    expect(payload.summaryText.length).toBeGreaterThan(20);
    expect(payload.actionItemsText.length).toBeGreaterThan(20);
    expect(payload.timestampsText.length).toBeGreaterThan(20);
  });

  it("ensures formatSeconds accurately formats seconds, minutes, and multi-hour recordings", () => {
    expect(formatSeconds(0)).toBe("00:00");
    expect(formatSeconds(9)).toBe("00:09");
    expect(formatSeconds(45)).toBe("00:45");
    expect(formatSeconds(60)).toBe("01:00");
    expect(formatSeconds(125)).toBe("02:05");
    expect(formatSeconds(3599)).toBe("59:59");
    expect(formatSeconds(3600)).toBe("1:00:00");
    expect(formatSeconds(3665)).toBe("1:01:05");
    expect(formatSeconds(-10)).toBe("00:00"); // Graceful clamp
  });

  it("maintains discussion phase time window monotonicity without overlaps or inversions", () => {
    const intelligence = extractIntelligence(sampleMeetingTranscript, "Database Migration Sync");
    const phases = intelligence.analytics!.discussionPhases;

    for (let i = 0; i < phases.length - 1; i++) {
      expect(phases[i].startSeconds).toBeLessThanOrEqual(phases[i].endSeconds);
      expect(phases[i].endSeconds).toBeLessThanOrEqual(phases[i + 1].startSeconds + 1);
    }
  });

  it("handles fallback extraction gracefully on completely empty transcript without crashing", () => {
    const emptyTranscript: WhipScribeTranscriptResult = {
      text: "",
      duration: 0,
      segments: [],
    };

    const intelligence = extractIntelligence(emptyTranscript, "Empty Meeting");
    expect(intelligence.title).toBe("Empty Meeting");
    expect(intelligence.analytics).toBeDefined();
    expect(intelligence.analytics!.healthScore).toBeGreaterThanOrEqual(0);
    expect(intelligence.actionItems).toBeDefined();
    expect(intelligence.airtablePayload).toBeDefined();
    expect(intelligence.airtablePayload.summaryText).toBeTruthy();
  });
});
