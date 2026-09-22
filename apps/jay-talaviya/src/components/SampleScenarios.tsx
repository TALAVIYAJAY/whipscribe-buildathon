"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Download,
  ExternalLink,
  Users,
  Target,
  TrendingUp,
  FileAudio,
  FolderOpen,
  Cloud,
  CheckCircle2,
  HardDrive,
} from "lucide-react";

export interface DemoItem {
  id: string;
  title: string;
  category: string;
  description: string;
  format: "wav" | "mp3" | "mp4";
  formatLabel: string;
  duration: string;
  speakers: string;
  fileName: string;
  icon: React.ElementType;
  badgeColor: string;
  tags: string[];
}

export const DIRECT_UPLOAD_ITEMS: DemoItem[] = [
  {
    id: "direct-standup",
    title: "Sprint Standup Meeting",
    category: "Engineering & Product",
    description:
      "Product manager Sarah and lead engineer Alex sync on the WhipScribe REST pipeline, speaker diarization accuracy, and deploying the automated Airtable sync by 2 PM.",
    format: "wav",
    formatLabel: "PCM 16-bit WAV",
    duration: "53s",
    speakers: "2 Speakers (Sarah & Alex)",
    fileName: "direct_01_standup_meeting.wav",
    icon: Users,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    tags: ["Diarization", "Sprint Standup", "Airtable Sync"],
  },
  {
    id: "direct-discovery",
    title: "Customer Discovery Call",
    category: "User Research & Product",
    description:
      "Design agency founder Marcus details losing 15 recorded client calls per week and why automated action item extraction straight to Airtable solves their bottleneck.",
    format: "mp3",
    formatLabel: "Compressed 128k MP3",
    duration: "60s",
    speakers: "2 Speakers (Elena & Marcus)",
    fileName: "direct_02_customer_interview.mp3",
    icon: Target,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    tags: ["User Research", "Pain Points", "Agency Workflow"],
  },
  {
    id: "direct-strategy",
    title: "Executive Strategy Briefing",
    category: "Leadership & Strategy",
    description:
      "Rapid leadership update reviewing 94% onboarding retention, expanding WhipScribe automation pipelines, and setting enterprise pilot deadlines for October.",
    format: "mp4",
    formatLabel: "H.264 / AAC MP4",
    duration: "33s",
    speakers: "1 Speaker (Executive Lead)",
    fileName: "direct_03_executive_memo.mp4",
    icon: TrendingUp,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    tags: ["Video Audio", "OKRs", "Enterprise Pilots"],
  },
];

export const GDRIVE_ITEMS: DemoItem[] = [
  {
    id: "gdrive-roadmap",
    title: "Quarterly Roadmap Review",
    category: "Cloud Engineering",
    description:
      "Engineering sync covering quarterly deliverables, database indexing, Airtable webhooks, and end-to-end encryption compliance for enterprise clients.",
    format: "wav",
    formatLabel: "Google Drive • WAV",
    duration: "40s",
    speakers: "2 Speakers (Sarah & Alex)",
    fileName: "gdrive_01_roadmap_sync.wav",
    icon: Users,
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    tags: ["Google Drive", "Compliance", "Roadmap"],
  },
  {
    id: "gdrive-onboarding",
    title: "Enterprise Client Onboarding",
    category: "Customer Success",
    description:
      "Customer success lead Elena guides enterprise client David through transcribing hundreds of voice memos directly from Google Drive into structured Airtable rows.",
    format: "mp3",
    formatLabel: "Google Drive • MP3",
    duration: "35s",
    speakers: "2 Speakers (Elena & David)",
    fileName: "gdrive_02_client_onboarding.mp3",
    icon: Target,
    badgeColor: "bg-cyan-100 text-cyan-800 border-cyan-200",
    tags: ["Google Drive", "Support Automation", "Client Onboarding"],
  },
  {
    id: "gdrive-founder",
    title: "Company All-Hands Announcement",
    category: "Executive Vision",
    description:
      "Founder all-hands update announcing the launch of the WhipScribe + Airtable pipeline, celebrating an 80% reduction in manual meeting documentation.",
    format: "mp4",
    formatLabel: "Google Drive • MP4",
    duration: "23s",
    speakers: "1 Speaker (Founder/CEO)",
    fileName: "gdrive_03_founder_update.mp4",
    icon: TrendingUp,
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    tags: ["Google Drive", "All-Hands", "Product Launch"],
  },
];

interface SampleScenariosProps {
  onSelectSample: (file: File) => void;
  onSubmitUrl?: (url: string) => void;
  isLoading: boolean;
  googleDriveFolderUrl?: string;
  googleDriveLinks?: {
    wavUrl?: string;
    mp3Url?: string;
    mp4Url?: string;
  };
}

