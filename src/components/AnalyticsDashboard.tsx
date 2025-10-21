"use client";

import { useState, useEffect } from "react";
import { Pipeline, AdvancedKPIs } from "@/types";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface AnalyticsDashboardProps {
  pipelines: Pipeline[];
  threshold: number;
}

const generateHistoricalData = (pipeline: Pipeline) => {
  const days = 30;
  const data = [];
  
  const seededRandom = (s: number) => {
    const x = Math.sin(s + pipeline.id) * 10000;
    return x - Math.floor(x);
  };
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const variance = (seededRandom(i) - 0.5) * 0.2;
    const value = Math.max(0, Math.min(1, pipeline.leakProb + variance));
    
    data.push({
      timestamp: date.getTime(),
      date: date.toISOString().split('T')[0],
      leakProb: Number((value * 100).toFixed(1)),
      pressure: Number((pipeline.pressure_bar + (seededRandom(i + 100) - 0.5) * 10).toFixed(1)),
      flow: Number((pipeline.flow_m3h + (seededRandom(i + 200) - 0.5) * 200).toFixed(0)),
    });
  }
  
  return data;
};

const generateKPIs = (pipelines: Pipeline[], threshold: number): AdvancedKPIs => {
  const atRisk = pipelines.filter(p => p.leakProb > threshold).length;
  const seed = pipelines.length + threshold * 100;
  const seededRandom = () => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  return {
    mttr: Number((12.5 + seededRandom() * 5).toFixed(1)),
    failureRate: Number(((atRisk / pipelines.length) * 100).toFixed(1)),
    costImpact: Number((atRisk * 125000 + seededRandom() * 50000).toFixed(0)),
    totalIncidents: Math.floor(atRisk * 1.5),
    preventedFailures: Math.floor(pipelines.length * 0.15),
  };
};

const generateRegionalRisk = (pipelines: Pipeline[]) => {
  const regions = ['Ghawar', 'Abqaiq', 'Ras Tanura', 'Safaniya', 'Shaybah', 'Khurais', 'Yanbu', 'Dhahran'];
  return regions.map(region => {
    const regionPipelines = pipelines.filter(p => p.name.includes(region.split(' ')[0]));
    const avgRisk = regionPipelines.length > 0 
      ? regionPipelines.reduce((sum, p) => sum + p.leakProb, 0) / regionPipelines.length 
      : 0;
    return {
      region,
      riskScore: Math.round(avgRisk * 100),
      pipelineCount: regionPipelines.length,
      criticalCount: regionPipelines.filter(p => p.leakProb > 0.5).length,
    };
  });
};

