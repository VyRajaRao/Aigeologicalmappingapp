import { useState, useEffect, useCallback } from 'react';
import { DashboardSidebar } from './components/DashboardSidebar';
import { MapboxCanvas } from './components/MapboxCanvas';
import { analyzeTerrain } from './services/geologicalAPI';
import { 
  GeologicalMetrics, 
  TerrainComposition, 
  MapMarker, 
  AnalysisResult,
  Landmark 
} from './types/geological';
import { Loader2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';
import { useIsMobile } from './components/ui/use-mobile';

export default function App() {
  const isMobile = useIsMobile();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  const [activeLayers, setActiveLayers] = useState({
    elevation: false,
    terrain: false,
    boundaries: false,
    landmarks: true,
    heatmap: false,
    hillshade: true,
    contours: false,
  });

  // Calculate metrics from markers
  const metrics: GeologicalMetrics = {
    totalAnalyzedPoints: markers.length,
    averageElevation: markers.length > 0
      ? markers.reduce((sum, m) => sum + m.terrain.elevation, 0) / markers.length
      : 0,
    elevationVariability: markers.length > 0
      ? Math.sqrt(
          markers.reduce((sum, m) => {
            const diff = m.terrain.elevation - (markers.reduce((s, mk) => s + mk.terrain.elevation, 0) / markers.length);
            return sum + diff * diff;
          }, 0) / markers.length
        )
      : 0,
    stabilityIndex: currentAnalysis?.stability.index || 75,
    highRiskAreas: markers.filter(m => m.terrain.riskLevel === 'high' || m.terrain.riskLevel === 'critical').length,
    detectedLandmarks: landmarks.length,
  };

  // Calculate terrain composition
  const composition: TerrainComposition = {
    plains: markers.filter(m => m.terrain.terrainType === 'plains').length,
    hills: markers.filter(m => m.terrain.terrainType === 'hills').length,
    mountains: markers.filter(m => m.terrain.terrainType === 'mountains').length,
    valleys: markers.filter(m => m.terrain.terrainType === 'valley').length,
    ridges: markers.filter(m => m.terrain.terrainType === 'ridge').length,
    plateaus: markers.filter(m => m.terrain.terrainType === 'plateau').length,
  };

  // Generate trend data
  const trendData = markers.slice(-10).map((marker, index) => ({
    time: `P${index + 1}`,
    elevation: Math.round(marker.terrain.elevation),
    stability: 100 - marker.terrain.slope * 2,
  }));

  // Generate scatter data
  const scatterData = markers.map(marker => ({
    elevation: Math.round(marker.terrain.elevation),
    risk: marker.terrain.slope,
    type: marker.terrain.riskLevel,
  }));

  // Handle map click
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setIsAnalyzing(true);
    
    try {
      const result = await analyzeTerrain(lat, lng);
      
      // Add marker
      const newMarker: MapMarker = {
        id: `marker-${Date.now()}`,
        latitude: lat,
        longitude: lng,
        terrain: result.terrain,
        timestamp: new Date(),
      };

      setMarkers(prev => [...prev, newMarker]);
      setCurrentAnalysis(result);
      
      // Update landmarks
      if (result.landmarks.length > 0) {
        setLandmarks(prev => {
          const newLandmarks = result.landmarks.filter(
            newLm => !prev.some(existingLm => existingLm.id === newLm.id)
          );
          return [...prev, ...newLandmarks];
        });
      }

      toast.success('Terrain analyzed', {
        description: `${result.terrain.terrainType} • ${Math.round(result.terrain.elevation)}m`,
      });
    } catch (error) {
      toast.error('Analysis failed');
      console.error('Terrain analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Handle layer toggle - no toast notification
  const handleLayerToggle = useCallback((layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({
      ...prev,
      [layer]: !prev[layer],
    }));
  }, []);

  // Add initial sample data
  useEffect(() => {
    const initializeData = async () => {
      // Add a sample marker to demonstrate the system
      const sampleLat = 40.0150;
      const sampleLng = -105.2705;
      
      try {
        const result = await analyzeTerrain(sampleLat, sampleLng);
        
        const sampleMarker: MapMarker = {
          id: 'sample-1',
          latitude: sampleLat,
          longitude: sampleLng,
          terrain: result.terrain,
          timestamp: new Date(),
        };

        setMarkers([sampleMarker]);
        setLandmarks(result.landmarks);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };

    initializeData();
  }, []);

  return (
    <div className="flex min-h-0 min-h-[100dvh] w-full flex-col bg-zinc-950 text-white md:flex-row md:h-screen md:overflow-hidden">
      <Toaster 
        position={isMobile ? 'top-center' : 'top-right'}
        theme="dark"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #3f3f46',
            color: '#fff',
          },
        }}
      />

      {/* Left: fixed-width dashboard sidebar */}
      <DashboardSidebar
        metrics={metrics}
        composition={composition}
        trendData={trendData.length > 0 ? trendData : [
          { time: 'P1', elevation: 500, stability: 80 },
          { time: 'P2', elevation: 650, stability: 75 },
        ]}
        scatterData={scatterData.length > 0 ? scatterData : [
          { elevation: 500, risk: 10, type: 'stable' },
          { elevation: 800, risk: 20, type: 'moderate' },
        ]}
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentAnalysis={currentAnalysis}
        onCloseAnalysis={() => setCurrentAnalysis(null)}
        activeLayers={activeLayers}
        onLayerToggle={handleLayerToggle}
        isMobile={isMobile}
      />

      {isMobile && !isSidebarCollapsed && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      {/* Map fills space beside sidebar (desktop) or full width (mobile drawer) */}
      <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <MapboxCanvas
          sidebarCollapsed={isSidebarCollapsed}
          onMapClick={handleMapClick}
          markers={markers}
          landmarks={landmarks}
          activeLayers={activeLayers}
        />

        {isAnalyzing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom,0px)+4rem)] z-10 flex justify-center px-4">
            <div className="flex max-w-md items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm sm:rounded-full sm:px-6">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-cyan-400" />
              <span className="text-center text-sm font-medium text-white">Analyzing terrain…</span>
            </div>
          </div>
        )}

        {markers.length === 1 && !isAnalyzing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom,0px)+4rem)] z-10 flex justify-center px-4">
            <div className="max-w-md rounded-2xl bg-gradient-to-r from-cyan-500 to-purple-600 px-4 py-3 text-center shadow-2xl sm:max-w-lg sm:rounded-full sm:px-6 sm:py-3">
              <span className="text-sm font-medium leading-snug text-white">
                {isMobile ? 'Tap the map to analyze terrain' : 'Click the map to analyze terrain'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}