import { AnalysisResult } from '../types/geological';
import type { ActiveLayersState } from '../context/TerrainMapContext';
import { Mountain, TrendingUp, AlertTriangle, MapPin, X } from 'lucide-react';
import { motion } from 'motion/react';

interface RightOverlayPanelProps {
  analysis: AnalysisResult | null;
  onClose: () => void;
  /** When true, panel lives in the scrollable sidebar (bounded height, no map overlap). */
  embedded?: boolean;
  activeLayers?: ActiveLayersState;
}

function layerInsightLines(
  layers: ActiveLayersState | undefined,
  terrain: AnalysisResult['terrain'],
): string[] {
  if (!layers) return [];
  const lines: string[] = [];
  if (layers.elevation) {
    lines.push(`Elevation layer on — value below is tied to the sampled point (${Math.round(terrain.elevation)} m).`);
  }
  if (layers.hillshade) {
    lines.push('Hillshade on — slope readout highlights surface steepness at this location.');
  }
  if (layers.terrain) {
    lines.push(`Terrain class overlay on — classification: ${terrain.terrainType}.`);
  }
  if (layers.landmarks) {
    lines.push('Landmarks on — nearby features listed when detected for this area.');
  }
  if (layers.heatmap) {
    lines.push('Risk heatmap on — risk callout below aligns with the heatmap emphasis.');
  }
  if (layers.contours) {
    lines.push('Contours on — expect local elevation variation within a few km of this point.');
  }
  if (layers.boundaries) {
    lines.push('Boundaries on — regional outlines visible on the map for context.');
  }
  return lines;
}

export function RightOverlayPanel({
  analysis,
  onClose,
  embedded = false,
  activeLayers,
}: RightOverlayPanelProps) {
  if (!analysis) return null;

  const { terrain, landmarks, stability } = analysis;
  const insights = layerInsightLines(activeLayers, terrain);
  const tagClass =
    'rounded border border-zinc-600/80 bg-zinc-800/80 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-zinc-300';

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'stable': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'moderate': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'high': return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
      case 'critical': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={
        embedded
          ? 'flex w-full flex-col rounded-lg border border-zinc-700 bg-zinc-900/95 shadow-xl backdrop-blur-sm'
          : 'flex h-full min-h-0 w-full flex-col overflow-hidden'
      }
    >
      {/* Header */}
      <div
        className={`flex shrink-0 items-center justify-between border-b border-zinc-700 bg-zinc-900 p-3 ${
          embedded ? '' : 'sticky top-0 z-10'
        }`}
      >
        <h3 className="flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
          <Mountain className="h-4 w-4 shrink-0 text-cyan-400 sm:h-5 sm:w-5" />
          Terrain Analysis
        </h3>
        <button type="button" onClick={onClose} className="text-zinc-400 transition-colors hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {activeLayers && Object.values(activeLayers).some(Boolean) && (
        <div className="flex flex-wrap gap-1.5 border-b border-zinc-800 px-3 pb-3 pt-0 sm:px-4">
          {activeLayers.elevation && <span className={tagClass}>Elevation</span>}
          {activeLayers.hillshade && <span className={tagClass}>Hillshade</span>}
          {activeLayers.terrain && <span className={tagClass}>Terrain</span>}
          {activeLayers.landmarks && <span className={tagClass}>Landmarks</span>}
          {activeLayers.boundaries && <span className={tagClass}>Boundaries</span>}
          {activeLayers.heatmap && <span className={tagClass}>Heatmap</span>}
          {activeLayers.contours && <span className={tagClass}>Contours</span>}
        </div>
      )}

      {/* Content — embedded: flows with sidebar scroll (no inner scrollbar) */}
      <div
        className={
          embedded
            ? 'space-y-3 p-3 sm:space-y-4 sm:p-4'
            : 'min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain p-3 sm:space-y-4 sm:p-4'
        }
        >
        {insights.length > 0 && (
          <ul className="space-y-1 text-xs leading-snug text-zinc-400">
            {insights.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        )}

        {/* Location */}
        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="text-xs text-zinc-500 mb-1">Location</div>
          <div className="text-sm text-white font-mono">
            {terrain.latitude.toFixed(4)}°, {terrain.longitude.toFixed(4)}°
          </div>
        </div>

        {/* Terrain Type */}
        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="text-xs text-zinc-500 mb-2">Terrain Type</div>
          <div className="text-lg font-bold text-white capitalize">
            {terrain.terrainType}
          </div>
          <div className="mt-1 text-xs text-zinc-400">
            {(terrain.geologicalAge ?? '—') + ' • ' + (terrain.rockType ?? '—')}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-1">
              <Mountain className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-zinc-500">Elevation</span>
            </div>
            <div className="text-xl font-bold text-cyan-400">
              {Math.round(terrain.elevation)}m
            </div>
          </div>

          <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-zinc-500">Slope</span>
            </div>
            <div className="text-xl font-bold text-purple-400">
              {terrain.slope.toFixed(1)}°
            </div>
          </div>
        </div>

        {/* Risk Level */}
        <div className={`p-3 rounded-lg border ${getRiskColor(terrain.riskLevel)}`}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase">
              {terrain.riskLevel} Risk
            </span>
          </div>
          <div className="text-xs opacity-80">
            Stability Index: {stability.index}%
          </div>
        </div>

        {/* Stability Factors */}
        <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
          <div className="text-xs text-zinc-500 mb-2">Stability Factors</div>
          <ul className="space-y-1.5">
            {stability.factors.map((factor, index) => (
              <li key={index} className="text-sm text-zinc-300 flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Nearby Landmarks */}
        {landmarks.length > 0 && (
          <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-zinc-500">Nearby Landmarks</span>
            </div>
            <div className="space-y-2">
              {landmarks.slice(0, 5).map((landmark) => (
                <div
                  key={landmark.id}
                  className="bg-zinc-900/50 p-2 rounded border border-zinc-700/30"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {landmark.name}
                      </div>
                      <div className="text-xs text-zinc-400 capitalize">
                        {landmark.type}
                      </div>
                    </div>
                    <div className="text-xs text-cyan-400 font-mono">
                      {Math.round(landmark.elevation)}m
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 space-y-2">
          <button className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors">
            Generate Full Report
          </button>
          <button className="w-full py-2 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm font-medium transition-colors">
            Export Data
          </button>
        </div>
      </div>
    </motion.div>
  );
}