export const SampleScenarios: React.FC<SampleScenariosProps> = ({
  onSelectSample,
  onSubmitUrl,
  isLoading,
  googleDriveFolderUrl = "https://drive.google.com/drive/folders/your-drive-folder-id",
  googleDriveLinks = {},
}) => {
  const [activeTab, setActiveTab] = useState<"direct" | "gdrive">("direct");
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);

  const handleRunDirect = async (item: DemoItem) => {
    const fileUrl = `/samples/${item.fileName}`;
    setLoadingItemId(item.id);

    try {
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error(`Could not load ${item.fileName}`);
      const blob = await res.blob();
      const mimeType =
        item.format === "wav" ? "audio/wav" : item.format === "mp3" ? "audio/mpeg" : "video/mp4";
      const file = new File([blob], item.fileName, { type: mimeType });

      window.scrollTo({ top: 120, behavior: "smooth" });
      onSelectSample(file);
    } catch (err) {
      console.error("Failed to run sample:", err);
      alert(`Could not load demo file ${item.fileName}.`);
    } finally {
      setLoadingItemId(null);
    }
  };

  const handleRunGdrive = async (item: DemoItem) => {
    // Check if a specific Google Drive link has been configured for this format
    const customLink =
      item.format === "wav"
        ? googleDriveLinks.wavUrl
        : item.format === "mp3"
        ? googleDriveLinks.mp3Url
        : googleDriveLinks.mp4Url;

    if (customLink && onSubmitUrl) {
      window.scrollTo({ top: 120, behavior: "smooth" });
      onSubmitUrl(customLink);
      return;
    }

    // Fallback: load file and process through pipeline
    await handleRunDirect(item);
  };

  const activeItems = activeTab === "direct" ? DIRECT_UPLOAD_ITEMS : GDRIVE_ITEMS;

  return (
    <section className="my-10 w-full">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 pb-4 border-b border-gray-200/80 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>6 Curated Test Vectors</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
            Quick-Launch Demo Scenarios
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
            Test the live WhipScribe & Airtable pipeline in 1 click without searching for files. Listen to the audio preview in your browser, test direct uploads, or test via Google Drive.
          </p>
        </div>

        {/* Vector Toggle Buttons */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-xl border border-gray-200 self-start md:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("direct")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "direct"
                ? "bg-white text-whip-800 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            <span>Direct Upload (3 Files)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("gdrive")}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "gdrive"
                ? "bg-white text-amber-700 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Google Drive (3 Files)</span>
          </button>
        </div>
      </div>

      {/* Google Drive Notice Banner when gdrive tab is active */}
      {activeTab === "gdrive" && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-950">
                Google Drive Cloud Ingestion Vector
              </div>
              <p className="text-[11px] text-amber-800">
                These 3 files are stored in Google Drive. You can preview the audio, open them on Google Drive, or run the automated extraction pipeline.
              </p>
            </div>
          </div>
          {googleDriveFolderUrl && (
            <a
              href={googleDriveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap self-start sm:self-auto"
            >
              <span>Open Drive Folder</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* 3 Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
        {activeItems.map((item) => {
          const Icon = item.icon;
          const fileUrl = `/samples/${item.fileName}`;
          const isThisLoading = isLoading || loadingItemId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-gray-200/90 hover:border-whip-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Header & Content */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-whip-50 text-whip-700 flex items-center justify-center border border-whip-100 flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${item.badgeColor}`}
                  >
                    {item.format.toUpperCase()}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-950 mb-1 leading-snug">
                  {item.title}
                </h3>

                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3 font-mono">
                  <span>⏱ {item.duration}</span>
                  <span>•</span>
                  <span>{item.speakers}</span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-4">
                  {item.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Inline HTML5 Audio Player for direct listening */}
                <div className="bg-gray-50/90 p-2.5 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1.5">
                    <span className="flex items-center space-x-1">
                      <FileAudio className="w-3.5 h-3.5 text-whip-600" />
                      <span>Listen In-Browser:</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {item.formatLabel}
                    </span>
                  </div>
                  <audio
                    controls
                    preload="none"
                    src={fileUrl}
                    className="w-full h-8 outline-none"
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>
              </div>

              {/* Card Footer / Action Buttons */}
              <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                <a
                  href={fileUrl}
                  download={item.fileName}
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 transition-all flex items-center space-x-1 text-xs font-semibold"
                  title={`Download ${item.fileName}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </a>

                <button
                  type="button"
                  onClick={() =>
                    activeTab === "direct" ? handleRunDirect(item) : handleRunGdrive(item)
                  }
                  disabled={isThisLoading}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-whip-700 hover:bg-whip-800 active:scale-[0.98] text-white text-xs font-bold shadow-sm shadow-whip-700/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isThisLoading
                      ? "Launching Pipeline..."
                      : activeTab === "direct"
                      ? "Test Direct Upload"
                      : "Test Google Drive"}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
