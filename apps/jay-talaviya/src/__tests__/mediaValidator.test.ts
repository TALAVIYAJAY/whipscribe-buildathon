import { describe, it, expect } from "vitest";
import {
  extractYouTubeId,
  extractGoogleDriveId,
  validateMediaFile,
} from "../lib/media-validator";

describe("Media Duration & Pre-Flight Credit Protection Engine", () => {
  describe("YouTube URL Parser", () => {
    it("extracts ID from standard watch URLs", () => {
      expect(extractYouTubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from shortened youtu.be URLs", () => {
      expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
      expect(extractYouTubeId("https://youtu.be/dQw4w9WgXcQ?t=42")).toBe("dQw4w9WgXcQ");
    });

    it("extracts ID from YouTube Shorts URLs", () => {
      expect(extractYouTubeId("https://www.youtube.com/shorts/abc123XYZ_0")).toBe("abc123XYZ_0");
    });

    it("extracts ID from YouTube Embed URLs", () => {
      expect(extractYouTubeId("https://www.youtube.com/embed/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    });

    it("returns null on non-YouTube or malformed URLs", () => {
      expect(extractYouTubeId("https://vimeo.com/123456")).toBeNull();
      expect(extractYouTubeId("https://example.com/audio.mp3")).toBeNull();
      expect(extractYouTubeId("not-a-valid-url")).toBeNull();
    });
  });

  describe("Google Drive URL Parser", () => {
    it("extracts file ID from /file/d/ URLs", () => {
      const url = "https://drive.google.com/file/d/1JUrBZBmRpqbEen1fQo9wnYjohZO1HK5V/view?usp=sharing";
      expect(extractGoogleDriveId(url)).toBe("1JUrBZBmRpqbEen1fQo9wnYjohZO1HK5V");
    });

    it("extracts file ID from query parameter ?id= URLs", () => {
      const url = "https://drive.google.com/open?id=10foMFl8LYYOFB89zQFOvYw5-2O6JjbEz";
      expect(extractGoogleDriveId(url)).toBe("10foMFl8LYYOFB89zQFOvYw5-2O6JjbEz");
    });

    it("returns null on non-Drive URLs", () => {
      expect(extractGoogleDriveId("https://dropbox.com/s/12345/file.wav")).toBeNull();
      expect(extractGoogleDriveId("not-a-url")).toBeNull();
    });
  });

  describe("Media File Pre-Flight Guardrails", () => {
    it("approves valid standard audio files (.mp3, .wav, .m4a)", () => {
      const mockMp3 = { name: "standup.mp3", size: 10 * 1024 * 1024, type: "audio/mpeg" } as File;
      const resMp3 = validateMediaFile(mockMp3);
      expect(resMp3.valid).toBe(true);

      const mockWav = { name: "interview.wav", size: 25 * 1024 * 1024, type: "audio/wav" } as File;
      const resWav = validateMediaFile(mockWav);
      expect(resWav.valid).toBe(true);
    });

    it("rejects oversized files exceeding 250MB to protect memory and credits", () => {
      const oversizedFile = { name: "giant_podcast.mp3", size: 300 * 1024 * 1024, type: "audio/mpeg" } as File;
      const res = validateMediaFile(oversizedFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("exceeds the 250MB limit");
    });

    it("rejects unsupported document and executable formats", () => {
      const exeFile = { name: "malware.exe", size: 1024, type: "application/octet-stream" } as File;
      const resExe = validateMediaFile(exeFile);
      expect(resExe.valid).toBe(false);
      expect(resExe.error).toContain("Unsupported file format");

      const pdfFile = { name: "document.pdf", size: 1024, type: "application/pdf" } as File;
      const resPdf = validateMediaFile(pdfFile);
      expect(resPdf.valid).toBe(false);
    });

    it("rejects empty 0-byte corrupted files", () => {
      const emptyFile = { name: "zero.mp3", size: 0, type: "audio/mpeg" } as File;
      const res = validateMediaFile(emptyFile);
      expect(res.valid).toBe(false);
      expect(res.error).toContain("is empty (0 bytes)");
    });
  });
});
