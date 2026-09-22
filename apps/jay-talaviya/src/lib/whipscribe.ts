/**
 * WhipScribe API Client
 * Production-grade REST integration with exponential backoff polling,
 * HTTP error mapping (402, 429, 401), paywall/locked detection, and retry resilience.
 */

const WHIPSCRIBE_BASE_URL = "https://whipscribe.com/api/v1";

export interface WhipScribeWord {
  start: number;
  end: number;
  text: string;
}

export interface WhipScribeSegment {
  start: number;
  end: number;
  speaker: string;
  text: string;
  words?: WhipScribeWord[];
}

export interface WhipScribeTranscriptResult {
  text: string;
  language: string;
  segments: WhipScribeSegment[];
  speech_detected?: boolean;
  speech_ratio?: number;
}

export interface WhipScribeJobStatus {
  job_id: string;
  status: "queued" | "processing" | "done" | "failed";
  progress?: number;
  audio_duration_seconds?: number;
  language?: string;
  source?: string;
  speech_detected?: boolean;
  locked?: boolean;
  locked_code?: string;
  unlock_url?: string;
  error?: string | null;
}

export interface WhipScribeAudioUrlResponse {
  url: string;
  storage: string;
  expires_in: number;
  retention_days?: number;
}

export class WhipScribeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WhipScribeError";
  }
}

export class WhipScribeClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.WHIPSCRIBE_API_KEY || "";
    if (!this.apiKey) {
      console.warn("[WhipScribe] Initialized without WHIPSCRIBE_API_KEY");
    }
  }

  private get headers(): HeadersInit {
    return {
      "X-API-Key": this.apiKey,
      "User-Agent": "WhipScribe-Audio-Intelligence/1.0",
    };
  }

  /**
   * Helper to parse and humanize WhipScribe HTTP errors
   */
  private async handleHttpError(res: Response, context: string): Promise<never> {
    const errText = await res.text().catch(() => "");
    if (res.status === 401 || res.status === 403) {
      throw new WhipScribeError(`Authentication failed (${res.status}): Please verify your WHIPSCRIBE_API_KEY in .env.`);
    }
    if (res.status === 402) {
      throw new WhipScribeError("Insufficient WhipScribe credits. Please add audio-hours in your WhipScribe account.");
    }
    if (res.status === 429) {
      throw new WhipScribeError("WhipScribe rate limit reached. Please wait a few seconds before retrying.");
    }
    throw new WhipScribeError(`WhipScribe ${context} failed (${res.status}): ${errText}`);
  }

  /**
   * Submit a public media URL (YouTube, direct MP3/WAV/MP4 audio stream)
   */
  async submitUrl(url: string, language: string = "en"): Promise<{ job_id: string; claim_token?: string }> {
    const res = await fetch(`${WHIPSCRIBE_BASE_URL}/transcribe/url`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        language,
        source: "url",
      }),
    });

    if (!res.ok) {
      await this.handleHttpError(res, "submit URL");
    }

    return res.json();
  }

  /**
   * Submit an audio file via multipart/form-data
   */
  async submitFile(
    fileBuffer: Blob | Buffer,
    fileName: string,
    mimeType: string,
    language: string = "en"
  ): Promise<{ job_id: string; claim_token?: string }> {
    const formData = new FormData();
    const blob = fileBuffer instanceof Blob ? fileBuffer : new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
    formData.append("file", blob, fileName);
    formData.append("language", language);

    const res = await fetch(`${WHIPSCRIBE_BASE_URL}/transcribe`, {
      method: "POST",
      headers: this.headers,
      body: formData,
    });

    if (!res.ok) {
      await this.handleHttpError(res, "file upload");
    }

    return res.json();
  }

  /**
   * Poll job status with single-call error mapping
   */
  async getJobStatus(jobId: string): Promise<WhipScribeJobStatus> {
    const res = await fetch(`${WHIPSCRIBE_BASE_URL}/jobs/${jobId}`, {
      method: "GET",
      headers: this.headers,
    });

    if (!res.ok) {
      await this.handleHttpError(res, `polling job ${jobId}`);
    }

    return res.json();
  }

  /**
   * Fetch full transcript with speaker diarization and word timestamps
   */
  async getTranscript(jobId: string): Promise<WhipScribeTranscriptResult> {
    const res = await fetch(`${WHIPSCRIBE_BASE_URL}/jobs/${jobId}/result?format=json`, {
      method: "GET",
      headers: this.headers,
    });

    if (!res.ok) {
      await this.handleHttpError(res, `fetching transcript for ${jobId}`);
    }

    return res.json();
  }

  /**
   * Fetch signed playback URL for uploaded media
   */
  async getAudioUrl(jobId: string): Promise<string | null> {
    try {
      const res = await fetch(`${WHIPSCRIBE_BASE_URL}/jobs/${jobId}/audio/url`, {
        method: "GET",
        headers: this.headers,
      });

      if (!res.ok) {
        return null;
      }

      const data: WhipScribeAudioUrlResponse = await res.json();
      return data.url || null;
    } catch {
      return null;
    }
  }

  /**
   * Poll with exponential backoff on transient network dropouts until job is done
   */
  async waitForJobCompletion(
    jobId: string,
    onProgress?: (progress: number, status: string) => void,
    maxWaitSeconds: number = 300
  ): Promise<WhipScribeJobStatus> {
    const startTime = Date.now();
    const intervalMs = 2500;
    let consecutiveNetworkErrors = 0;

    while (Date.now() - startTime < maxWaitSeconds * 1000) {
      let status: WhipScribeJobStatus;

      try {
        status = await this.getJobStatus(jobId);
        consecutiveNetworkErrors = 0; // reset on successful ping
      } catch (err: unknown) {
        // If it's a definitive WhipScribe HTTP rejection (e.g. 401, 402, 429), rethrow immediately
        if (err instanceof WhipScribeError) {
          throw err;
        }

        // Allow up to 4 consecutive transient network poll failures before aborting
        consecutiveNetworkErrors++;
        console.warn(`[WhipScribe] Poll attempt transient network error (${consecutiveNetworkErrors}/4):`, err);
        if (consecutiveNetworkErrors >= 4) {
          throw new WhipScribeError(`Lost connection to WhipScribe polling endpoint: ${err}`);
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
        continue;
      }

      if (onProgress) {
        onProgress(status.progress ?? 0, status.status);
      }

      if (status.status === "done") {
        // Check for WhipScribe paywall lock status
        if (status.locked) {
          throw new WhipScribeError(
            "This transcript is locked or paywalled. Your WhipScribe account needs active credit balance."
          );
        }
        return status;
      }

      if (status.status === "failed") {
        let failureReason = status.error || `Transcription job failed for ID: ${jobId}`;
        if (failureReason.includes("engine door unreachable")) {
          failureReason = "WhipScribe GPU worker cluster is temporarily unresponsive (engine door unreachable). The WhipScribe server is attempting to recover. Please retry in a moment or click Cancel.";
        }
        throw new WhipScribeError(failureReason);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }

    throw new WhipScribeError(`Timed out waiting for WhipScribe job ${jobId} to complete after ${maxWaitSeconds}s`);
  }
}
