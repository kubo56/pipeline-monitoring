/**
 * Core type definitions for Aramco Pipelines AI Leak Watch
 */

export interface Pipeline {
  id: number;
  name: string;
  lat: number;
  lon: number;
  pressure_bar: number;
  flow_m3h: number;
  leakProb: number;
}

export interface DiagnosisRequest {
  id: number;
  name: string;
  pressure_bar: number;
  flow_m3h: number;
  leakProb: number;
}

export interface DiagnosisResponse {
  summary: string;
  recommendations: string[];
}

export interface KPIStats {
  total: number;
  atRisk: number;
  normal: number;
}

export interface HistoricalDataPoint {
  timestamp: string;
  leakProb: number;
  pressure: number;
  flow: number;
}

export interface MaintenanceSchedule {
  pipelineId: number;
  scheduledDate: string;
  technicianName: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed';
}

export interface AdvancedKPIs {
  mttr: number; // Mean Time To Repair in hours
  failureRate: number; // failures per 1000 hours
  costImpact: number; // in USD
  totalIncidents: number;
  preventedFailures: number;
}

export interface SimulationResult {
  affectedPipelines: number[];
  cascadingFailures: number;
  estimatedDowntime: number; // hours
  estimatedCost: number; // USD
  criticalPath: string[];
}

export interface WhatIfScenario {
  scenarioType: 'pressure' | 'flow' | 'temperature';
  changePercent: number;
  newLeakProb: number;
  riskLevel: string;
  recommendation: string;
}
