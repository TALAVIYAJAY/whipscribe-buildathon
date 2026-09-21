"use client";

import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Header } from "@/components/Header";
import { MediaInput } from "@/components/MediaInput";
import { ProgressStepper } from "@/components/ProgressStepper";
import { IntelligenceView } from "@/components/IntelligenceView";
import { AirtableCard } from "@/components/AirtableCard";
import { OfflineBanner, EmptyStateView, ErrorStateView } from "@/components/StateViews";
import { ExtractedIntelligence } from "@/lib/intelligence";
import { WhipScribeTranscriptResult } from "@/lib/whipscribe";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0); // 0 = idle, 1 = submitted, 2 = transcribing, 3 = intelligence, 4 = airtable
  const [stepStatusText, setStepStatusText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active result state
  const [jobId, setJobId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<WhipScribeTranscriptResult | null>(null);
  const [intelligence, setIntelligence] = useState<ExtractedIntelligence | null>(null);

  // Airtable sync state
  const [airtableRecordId, setAirtableRecordId] = useState<string | null>(null);
  const [isSyncingAirtable, setIsSyncingAirtable] = useState(false);
  const [airtableSyncSuccess, setAirtableSyncSuccess] = useState(false);

  /**
   * Reset all state to start a clean new session
   */
  const handleResetSession = () => {
    setIsLoading(false);
    setCurrentStep(0);
    setStepStatusText("");
    setErrorMessage(null);
    setJobId(null);
    setAudioUrl(null);
    setTranscript(null);
    setIntelligence(null);
    setAirtableRecordId(null);
    setAirtableSyncSuccess(false);
  };

  /**
   * Sync the current intelligence record to Airtable
   */
  const handleSyncToAirtable = async (
    intel: ExtractedIntelligence,
    currentJobId: string,
    currentAudioLink?: string | null
  ) => {
    setIsSyncingAirtable(true);
    try {
      const res = await fetch("/api/airtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: intel.title,
          summary: intel.airtablePayload.summaryText,
          actionItems: intel.airtablePayload.actionItemsText,
          keyTimestamps: intel.airtablePayload.timestampsText,
          audioLink: currentAudioLink || undefined,
          jobId: currentJobId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Airtable insertion failed");
      }

      setAirtableRecordId(data.record_id);
      setAirtableSyncSuccess(true);
    } catch (err: unknown) {
      console.error("Airtable sync error:", err);
      // Non-fatal, user can retry sync
    } finally {
      setIsSyncingAirtable(false);
    }
  };

  /**
   * Process URL submission
   */
  const handleProcessUrl = async (url: string) => {
    // Explicitly isolate each run: clear all previous data immediately
    setErrorMessage(null);
    setJobId(null);
    setAudioUrl(null);
    setTranscript(null);
    setIntelligence(null);
    setAirtableRecordId(null);
    setAirtableSyncSuccess(false);

    setIsLoading(true);
    setCurrentStep(1);
    setStepStatusText("Submitting media URL to WhipScribe...");

    try {
      setCurrentStep(2);
      setStepStatusText("Transcribing audio & analyzing speakers...");

      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Transcription request failed");
      }

      setCurrentStep(3);
      setStepStatusText("Extracting summary, action items & timestamps...");

      setJobId(data.job_id);
      setAudioUrl(data.audio_url || url);
      setTranscript(data.transcript);
      setIntelligence(data.intelligence);

      // Auto-sync to Airtable
      setCurrentStep(4);
      setStepStatusText("Syncing intelligence record into Airtable Base...");
      await handleSyncToAirtable(data.intelligence, data.job_id, data.audio_url || url);

      setCurrentStep(5);
      setStepStatusText("Pipeline Complete!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setCurrentStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Process direct file upload
   */
  const handleProcessFile = async (file: File) => {
    // Explicitly isolate each run: clear all previous data immediately
    setErrorMessage(null);
    setJobId(null);
    setAudioUrl(null);
    setTranscript(null);
    setIntelligence(null);
    setAirtableRecordId(null);
    setAirtableSyncSuccess(false);

    setIsLoading(true);
    setCurrentStep(1);
    setStepStatusText(`Uploading ${file.name}...`);

    try {
      setCurrentStep(2);
      setStepStatusText("WhipScribe transcribing speech & timestamps...");

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "File transcription failed");
      }

      setCurrentStep(3);
      setStepStatusText("Synthesizing executive brief & action items...");

      setJobId(data.job_id);
      // Use local Object URL for immediate, reliable local playback with sound
      const localPlaybackUrl = URL.createObjectURL(file);
      setAudioUrl(localPlaybackUrl);
      setTranscript(data.transcript);
      setIntelligence(data.intelligence);

      // Auto-sync to Airtable
      setCurrentStep(4);
      setStepStatusText("Syncing row to Airtable Base...");
      await handleSyncToAirtable(data.intelligence, data.job_id, data.audio_url || null);

      setCurrentStep(5);
      setStepStatusText("Pipeline Complete!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setCurrentStep(0);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <OfflineBanner />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-whip-100 text-whip-800 text-xs font-semibold mb-4 border border-whip-200">
            <span>Audio &rarr; Actionable Airtable Intelligence</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-950 tracking-tight leading-tight">
            Turn Unreviewed Audio Into <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-whip-700 via-indigo-600 to-purple-600">
              Actionable Airtable Records
            </span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
            Transcribe meeting calls, user interviews, and voice memos with WhipScribe. Automatically extract executive takeaways and action items synced straight to Airtable.
          </p>
        </div>

        {/* Media Input Form */}
        <div className="mb-8">
          <MediaInput
            onSubmitUrl={handleProcessUrl}
            onSubmitFile={handleProcessFile}
            onClear={handleResetSession}
            hasActiveResult={Boolean(intelligence || transcript || jobId || errorMessage)}
            isLoading={isLoading}
          />
        </div>

        {/* Progress Stepper (shown when loading or step is active) */}
        {(isLoading || currentStep > 0) && (
          <ProgressStepper
            currentStep={currentStep}
            stepStatusText={stepStatusText}
          />
        )}

        {/* Error State */}
        {errorMessage && (
          <ErrorStateView
            message={errorMessage}
            onRetry={() => {
              setErrorMessage(null);
              setCurrentStep(0);
            }}
          />
        )}

        {/* Done State: Audio Intelligence Results */}
        {intelligence && transcript && (
          <div className="space-y-6 animate-fadeIn">
            {/* Session Action Bar */}
            <div className="flex items-center justify-between bg-white px-5 py-3 rounded-2xl border border-gray-200/80 shadow-sm">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Active Intelligence Session
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetSession}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Clear & Start New Session</span>
              </button>
            </div>

            {/* Airtable Sync Status Card */}
            <AirtableCard
              recordId={airtableRecordId}
              isSyncing={isSyncingAirtable}
              syncSuccess={airtableSyncSuccess}
            />

            {/* Intelligence Briefing Tabs & Diarized Transcript */}
            <IntelligenceView
              intelligence={intelligence}
              transcript={transcript}
            />
          </div>
        )}

        {/* Empty State (when idle and no intelligence loaded) */}
        {!isLoading && !intelligence && !errorMessage && (
          <EmptyStateView />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 bg-white/70 py-6 text-center text-xs text-gray-500">
        <p>
          Built by <strong className="text-gray-800">Jay Talaviya</strong> • Powered by{" "}
          <span className="text-whip-700 font-semibold">WhipScribe API</span> & Google Gemini AI.
        </p>
      </footer>
    </div>
  );
}
