"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { simulatePipelines } from "@/lib/simulatePipelines";
import { Pipeline, KPIStats } from "@/types";
import Topbar from "@/components/Topbar";
import RightDrawer from "@/components/RightDrawer";

// Dynamically import Map component (client-side only due to Leaflet)
const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-900">
      <div className="text-white text-lg">Loading map...</div>
    </div>
  ),
});

/**
 * Main page component for Aramco Pipelines AI Leak Watch
 */
export default function Home() {
  const [pipelines] = useState<Pipeline[]>(() => simulatePipelines());
  const [threshold, setThreshold] = useState(0.5); // Default 50%
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);

  // Calculate KPI stats
  const stats: KPIStats = useMemo(() => {
    const atRisk = pipelines.filter((p) => p.leakProb > threshold).length;
    return {
      total: pipelines.length,
      atRisk,
      normal: pipelines.length - atRisk,
    };
  }, [pipelines, threshold]);

  return (
    <div className="h-screen flex flex-col bg-transparent">
      {/* Topbar */}
      <Topbar threshold={threshold} onThresholdChange={setThreshold} stats={stats} />

      {/* Map Container */}
      <div className="flex-1 relative">
        <Map
          pipelines={pipelines}
          threshold={threshold}
          onPipelineClick={setSelectedPipeline}
        />
      </div>

      {/* Right Drawer */}
      {selectedPipeline && (
        <RightDrawer
          pipeline={selectedPipeline}
          threshold={threshold}
          onClose={() => setSelectedPipeline(null)}
        />
      )}

      {/* Footer with README */}
      <div className="bg-slate-900/98 border-t border-slate-700/70 px-4 py-2 text-[10px] text-slate-300 backdrop-blur-lg shadow-lg">
        <div className="max-w-[2000px] mx-auto flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="font-bold text-slate-200">Quick Start:</span>
          <span className="font-medium">1. <code className="bg-slate-800/70 px-1 py-0.5 rounded text-slate-200 font-semibold">OPENAI_API_KEY</code> in .env</span>
          <span className="font-medium">2. <code className="bg-slate-800/70 px-1 py-0.5 rounded text-slate-200 font-semibold">npm install</code></span>
          <span className="font-medium">3. <code className="bg-slate-800/70 px-1 py-0.5 rounded text-slate-200 font-semibold">npm run dev</code></span>
          <span className="ml-auto text-slate-400 font-medium">Next.js 14 • React Leaflet • OpenAI GPT-4</span>
        </div>
      </div>
    </div>
  );
}