export default function AnalyticsDashboard({ pipelines, threshold }: AnalyticsDashboardProps) {
  const [selectedView, setSelectedView] = useState<'trends' | 'kpis' | 'heatmap'>('kpis');
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const kpis = generateKPIs(pipelines, threshold);
  const regionalRisk = generateRegionalRisk(pipelines);
  const historicalData = selectedPipeline ? generateHistoricalData(selectedPipeline) : [];

  return (
    <div className="fixed top-20 left-4 w-96 bg-slate-900/98 border border-slate-700/70 rounded-lg shadow-2xl backdrop-blur-xl z-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
      <div className="sticky top-0 bg-slate-900/98 border-b border-slate-700/70 p-4 backdrop-blur-lg">
        <h2 className="text-lg font-bold text-white mb-3">Analytics Dashboard</h2>
        
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedView('kpis')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedView === 'kpis' ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            KPIs
          </button>
          <button
            onClick={() => setSelectedView('trends')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedView === 'trends' ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setSelectedView('heatmap')}
            className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
              selectedView === 'heatmap' ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-white'
            }`}
          >
            Heatmap
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {selectedView === 'kpis' && (
          <>
            <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-900/30 to-slate-900/30 p-4 rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-200 uppercase tracking-wider font-semibold">MTTR</span>
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">{kpis.mttr}h</div>
            <div className="text-xs text-slate-300 mt-1">Mean Time to Repair</div>
          </div>                        <div className="bg-gradient-to-br from-red-900/30 to-slate-900/30 p-4 rounded-lg border border-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-200 uppercase tracking-wider font-semibold">Failure Rate</span>
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-white tabular-nums">{kpis.failureRate}%</div>
            <div className="text-xs text-slate-300 mt-1">Last 30 Days</div>
          </div>

              <div className="bg-gradient-to-br from-orange-950/50 to-slate-800/60 border border-orange-800/40 rounded-lg p-3">
                <div className="text-xs text-orange-300 font-semibold mb-1">Cost Impact</div>
                <div className="text-2xl font-bold text-white">${(kpis.costImpact / 1000000).toFixed(1)}<span className="text-sm text-slate-200 ml-1">M</span></div>
                <div className="text-xs text-slate-300 mt-1">Estimated Annual Cost</div>
              </div>

              <div className="bg-gradient-to-br from-green-950/50 to-slate-800/60 border border-green-800/40 rounded-lg p-3">
                <div className="text-xs text-green-300 font-semibold mb-1">Prevented</div>
                <div className="text-2xl font-bold text-white">{kpis.preventedFailures}</div>
                <div className="text-xs text-slate-300 mt-1">Failures Prevented</div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase mb-3">Incident Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-200">Total Incidents (30d)</span>
                  <span className="text-sm font-bold text-white">{kpis.totalIncidents}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-200">Active Warnings</span>
                  <span className="text-sm font-bold text-orange-400">{pipelines.filter(p => p.leakProb > threshold).length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-200">Avg Resolution Time</span>
                  <span className="text-sm font-bold text-blue-400">{(kpis.mttr * 0.8).toFixed(1)}h</span>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedView === 'trends' && (
          <>
            <div className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase mb-2">Select Pipeline</h3>
              <select
                value={selectedPipeline?.id || ''}
                onChange={(e) => {
                  const pipeline = pipelines.find(p => p.id === Number(e.target.value));
                  setSelectedPipeline(pipeline || null);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
              >
                <option value="">Choose a pipeline...</option>
                {pipelines.slice(0, 20).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} - {(p.leakProb * 100).toFixed(1)}% risk
                  </option>
                ))}
              </select>
            </div>

            {selectedPipeline && (
              <>
                <div className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase mb-3">Leak Probability Trend (30 Days)</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <AreaChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#cbd5e1" 
                        style={{ fontSize: '10px' }}
                        tickFormatter={(value) => new Date(value).getDate().toString()}
                      />
                      <YAxis stroke="#cbd5e1" style={{ fontSize: '10px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="leakProb" stroke="#ef4444" fill="#ef444420" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase mb-3">Pressure & Flow (30 Days)</h3>
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis 
                        dataKey="timestamp" 
                        stroke="#cbd5e1" 
                        style={{ fontSize: '10px' }}
                        tickFormatter={(value) => new Date(value).getDate().toString()}
                      />
                      <YAxis stroke="#cbd5e1" style={{ fontSize: '10px' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line type="monotone" dataKey="pressure" stroke="#3b82f6" strokeWidth={2} dot={false} name="Pressure (bar)" />
                      <Line type="monotone" dataKey="flow" stroke="#10b981" strokeWidth={2} dot={false} name="Flow (m³/h)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        )}

        {selectedView === 'heatmap' && (
          <>
            <div className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase mb-3">Regional Risk Heatmap</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={regionalRisk} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#cbd5e1" style={{ fontSize: '10px' }} />
                  <YAxis dataKey="region" type="category" stroke="#cbd5e1" style={{ fontSize: '10px' }} width={80} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="riskScore" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {regionalRisk.sort((a, b) => b.riskScore - a.riskScore).map((region) => (
                <div 
                  key={region.region}
                  className={`bg-gradient-to-r ${
                    region.riskScore > 40 
                      ? 'from-red-950/50 to-slate-800/60 border-red-800/40' 
                      : region.riskScore > 25
                      ? 'from-orange-950/50 to-slate-800/60 border-orange-800/40'
                      : 'from-green-950/50 to-slate-800/60 border-green-800/40'
                  } border rounded-lg p-3`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-bold text-white">{region.region}</div>
                      <div className="text-xs text-slate-200">{region.pipelineCount} pipelines</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{region.riskScore}</div>
                      <div className="text-xs text-slate-200">risk score</div>
                    </div>
                  </div>
                  {region.criticalCount > 0 && (
                    <div className="text-xs text-red-400 font-semibold">
                      ⚠️ {region.criticalCount} critical pipeline{region.criticalCount > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
