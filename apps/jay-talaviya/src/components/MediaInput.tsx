"use client";

import React, { useState, useRef } from "react";
import { Link as LinkIcon, UploadCloud, FileAudio, ArrowRight, Clock, AlertCircle, RotateCcw, X } from "lucide-react";

interface MediaInputProps {
  onSubmitUrl: (url: string) => void;
  onSubmitFile: (file: File) => void;
  onClear?: () => void;
  hasActiveResult?: boolean;
  isLoading: boolean;
}

export const MediaInput: React.FC<MediaInputProps> = ({
  onSubmitUrl,
  onSubmitFile,
  onClear,
  hasActiveResult = false,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<"url" | "file">("url");
  const [urlInput, setUrlInput] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearAll = () => {
    setUrlInput("");
    setSelectedFile(null);
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClear?.();
  };

  const validateAndSetFile = (file: File) => {
    setValidationError(null);
    if (file.size > 50 * 1024 * 1024) {
      setValidationError("File exceeds the 50MB limit. Please select a smaller file.");
      setSelectedFile(null);
      return;
    }

    // Inspect duration client-side via HTML5 Audio
    try {
      const audio = document.createElement("audio");
      const objectUrl = URL.createObjectURL(file);
      audio.preload = "metadata";
      audio.src = objectUrl;

      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        if (audio.duration && audio.duration > 630) {
          const mins = Math.round(audio.duration / 60);
          setValidationError(
            `This file is ~${mins} minutes long. To protect processing credits, this demo is capped at 10 minutes (600 seconds). Please upload a recording under 10 minutes.`
          );
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = "";
        } else {
          setSelectedFile(file);
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setSelectedFile(file);
      };
    } catch {
      setSelectedFile(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (!urlInput.trim()) return;
    onSubmitUrl(urlInput.trim());
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSubmit = () => {
    if (!selectedFile) return;
    onSubmitFile(selectedFile);
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-whip-100 shadow-xl shadow-whip-900/5 overflow-hidden transition-all">
      {/* Tabs */}
      <div className="flex items-center border-b border-gray-100 bg-gray-50/70 p-1.5 gap-1.5">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            setActiveTab("url");
            setValidationError(null);
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === "url"
              ? "bg-white text-whip-800 shadow-sm border border-gray-100"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
          }`}
        >
          <LinkIcon className="w-4 h-4" />
          <span>Public Cloud / Audio URL</span>
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            setActiveTab("file");
            setValidationError(null);
          }}
          className={`flex-1 flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            activeTab === "file"
              ? "bg-white text-whip-800 shadow-sm border border-gray-100"
              : "text-gray-500 hover:text-gray-900 hover:bg-gray-100/50"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Direct File Upload (MP3, WAV, M4A, MP4)</span>
        </button>

        {/* Demo Cap Badge */}
        <div className="hidden sm:flex items-center px-3 py-2 bg-amber-50/90 border border-amber-200/80 rounded-xl text-[11px] font-semibold text-amber-800 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 mr-1 text-amber-600" />
          <span>Cap: Max 10 Mins</span>
        </div>

        {/* Clear Button */}
        {(hasActiveResult || urlInput || selectedFile || validationError) && (
          <button
            type="button"
            onClick={handleClearAll}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-gray-500 hover:text-red-600 hover:bg-red-50/80 border border-gray-200 hover:border-red-200 transition-all disabled:opacity-50"
            title="Clear all inputs and results"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {validationError && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start space-x-2.5 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold mb-0.5">Demo Duration Limit</p>
            <p className="text-amber-800 leading-relaxed">{validationError}</p>
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Tab 1: URL Input */}
        {activeTab === "url" && (
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label htmlFor="media-url" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Paste Public Audio or Media Link (Podcast, Stream, Cloud URL)
              </label>
              <div className="relative flex items-center">
                <input
                  id="media-url"
                  type="url"
                  disabled={isLoading}
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/interview.mp3 or https://cdn.com/audio.wav"
                  className="w-full px-4 py-3.5 pr-36 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-whip-500 focus:border-transparent transition-all placeholder:text-gray-400 font-mono disabled:opacity-60"
                />
                <div className="absolute right-2 flex items-center space-x-1.5">
                  {urlInput && !isLoading && (
                    <button
                      type="button"
                      onClick={() => {
                        setUrlInput("");
                        setValidationError(null);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                      title="Clear URL"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || !urlInput.trim()}
                    className="px-4 py-2 rounded-lg bg-whip-700 hover:bg-whip-800 text-white text-xs font-semibold shadow-md shadow-whip-700/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 transition-all"
                  >
                    <span>Process</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                <strong className="text-whip-800">Supported:</strong> Any publicly accessible audio or video stream (.mp3, .wav, .m4a, .mp4, .webm). For private local files, use the <strong>Direct File Upload</strong> tab.
              </p>
            </div>
          </form>
        )}

        {/* Tab 2: File Upload */}
        {activeTab === "file" && (
          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div
              onDragOver={(e) => {
                if (isLoading) return;
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                if (isLoading) return;
                handleFileDrop(e);
              }}
              onClick={() => {
                if (!isLoading) fileInputRef.current?.click();
              }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isLoading
                  ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50"
                  : "cursor-pointer " +
                    (dragActive
                      ? "border-whip-500 bg-whip-50/60"
                      : selectedFile
                      ? "border-emerald-300 bg-emerald-50/30"
                      : "border-gray-200 hover:border-whip-300 hover:bg-gray-50/50")
              }`}
            >
              {selectedFile ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                    <FileAudio className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{selectedFile.name}</div>
                  <div className="text-xs text-gray-500 font-mono">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to transcribe
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-whip-100 text-whip-700 flex items-center justify-center shadow-sm">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    Click to browse or drag and drop audio/video file
                  </div>
                  <div className="text-xs text-gray-400">
                    Supports MP3, WAV, M4A, MP4, AAC (Max 50MB)
                  </div>
                </div>
              )}
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setValidationError(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  disabled={isLoading}
                  className="px-3 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-all flex items-center space-x-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove File</span>
                </button>
                <button
                  type="button"
                  onClick={handleFileSubmit}
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-whip-700 hover:bg-whip-800 text-white text-xs font-semibold shadow-md shadow-whip-700/20 disabled:opacity-50 flex items-center space-x-2 transition-all"
                >
                  <span>Upload & Transcribe to Airtable</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
