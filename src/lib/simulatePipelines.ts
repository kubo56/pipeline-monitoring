import { Pipeline } from "@/types";

/**
 * Simulates 100 oil pipelines positioned near Aramco's major operational areas.
 * 
 * Based on publicly available information, pipelines are clustered around:
 * - Ghawar Field (Eastern Province) - World's largest oil field
 * - Abqaiq - Major processing facility
 * - Ras Tanura - Major export terminal
 * - Safaniya - Offshore fields
 * - Shaybah - Deep in Rub' al Khali (Empty Quarter)
 * - Khurais - Northern fields
 * - Yanbu - Red Sea coast refinery
 * - Dhahran - Headquarters area
 * 
 * Note: Exact locations are estimated for demo purposes and do not reflect 
 * actual infrastructure coordinates, which are sensitive/confidential.
 * 
 * Leak Probability Formula:
 * -------------------------
 * leakProb = base_risk + abnormality_score + noise
 * 
 * Where:
 * - base_risk = 0.1 (10% baseline)
 * - abnormality_score = abs((pressure/flow) - expected_ratio) / expected_ratio
 *   - expected_ratio = 0.05 (normal: ~50 bar / ~1000 m³/h)
 *   - This detects abnormal pressure-to-flow ratios
 * - noise = random variation ±0.05 for realism
 * 
 * Final leakProb is clamped to [0.0, 1.0]
 */

const SEED = 42; // Deterministic seed for repeatable demo

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  // Linear congruential generator
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
}

export function simulatePipelines(): Pipeline[] {
  const rng = new SeededRandom(SEED);
  const pipelines: Pipeline[] = [];

  // Aramco's major operational areas (estimated from public data)
  const operationalClusters = [
    // Eastern Province - Ghawar Field (largest concentration)
    { lat: 25.5, lon: 49.5, count: 30, radius: 1.5, name: "Ghawar" },
    // Abqaiq - Major processing facility
    { lat: 25.93, lon: 49.67, count: 15, radius: 0.8, name: "Abqaiq" },
    // Ras Tanura - Major export terminal
    { lat: 26.65, lon: 50.17, count: 10, radius: 0.6, name: "Ras Tanura" },
    // Safaniya - Offshore fields
    { lat: 27.85, lon: 48.75, count: 10, radius: 1.0, name: "Safaniya" },
    // Shaybah - Deep in Empty Quarter
    { lat: 22.5, lon: 53.9, count: 8, radius: 1.2, name: "Shaybah" },
    // Khurais - Northern fields
    { lat: 25.0, lon: 48.0, count: 10, radius: 1.0, name: "Khurais" },
    // Yanbu - Red Sea coast refinery
    { lat: 24.08, lon: 38.05, count: 8, radius: 0.7, name: "Yanbu" },
    // Dhahran - Headquarters area
    { lat: 26.27, lon: 50.15, count: 9, radius: 0.5, name: "Dhahran" },
  ];

  // Expected normal ratio: pressure_bar / flow_m3h ≈ 0.05
  const EXPECTED_RATIO = 0.05;
  const BASE_RISK = 0.1;

  let pipelineId = 1;

  // Generate pipelines clustered around real operational areas
  for (const cluster of operationalClusters) {
    for (let i = 0; i < cluster.count; i++) {
      // Generate position within cluster radius using normal distribution
      const angle = rng.next() * 2 * Math.PI;
      const distance = rng.next() * cluster.radius;
      
      const lat = cluster.lat + distance * Math.cos(angle);
      const lon = cluster.lon + distance * Math.sin(angle);

      // Generate pressure and flow with some variation
      // Normal range: pressure 30-70 bar, flow 600-1400 m³/h
      const pressure_bar = rng.range(30, 70);
      const flow_m3h = rng.range(600, 1400);

      // Calculate leak probability using abnormality formula
      const actualRatio = pressure_bar / flow_m3h;
      const abnormalityScore = Math.abs(actualRatio - EXPECTED_RATIO) / EXPECTED_RATIO;
      const noise = rng.range(-0.05, 0.05);
      
      let leakProb = BASE_RISK + abnormalityScore * 0.3 + noise;
      
      // Clamp to valid range [0, 1]
      leakProb = Math.max(0, Math.min(1, leakProb));

      pipelines.push({
        id: pipelineId,
        name: `${cluster.name}-${i.toString().padStart(2, '0')}`,
        lat: Math.round(lat * 10000) / 10000,
        lon: Math.round(lon * 10000) / 10000,
        pressure_bar: Math.round(pressure_bar * 10) / 10,
        flow_m3h: Math.round(flow_m3h * 10) / 10,
        leakProb: Math.round(leakProb * 1000) / 1000, // 3 decimal places
      });
      
      pipelineId++;
    }
  }

  return pipelines;
}
