"use client";

import { KPIStats } from "@/types";
import Image from "next/image";

interface TopbarProps {
  threshold: number;
  onThresholdChange: (value: number) => void;
  stats: KPIStats;
}

/**
 * Topbar component with title, threshold slider, and KPI pills
 */
export default function Topbar({ threshold, onThresholdChange, stats }: TopbarProps) {
  return (
    <div className="sticky top-0 z-50 bg-slate-900/98 border-b border-slate-800/50 shadow-xl backdrop-blur-lg">
      <div className="max-w-[2000px] mx-auto px-4 sm:px-6 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title */}
          <div className="flex items-center gap-4">
            {/* Aramco Logo */}
            <div className="relative h-11 w-28 flex-shrink-0">
              <Image 
                src="/Saudi-Aramco-logo.png" 
                alt="Aramco" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="h-10 w-px bg-slate-700/50"></div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                AI Leak Watch
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-300 font-medium">Real-time Pipeline Monitoring</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 lg:gap-4">
            {/* Threshold Slider */}
            <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-lg border border-slate-700/70 backdrop-blur-sm shadow-lg">
              <label className="text-xs font-semibold text-white whitespace-nowrap">
                Threshold:
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={threshold}
                onChange={(e) => onThresholdChange(parseFloat(e.target.value))}
                className="w-32 h-1.5 bg-slate-700/50 rounded-full appearance-none cursor-pointer accent-orange-500"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${threshold * 100}%, rgb(51 65 85 / 0.5) ${threshold * 100}%, rgb(51 65 85 / 0.5) 100%)`
                }}
              />
              <div className="px-2.5 py-1 bg-orange-500/20 border border-orange-500/30 rounded-md min-w-[48px] text-center">
                <span className="text-xs font-bold text-orange-400">
                  {(threshold * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* KPI Pills */}
            <div className="flex gap-2">
              <div className="flex-1 sm:flex-none px-4 py-2 bg-slate-800/80 rounded-lg border border-slate-700/70 backdrop-blur-sm shadow-lg">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Total</div>
                <div className="text-lg font-bold text-white tabular-nums">{stats.total}</div>
              </div>
              <div className="flex-1 sm:flex-none px-4 py-2 bg-red-950/60 rounded-lg border border-red-800/60 backdrop-blur-sm shadow-lg">
                <div className="text-[10px] text-red-300 uppercase tracking-wider font-bold">At-Risk</div>
                <div className="text-lg font-bold text-red-300 tabular-nums">{stats.atRisk}</div>
              </div>
              <div className="flex-1 sm:flex-none px-4 py-2 bg-emerald-950/60 rounded-lg border border-emerald-800/60 backdrop-blur-sm shadow-lg">
                <div className="text-[10px] text-emerald-300 uppercase tracking-wider font-bold">Normal</div>
                <div className="text-lg font-bold text-emerald-300 tabular-nums">{stats.normal}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
