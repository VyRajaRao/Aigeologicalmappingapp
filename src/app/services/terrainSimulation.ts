import type { AnalysisResult, TerrainData, Landmark } from '../types/geological';
import { calculateElevation } from './geologicalAPI';

function classifyTerrainType(elevation: number): TerrainData['terrainType'] {
  if (elevation < 200) return 'plains';
  if (elevation < 1000) return 'hills';
  return 'mountains';
}

function slopeFromLatLng(lat: number, lng: number): number {
  const s =
    Math.abs(Math.sin(lat * 0.017453) * 12) +
    Math.abs(Math.cos(lng * 0.017453) * 8) +
    (Math.sin(lat * 0.5 + lng * 0.3) + 1) * 6;
  return Math.min(45, Math.max(0, s));
}

function riskFromSlope(slope: number): TerrainData['riskLevel'] {
  if (slope < 12) return 'stable';
  if (slope < 22) return 'moderate';
  if (slope < 32) return 'high';
  return 'critical';
}

function stabilityIndex(slope: number, risk: TerrainData['riskLevel']): number {
  let base = 100 - slope * 1.4;
  if (risk === 'moderate') base -= 6;
  if (risk === 'high') base -= 14;
  if (risk === 'critical') base -= 22;
  return Math.max(15, Math.min(99, Math.round(base)));
}

/** Deterministic fallback when API is unavailable — uses elevation rules from spec. */
export function simulateTerrainAnalysis(lat: number, lng: number): AnalysisResult {
  const elevation = calculateElevation(lat, lng);
  const terrainType = classifyTerrainType(elevation);
  const slope = slopeFromLatLng(lat, lng);
  const riskLevel = riskFromSlope(slope);
  const idx = stabilityIndex(slope, riskLevel);

  const terrain: TerrainData = {
    latitude: lat,
    longitude: lng,
    elevation,
    terrainType,
    riskLevel,
    slope,
    geologicalAge: 'Quaternary',
    rockType: 'Mixed sedimentary',
  };

  const stability = {
    index: idx,
    factors: [
      `Slope angle ~${slope.toFixed(1)}° influences stability.`,
      terrainType === 'mountains'
        ? 'High relief increases mass-wasting potential.'
        : 'Moderate relief suitable for typical development.',
    ],
  };

  const landmarks: Landmark[] = [];
  if (terrainType === 'mountains' || elevation > 1500) {
    landmarks.push({
      id: `sim-peak-${lat.toFixed(2)}-${lng.toFixed(2)}`,
      type: 'peak',
      name: 'Regional high point (simulated)',
      latitude: lat + 0.02,
      longitude: lng + 0.02,
      elevation: elevation + 120,
      prominence: 80,
    });
  }

  return {
    terrain,
    landmarks,
    nearbyFeatures: [],
    stability,
  };
}

export function normalizeAnalysisResult(
  result: AnalysisResult,
  lat: number,
  lng: number,
): AnalysisResult {
  const t = result.terrain;
  const elevation = typeof t.elevation === 'number' ? t.elevation : calculateElevation(lat, lng);
  const terrainType = t.terrainType ?? classifyTerrainType(elevation);
  const slope = typeof t.slope === 'number' ? t.slope : slopeFromLatLng(lat, lng);
  const riskLevel = t.riskLevel ?? riskFromSlope(slope);

  return {
    ...result,
    terrain: {
      ...t,
      latitude: t.latitude ?? lat,
      longitude: t.longitude ?? lng,
      elevation,
      terrainType,
      slope,
      riskLevel,
      geologicalAge: t.geologicalAge ?? '—',
      rockType: t.rockType ?? '—',
    },
    landmarks: Array.isArray(result.landmarks) ? result.landmarks : [],
    nearbyFeatures: Array.isArray(result.nearbyFeatures) ? result.nearbyFeatures : [],
    stability: {
      index: result.stability?.index ?? stabilityIndex(slope, riskLevel),
      factors:
        result.stability?.factors?.length ? result.stability.factors : ['Analysis factors pending.'],
    },
  };
}
