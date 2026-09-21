import { NextRequest, NextResponse } from "next/server";
import { WhipScribeClient } from "@/lib/whipscribe";
import { extractIntelligence } from "@/lib/intelligence";
import { extractIntelligenceWithGemini } from "@/lib/gemini";
import { validateMediaUrlBeforeIntake } from "@/lib/media-validator";

export const maxDuration = 300; // Allow up to 5 minutes on Vercel Pro/serverless
export const dynamic = "force-dynamic";

const SUPPORTED_EXTENSIONS = ["mp3", "wav", "m4a", "mp4", "webm", "ogg", "flac", "aac", "mov", "m4v"];

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    const client = new WhipScribeClient();

    let jobId: string;
    let originalAudioUrl: string | null = null;
    let fallbackTitle: string = "Audio Intelligence Recording";

    if (contentType.includes("multipart/form-data")) {
      // Direct file upload
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const language = (formData.get("language") as string) || "en";

      if (!file) {
        return NextResponse.json(
          { error: "No file was uploaded. Please select an audio or video file." },
          { status: 400 }
        );
      }

      // File size validation (50MB limit)
      const maxSizeBytes = 50 * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return NextResponse.json(
          { error: "File exceeds 50MB limit. Please upload a smaller file or compressed audio." },
          { status: 400 }
        );
      }

      // Extension / Format validation
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const isAudioOrVideoMime = file.type.startsWith("audio/") || file.type.startsWith("video/");
      if (!SUPPORTED_EXTENSIONS.includes(ext) && !isAudioOrVideoMime) {
        return NextResponse.json(
          { error: `Unsupported file format (.${ext}). Please upload an MP3, WAV, M4A, MP4, or WebM file.` },
          { status: 400 }
        );
      }

      fallbackTitle = file.name.replace(/\.[^/.]+$/, "");
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Submit file to WhipScribe
      const submitRes = await client.submitFile(buffer, file.name, file.type || "audio/mpeg", language);
      jobId = submitRes.job_id;
    } else {
      // URL submission (JSON body)
      const body = await req.json().catch(() => ({}));
      const { url, language = "en" } = body;

      if (!url || typeof url !== "string" || !url.trim()) {
        return NextResponse.json(
          { error: "A valid media URL is required." },
          { status: 400 }
        );
      }

      const trimmedUrl = url.trim();
      if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
        return NextResponse.json(
          { error: "Invalid URL format. Please ensure your link begins with http:// or https://" },
          { status: 400 }
        );
      }

      originalAudioUrl = trimmedUrl;
      try {
        fallbackTitle = `Recording from ${new URL(trimmedUrl).hostname}`;
      } catch {
        fallbackTitle = "Web Media Recording";
      }

      // Pre-flight duration check BEFORE submitting to WhipScribe (protects account credits)
      const validation = await validateMediaUrlBeforeIntake(trimmedUrl, 600);
      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || "Media duration exceeds the 10-minute demo limit." },
          { status: 400 }
        );
      }

      if (validation.detectedTitle) {
        fallbackTitle = validation.detectedTitle;
      }

      // Submit URL to WhipScribe
      const submitRes = await client.submitUrl(trimmedUrl, language);
      jobId = submitRes.job_id;
    }

    // Poll until completed with exponential backoff on transient network drops
    await client.waitForJobCompletion(jobId, undefined, 240);

    // Fetch full transcript with speaker diarization and word timestamps
    const transcript = await client.getTranscript(jobId);

    // Enforce 10-minute demo limit (600s + 30s grace buffer) to conserve processing credits
    const segments = transcript.segments || [];
    const lastSegment = segments[segments.length - 1];
    const durationSeconds = lastSegment?.end || 0;
    if (durationSeconds > 630) {
      const mins = Math.round(durationSeconds / 60);
      return NextResponse.json(
        {
          error: `Recording duration (~${mins} minutes) exceeds the 10-minute demo limit. Please provide an audio or video recording under 10 minutes to conserve processing credits.`,
        },
        { status: 400 }
      );
    }

    // If an uploaded file, query WhipScribe for hosted playback URL
    if (!originalAudioUrl) {
      const hostedUrl = await client.getAudioUrl(jobId);
      if (hostedUrl) {
        originalAudioUrl = hostedUrl;
      }
    }

    // Check for VAD (Voice Activity Detection) rejection
    if (transcript.speech_detected === false) {
      const isUrl = Boolean(originalAudioUrl);
      const vadMsg = isUrl
        ? "Unable to detect spoken audio from this URL. The link may point to a folder, webpage, or silent file rather than a direct media stream. Please verify the URL or use the Direct File Upload tab."
        : "No transcribable speech was detected in this recording. Please ensure the file contains spoken conversation, or try another audio recording.";
      return NextResponse.json({ error: vadMsg }, { status: 400 });
    }

    // Extract intelligence with Gemini AI (with automatic fallback to rule-based engine)
    let intelligence = await extractIntelligenceWithGemini(transcript, fallbackTitle);
    if (!intelligence) {
      intelligence = extractIntelligence(transcript, fallbackTitle);
    }

    return NextResponse.json({
      success: true,
      job_id: jobId,
      audio_url: originalAudioUrl,
      transcript,
      intelligence,
    });
  } catch (err: unknown) {
    console.error("Transcribe API Error:", err);
    const isUrl = !req.headers.get("content-type")?.includes("multipart/form-data");
    const errMsg = err instanceof Error ? err.message : String(err);

    // If it's a specific WhipScribe error (credits, rate limit, auth, locked), return it directly
    if (
      errMsg.includes("WhipScribe") ||
      errMsg.includes("credits") ||
      errMsg.includes("rate limit") ||
      errMsg.includes("Authentication failed") ||
      errMsg.includes("locked or paywalled")
    ) {
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    // Unified, honest error message for URLs vs Files
    const message = isUrl
      ? "Unable to process audio from this URL. Please ensure the link points directly to a single, publicly accessible audio or video file (not a folder, playlist, or page requiring login). For guaranteed reliability, download the file and use the Direct File Upload tab."
      : "Unable to process this file. Please ensure the file contains clear spoken audio in a supported format (MP3, WAV, M4A, MP4, WebM) under 50MB.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
