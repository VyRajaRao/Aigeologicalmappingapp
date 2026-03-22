// Geological API Service - Connected to Supabase Backend
import { TerrainData, Landmark, AnalysisResult } from '../types/geological';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-2c510f42`;

export async function analyzeTerrain(
  latitude: number,
  longitude: number
): Promise<AnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze-terrain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify({ latitude, longitude }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze terrain');
    }

    const data = await response.json();
    return data as AnalysisResult;
  } catch (error) {
    console.error('Terrain analysis error:', error);
    throw error;
  }
}

export async function getTerrainHistory(): Promise<TerrainData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/terrain-history`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${publicAnonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch terrain history');
    }

    const data = await response.json();
    return data.terrains || [];
  } catch (error) {
    console.error('Error fetching terrain history:', error);
    return [];
  }
}

// Keep for backward compatibility but not needed anymore
export async function detectLandmarks(
  centerLat: number,
  centerLng: number,
  centerElev: number
): Promise<Landmark[]> {
  return [];
}

export async function getTerrainData(
  bounds: [[number, number], [number, number]]
): Promise<TerrainData[]> {
  return [];
}

// Export for use in components - using same calculation as backend
export function calculateElevation(lat: number, lng: number): number {
  const base = Math.sin(lat * 0.1) * Math.cos(lng * 0.1) * 500;
  const variation = Math.sin(lat * 0.5) * Math.cos(lng * 0.3) * 300;
  const detail = Math.sin(lat * 2) * Math.cos(lng * 2) * 100;
  return Math.max(0, 500 + base + variation + detail);
}