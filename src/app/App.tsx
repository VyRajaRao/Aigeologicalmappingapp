import { useState, useEffect, useCallback } from 'react';
import { DashboardSidebar } from './components/DashboardSidebar';
import { MapboxCanvas } from './components/MapboxCanvas';
import { LayerControls } from './components/LayerControls';
import { RightOverlayPanel } from './components/RightOverlayPanel';
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

export default function App() {
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Toaster 
        position="bottom-right"
        theme="dark"
        toastOptions={{
          style: {
            background: '#18181b',
            border: '1px solid #3f3f46',
            color: '#fff',
          },
        }}
      />
      
      {/* Left Sidebar - Dashboard */}
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
      />

      {/* Right Side - Map Area */}
      <div className="flex-1 relative">
        {/* Mapbox Canvas */}
        <MapboxCanvas
          onMapClick={handleMapClick}
          markers={markers}
          landmarks={landmarks}
          activeLayers={activeLayers}
        />

        {/* Layer Controls Overlay */}
        <LayerControls
          layers={activeLayers}
          onLayerToggle={handleLayerToggle}
        />

        {/* Analysis Panel Overlay */}
        {currentAnalysis && (
          <RightOverlayPanel
            analysis={currentAnalysis}
            onClose={() => setCurrentAnalysis(null)}
          />
        )}

        {/* Loading Indicator */}
        {isAnalyzing && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-full px-6 py-3 flex items-center gap-3 shadow-2xl">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="text-sm font-medium text-white">Analyzing terrain...</span>
          </div>
        )}

        {/* Instructions Overlay */}
        {markers.length === 1 && !isAnalyzing && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full px-6 py-3 shadow-2xl animate-pulse">
            <span className="text-sm font-medium text-white">
              🗺️ Click anywhere on the map to analyze terrain
            </span>
          </div>
        )}
      </div>
    </div>
  );
}