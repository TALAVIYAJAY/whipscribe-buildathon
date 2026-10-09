import { describe, it, expect } from "vitest";
import {
  generateProgressBar,
  escapeMarkdownCell,
  generateMarkdownBriefing,
  generateJsonTelemetry,
  generateExecutiveBriefingText,
  generateBriefingPdfFilename,
  cleanTakeawayBullet,
  getTakeawaysList,
  getDecisionsList,
  getQuestionsList,
  getActionItemsList,
} from "../lib/briefingExport";
import { ExtractedIntelligence } from "../lib/intelligence";
import { WhipScribeTranscriptResult } from "../lib/whipscribe";

describe("Executive Briefing Export Engine", () => {
  describe("Visual Progress Bar Generator", () => {
    it("renders completely empty bar at 0%", () => {
      expect(generateProgressBar(0, 10)).toBe("░░░░░░░░░░");
    });

    it("renders half-filled bar at 50%", () => {
      expect(generateProgressBar(50, 10)).toBe("█████░░░░░");
    });

    it("renders completely filled bar at 100%", () => {
      expect(generateProgressBar(100, 10)).toBe("██████████");
    });

    it("clamps negative numbers to 0% gracefully", () => {
      expect(generateProgressBar(-25, 10)).toBe("░░░░░░░░░░");
    });

    it("clamps numbers greater than 100% to 100% gracefully", () => {
      expect(generateProgressBar(150, 10)).toBe("██████████");
    });
  });

  describe("Markdown Table Cell Sanitizer", () => {
    it("escapes pipe characters to avoid table column breakages", () => {
      const dirty = "Option A | Option B | Option C";
      expect(escapeMarkdownCell(dirty)).toBe("Option A \\| Option B \\| Option C");
    });

    it("replaces newlines with spaces to maintain single-line table rows", () => {
      const multiline = "Line 1\nLine 2\n\nLine 3";
      expect(escapeMarkdownCell(multiline)).toBe("Line 1 Line 2 Line 3");
    });

    it("returns empty string when given empty or null-like inputs", () => {
      expect(escapeMarkdownCell("")).toBe("");
    });
  });

  describe("Markdown Executive Briefing Generator", () => {
    const mockIntelligence: ExtractedIntelligence = {
      title: "Sprint Standup: API & Diarization",
      overview: "Team aligned on WhipScribe REST pipeline and diarization normalizers.",
      summary: "Detailed review of speaker normalization and Airtable integration.",
      topics: ["WhipScribe API", "Diarization", "Vercel Edge"],
      actionItems: [
        { task: "Deploy commit to Vercel", assignee: "Alex", urgency: "high", effort: "1 day" },
        { task: "Verify 6 test audio files", assignee: "Sarah", urgency: "medium", effort: "4 hours" },
      ],
      keyDecisions: [
        { decision: "Standardize on Next.js 14 App Router", impact: "High", context: "Performance" },
      ],
      keyMoments: [
        { timestamp: "00:42", quote: "All 6 audio files pass with 100% accuracy.", label: "Test Verification", seconds: 42, speaker: "Sarah" },
      ],
      airtablePayload: {
        title: "Sprint Standup",
        summaryText: "Summary",
        actionItemsText: "Action items",
        timestampsText: "Timestamps",
      },
      analytics: {
        healthScore: 92,
        alignmentScore: 95,
        executionClarityScore: 90,
        signalToNoiseRatio: 88,
        pacingWPM: 145,
        overallPacing: "moderate",
        speakerDynamics: [
          { speaker: "Alex", talkTimePercentage: 60, turnCount: 4, wordsSpoken: 210, inferredRole: "Lead" },
          { speaker: "Sarah", talkTimePercentage: 40, turnCount: 3, wordsSpoken: 140, inferredRole: "Tech Contributor" },
        ],
        discussionPhases: [
          { phaseName: "Context & Standup Review", timeRange: "00:00 - 00:30", frictionLevel: "low", consensusReached: true },
          { phaseName: "Deployment Execution", timeRange: "00:31 - 01:00", frictionLevel: "low", consensusReached: true },
        ],
        decisionsArchitecture: {
          confirmedDecisions: [
            { decision: "Standardize on Next.js 14", consensusLevel: "Unanimous", rationaleOrDriver: "Alex" },
          ],
          highRiskCommitments: [
            { commitment: "Complete migration before Thursday freeze", owner: "Sarah", riskFactor: "Database load" },
          ],
          openBlockers: [],
        },
      },
    };

    const mockTranscript: WhipScribeTranscriptResult = {
      text: "Alex: Let's ship. Sarah: Tests pass.",
      duration: 60,
      segments: [
        { start: 0, end: 30, text: "Let's ship the diarization update.", speaker: "Alex" },
        { start: 31, end: 60, text: "All 6 audio files pass with 100% accuracy.", speaker: "Sarah" },
      ],
    };

    it("generates markdown with valid structural headers", () => {
      const md = generateMarkdownBriefing(mockIntelligence, mockTranscript);
      expect(md).toContain("# Sprint Standup: API & Diarization");
      expect(md).toContain("## 1. Executive Summary");
      expect(md).toContain("## 2. Meeting Health Index & Metrics");
      expect(md).toContain("## 3. Speaker Talk-Time & Dynamics Matrix");
      expect(md).toContain("## 4. Phased Discussion Pipeline");
      expect(md).toContain("## 5. 3-Way Decision Architecture");
      expect(md).toContain("## 6. Action Items & Deliverables Matrix");
      expect(md).toContain("## 7. Pivotal Audio Evidence & Timestamp Anchors");
    });

    it("embeds a valid Mermaid.js flowchart in the discussion pipeline section", () => {
      const md = generateMarkdownBriefing(mockIntelligence, mockTranscript);
      expect(md).toContain("```mermaid");
      expect(md).toContain("flowchart LR");
      expect(md).toContain("P1");
      expect(md).toContain("P2");
      expect(md).toContain("P1 --> P2");
    });

    it("formats action items as a valid Markdown table with correct columns", () => {
      const md = generateMarkdownBriefing(mockIntelligence, mockTranscript);
      expect(md).toContain("| # | Action Item | Assignee | Urgency | Effort |");
      expect(md).toContain("| :---: | :--- | :---: | :---: | :---: |");
      expect(md).toContain("Deploy commit to Vercel");
      expect(md).toContain("`Alex`");
      expect(md).toContain("Verify 6 test audio files");
    });

    it("includes 3-way decision architecture categories (Decisions, Commitments, Blockers)", () => {
      const md = generateMarkdownBriefing(mockIntelligence, mockTranscript);
      expect(md).toContain("### 🟢 Confirmed Decisions");
      expect(md).toContain("Standardize on Next.js 14");
      expect(md).toContain("### 🟡 High-Risk Commitments");
      expect(md).toContain("Complete migration before Thursday freeze");
      expect(md).toContain("### 🔴 Open Blockers & Friction Points");
    });

    it("includes clickable timestamp anchors formatted as [MM:SS]", () => {
      const md = generateMarkdownBriefing(mockIntelligence, mockTranscript);
      expect(md).toContain("**`[00:42]`**");
      expect(md).toContain("All 6 audio files pass with 100% accuracy.");
    });
  });

  describe("JSON Machine-Readable Telemetry Generator", () => {
    it("generates parseable, valid JSON containing complete telemetry payload", () => {
      const mockIntelligence: ExtractedIntelligence = {
        title: "Telemetry Test",
        overview: "Overview",
        summary: "Summary",
        topics: ["API"],
        actionItems: [],
        keyDecisions: [],
        keyMoments: [],
        airtablePayload: { title: "", summaryText: "", actionItemsText: "", timestampsText: "" },
      };
      const mockTranscript: WhipScribeTranscriptResult = { text: "Test", duration: 10, segments: [] };

      const jsonStr = generateJsonTelemetry(mockIntelligence, mockTranscript);
      const parsed = JSON.parse(jsonStr);

      expect(parsed).toHaveProperty("metadata");
      expect(parsed.metadata.generator).toContain("WhipScribe");
      expect(parsed.metadata.meetingTitle).toBe("Telemetry Test");
      expect(parsed).toHaveProperty("executiveSummary");
      expect(parsed).toHaveProperty("actionItems");
      expect(parsed).toHaveProperty("transcriptSegments");
    });
  });

  describe("Clean 6-Section Executive Text Briefing Generator", () => {
    const mockIntelligence: ExtractedIntelligence = {
      title: "Sprint Standup: API & Diarization",
      overview: "Team aligned on WhipScribe REST pipeline and diarization normalizers.",
      summaryBulletPoints: [
        "Vercel Edge API deployed successfully.",
        "Airtable table schema sync validated across 6 audio test files.",
      ],
      actionItems: [
        { task: "Deploy commit to Vercel", assignee: "Alex", urgency: "high", effort: "1 day" },
      ],
      keyDecisions: [
        { decision: "Standardize on Next.js 14 App Router", impact: "High", context: "Performance" },
      ],
      openQuestions: [
        "When will the final staging verification be completed?",
      ],
      detailedTopics: [
        { topic: "API & Sync Pipeline", details: ["Word timestamps connected", "Direct seeks implemented"] },
      ],
      keyMoments: [
        { timestamp: "00:42", quote: "All 6 audio files pass with 100% accuracy.", label: "Test Verification", seconds: 42, speaker: "Sarah" },
      ],
      airtablePayload: {
        title: "Sprint Standup",
        summaryText: "Summary",
        actionItemsText: "Action items",
        timestampsText: "Timestamps",
      },
      analytics: {
        healthScore: 92,
        alignmentScore: 95,
        executionClarityScore: 90,
        signalToNoiseRatio: 88,
        pacingWPM: 145,
        overallPacing: "moderate",
        speakerDynamics: [
          { speaker: "Alex", talkTimePercentage: 60, turnCount: 4, wordsSpoken: 210, inferredRole: "Lead" },
        ],
        decisionMatrix: {
          confirmedDecisions: ["Standardize on Next.js 14 App Router"],
          highRiskCommitments: ["Staging deployment deadline"],
          openBlockers: ["When will the final staging verification be completed?"],
        },
      },
    };

    const mockTranscript: WhipScribeTranscriptResult = {
      text: "Alex: Welcome everyone. Sarah: All 6 audio files pass with 100% accuracy.",
      duration: 120,
      segments: [
        { start: 0, end: 15, text: "Welcome everyone.", speaker: "Alex" },
        { start: 16, end: 42, text: "All 6 audio files pass with 100% accuracy.", speaker: "Sarah" },
      ],
    };

    it("includes all 6 mandatory executive sections in clean text format", () => {
      const text = generateExecutiveBriefingText(mockIntelligence, mockTranscript);

      expect(text).toContain("1. EXECUTIVE SUMMARY");
      expect(text).toContain("2. KEY DECISIONS");
      expect(text).toContain("3. KEY QUESTIONS & CONSIDERATIONS");
      expect(text).toContain("4. DETAILED DISCUSSION BREAKDOWN (BY TOPIC)");
      expect(text).toContain("5. PIVOTAL AUDIO EVIDENCE & TIMESTAMP ANCHORS");
      expect(text).toContain("6. FULL DIARIZED TRANSCRIPT");
    });

    it("renders executive summary narrative and key takeaways correctly", () => {
      const text = generateExecutiveBriefingText(mockIntelligence, mockTranscript);
      expect(text).toContain("Team aligned on WhipScribe REST pipeline");
      expect(text).toContain("Vercel Edge API deployed successfully");
    });

    it("renders confirmed decisions and open questions cleanly", () => {
      const text = generateExecutiveBriefingText(mockIntelligence, mockTranscript);
      expect(text).toContain("Standardize on Next.js 14 App Router");
      expect(text).toContain("When will the final staging verification be completed?");
    });

    it("renders full diarized transcript with speaker names and timestamps", () => {
      const text = generateExecutiveBriefingText(mockIntelligence, mockTranscript);
      expect(text).toContain("[00:00] Alex: Welcome everyone.");
      expect(text).toContain("[00:16] Sarah: All 6 audio files pass with 100% accuracy.");
    });
    it("strips leading question marks and bullets from questions and decisions", () => {
      const dirtyIntelligence: ExtractedIntelligence = {
        ...mockIntelligence,
        keyDecisions: [{ decision: "• Launch enterprise pilot program on October 1 led by John" }],
        analytics: {
          ...mockIntelligence.analytics!,
          decisionMatrix: {
            ...mockIntelligence.analytics!.decisionMatrix!,
            confirmedDecisions: ["• Launch enterprise pilot program on October 1 led by John"],
          },
        },
        openQuestions: ["? What specific technical integration milestones are required for Wipscribe and Airtable by next month?"],
      };
      const text = generateExecutiveBriefingText(dirtyIntelligence, mockTranscript);
      expect(text).toContain("• Launch enterprise pilot program on October 1 led by John");
      expect(text).not.toContain("• •");
      expect(text).toContain("• What specific technical integration milestones are required");
      expect(text).not.toContain("? What");
    });
  });

  describe("Takeaway Bullet Cleaner (Prefix Normalizer)", () => {
    it("strips redundant topic prefix before the colon when followed by a detailed sentence", () => {
      const input = "Customer Retention and Onboarding Performance: Customer retention metrics reached a milestone of 94% for the current month.";
      expect(cleanTakeawayBullet(input)).toBe("Customer retention metrics reached a milestone of 94% for the current month.");
    });

    it("strips engineering assignment topic prefix cleanly", () => {
      const input = "Engineering Priorities and Operational Assignments: Maria is assigned to finalize the compliance review by next Wednesday.";
      expect(cleanTakeawayBullet(input)).toBe("Maria is assigned to finalize the compliance review by next Wednesday.");
    });

    it("strips leading bullet characters and whitespace", () => {
      const input = "• Customer retention reached a milestone of 94%.";
      expect(cleanTakeawayBullet(input)).toBe("Customer retention reached a milestone of 94%.");
    });

    it("preserves regular sentences without colon prefixes", () => {
      const input = "Optimized database query performance by 40% across all API endpoints.";
      expect(cleanTakeawayBullet(input)).toBe("Optimized database query performance by 40% across all API endpoints.");
    });

    it("returns empty string gracefully for empty or null inputs", () => {
      expect(cleanTakeawayBullet("")).toBe("");
    });
  });

  describe("Frontend UI Data Parity (Strict Screen Alignment)", () => {
    const screenAlignedIntelligence: ExtractedIntelligence = {
      title: "Q3 Executive Strategy: Retention Milestone and Engineering Workflows",
      overview: "The Executive Lead convened a weekly strategy update to review Q3 performance metrics and assign ownership for upcoming milestones.",
      quickTakeaways: [
        "Customer retention reached 94% this month due to accelerated onboarding processes.",
        "Primary engineering focus for next month is expanding audio intelligence workflows using Wipscribe and Airtable.",
        "John will lead the enterprise pilot starting October 1, and Maria will finalize compliance by next Wednesday.",
      ],
      summaryBulletPoints: [
        "Customer retention reached a high of 94% for the month.",
        "Retention growth was directly attributed to faster onboarding procedures.",
        "Primary engineering initiative for next month focuses on expanding audio intelligence workflows.",
      ],
      keyDecisions: [
        "Target audio intelligence workflow expansion with Wipscribe and Airtable as the primary engineering initiative for next month.",
        "Launch the enterprise pilot program on October 1 under John's leadership.",
      ],
      openQuestions: [
        "What specific metrics will be used to measure the success of the enterprise pilot program?",
      ],
      detailedTopics: [
        {
          topic: "Q3 Business Performance & Customer Retention",
          details: [
            "Customer retention reached a high of 94% for the month.",
            "Retention growth was directly attributed to faster onboarding procedures implemented across the team.",
          ],
        },
      ],
      keyMoments: [
        {
          timestamp: "00:00",
          speaker: "Executive Lead",
          topic: "Discussion Kickoff",
          quote: "Team, here is our weekly executive strategy update for the third quarter.",
          seconds: 0,
          significance: "Defines the core technical focus and toolchain for the upcoming sprint cycle.",
        },
      ],
      airtablePayload: { title: "", summaryText: "", actionItemsText: "", timestampsText: "" },
      actionItems: [
        "John: Lead the enterprise pilot program starting October 1.",
        "Maria: Finalize the compliance review by next Wednesday.",
      ],
      analytics: {
        healthScore: 92,
        efficiencyLevel: "High Execution",
        signalToNoiseRatio: 90,
        speakingPaceWpm: 140,
        paceLabel: "Optimal",
        speakerDynamics: [],
        sentimentTimeline: [],
        decisionMatrix: {
          confirmedDecisions: ["Expand audio intelligence workflows using Wipscribe and Airtable"],
          highRiskCommitments: [],
          openBlockers: ["Generic fallback blocker"],
        },
      },
    };

    const mockTranscript: WhipScribeTranscriptResult = {
      text: "Executive Lead: Team, here is our weekly executive strategy update.",
      duration: 33,
      segments: [
        { start: 0, end: 5, speaker: "Executive Lead", text: "Team, here is our weekly executive strategy update." },
      ],
    };

    it("prioritizes quickTakeaways (the 3 cards shown on screen) over summaryBulletPoints", () => {
      const takeaways = getTakeawaysList(screenAlignedIntelligence);
      expect(takeaways).toHaveLength(3);
      expect(takeaways[0]).toBe("Customer retention reached 94% this month due to accelerated onboarding processes.");
      expect(takeaways[1]).toContain("Primary engineering focus for next month");
      expect(takeaways[2]).toContain("John will lead the enterprise pilot");
    });

    it("prioritizes intelligence.keyDecisions (the green card shown on screen) over analytics decisionMatrix", () => {
      const decisions = getDecisionsList(screenAlignedIntelligence);
      expect(decisions).toHaveLength(2);
      expect(decisions[0]).toBe("Target audio intelligence workflow expansion with Wipscribe and Airtable as the primary engineering initiative for next month.");
      expect(decisions[1]).toBe("Launch the enterprise pilot program on October 1 under John's leadership.");
      expect(decisions).not.toContain("Expand audio intelligence workflows using Wipscribe and Airtable");
    });

    it("extracts action items matching the checkbox items on the frontend screen", () => {
      const actions = getActionItemsList(screenAlignedIntelligence);
      expect(actions).toHaveLength(2);
      expect(actions[0]).toBe("John: Lead the enterprise pilot program starting October 1.");
      expect(actions[1]).toBe("Maria: Finalize the compliance review by next Wednesday.");

      // Also test object structure and [Owner: Maria] normalization
      const objectIntelligence: ExtractedIntelligence = {
        ...screenAlignedIntelligence,
        actionItems: [
          { task: "Lead the enterprise pilot program starting October 1.", assignee: "John", urgency: "high", effort: "1w" },
          "[Owner: Maria] Finalize the compliance review by next Wednesday.",
        ],
      };
      const objectActions = getActionItemsList(objectIntelligence);
      expect(objectActions[0]).toBe("John: Lead the enterprise pilot program starting October 1.");
      expect(objectActions[1]).toBe("Maria: Finalize the compliance review by next Wednesday.");
    });

    it("prioritizes intelligence.openQuestions (the amber card shown on screen)", () => {
      const questions = getQuestionsList(screenAlignedIntelligence);
      expect(questions).toHaveLength(1);
      expect(questions[0]).toBe("What specific metrics will be used to measure the success of the enterprise pilot program?");
    });

    it("generates Copy Briefing with identical content to the frontend screen", () => {
      const text = generateExecutiveBriefingText(screenAlignedIntelligence, mockTranscript);
      expect(text).toContain("Customer retention reached 94% this month due to accelerated onboarding processes.");
      expect(text).toContain("Target audio intelligence workflow expansion with Wipscribe and Airtable as the primary engineering initiative for next month.");
      expect(text).toContain("Launch the enterprise pilot program on October 1 under John's leadership.");
      expect(text).toContain("John: Lead the enterprise pilot program starting October 1.");
      expect(text).toContain("Maria: Finalize the compliance review by next Wednesday.");
      expect(text).toContain("What specific metrics will be used to measure the success of the enterprise pilot program?");
      expect(text).toContain("[00:00] Executive Lead (Discussion Kickoff): \"Team, here is our weekly executive strategy update for the third quarter.\"");
      expect(text).toContain("Significance: Defines the core technical focus and toolchain for the upcoming sprint cycle.");
    });
  });

  describe("Dynamic PDF Filename Generator", () => {
    it("generates a clean slugified name ending with .pdf", () => {
      const filename = generateBriefingPdfFilename("Database Migration Sync");
      expect(filename).toMatch(/^briefing-database-migration-sync-[a-z0-9]{4}\.pdf$/);
    });

    it("generates random unique hashes for consecutive calls", () => {
      const file1 = generateBriefingPdfFilename("Team Standup");
      const file2 = generateBriefingPdfFilename("Team Standup");
      expect(file1).toMatch(/\.pdf$/);
      expect(file2).toMatch(/\.pdf$/);
      expect(file1).not.toBe(file2);
    });

    it("falls back gracefully when title is empty or undefined", () => {
      const fallback = generateBriefingPdfFilename("");
      expect(fallback).toMatch(/^briefing-meeting-briefing-[a-z0-9]{4}\.pdf$/);
    });
  });
});
