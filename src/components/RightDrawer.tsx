"use client";

import { useState } from "react";
import { Pipeline, DiagnosisResponse } from "@/types";

interface RightDrawerProps {
  pipeline: Pipeline | null;
  threshold: number;
  onClose: () => void;
}

/**
 * Right drawer/modal showing pipeline details and AI diagnosis
 */
export default function RightDrawer({ pipeline, threshold, onClose }: RightDrawerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!pipeline) return null;

  const isAtRisk = pipeline.leakProb > threshold;

  const handleGenerateDiagnosis = async () => {
    setIsLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: pipeline.id,
          name: pipeline.name,
          pressure_bar: pipeline.pressure_bar,
          flow_m3h: pipeline.flow_m3h,
          leakProb: pipeline.leakProb,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate diagnosis");
      }

      setDiagnosis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full lg:w-[420px] bg-slate-900/99 border-l border-slate-700/70 shadow-2xl z-50 overflow-y-auto backdrop-blur-xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/98 border-b border-slate-700/70 p-4 flex items-center justify-between backdrop-blur-lg z-10 shadow-md">
          <div>
            <h2 className="text-lg font-semibold text-white">{pipeline.name}</h2>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">ID: {pipeline.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors group"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                isAtRisk
                  ? "bg-red-950/50 border border-red-900/50 text-red-400"
                  : "bg-emerald-950/50 border border-emerald-900/50 text-emerald-400"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  isAtRisk ? "bg-red-500" : "bg-emerald-500"
                } animate-pulse`}
              />
              <span className="font-semibold text-xs uppercase tracking-wide">
                {isAtRisk ? "At-Risk" : "Normal"}
              </span>
            </div>
          </div>

          {/* Key Metrics */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              Key Metrics
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/60 border border-slate-700/70 rounded-lg p-3 shadow-lg">
                <div className="text-[10px] text-slate-300 uppercase tracking-wide font-bold mb-1">Pressure</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {pipeline.pressure_bar}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5 font-medium">bar</div>
              </div>
              <div className="bg-slate-800/60 border border-slate-700/70 rounded-lg p-3 shadow-lg">
                <div className="text-[10px] text-slate-300 uppercase tracking-wide font-bold mb-1">Flow Rate</div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {pipeline.flow_m3h}
                </div>
                <div className="text-[10px] text-slate-300 mt-0.5 font-medium">m³/h</div>
              </div>
              <div
                className={`border rounded-lg p-3 shadow-lg ${
                  isAtRisk
                    ? "bg-red-950/50 border-red-800/70"
                    : "bg-emerald-950/50 border-emerald-800/70"
                }`}
              >
                <div className="text-[10px] uppercase tracking-wide font-bold mb-1 text-white/90">Risk</div>
                <div
                  className={`text-xl font-bold tabular-nums ${
                    isAtRisk ? "text-red-300" : "text-emerald-300"
                  }`}
                >
                  {(pipeline.leakProb * 100).toFixed(1)}%
                </div>
                <div className={`text-[10px] mt-0.5 font-medium ${isAtRisk ? "text-red-400" : "text-emerald-400"}`}>
                  leak prob
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-3 shadow-lg">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Location
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-100 font-medium">
              <div>
                <span className="text-slate-300 font-semibold">Lat:</span> {pipeline.lat.toFixed(4)}°
              </div>
              <div>
                <span className="text-slate-300 font-semibold">Lon:</span> {pipeline.lon.toFixed(4)}°
              </div>
            </div>
          </div>

          {/* AI Diagnosis Button */}
          <div>
            <button
              onClick={handleGenerateDiagnosis}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-2 border border-orange-500/20 disabled:border-slate-600 text-sm"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Generate AI Diagnosis
                </>
              )}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3">
              <div className="flex gap-2">
                <svg
                  className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <div className="font-semibold text-red-400 text-xs mb-0.5">Error</div>
                  <div className="text-xs text-red-300">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Diagnosis Results */}
          {diagnosis && (
            <div className="space-y-3 animate-fadeIn">
              {/* Summary */}
              <div className="bg-gradient-to-br from-blue-950/50 to-slate-800/60 border border-blue-800/40 rounded-lg p-4 shadow-lg">
                <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Diagnostic Summary
                </h3>
                <p className="text-sm text-white/95 leading-relaxed font-medium">{diagnosis.summary}</p>
              </div>

              {/* Recommendations */}
              <div className="bg-gradient-to-br from-orange-950/50 to-slate-800/60 border border-orange-800/40 rounded-lg p-4 shadow-lg">
                <h3 className="text-xs font-bold text-orange-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Recommended Actions
                </h3>
                <ul className="space-y-2.5">
                  {diagnosis.recommendations.map((rec, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-500/25 text-orange-300 rounded-md flex items-center justify-center text-xs font-bold border border-orange-500/40 shadow-sm">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white/95 leading-relaxed pt-0.5 font-medium">
                        {rec}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
