"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, Database } from "lucide-react";

interface HeaderProps {
  airtableBaseId?: string;
}

export const Header: React.FC<HeaderProps> = ({ airtableBaseId = "appx2rQXn4238eQ0v" }) => {
  return (
    <header className="border-b border-whip-100/80 bg-white/90 backdrop-blur-md sticky top-0 z-40 w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand / Logo */}
        <Link href="/" className="flex items-center space-x-2.5 shrink-0 group">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-whip-700 to-whip-500 flex items-center justify-center text-white shadow-sm shadow-whip-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-gray-950 text-base sm:text-lg tracking-tight">
                WhipScribe
              </span>
              <span className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full bg-whip-100 text-whip-800 border border-whip-200">
                Audio Intelligence
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-gray-500 font-mono truncate">
              Audio Intelligence &rarr; Airtable Workflow
            </p>
          </div>
        </Link>

        {/* Right-aligned Navigation & Status Controls */}
        <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
          <Link
            href="/reader"
            className="inline-flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-xs transition-all shrink-0 whitespace-nowrap"
            title="Open UI Challenge 01 Mobile Reader Prototype"
          >
            <span>📱</span>
            <span className="sm:hidden">Reader</span>
            <span className="hidden sm:inline">Mobile Reader Pass</span>
          </Link>

          <div
            className="inline-flex items-center space-x-1 sm:space-x-1.5 text-xs font-medium px-2 sm:px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 text-emerald-800 shadow-2xs shrink-0 whitespace-nowrap"
            title={`Airtable Base ${airtableBaseId} Connected`}
          >
            <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="sm:hidden">Airtable</span>
            <span className="hidden sm:inline">Airtable Connected</span>
          </div>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>API Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
