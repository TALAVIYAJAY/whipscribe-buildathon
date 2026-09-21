/**
 * Media Duration & Credit Protection Validator
 * Checks media duration & size BEFORE sending to WhipScribe to protect user account credits.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  detectedTitle?: string;
  durationSeconds?: number;
}

/**
 * Extract YouTube Video ID from standard, short, embed, or mobile URLs
 */
export function extractYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      if (parsed.pathname.startsWith("/v/")) {
        return parsed.pathname.split("/")[2] || null;
      }
    }
    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("?")[0] || null;
    }
  } catch {
    // Malformed URL
  }
  return null;
}

/**
 * Extract Google Drive File ID from preview, view, or open URLs
 */
export function extractGoogleDriveId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("drive.google.com")) {
      const match = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) return match[1];
      const idParam = parsed.searchParams.get("id");
      if (idParam) return idParam;
    }
  } catch {
    // Malformed URL
  }
  return null;
}

/**
 * Validates a media URL before submitting to WhipScribe
 * Rejects videos/audio longer than maxAllowedSeconds in < 500ms without consuming credits.
 */
export async function validateMediaUrlBeforeIntake(
  url: string,
  maxAllowedSeconds: number = 600
): Promise<ValidationResult> {
  // 1. YouTube Pre-Flight Check (exact duration in seconds)
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch("https://www.youtube.com/youtubei/v1/player", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        body: JSON.stringify({
          context: { client: { clientName: "WEB", clientVersion: "2.20230522.01.00" } },
          videoId: youtubeId,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const secStr = data?.videoDetails?.lengthSeconds;
        const title = data?.videoDetails?.title || "";

        if (secStr) {
          const durationSeconds = parseInt(secStr, 10);
          if (!isNaN(durationSeconds) && durationSeconds > 0) {
            // Allow 30s grace buffer (e.g. 10m 20s clip)
            if (durationSeconds > maxAllowedSeconds + 30) {
              const minutes = Math.round(durationSeconds / 60);
              return {
                valid: false,
                durationSeconds,
                detectedTitle: title,
                error: `This YouTube video ("${title || "Video"}") is ~${minutes} minutes (${durationSeconds} seconds) long. To protect your processing credits, this demo strictly enforces a 10-minute (600 seconds) limit. Please provide a shorter video.`,
              };
            }
            return { valid: true, durationSeconds, detectedTitle: title };
          }
        }
      }
    } catch {
      // Fall through gracefully if network glitch on innertube
    }
  }

  // 2. Google Drive Pre-Flight Check (direct stream content-length probe)
  const gdriveId = extractGoogleDriveId(url);
  if (gdriveId) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${gdriveId}`;

      const headRes = await fetch(downloadUrl, {
        method: "HEAD",
        redirect: "follow",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if file is private or requires sign-in
      if (headRes.url.includes("accounts.google.com")) {
        return {
          valid: false,
          error: "This Google Drive file is private and requires a Google account login. Please update the file share settings to 'Anyone with the link can view', or use the Direct File Upload tab.",
        };
      }

      const contentType = headRes.headers.get("content-type") || "";
      const contentLength = headRes.headers.get("content-length");

      if (contentLength) {
        const bytes = parseInt(contentLength, 10);
        // 40MB cap: 10 mins of high quality MP3 (320kbps) is ~24MB, speech MP3 (128kbps) is ~10MB.
        // Files > 40MB are definitely oversized (> 15-30+ minutes).
        const maxGdriveBytes = 40 * 1024 * 1024;
        if (!isNaN(bytes) && bytes > maxGdriveBytes) {
          const mb = Math.round(bytes / (1024 * 1024));
          return {
            valid: false,
            error: `This Google Drive file is approximately ${mb}MB, which exceeds the 10-minute demo threshold (~40MB max). To protect your processing credits, please provide an audio recording under 10 minutes.`,
          };
        }
      } else if (contentType.includes("text/html")) {
        // Google returned an HTML page instead of a stream (e.g. virus warning for >100MB file or permission wall)
        return {
          valid: false,
          error: "Unable to stream this Google Drive file directly. The file may be oversized (>100MB) or restricted. Please download the file and use the Direct File Upload tab.",
        };
      }

      return { valid: true };
    } catch {
      // Fall through if Google Drive probe times out
    }
  }

  // 3. Direct Media Link Pre-Flight Check (HTTP HEAD Content-Length)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const contentLength = headRes.headers.get("content-length");
    if (contentLength) {
      const bytes = parseInt(contentLength, 10);
      // 45MB cap for general media URLs
      if (!isNaN(bytes) && bytes > 45 * 1024 * 1024) {
        const mb = Math.round(bytes / (1024 * 1024));
        return {
          valid: false,
          error: `The media file at this URL is approximately ${mb}MB, which exceeds the 10-minute demo threshold. Please provide an audio recording under 10 minutes to conserve processing credits.`,
        };
      }
    }
  } catch {
    // Some CDN links do not support HEAD, proceed to intake safely
  }

  return { valid: true };
}
