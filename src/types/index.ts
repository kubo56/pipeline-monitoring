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
  leakProb: number; // 0.0 to 1.0
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
