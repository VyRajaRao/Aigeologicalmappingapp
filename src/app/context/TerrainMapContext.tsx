import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import { analyzeTerrain } from '../services/geologicalAPI';
import { normalizeAnalysisResult, simulateTerrainAnalysis } from '../services/terrainSimulation';
import type {
  AnalysisResult,
  GeologicalMetrics,
  Landmark,
  MapMarker,
  TerrainComposition,
} from '../types/geological';

export type ActiveLayersState = {
  elevation: boolean;
  terrain: boolean;
  boundaries: boolean;
  landmarks: boolean;
  heatmap: boolean;
  hillshade: boolean;
  contours: boolean;
};

const defaultLayers: ActiveLayersState = {
  elevation: false,
  terrain: false,
  boundaries: false,
  landmarks: true,
  heatmap: false,
  hillshade: true,
  contours: false,
};

type TerrainMapContextValue = {
  selectedLocation: { lat: number; lng: number } | null;
  currentAnalysis: AnalysisResult | null;
  markers: MapMarker[];
  landmarks: Landmark[];
  activeLayers: ActiveLayersState;
  isAnalyzing: boolean;
  metrics: GeologicalMetrics;
  composition: TerrainComposition;
  toggleLayer: (layer: keyof ActiveLayersState) => void;
  clearAnalysis: () => void;
  /** Debounced map click handler */
  handleMapClick: (lat: number, lng: number) => void;
};

const TerrainMapContext = createContext<TerrainMapContextValue | null>(null);

export function TerrainMapProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [activeLayers, setActiveLayers] = useState<ActiveLayersState>(defaultLayers);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const metrics: GeologicalMetrics = useMemo(() => {
    const total = markers.length;
    const avgElev =
      total > 0 ? markers.reduce((s, m) => s + m.terrain.elevation, 0) / total : 0;
    const variability =
      total > 0
        ? Math.sqrt(
            markers.reduce((sum, m) => {
              const d = m.terrain.elevation - avgElev;
              return sum + d * d;
            }, 0) / total,
          )
        : 0;
    return {
      totalAnalyzedPoints: total,
      averageElevation: avgElev,
      elevationVariability: variability,
      stabilityIndex: currentAnalysis?.stability.index ?? 75,
      highRiskAreas: markers.filter(
        (m) => m.terrain.riskLevel === 'high' || m.terrain.riskLevel === 'critical',
      ).length,
      detectedLandmarks: landmarks.length,
    };
  }, [markers, landmarks.length, currentAnalysis?.stability.index]);

  const composition: TerrainComposition = useMemo(
    () => ({
      plains: markers.filter((m) => m.terrain.terrainType === 'plains').length,
      hills: markers.filter((m) => m.terrain.terrainType === 'hills').length,
      mountains: markers.filter((m) => m.terrain.terrainType === 'mountains').length,
      valleys: markers.filter((m) => m.terrain.terrainType === 'valley').length,
      ridges: markers.filter((m) => m.terrain.terrainType === 'ridge').length,
      plateaus: markers.filter((m) => m.terrain.terrainType === 'plateau').length,
    }),
    [markers],
  );

  const runAnalysis = useCallback(async (lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });
    setIsAnalyzing(true);
    try {
      let result: AnalysisResult;
      try {
        result = await analyzeTerrain(lat, lng);
      } catch {
        result = simulateTerrainAnalysis(lat, lng);
      }
      result = normalizeAnalysisResult(result, lat, lng);

      const newMarker: MapMarker = {
        id: `marker-${Date.now()}`,
        latitude: lat,
        longitude: lng,
        terrain: result.terrain,
        timestamp: new Date(),
      };

      setMarkers((prev) => [...prev, newMarker]);
      setCurrentAnalysis(result);

      if (result.landmarks.length > 0) {
        setLandmarks((prev) => {
          const added = result.landmarks.filter((lm) => !prev.some((p) => p.id === lm.id));
          return [...prev, ...added];
        });
      }

      toast.success('Terrain analyzed', {
        description: `${result.terrain.terrainType} • ${Math.round(result.terrain.elevation)}m`,
      });
    } catch (e) {
      console.error(e);
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        void runAnalysis(lat, lng);
      }, 280);
    },
    [runAnalysis],
  );

  const toggleLayer = useCallback((layer: keyof ActiveLayersState) => {
    setActiveLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    setSelectedLocation(null);
  }, []);

  const value = useMemo<TerrainMapContextValue>(
    () => ({
      selectedLocation,
      currentAnalysis,
      markers,
      landmarks,
      activeLayers,
      isAnalyzing,
      metrics,
      composition,
      toggleLayer,
      clearAnalysis,
      handleMapClick,
    }),
    [
      selectedLocation,
      currentAnalysis,
      markers,
      landmarks,
      activeLayers,
      isAnalyzing,
      metrics,
      composition,
      toggleLayer,
      clearAnalysis,
      handleMapClick,
    ],
  );

  return <TerrainMapContext.Provider value={value}>{children}</TerrainMapContext.Provider>;
}

export function useTerrainMap() {
  const ctx = useContext(TerrainMapContext);
  if (!ctx) throw new Error('useTerrainMap must be used within TerrainMapProvider');
  return ctx;
}
