"use client";

import React, { useState } from "react";
import {
  Play,
  Pause,
  Download,
  ExternalLink,
  Users,
  Target,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  FolderOpen,
  FileAudio,
} from "lucide-react";

export interface DemoScenario {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultFormat: "wav" | "mp3" | "mp4";
  availableFormats: Array<"wav" | "mp3" | "mp4">;
  duration: string;
  speakers: string;
  fileBaseName: string;
  icon: React.ElementType;
  badgeColor: string;
  tags: string[];
}

const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "standup",
    title: "Sprint Standup Meeting",
    category: "Engineering & Product",
    description:
      "Product manager Sarah and lead engineer Alex sync on WhipScribe REST pipeline, speaker diarization accuracy, and deploying the automated Airtable sync by 2 PM today.",
    defaultFormat: "wav",
    availableFormats: ["wav", "mp3", "mp4"],
    duration: "53s",
    speakers: "2 Speakers (Sarah & Alex)",
    fileBaseName: "01_product_standup_meeting",
    icon: Users,
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    tags: ["Diarization", "Sprint Goals", "Airtable Sync"],
  },
  {
    id: "discovery",
    title: "Customer Discovery Call",
    category: "User Research & Product",
    description:
      "Agency founder Marcus discusses losing 15 recorded client calls every week, highlighting the urgent need for automatic action item extraction into team Airtable boards.",
    defaultFormat: "mp3",
    availableFormats: ["mp3", "wav", "mp4"],
    duration: "60s",
    speakers: "2 Speakers (Elena & Marcus)",
    fileBaseName: "02_customer_discovery_interview",
    icon: Target,
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    tags: ["User Research", "Pain Points", "Agency Workflow"],
  },
  {
    id: "strategy",
    title: "Executive Strategy Briefing",
    category: "Leadership & Strategy",
    description:
      "Rapid leadership update reviewing 94% onboarding-driven retention, expanding WhipScribe automation pipelines, and setting enterprise pilot deadlines for October.",
    defaultFormat: "mp4",
    availableFormats: ["mp4", "mp3", "wav"],
    duration: "33s",
    speakers: "1 Speaker (Executive Lead)",
    fileBaseName: "03_executive_strategy_briefing",
    icon: TrendingUp,
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    tags: ["Fast Brief", "OKRs", "Enterprise Pilots"],
  },
];

interface SampleScenariosProps {
  onSelectSample: (file: File) => void;
  isLoading: boolean;
  googleDriveUrl?: string;
}

