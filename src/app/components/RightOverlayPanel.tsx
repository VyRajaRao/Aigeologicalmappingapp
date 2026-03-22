import { AnalysisResult } from '../types/geological';
import { Mountain, TrendingUp, AlertTriangle, MapPin, X } from 'lucide-react';
import { motion } from 'motion/react';

interface RightOverlayPanelProps {
  analysis: AnalysisResult | null;
  onClose: () => void;
}

export function RightOverlayPanel({ analysis, onClose }: RightOverlayPanelProps) {
  if (!analysis) return null;

  const { terrain, landmarks, stability } = analysis;

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
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="absolute top-4 right-80 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-lg w-96 shadow-2xl max-h-[calc(100vh-2rem)] overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-4 flex items-center justify-between">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Mountain className="w-5 h-5 text-cyan-400" />
          Terrain Analysis
        </h3>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
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
          <div className="text-xs text-zinc-400 mt-1">
            {terrain.geologicalAge} • {terrain.rockType}
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
