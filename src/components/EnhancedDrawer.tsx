"use client";

import { useState } from "react";
import { Pipeline, DiagnosisResponse, MaintenanceSchedule, SimulationResult, WhatIfScenario } from "@/types";

interface EnhancedDrawerProps {
  pipeline: Pipeline | null;
  threshold: number;
  allPipelines: Pipeline[];
  onClose: () => void;
}

export default function EnhancedDrawer({ pipeline, threshold, allPipelines, onClose }: EnhancedDrawerProps) {
  const [activeTab, setActiveTab] = useState<'diagnosis' | 'analysis' | 'simulation' | 'maintenance'>('diagnosis');
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<DiagnosisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [followUpResponse, setFollowUpResponse] = useState<string | null>(null);
  const [rootCause, setRootCause] = useState<any>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [whatIfScenario, setWhatIfScenario] = useState<WhatIfScenario | null>(null);
  const [maintenanceScheduled, setMaintenanceScheduled] = useState(false);

  if (!pipeline) return null;

  const isAtRisk = pipeline.leakProb > threshold;

  const handleGenerateDiagnosis = async () => {
    setIsLoading(true);
    setError(null);
    setDiagnosis(null);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pipeline.id,
          name: pipeline.name,
          pressure_bar: pipeline.pressure_bar,
          flow_m3h: pipeline.flow_m3h,
          leakProb: pipeline.leakProb,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to generate diagnosis");
      setDiagnosis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpQuestion = async () => {
    if (!followUpQuestion.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch("/api/follow-up", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pipeline: { ...pipeline },
          question: followUpQuestion,
          previousDiagnosis: diagnosis,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFollowUpResponse(data.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get answer");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRootCauseAnalysis = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/root-cause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipeline }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setRootCause(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateFailure = () => {
    // Mock simulation - find nearby pipelines and calculate cascading effect
    const nearbyPipelines = allPipelines.filter(p => {
      const distance = Math.sqrt(
        Math.pow(p.lat - pipeline.lat, 2) + Math.pow(p.lon - pipeline.lon, 2)
      );
      return distance < 0.5 && p.id !== pipeline.id; // Within ~50km
    });

    const affected = nearbyPipelines.slice(0, Math.floor(Math.random() * 5) + 2);
    const cascading = Math.floor(affected.length * 0.6);
    const downtime = 24 + Math.random() * 48; // 24-72 hours
    const cost = affected.length * 180000 + Math.random() * 100000;

    setSimulation({
      affectedPipelines: affected.map(p => p.id),
      cascadingFailures: cascading,
      estimatedDowntime: downtime,
      estimatedCost: cost,
      criticalPath: [pipeline.name, ...affected.slice(0, 3).map(p => p.name)],
    });
  };

  const handleWhatIfScenario = (type: 'pressure' | 'flow', change: number) => {
    const newValue = type === 'pressure' 
      ? pipeline.pressure_bar * (1 + change / 100)
      : pipeline.flow_m3h * (1 + change / 100);
    
    // Recalculate leak probability with new parameters
    const ratio = type === 'pressure' 
      ? newValue / pipeline.flow_m3h 
      : pipeline.pressure_bar / newValue;
    
    const abnormality = Math.abs(ratio - 0.05) / 0.05;
    const newLeakProb = Math.min(0.95, 0.1 + abnormality * 0.3);

    let riskLevel = 'Low';
    let recommendation = 'Conditions remain within safe operational parameters.';
    
    if (newLeakProb > 0.5) {
      riskLevel = 'Critical';
      recommendation = 'Immediate intervention required. Consider shutting down pipeline for inspection.';
    } else if (newLeakProb > 0.35) {
      riskLevel = 'High';
      recommendation = 'Schedule urgent maintenance within 24 hours.';
    } else if (newLeakProb > 0.2) {
      riskLevel = 'Medium';
      recommendation = 'Monitor closely and schedule preventive maintenance.';
    }

    setWhatIfScenario({
      scenarioType: type,
      changePercent: change,
      newLeakProb,
      riskLevel,
      recommendation,
    });
  };

  const handleScheduleMaintenance = () => {
    // Mock scheduling
    setMaintenanceScheduled(true);
    setTimeout(() => setMaintenanceScheduled(false), 3000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden" onClick={onClose} />
      
      <div className="fixed top-0 right-0 h-full w-full lg:w-[480px] bg-slate-900/99 border-l border-slate-700/70 shadow-2xl z-50 overflow-y-auto backdrop-blur-xl">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/98 border-b border-slate-700/70 p-4 backdrop-blur-lg z-10 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">{pipeline.name}</h2>
              <p className="text-xs text-slate-300 mt-0.5">ID: {pipeline.id}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-800/50 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto">
            {[
              { id: 'diagnosis', label: 'Diagnosis', icon: '🔍' },
              { id: 'analysis', label: 'Analysis', icon: '📊' },
              { id: 'simulation', label: 'Simulate', icon: '⚡' },
              { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Status Badge */}
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
            isAtRisk ? 'bg-red-950/50 border border-red-900/50 text-red-400' : 'bg-emerald-950/50 border border-emerald-900/50 text-emerald-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isAtRisk ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
            {isAtRisk ? 'At-Risk' : 'Normal'}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-lg p-3">
              <div className="text-[10px] text-slate-300 uppercase font-bold mb-1">Pressure</div>
              <div className="text-xl font-bold text-white">{pipeline.pressure_bar}</div>
              <div className="text-[10px] text-slate-300 mt-0.5">bar</div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-lg p-3">
              <div className="text-[10px] text-slate-300 uppercase font-bold mb-1">Flow</div>
              <div className="text-xl font-bold text-white">{pipeline.flow_m3h}</div>
              <div className="text-[10px] text-slate-300 mt-0.5">m³/h</div>
            </div>
            <div className={`border rounded-lg p-3 ${isAtRisk ? 'bg-red-950/50 border-red-800/70' : 'bg-emerald-950/50 border-emerald-800/70'}`}>
              <div className="text-[10px] uppercase font-bold mb-1 text-white/90">Risk</div>
              <div className={`text-xl font-bold ${isAtRisk ? 'text-red-300' : 'text-emerald-300'}`}>
                {(pipeline.leakProb * 100).toFixed(1)}%
              </div>
              <div className={`text-[10px] mt-0.5 ${isAtRisk ? 'text-red-400' : 'text-emerald-400'}`}>leak prob</div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'diagnosis' && (
            <>
              <button
                onClick={handleGenerateDiagnosis}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                {isLoading ? <><span className="animate-spin">⏳</span> Analyzing...</> : <><span>⚡</span> Generate AI Diagnosis</>}
              </button>

              {error && (
                <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-3 text-xs text-red-300">{error}</div>
              )}

              {diagnosis && (
                <>
                  <div className="bg-gradient-to-br from-blue-950/50 to-slate-800/60 border border-blue-800/40 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-blue-300 uppercase mb-2.5">📋 Diagnostic Summary</h3>
                    <p className="text-sm text-white/95 leading-relaxed">{diagnosis.summary}</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-950/50 to-slate-800/60 border border-orange-800/40 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-orange-300 uppercase mb-3">✅ Recommended Actions</h3>
                    <ul className="space-y-2.5">
                      {diagnosis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-orange-500/25 text-orange-300 rounded-md flex items-center justify-center text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-white/95 leading-relaxed pt-0.5">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Follow-up Questions */}
                  <div className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase mb-3">💬 Ask Follow-up Question</h3>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={followUpQuestion}
                        onChange={(e) => setFollowUpQuestion(e.target.value)}
                        placeholder="e.g., What causes this issue?"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                        onKeyPress={(e) => e.key === 'Enter' && handleFollowUpQuestion()}
                      />
                      <button
                        onClick={handleFollowUpQuestion}
                        disabled={isLoading || !followUpQuestion.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded text-sm font-semibold"
                      >
                        Ask
                      </button>
                    </div>
                    {followUpResponse && (
                      <div className="mt-3 p-3 bg-blue-950/30 border border-blue-800/40 rounded text-sm text-blue-100">
                        {followUpResponse}
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'analysis' && (
            <>
              <button
                onClick={handleRootCauseAnalysis}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all text-sm"
              >
                {isLoading ? 'Analyzing...' : '🔬 Root Cause Analysis'}
              </button>

              {rootCause && (
                <>
                  <div className="bg-gradient-to-br from-purple-950/50 to-slate-800/60 border border-purple-800/40 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-purple-300 uppercase mb-3">🎯 Root Cause</h3>
                    <p className="text-sm text-white/95 mb-3">{rootCause.cause}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Confidence:</span>
                        <span className="text-white font-semibold">{rootCause.confidence}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Contributing Factors:</span>
                        <span className="text-white font-semibold">{rootCause.factors}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-950/50 to-slate-800/60 border border-green-800/40 rounded-lg p-4">
                    <h3 className="text-xs font-bold text-green-300 uppercase mb-3">💰 Cost-Benefit Analysis</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Repair Cost</div>
                        <div className="text-2xl font-bold text-white">${rootCause.repairCost.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Failure Cost (if ignored)</div>
                        <div className="text-2xl font-bold text-red-400">${rootCause.failureCost.toLocaleString()}</div>
                      </div>
                      <div className="pt-2 border-t border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">Net Benefit</div>
                        <div className="text-2xl font-bold text-green-400">${(rootCause.failureCost - rootCause.repairCost).toLocaleString()}</div>
                      </div>
                      <div className="text-sm text-green-300 bg-green-950/30 p-2 rounded">
                        ✅ ROI: {((rootCause.failureCost / rootCause.repairCost - 1) * 100).toFixed(0)}% - Repair is highly recommended
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {activeTab === 'simulation' && (
            <>
              <button
                onClick={handleSimulateFailure}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all text-sm"
              >
                ⚡ Simulate Pipeline Failure
              </button>

              {simulation && (
                <div className="bg-gradient-to-br from-red-950/50 to-slate-800/60 border border-red-800/40 rounded-lg p-4 space-y-3">
                  <h3 className="text-xs font-bold text-red-300 uppercase">🔥 Simulation Results</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-slate-400">Affected Pipelines</div>
                      <div className="text-2xl font-bold text-white">{simulation.affectedPipelines.length}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Cascading Failures</div>
                      <div className="text-2xl font-bold text-red-400">{simulation.cascadingFailures}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Est. Downtime</div>
                      <div className="text-2xl font-bold text-orange-400">{simulation.estimatedDowntime.toFixed(0)}h</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Est. Cost</div>
                      <div className="text-2xl font-bold text-red-400">${(simulation.estimatedCost / 1000).toFixed(0)}K</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-2">Critical Path:</div>
                    <div className="text-sm text-white/90">{simulation.criticalPath.join(' → ')}</div>
                  </div>
                </div>
              )}

              <div className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase mb-3">🔮 What-If Scenarios</h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-slate-300 mb-2">Pressure Change:</div>
                    <div className="flex gap-2">
                      {[-20, -10, +10, +20].map((change) => (
                        <button
                          key={change}
                          onClick={() => handleWhatIfScenario('pressure', change)}
                          className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                        >
                          {change > 0 ? '+' : ''}{change}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-300 mb-2">Flow Rate Change:</div>
                    <div className="flex gap-2">
                      {[-20, -10, +10, +20].map((change) => (
                        <button
                          key={change}
                          onClick={() => handleWhatIfScenario('flow', change)}
                          className="flex-1 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-white font-semibold"
                        >
                          {change > 0 ? '+' : ''}{change}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {whatIfScenario && (
                  <div className={`mt-4 p-3 rounded-lg ${
                    whatIfScenario.riskLevel === 'Critical' ? 'bg-red-950/30 border border-red-800/40' :
                    whatIfScenario.riskLevel === 'High' ? 'bg-orange-950/30 border border-orange-800/40' :
                    whatIfScenario.riskLevel === 'Medium' ? 'bg-yellow-950/30 border border-yellow-800/40' :
                    'bg-green-950/30 border border-green-800/40'
                  }`}>
                    <div className="text-xs font-bold text-white uppercase mb-2">
                      {whatIfScenario.scenarioType === 'pressure' ? '📊' : '💧'} {whatIfScenario.changePercent > 0 ? '+' : ''}{whatIfScenario.changePercent}% {whatIfScenario.scenarioType}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">New Leak Probability:</span>
                        <span className="font-bold text-white">{(whatIfScenario.newLeakProb * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Risk Level:</span>
                        <span className={`font-bold ${
                          whatIfScenario.riskLevel === 'Critical' ? 'text-red-400' :
                          whatIfScenario.riskLevel === 'High' ? 'text-orange-400' :
                          whatIfScenario.riskLevel === 'Medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>{whatIfScenario.riskLevel}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-700">
                        <div className="text-xs text-slate-400 mb-1">Recommendation:</div>
                        <div className="text-sm text-white/90">{whatIfScenario.recommendation}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'maintenance' && (
            <>
              <div className="bg-gradient-to-br from-blue-950/50 to-slate-800/60 border border-blue-800/40 rounded-lg p-4">
                <h3 className="text-xs font-bold text-blue-300 uppercase mb-3">📅 Schedule Preventive Maintenance</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Priority Level</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white">
                      <option value="low">Low - Routine Inspection</option>
                      <option value="medium">Medium - Scheduled Maintenance</option>
                      <option value="high" selected={isAtRisk}>High - Urgent Repair</option>
                      <option value="critical">Critical - Emergency Response</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Assign Technician</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white">
                      <option>Ahmed Al-Faisal (Senior Tech)</option>
                      <option>Mohammed Al-Rashid (Field Specialist)</option>
                      <option>Fatima Al-Zahrani (Lead Engineer)</option>
                      <option>Khalid Al-Mutairi (Maintenance Supervisor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Scheduled Date</label>
                    <input 
                      type="date" 
                      className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <button
                    onClick={handleScheduleMaintenance}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold py-3 px-4 rounded-lg shadow-lg transition-all text-sm"
                  >
                    🔧 Schedule Maintenance
                  </button>
                </div>
              </div>

              {maintenanceScheduled && (
                <div className="bg-green-950/30 border border-green-800/40 rounded-lg p-4 animate-fadeIn">
                  <div className="flex items-center gap-2 text-green-400 font-semibold mb-2">
                    <span className="text-lg">✅</span>
                    <span>Maintenance Scheduled Successfully!</span>
                  </div>
                  <div className="text-sm text-slate-300">
                    Field technician will be dispatched to {pipeline.name}. Confirmation sent via SMS and email.
                  </div>
                </div>
              )}

              <div className="bg-slate-800/50 border border-slate-700/70 rounded-lg p-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase mb-3">📊 Maintenance History</h3>
                <div className="space-y-2">
                  {[
                    { date: '2025-09-15', type: 'Routine Inspection', status: 'Completed' },
                    { date: '2025-07-03', type: 'Pressure Test', status: 'Completed' },
                    { date: '2025-05-20', type: 'Valve Replacement', status: 'Completed' },
                  ].map((record, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-900/50 rounded">
                      <div>
                        <div className="text-sm text-white font-semibold">{record.type}</div>
                        <div className="text-xs text-slate-400">{record.date}</div>
                      </div>
                      <div className="text-xs text-green-400 font-semibold">{record.status}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
