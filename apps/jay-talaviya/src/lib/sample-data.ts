/**
 * Curated Sample Data for Instant Buildathon Evaluation
 * Product Architecture & Roadmap Discussion (1 minute 20 seconds sample)
 */

import { ExtractedIntelligence } from "./intelligence";
import { WhipScribeTranscriptResult } from "./whipscribe";

export const SAMPLE_AUDIO_URL =
  "https://actions.google.com/sounds/v1/ambiences/office_room_tone.ogg"; // Public CC audio stream

export const SAMPLE_JOB_ID = "demo-whipscribe-arch-review-8821";

export const SAMPLE_TRANSCRIPT: WhipScribeTranscriptResult = {
  text: "Welcome team. Today we are aligning on the WhipScribe Audio Intelligence workflow. The core objective is turning audio from meetings, user interviews, and lectures into actionable rows in Airtable. Jay, can you walk us through the architecture? Sure, we take the audio stream or URL, process it through the WhipScribe API for speaker diarization and word timestamps, and then extract the action items and key moments. We also decided that clicking any timestamp jumps the audio player to that exact second. That sounds fantastic, what are the next steps? We need to finalize the Airtable schema and deploy to Vercel by Friday.",
  language: "en",
  speech_detected: true,
  speech_ratio: 0.94,
  segments: [
    {
      start: 0.0,
      end: 6.2,
      speaker: "SPEAKER_00",
      text: "Welcome team. Today we are aligning on the WhipScribe Audio Intelligence workflow.",
      words: [
        { start: 0.0, end: 0.8, text: "Welcome" },
        { start: 0.9, end: 1.4, text: "team." },
        { start: 1.6, end: 2.1, text: "Today" },
        { start: 2.2, end: 2.4, text: "we" },
        { start: 2.5, end: 2.8, text: "are" },
        { start: 2.9, end: 3.5, text: "aligning" },
        { start: 3.6, end: 3.8, text: "on" },
        { start: 3.9, end: 4.1, text: "the" },
        { start: 4.2, end: 4.9, text: "WhipScribe" },
        { start: 5.0, end: 5.5, text: "Audio" },
        { start: 5.6, end: 6.2, text: "Intelligence" },
      ],
    },
    {
      start: 6.5,
      end: 14.8,
      speaker: "SPEAKER_00",
      text: "The core objective is turning audio from meetings, user interviews, and lectures into actionable rows in Airtable.",
      words: [
        { start: 6.5, end: 6.8, text: "The" },
        { start: 6.9, end: 7.3, text: "core" },
        { start: 7.4, end: 8.0, text: "objective" },
        { start: 8.1, end: 8.3, text: "is" },
        { start: 8.4, end: 8.9, text: "turning" },
        { start: 9.0, end: 9.5, text: "audio" },
        { start: 9.6, end: 9.8, text: "from" },
        { start: 9.9, end: 10.6, text: "meetings," },
        { start: 10.7, end: 11.2, text: "user" },
        { start: 11.3, end: 12.0, text: "interviews," },
        { start: 12.1, end: 12.3, text: "and" },
        { start: 12.4, end: 13.0, text: "lectures" },
        { start: 13.1, end: 13.4, text: "into" },
        { start: 13.5, end: 14.0, text: "actionable" },
        { start: 14.1, end: 14.4, text: "rows" },
        { start: 14.5, end: 14.8, text: "in" },
      ],
    },
    {
      start: 15.0,
      end: 18.5,
      speaker: "SPEAKER_00",
      text: "Jay, can you walk us through the architecture?",
      words: [
        { start: 15.0, end: 15.4, text: "Jay," },
        { start: 15.5, end: 15.8, text: "can" },
        { start: 15.9, end: 16.1, text: "you" },
        { start: 16.2, end: 16.5, text: "walk" },
        { start: 16.6, end: 16.8, text: "us" },
        { start: 16.9, end: 17.3, text: "through" },
        { start: 17.4, end: 17.6, text: "the" },
        { start: 17.7, end: 18.5, text: "architecture?" },
      ],
    },
    {
      start: 19.0,
      end: 32.0,
      speaker: "SPEAKER_01",
      text: "Sure, we take the audio stream or URL, process it through the WhipScribe API for speaker diarization and word timestamps, and then extract the action items and key moments.",
      words: [
        { start: 19.0, end: 19.5, text: "Sure," },
        { start: 19.6, end: 19.8, text: "we" },
        { start: 19.9, end: 20.2, text: "take" },
        { start: 20.3, end: 20.5, text: "the" },
        { start: 20.6, end: 21.0, text: "audio" },
        { start: 21.1, end: 21.6, text: "stream" },
        { start: 21.7, end: 21.9, text: "or" },
        { start: 22.0, end: 22.5, text: "URL," },
        { start: 22.8, end: 23.4, text: "process" },
        { start: 23.5, end: 23.8, text: "it" },
        { start: 23.9, end: 24.3, text: "through" },
        { start: 24.4, end: 24.7, text: "the" },
        { start: 24.8, end: 25.5, text: "WhipScribe" },
        { start: 25.6, end: 26.0, text: "API" },
        { start: 26.1, end: 26.3, text: "for" },
        { start: 26.4, end: 26.9, text: "speaker" },
        { start: 27.0, end: 27.7, text: "diarization" },
        { start: 27.8, end: 28.0, text: "and" },
        { start: 28.1, end: 28.5, text: "word" },
        { start: 28.6, end: 29.5, text: "timestamps," },
        { start: 29.6, end: 29.9, text: "and" },
        { start: 30.0, end: 30.3, text: "then" },
        { start: 30.4, end: 30.9, text: "extract" },
        { start: 31.0, end: 31.2, text: "the" },
        { start: 31.3, end: 31.7, text: "action" },
        { start: 31.8, end: 32.0, text: "items." },
      ],
    },
    {
      start: 32.5,
      end: 42.0,
      speaker: "SPEAKER_01",
      text: "We also decided that clicking any timestamp jumps the audio player to that exact second.",
      words: [
        { start: 32.5, end: 32.7, text: "We" },
        { start: 32.8, end: 33.1, text: "also" },
        { start: 33.2, end: 33.8, text: "decided" },
        { start: 33.9, end: 34.2, text: "that" },
        { start: 34.3, end: 34.8, text: "clicking" },
        { start: 34.9, end: 35.2, text: "any" },
        { start: 35.3, end: 36.0, text: "timestamp" },
        { start: 36.1, end: 36.5, text: "jumps" },
        { start: 36.6, end: 36.9, text: "the" },
        { start: 37.0, end: 37.4, text: "audio" },
        { start: 37.5, end: 37.9, text: "player" },
        { start: 38.0, end: 38.2, text: "to" },
        { start: 38.3, end: 38.6, text: "that" },
        { start: 38.7, end: 39.2, text: "exact" },
        { start: 39.3, end: 40.0, text: "second." },
      ],
    },
    {
      start: 42.5,
      end: 47.0,
      speaker: "SPEAKER_00",
      text: "That sounds fantastic, what are the next steps?",
      words: [
        { start: 42.5, end: 42.8, text: "That" },
        { start: 42.9, end: 43.4, text: "sounds" },
        { start: 43.5, end: 44.2, text: "fantastic," },
        { start: 44.3, end: 44.7, text: "what" },
        { start: 44.8, end: 45.0, text: "are" },
        { start: 45.1, end: 45.3, text: "the" },
        { start: 45.4, end: 45.8, text: "next" },
        { start: 45.9, end: 47.0, text: "steps?" },
      ],
    },
    {
      start: 47.5,
      end: 56.0,
      speaker: "SPEAKER_01",
      text: "We need to finalize the Airtable schema and deploy to Vercel by Friday.",
      words: [
        { start: 47.5, end: 47.7, text: "We" },
        { start: 47.8, end: 48.1, text: "need" },
        { start: 48.2, end: 48.4, text: "to" },
        { start: 48.5, end: 49.0, text: "finalize" },
        { start: 49.1, end: 49.3, text: "the" },
        { start: 49.4, end: 50.0, text: "Airtable" },
        { start: 50.1, end: 50.6, text: "schema" },
        { start: 50.7, end: 50.9, text: "and" },
        { start: 51.0, end: 51.5, text: "deploy" },
        { start: 51.6, end: 51.8, text: "to" },
        { start: 51.9, end: 52.4, text: "Vercel" },
        { start: 52.5, end: 52.8, text: "by" },
        { start: 52.9, end: 53.6, text: "Friday." },
      ],
    },
  ],
};

