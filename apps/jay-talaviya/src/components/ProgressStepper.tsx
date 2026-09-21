"use client";

import React from "react";
import { Check, Loader2 } from "lucide-react";

export type StepState = "waiting" | "active" | "completed" | "error";

interface ProgressStepperProps {
  currentStep: number; // 1 to 4
  stepStatusText?: string;
}

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  currentStep,
  stepStatusText,
}) => {
  const steps = [
    { title: "Input Received", desc: "URL or File staged" },
    { title: "WhipScribe API", desc: "Transcribing & Diarizing" },
    { title: "Audio Intelligence", desc: "Summary & Action Items" },
    { title: "Airtable Sync", desc: "Writing to Base" },
  ];

  return (
    <div className="w-full bg-white rounded-2xl border border-whip-100 p-6 shadow-md mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Workflow Pipeline Progress
        </h3>
        {stepStatusText && (
          <span className="text-xs font-mono text-whip-700 bg-whip-50 px-2.5 py-1 rounded-full border border-whip-100 animate-pulse">
            {stepStatusText}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {steps.map((step, idx) => {
          const stepNum = idx + 1;
          const isDone = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          const isWaiting = currentStep < stepNum;

          return (
            <div
              key={step.title}
              className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                isActive
                  ? "border-whip-400 bg-whip-50/70 shadow-sm"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50/40 text-emerald-950"
                  : "border-gray-100 bg-gray-50/50 opacity-60"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  isDone
                    ? "bg-emerald-500 text-white"
                    : isActive
                    ? "bg-whip-700 text-white animate-pulse"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isDone ? (
                  <Check className="w-4 h-4" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  stepNum
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate text-gray-900">
                  {step.title}
                </div>
                <div className="text-[11px] text-gray-500 truncate">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