export const SampleScenarios: React.FC<SampleScenariosProps> = ({
  onSelectSample,
  isLoading,
  googleDriveUrl = "https://drive.google.com/drive/folders/1B_WhipScribeDemoAssets",
}) => {
  const [selectedFormats, setSelectedFormats] = useState<Record<string, "wav" | "mp3" | "mp4">>({
    standup: "wav",
    discovery: "mp3",
    strategy: "mp4",
  });
  const [loadingScenarioId, setLoadingScenarioId] = useState<string | null>(null);
  const [activeAudioPlaying, setActiveAudioPlaying] = useState<string | null>(null);

  const handleFormatChange = (scenarioId: string, format: "wav" | "mp3" | "mp4") => {
    setSelectedFormats((prev) => ({ ...prev, [scenarioId]: format }));
  };

  const handleRunScenario = async (scenario: DemoScenario) => {
    const format = selectedFormats[scenario.id] || scenario.defaultFormat;
    const fileName = `${scenario.fileBaseName}.${format}`;
    const fileUrl = `/samples/${fileName}`;

    setLoadingScenarioId(scenario.id);
    try {
      const res = await fetch(fileUrl);
      if (!res.ok) {
        throw new Error(`Failed to load ${fileName} from server`);
      }
      const blob = await res.blob();
      const mimeType =
        format === "wav" ? "audio/wav" : format === "mp3" ? "audio/mpeg" : "video/mp4";
      const file = new File([blob], fileName, { type: mimeType });

      // Scroll smoothly to top for progress stepper
      window.scrollTo({ top: 120, behavior: "smooth" });
      onSelectSample(file);
    } catch (err) {
      console.error("Failed to run demo scenario:", err);
      alert(`Could not load demo file: ${fileName}. Please check local static assets.`);
    } finally {
      setLoadingScenarioId(null);
    }
  };

  return (
    <section className="my-10 w-full">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-gray-200/80 gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-1.5">
            <Sparkles className="w-3 h-3 text-indigo-600" />
            <span>Curated Test Vectors</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
            Quick-Launch Demo Scenarios
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1 max-w-2xl">
            Evaluate the complete end-to-end pipeline instantly. Listen to real conversations, select your preferred format, and test live WhipScribe transcription & Airtable syncing in 1 click.
          </p>
        </div>

        {/* Google Drive Test Repository Button */}
        <div className="flex-shrink-0">
          <a
            href={googleDriveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border border-gray-300 hover:border-whip-500 hover:bg-gray-50 text-gray-800 text-xs font-semibold shadow-sm transition-all"
            title="Browse and download all demo audio files directly on Google Drive"
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            <span>Google Drive Test Files</span>
            <ExternalLink className="w-3 h-3 text-gray-400" />
          </a>
        </div>
      </div>

      {/* 3 Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {DEMO_SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          const currentFormat = selectedFormats[scenario.id] || scenario.defaultFormat;
          const currentFileName = `${scenario.fileBaseName}.${currentFormat}`;
          const currentFileUrl = `/samples/${currentFileName}`;
          const isThisLoading = isLoading || loadingScenarioId === scenario.id;

          return (
            <div
              key={scenario.id}
              className="bg-white rounded-2xl border border-gray-200/90 hover:border-whip-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
            >
              {/* Card Top / Header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-whip-50 text-whip-700 flex items-center justify-center border border-whip-100 flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${scenario.badgeColor}`}
                  >
                    {scenario.category}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-950 mb-1 leading-snug">
                  {scenario.title}
                </h3>

                <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3 font-mono">
                  <span>⏱ {scenario.duration}</span>
                  <span>•</span>
                  <span>{scenario.speakers}</span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 mb-4">
                  {scenario.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {scenario.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Inline Audio Preview Player */}
                <div className="bg-gray-50/80 p-2.5 rounded-xl border border-gray-100 mb-4">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-600 mb-1.5">
                    <span className="flex items-center space-x-1">
                      <FileAudio className="w-3 h-3 text-whip-600" />
                      <span>Audio Preview</span>
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono uppercase">
                      {currentFormat}
                    </span>
                  </div>
                  <audio
                    controls
                    preload="none"
                    src={currentFileUrl}
                    className="w-full h-8 outline-none"
                    onPlay={() => setActiveAudioPlaying(scenario.id)}
                  >
                    Your browser does not support audio playback.
                  </audio>
                </div>

                {/* Format Picker */}
                <div className="flex items-center justify-between pt-1 pb-2 border-t border-gray-100">
                  <span className="text-[11px] font-medium text-gray-500">Format:</span>
                  <div className="flex items-center space-x-1">
                    {scenario.availableFormats.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => handleFormatChange(scenario.id, fmt)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase transition-all ${
                          currentFormat === fmt
                            ? "bg-whip-700 text-white shadow-xs"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        .{fmt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer / Action Buttons */}
              <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                {/* Direct Download Link */}
                <a
                  href={currentFileUrl}
                  download={currentFileName}
                  className="p-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 transition-all flex items-center space-x-1 text-xs font-semibold"
                  title={`Download ${currentFileName}`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Save</span>
                </a>

                {/* Primary Run Test Button */}
                <button
                  type="button"
                  onClick={() => handleRunScenario(scenario)}
                  disabled={isThisLoading}
                  className="flex-1 inline-flex items-center justify-center space-x-1.5 px-4 py-2.5 rounded-xl bg-whip-700 hover:bg-whip-800 active:scale-[0.98] text-white text-xs font-bold shadow-sm shadow-whip-700/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isThisLoading ? "Launching Pipeline..." : "Run Live Test"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
