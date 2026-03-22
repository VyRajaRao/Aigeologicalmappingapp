// Geological data types

export interface TerrainData {
  latitude: number;
  longitude: number;
  elevation: number;
  terrainType: 'plains' | 'hills' | 'mountains' | 'plateau' | 'valley' | 'ridge';
  riskLevel: 'stable' | 'moderate' | 'high' | 'critical';
  slope: number;
  geologicalAge?: string;
  rockType?: string;
}

export interface Landmark {
  id: string;
  type: 'peak' | 'valley' | 'fault' | 'ridge' | 'crater' | 'glacier';
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  prominence?: number;
  description?: string;
}

export interface AnalysisResult {
  terrain: TerrainData;
  landmarks: Landmark[];
  nearbyFeatures: {
    type: string;
    distance: number;
    bearing: number;
  }[];
  stability: {
    index: number;
    factors: string[];
  };
}

export interface GeologicalMetrics {
  totalAnalyzedPoints: number;
  averageElevation: number;
  elevationVariability: number;
  stabilityIndex: number;
  highRiskAreas: number;
  detectedLandmarks: number;
}

export interface TerrainComposition {
  plains: number;
  hills: number;
  mountains: number;
  valleys: number;
  ridges: number;
  plateaus: number;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  terrain: TerrainData;
  timestamp: Date;
}
