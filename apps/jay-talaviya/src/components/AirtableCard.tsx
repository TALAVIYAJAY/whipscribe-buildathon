"use client";

import React, { useState } from "react";
import { Database, Check, Loader2, Copy } from "lucide-react";

interface AirtableCardProps {
  baseId?: string;
  tableName?: string;
  recordId?: string | null;
  isSyncing: boolean;
  syncSuccess: boolean;
}

export const AirtableCard: React.FC<AirtableCardProps> = ({
  baseId = "appx2rQXn4238eQ0v",
  tableName = "Table 1",
  recordId,
  isSyncing,
  syncSuccess,
}) => {
  const [copied, setCopied] = useState(false);

  const copyRecordId = () => {
    if (recordId) {
      navigator.clipboard.writeText(recordId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-emerald-50 via-teal-50/30 to-white rounded-2xl border border-emerald-200/80 p-6 shadow-xl mb-8 transition-all">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-bold text-gray-900">
                Airtable Database Synchronization
              </h3>
              {syncSuccess ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Check className="w-3 h-3" />
                  <span>Synced</span>
                </span>
              ) : isSyncing ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                  <span>Auto-Sync Ready</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Target: <code className="text-emerald-900 font-mono font-semibold">{baseId}</code> /{" "}
              <code className="text-emerald-900 font-mono font-semibold">{tableName}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-sm">
            {isSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Auto-Syncing Row to Base...</span>
              </>
            ) : syncSuccess ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Record Saved Automatically</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Automatic Sync Active</span>
              </>
            )}
          </div>
        </div>
      </div>

      {recordId && (
        <div className="mt-4 pt-4 border-t border-emerald-200/60 flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-600">Created Record ID:</span>
            <code className="bg-white px-2.5 py-1 rounded-md border border-emerald-200 font-mono text-emerald-800 font-bold shadow-xs">
              {recordId}
            </code>
            <span className="text-[11px] text-emerald-600 font-medium hidden sm:inline">
              (Live on Table 1)
            </span>
          </div>

          <button
            type="button"
            onClick={copyRecordId}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-100/70 hover:bg-emerald-100 text-emerald-800 font-medium transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-emerald-600" />
                <span>Copy Record ID</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
