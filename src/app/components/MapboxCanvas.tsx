import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { useTerrainMap } from '../context/TerrainMapContext';
import { circlePolygon, contourRings } from '../utils/geojson';

import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoidnlyYWphIiwiYSI6ImNtbjFwb2d3eTBwamQycnNqYTUxd3Q1dHUifQ.kJkuVZ1LmRUyqzhbuGE-iw';

function riskHeatWeight(risk: string): number {
  switch (risk) {
    case 'stable':
      return 0.25;
    case 'moderate':
      return 0.5;
    case 'high':
      return 0.75;
    case 'critical':
      return 1;
    default:
      return 0.4;
  }
}

interface MapboxCanvasProps {
  sidebarCollapsed?: boolean;
}

export function MapboxCanvas({ sidebarCollapsed = false }: MapboxCanvasProps) {
  const { markers, landmarks, activeLayers, handleMapClick } = useTerrainMap();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const landmarkMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-105.2705, 40.015],
      zoom: 9,
      pitch: 60,
      bearing: -17.6,
      antialias: true,
    });

    const mapInstance = map.current;

    mapInstance.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
    mapInstance.addControl(new mapboxgl.FullscreenControl(), 'bottom-right');

    const geocoder = new MapboxGeocoder({
      accessToken: MAPBOX_TOKEN,
      mapboxgl: mapboxgl,
      marker: false,
    });
    mapInstance.addControl(geocoder, 'top-left');

    mapInstance.on('load', () => {
      mapInstance.resize();
      setIsMapLoaded(true);

      mapInstance.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
        maxzoom: 14,
      });

      mapInstance.setTerrain({
        source: 'mapbox-dem',
        exaggeration: 1.8,
      });

      mapInstance.addSource('hillshade-source', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.terrain-rgb',
        tileSize: 512,
      });

      mapInstance.addLayer(
        {
          id: 'hillshade-layer',
          type: 'hillshade',
          source: 'hillshade-source',
          layout: { visibility: 'none' },
          paint: {
            'hillshade-exaggeration': 0.85,
            'hillshade-shadow-color': '#000',
          },
        },
        'waterway-label',
      );

      mapInstance.addSource('elevation-gradient', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      mapInstance.addLayer({
        id: 'elevation-gradient',
        type: 'fill',
        source: 'elevation-gradient',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'elevation'],
            0,
            '#1a1a2e',
            500,
            '#16213e',
            1000,
            '#0f4c75',
            1500,
            '#3282b8',
            2000,
            '#bbe1fa',
            3000,
            '#ffffff',
          ],
          'fill-opacity': 0.55,
        },
      });

      mapInstance.addSource('terrain-class', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      mapInstance.addLayer({
        id: 'terrain-class-fill',
        type: 'fill',
        source: 'terrain-class',
        layout: { visibility: 'none' },
        paint: {
          'fill-color': [
            'match',
            ['get', 'class'],
            'plains',
            '#4ade80',
            'hills',
            '#fbbf24',
            'mountains',
            '#c084fc',
            'valley',
            '#38bdf8',
            'ridge',
            '#f472b6',
            'plateau',
            '#94a3b8',
            '#64748b',
          ],
          'fill-opacity': 0.35,
        },
      });

      mapInstance.addSource('selection-highlight', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      mapInstance.addLayer({
        id: 'selection-highlight-fill',
        type: 'fill',
        source: 'selection-highlight',
        paint: {
          'fill-color': '#22d3ee',
          'fill-opacity': 0.1,
        },
      });

      mapInstance.addLayer({
        id: 'selection-highlight-line',
        type: 'line',
        source: 'selection-highlight',
        paint: {
          'line-color': '#22d3ee',
          'line-width': 2,
          'line-opacity': 0.5,
        },
      });

      mapInstance.addSource('risk-heatmap', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      mapInstance.addLayer(
        {
          id: 'risk-heatmap-layer',
          type: 'heatmap',
          source: 'risk-heatmap',
          maxzoom: 15,
          paint: {
            'heatmap-weight': ['coalesce', ['get', 'weight'], 0.5],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 6, 0.4, 12, 1.2],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 6, 25, 12, 55],
            'heatmap-opacity': 0.75,
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(33,102,172,0)',
              0.3,
              'rgba(103,169,207,0.6)',
              0.6,
              'rgba(209,229,240,0.85)',
              0.85,
              'rgba(239,59,44,0.9)',
            ],
          },
        },
        'waterway-label',
      );

      mapInstance.addSource('contours-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      mapInstance.addLayer({
        id: 'contours-lines',
        type: 'line',
        source: 'contours-source',
        layout: { visibility: 'none' },
        paint: {
          'line-color': '#38bdf8',
          'line-width': 1.2,
          'line-opacity': 0.65,
        },
      });

      try {
        mapInstance.addSource('boundaries-vector', {
          type: 'vector',
          url: 'mapbox://mapbox.country-boundaries-v1',
        });
        mapInstance.addLayer({
          id: 'boundaries-line',
          type: 'line',
          source: 'boundaries-vector',
          'source-layer': 'country_boundaries',
          layout: { visibility: 'none' },
          paint: {
            'line-color': '#f472b6',
            'line-width': 0.8,
            'line-opacity': 0.55,
          },
        });
      } catch {
        /* boundaries tileset optional */
      }

      setTimeout(() => {
        mapInstance.flyTo({
          center: [-105.2705, 40.015],
          zoom: 10,
          pitch: 65,
          duration: 3000,
          essential: true,
        });
      }, 500);
    });

    mapInstance.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      handleMapClick(lat, lng);
    });

    return () => {
      mapInstance.remove();
      map.current = null;
    };
  }, [handleMapClick]);

  useEffect(() => {
    const el = mapContainer.current;
    if (!el) return;
    const ro = new ResizeObserver(() => map.current?.resize());
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    map.current?.resize();
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const m = map.current;
    const last = markers[markers.length - 1];
    if (!last) {
      (m.getSource('selection-highlight') as mapboxgl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: [],
      });
      (m.getSource('elevation-gradient') as mapboxgl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: [],
      });
      (m.getSource('terrain-class') as mapboxgl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: [],
      });
      (m.getSource('contours-source') as mapboxgl.GeoJSONSource)?.setData({
        type: 'FeatureCollection',
        features: [],
      });
      return;
    }

    const { latitude: lat, longitude: lng, terrain } = last;
    const poly = circlePolygon(lat, lng, 14);
    const elev = terrain.elevation;
    const cls = terrain.terrainType;

    (m.getSource('selection-highlight') as mapboxgl.GeoJSONSource)?.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: poly,
        },
      ],
    });

    (m.getSource('elevation-gradient') as mapboxgl.GeoJSONSource)?.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { elevation: elev },
          geometry: poly,
        },
      ],
    });

    (m.getSource('terrain-class') as mapboxgl.GeoJSONSource)?.setData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { class: cls },
          geometry: circlePolygon(lat, lng, 18),
        },
      ],
    });

    (m.getSource('contours-source') as mapboxgl.GeoJSONSource)?.setData(contourRings(lat, lng, [1.2, 2.4, 4, 6]));
  }, [markers, isMapLoaded]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const m = map.current;
    const feats = markers.map((mk) => ({
      type: 'Feature' as const,
      properties: { weight: riskHeatWeight(mk.terrain.riskLevel) },
      geometry: {
        type: 'Point' as const,
        coordinates: [mk.longitude, mk.latitude],
      },
    }));
    (m.getSource('risk-heatmap') as mapboxgl.GeoJSONSource)?.setData({
      type: 'FeatureCollection',
      features: feats,
    });
  }, [markers, isMapLoaded]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;
    const m = map.current;
    const exag = activeLayers.elevation ? 2.25 : 1.65;
    try {
      m.setTerrain({ source: 'mapbox-dem', exaggeration: exag });
    } catch {
      /* ignore */
    }

    const vis = (on: boolean) => (on ? 'visible' : 'none');

    if (m.getLayer('hillshade-layer')) {
      m.setLayoutProperty('hillshade-layer', 'visibility', vis(activeLayers.hillshade));
    }
    if (m.getLayer('elevation-gradient')) {
      m.setLayoutProperty('elevation-gradient', 'visibility', vis(activeLayers.elevation));
    }
    if (m.getLayer('terrain-class-fill')) {
      m.setLayoutProperty('terrain-class-fill', 'visibility', vis(activeLayers.terrain));
    }
    if (m.getLayer('risk-heatmap-layer')) {
      m.setLayoutProperty('risk-heatmap-layer', 'visibility', vis(activeLayers.heatmap));
    }
    if (m.getLayer('contours-lines')) {
      m.setLayoutProperty('contours-lines', 'visibility', vis(activeLayers.contours));
    }
    if (m.getLayer('boundaries-line')) {
      m.setLayoutProperty('boundaries-line', 'visibility', vis(activeLayers.boundaries));
    }

    const selVis = markers.length > 0;
    if (m.getLayer('selection-highlight-fill')) {
      m.setLayoutProperty('selection-highlight-fill', 'visibility', selVis ? 'visible' : 'none');
    }
    if (m.getLayer('selection-highlight-line')) {
      m.setLayoutProperty('selection-highlight-line', 'visibility', selVis ? 'visible' : 'none');
    }
  }, [activeLayers, isMapLoaded, markers.length]);

  useEffect(() => {
    if (!map.current || !isMapLoaded) return;

    markersRef.current.forEach((x) => x.remove());
    markersRef.current = [];

    markers.forEach((markerData, index) => {
      const el = document.createElement('div');
      el.className = 'marker-pulse marker-pop';

      let color = '#06b6d4';
      if (markerData.terrain.riskLevel === 'moderate') color = '#a855f7';
      if (markerData.terrain.riskLevel === 'high') color = '#f59e0b';
      if (markerData.terrain.riskLevel === 'critical') color = '#ef4444';

      el.style.cssText = `
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background-color: ${color};
        border: 3px solid rgba(255, 255, 255, 0.35);
        cursor: pointer;
        box-shadow: 0 0 20px ${color}, 0 0 40px ${color};
        animation: pulse 2s infinite, marker-pop 0.45s ease-out both;
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <div style="font-weight: bold; margin-bottom: 4px; color: #fff;">
            ${String(markerData.terrain.terrainType).toUpperCase()}
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

  useEffect(() => {
    if (!map.current || !isMapLoaded || !activeLayers.landmarks) {
      landmarkMarkersRef.current.forEach((x) => x.remove());
      landmarkMarkersRef.current = [];
      return;
    }

    landmarkMarkersRef.current.forEach((x) => x.remove());
    landmarkMarkersRef.current = [];

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
  }, [landmarks, isMapLoaded, activeLayers.landmarks]);

  return (
    <div
      className="map-surface flex min-h-0 min-w-0 flex-1 flex-col bg-zinc-950"
      data-sidebar-collapsed={sidebarCollapsed ? 'true' : 'false'}
    >
      <div ref={mapContainer} className="min-h-0 w-full flex-1" />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.85; }
        }
        @keyframes marker-pop {
          from { transform: scale(0.2); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
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
    </div>
  );
}
