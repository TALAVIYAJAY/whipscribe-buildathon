"use client";

import React, { useEffect, useState } from "react";
import {
  WifiOff,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Inbox,
} from "lucide-react";

/**
 * 1. Offline State Banner
 * Detects browser network disconnection and presents offline guidance
 */
export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="w-full bg-amber-500 text-white px-4 py-2.5 shadow-md flex items-center justify-center space-x-2 text-xs font-semibold sticky top-16 z-50 animate-bounce">
      <WifiOff className="w-4 h-4" />
      <span>
        You are currently offline. WhipScribe API and Airtable requests require an active internet connection.
      </span>
    </div>
  );
};

/**
 * 2. Empty State View
 */
export const EmptyStateView: React.FC = () => {
  return (
    <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50 my-6">
      <div className="w-14 h-14 rounded-2xl bg-whip-100 text-whip-700 mx-auto flex items-center justify-center mb-4">
        <Inbox className="w-7 h-7" />
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-1">
        Ready to Process Audio
      </h3>
      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
        Select a tab above: paste a public audio URL or upload an audio file to extract intelligence and sync to your Airtable Base.
      </p>
    </div>
  );
};

/**
 * 3. Error State View
 */
export const ErrorStateView: React.FC<{
  message: string;
  onRetry: () => void;
}> = ({ message, onRetry }) => {
  return (
    <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center my-6">
      <div className="w-12 h-12 rounded-xl bg-red-100 text-red-700 mx-auto flex items-center justify-center mb-3">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-red-900 mb-1">
        Processing Encountered An Issue
      </h3>
      <p className="text-xs text-red-700 max-w-lg mx-auto mb-4 font-mono">
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-all"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Try Again</span>
      </button>
    </div>
  );
};
