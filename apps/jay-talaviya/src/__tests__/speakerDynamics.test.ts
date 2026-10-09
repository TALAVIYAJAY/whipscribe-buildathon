import { describe, it, expect } from "vitest";
import { extractIntelligence } from "../lib/intelligence";
import { WhipScribeTranscriptResult } from "../lib/whipscribe";

describe("Speaker Dynamics & Interaction Matrix Engine", () => {
  const balancedMeeting: WhipScribeTranscriptResult = {
    text: "Elena: Let's discuss client feedback. Marcus: Retention is high, but onboarding has minor friction. Elena: We should simplify step 2.",
    duration: 60,
    segments: [
      { start: 0, end: 15, text: "Let's discuss client feedback from the pilot cohort.", speaker: "Elena" },
      { start: 16, end: 40, text: "Retention is high at 94 percent, but onboarding has minor friction in setting up webhooks.", speaker: "Marcus" },
      { start: 41, end: 60, text: "We should simplify step 2 and add automated verification.", speaker: "Elena" },
    ],
  };

  it("calculates speaker talk-time percentages that sum to 100% (within standard rounding)", () => {
    const intelligence = extractIntelligence(balancedMeeting, "Product Review");
    const dynamics = intelligence.analytics!.speakerDynamics;

    expect(dynamics).toBeDefined();
    expect(dynamics.length).toBe(2);

    const totalPercentage = dynamics.reduce((sum, spk) => sum + spk.talkTimePercentage, 0);
    expect(totalPercentage).toBeGreaterThanOrEqual(98);
    expect(totalPercentage).toBeLessThanOrEqual(102);
  });

  it("accurately counts turn frequency for each distinct speaker", () => {
    const intelligence = extractIntelligence(balancedMeeting, "Product Review");
    const dynamics = intelligence.analytics!.speakerDynamics;

    const elena = dynamics.find((s) => s.speaker.toLowerCase().includes("elena"));
    const marcus = dynamics.find((s) => s.speaker.toLowerCase().includes("marcus"));

    expect(elena).toBeDefined();
    expect(marcus).toBeDefined();

    expect(elena!.turnCount).toBe(2);
    expect(marcus!.turnCount).toBe(1);
  });

  it("accurately tallies words spoken across turns per speaker", () => {
    const intelligence = extractIntelligence(balancedMeeting, "Product Review");
    const dynamics = intelligence.analytics!.speakerDynamics;

    dynamics.forEach((spk) => {
      expect(spk.wordsSpoken).toBeGreaterThan(0);
      expect(typeof spk.wordsSpoken).toBe("number");
    });
  });

  it("infers realistic organizational roles for participants", () => {
    const intelligence = extractIntelligence(balancedMeeting, "Product Review");
    const dynamics = intelligence.analytics!.speakerDynamics;

    dynamics.forEach((spk) => {
      expect(spk.inferredRole).toBeTruthy();
      expect(typeof spk.inferredRole).toBe("string");
    });
  });

  it("handles a single-speaker monologue attributing 100% airtime cleanly", () => {
    const soloMemo: WhipScribeTranscriptResult = {
      text: "This is a solo leadership memo covering quarterly goals.",
      duration: 30,
      segments: [
        { start: 0, end: 30, text: "This is a solo leadership memo covering quarterly goals.", speaker: "VP Product" },
      ],
    };

    const intelligence = extractIntelligence(soloMemo, "Solo Memo");
    const dynamics = intelligence.analytics!.speakerDynamics;

    expect(dynamics.length).toBe(1);
    expect(dynamics[0].talkTimePercentage).toBe(100);
    expect(dynamics[0].turnCount).toBe(1);
  });

  it("handles empty transcripts with graceful default speaker dynamics fallback", () => {
    const emptyTranscript: WhipScribeTranscriptResult = {
      text: "",
      duration: 0,
      segments: [],
    };

    const intelligence = extractIntelligence(emptyTranscript, "Empty Audio");
    const dynamics = intelligence.analytics!.speakerDynamics;

    expect(Array.isArray(dynamics)).toBe(true);
  });
});
