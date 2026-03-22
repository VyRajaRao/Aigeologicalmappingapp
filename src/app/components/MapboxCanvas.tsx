import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { MapMarker, Landmark } from '../types/geological';
import { calculateElevation } from '../services/geologicalAPI';

// Mapbox CSS imports
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

interface MapboxCanvasProps {
  onMapClick: (lat: number, lng: number) => void;
  markers: MapMarker[];
  landmarks: Landmark[];
  activeLayers: {
    elevation: boolean;
    terrain: boolean;
    boundaries: boolean;
    landmarks: boolean;
    heatmap: boolean;
    hillshade: boolean;
    contours: boolean;
  };
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoidnlyYWphIiwiYSI6ImNtbjFwb2d3eTBwamQycnNqYTUxd3Q1dHUifQ.kJkuVZ1LmRUyqzhbuGE-iw';

export function MapboxCanvas({ 
  onMapClick, 
  markers, 
  landmarks,
  activeLayers 
}: MapboxCanvasProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const landmarkMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-105.2705, 40.0150], // Colorado Rocky Mountains
      zoom: 9,
      pitch: 60,
      bearing: -17.6,
      antialias: true,
    });

    const mapInstance = map.current;

    // Add navigation controls
    mapInstance.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapInstance.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    // Add geocoder search
    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl: mapboxgl,
      marker: false,
    });
    mapInstance.addControl(geocoder, 'top-left');

    // Map load event
    mapInstance.on('load', () => {
      setIsMapLoaded(true);

      // Add 3D terrain
      mapInstance.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
        maxzoom: 14,
      });

      mapInstance.setTerrain({ 
        source: 'mapbox-dem', 
        exaggeration: 1.8 
      });

      // Add sky layer
      mapInstance.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 90.0],
          'sky-atmosphere-sun-intensity': 15,
        },
      });

      // Add hillshade layer (initially hidden)
      mapInstance.addSource('hillshade-source', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
      });

      mapInstance.addLayer({
        id: 'hillshade-layer',
        type: 'hillshade',
        source: 'hillshade-source',
        layout: {
          visibility: 'none',
        },
        paint: {
          'hillshade-exaggeration': 0.8,
          'hillshade-shadow-color': '#000',
        },
      }, 'waterway-label');

      // Add elevation gradient layer
      mapInstance.addLayer({
        id: 'elevation-gradient',
        type: 'fill',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [],
          },
        },
        layout: {
          visibility: 'none',
        },
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'elevation'],
            0, '#1a1a2e',
            500, '#16213e',
            1000, '#0f4c75',
            1500, '#3282b8',
            2000, '#bbe1fa',
            3000, '#ffffff',
          ],
          'fill-opacity': 0.6,
        },
      });

      // Fly-in animation
      setTimeout(() => {
        mapInstance.flyTo({
          center: [-105.2705, 40.0150],
          zoom: 10,
          pitch: 65,
          duration: 3000,
          essential: true,
        });
      }, 500);
    });

    // Click handler
    mapInstance.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      onMapClick(lat, lng);
    });

    return () => {
      mapInstance.remove();
    };
  }, [onMapClick]);

  // Update markers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const el = document.createElement('div');
      el.className = 'marker-pulse';
      
      let color = '#06b6d4'; // cyan for stable
      if (markerData.terrain.riskLevel === 'moderate') color = '#a855f7'; // purple
      if (markerData.terrain.riskLevel === 'high') color = '#f59e0b'; // amber
      if (markerData.terrain.riskLevel === 'critical') color = '#ef4444'; // red

      el.style.cssText = `
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid rgba(255, 255, 255, 0.3);
        cursor: pointer;
        box-shadow: 0 0 20px ${color}, 0 0 40px ${color};
        animation: pulse 2s infinite;
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #fff;">
            ${markerData.terrain.terrainType.toUpperCase()}
          </div>
          <div style="font-size: 12px; color: #a1a1aa;">
            Elevation: <strong style="color: #06b6d4;">${Math.round(markerData.terrain.elevation)}m</strong>
          </div>
          <div style="font-size: 12px; color: #a1a1aa;">
            Slope: <strong style="color: #a855f7;">${markerData.terrain.slope.toFixed(1)}°</strong>
          </div>
          <div style="font-size: 12px; color: #a1a1aa;">
            Risk: <strong style="color: ${color};">${markerData.terrain.riskLevel}</strong>
          </div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([markerData.longitude, markerData.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });
  }, [markers, isMapLoaded]);

  // Update landmark markers
  useEffect(() => {
    if (!map.current || !isMapLoaded || !activeLayers.landmarks) return;

    // Clear existing landmark markers
    landmarkMarkersRef.current.forEach((marker) => marker.remove());
    landmarkMarkersRef.current = [];

    // Add landmark markers
    landmarks.forEach((landmark) => {
      const el = document.createElement('div');
      
      let icon = '🏔️';
      let color = '#fff';
      
      if (landmark.type === 'peak') {
        icon = '⛰️';
        color = '#a855f7';
      } else if (landmark.type === 'valley') {
        icon = '🏞️';
        color = '#06b6d4';
      } else if (landmark.type === 'fault') {
        icon = '⚠️';
        color = '#ef4444';
      }

      el.style.cssText = `
        font-size: 24px;
        cursor: pointer;
        filter: drop-shadow(0 0 8px ${color});
      `;
      el.textContent = icon;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 180px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #fff;">
            ${landmark.name}
          </div>
          <div style="font-size: 12px; color: #a1a1aa;">
            Type: <strong>${landmark.type}</strong>
          </div>
          <div style="font-size: 12px; color: #a1a1aa;">
            Elevation: <strong>${Math.round(landmark.elevation)}m</strong>
          </div>
          ${landmark.prominence ? `
            <div style="font-size: 12px; color: #a1a1aa;">
              Prominence: <strong>${Math.round(landmark.prominence)}m</strong>
            </div>
          ` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat([landmark.longitude, landmark.latitude])
        .setPopup(popup)
        .addTo(map.current!);

      landmarkMarkersRef.current.push(marker);
    });

    return () => {
      if (!activeLayers.landmarks) {
        landmarkMarkersRef.current.forEach((marker) => marker.remove());
        landmarkMarkersRef.current = [];
      }
    };
  }, [landmarks, isMapLoaded, activeLayers.landmarks]);

  // Toggle layers
  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    const mapInstance = map.current;

    // Toggle hillshade
    if (mapInstance.getLayer('hillshade-layer')) {
      mapInstance.setLayoutProperty(
        'hillshade-layer',
        'visibility',
        activeLayers.hillshade ? 'visible' : 'none'
      );
    }

    // Toggle elevation gradient
    if (mapInstance.getLayer('elevation-gradient')) {
      mapInstance.setLayoutProperty(
        'elevation-gradient',
        'visibility',
        activeLayers.elevation ? 'visible' : 'none'
      );
    }
  }, [activeLayers, isMapLoaded]);

  return (
    <>
      <div ref={mapContainer} className="w-full h-full" />
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.8;
          }
        }
        .mapboxgl-popup-content {
          background: #18181b !important;
          border: 1px solid #3f3f46 !important;
          border-radius: 8px !important;
        }
        .mapboxgl-popup-tip {
          border-top-color: #18181b !important;
        }
      `}</style>
    </>
  );
}