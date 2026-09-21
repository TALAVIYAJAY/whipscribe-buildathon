"use client";

import React from "react";
import { Sparkles, Database } from "lucide-react";

interface HeaderProps {
  airtableBaseId?: string;
}

export const Header: React.FC<HeaderProps> = ({ airtableBaseId = "appx2rQXn4238eQ0v" }) => {
  return (
    <header className="border-b border-whip-100 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-whip-700 to-whip-500 flex items-center justify-center text-white shadow-md shadow-whip-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-gray-900 text-lg tracking-tight">
                WhipScribe
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-whip-100 text-whip-800 border border-whip-200">
                Audio Intelligence
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono">
              Audio Intelligence &rarr; Airtable Workflow
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Airtable Connected</span>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>WhipScribe API Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