export const SAMPLE_INTELLIGENCE: ExtractedIntelligence = {
  title: "WhipScribe Audio Intelligence Roadmap & Architecture",
  summaryBulletPoints: [
    "Core objective is transforming unstructured audio from meetings, user interviews, and lectures into structured Airtable intelligence.",
    "Integrated directly with WhipScribe API for high-precision speaker diarization, word-level timestamps, and cloud-hosted audio playback.",
    "Architecture connects transcript moments to an interactive media player that seeks directly to quoted timestamps.",
    "Target milestone is completing the Airtable synchronization schema and shipping the live deployment to Vercel.",
  ],
  actionItems: [
    "[00:32] SPEAKER_01: Enable interactive timestamp player seeking on quote click.",
    "[00:47] SPEAKER_01: Finalize Airtable schema (Title, Summary, Action Items, Key Timestamps, Audio Link, Job ID).",
    "[00:51] SPEAKER_01: Deploy live application to Vercel with environment variables configured.",
  ],
  openQuestions: [
    "Jay, can you walk us through the architecture?",
    "What are the next steps for Friday deployment?",
  ],
  keyMoments: [
    {
      seconds: 0,
      timestamp: "00:00",
      speaker: "SPEAKER_00",
      quote: "Welcome team. Today we are aligning on the WhipScribe Audio Intelligence workflow.",
    },
    {
      seconds: 6,
      timestamp: "00:06",
      speaker: "SPEAKER_00",
      quote: "The core objective is turning audio from meetings, user interviews, and lectures into actionable rows in Airtable.",
    },
    {
      seconds: 19,
      timestamp: "00:19",
      speaker: "SPEAKER_01",
      quote: "We take the audio stream or URL, process it through the WhipScribe API for speaker diarization and word timestamps.",
    },
    {
      seconds: 32,
      timestamp: "00:32",
      speaker: "SPEAKER_01",
      quote: "We also decided that clicking any timestamp jumps the audio player to that exact second.",
    },
    {
      seconds: 47,
      timestamp: "00:47",
      speaker: "SPEAKER_01",
      quote: "We need to finalize the Airtable schema and deploy to Vercel by Friday.",
    },
  ],
  airtablePayload: {
    summaryText:
      "• Core objective is transforming unstructured audio from meetings, user interviews, and lectures into structured Airtable intelligence.\n\n• Integrated directly with WhipScribe API for high-precision speaker diarization, word-level timestamps, and cloud-hosted audio playback.\n\n• Architecture connects transcript moments to an interactive media player that seeks directly to quoted timestamps.\n\n• Target milestone is completing the Airtable synchronization schema and shipping the live deployment to Vercel.",
    actionItemsText:
      "### Action Items & Next Steps:\n1. [00:32] SPEAKER_01: Enable interactive timestamp player seeking on quote click.\n2. [00:47] SPEAKER_01: Finalize Airtable schema (Title, Summary, Action Items, Key Timestamps, Audio Link, Job ID).\n3. [00:51] SPEAKER_01: Deploy live application to Vercel with environment variables configured.\n\n### Key Questions Discussed:\n? Jay, can you walk us through the architecture?\n? What are the next steps for Friday deployment?",
    timestampsText:
      '[00:00] (SPEAKER_00): "Welcome team. Today we are aligning on the WhipScribe Audio Intelligence workflow."\n\n[00:06] (SPEAKER_00): "The core objective is turning audio from meetings, user interviews, and lectures into actionable rows in Airtable."\n\n[00:19] (SPEAKER_01): "We take the audio stream or URL, process it through the WhipScribe API for speaker diarization and word timestamps."\n\n[00:32] (SPEAKER_01): "We also decided that clicking any timestamp jumps the audio player to that exact second."\n\n[00:47] (SPEAKER_01): "We need to finalize the Airtable schema and deploy to Vercel by Friday."',
  },
};
