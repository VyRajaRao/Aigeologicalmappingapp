import { MetricsPanel } from './MetricsPanel';
import { CompositionPanel } from './CompositionPanel';
import { GraphPanel } from './GraphPanel';
import { ScatterPanel } from './ScatterPanel';
import { GeologicalMetrics, TerrainComposition } from '../types/geological';
import { Layers, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardSidebarProps {
  metrics: GeologicalMetrics;
  composition: TerrainComposition;
  trendData: Array<{ time: string; elevation: number; stability: number }>;
  scatterData: Array<{ elevation: number; risk: number; type: string }>;
  isCollapsed: boolean;
  onToggle: () => void;
}

export function DashboardSidebar({ 
  metrics, 
  composition, 
  trendData, 
  scatterData,
  isCollapsed,
  onToggle 
}: DashboardSidebarProps) {
  return (
    <>
      <div 
        className={`bg-zinc-900 border-r border-zinc-800 flex flex-col h-full shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-0' : 'w-[400px]'
        } overflow-hidden`}
      >
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">GeoMapper AI</h1>
              <p className="text-xs text-zinc-500">Geological Intelligence Platform</p>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* Status Indicator */}
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <span className="text-sm font-medium text-emerald-400">System Active</span>
            </div>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>

          <MetricsPanel metrics={metrics} />

          <CompositionPanel composition={composition} />

          <GraphPanel data={trendData} />

          <ScatterPanel data={scatterData} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/50">
          <div className="text-xs text-zinc-500 text-center">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Toggle Button - positioned at the sidebar's right edge */}
      <button
        onClick={onToggle}
        className="fixed top-4 z-50 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-lg p-2 hover:bg-zinc-800 transition-colors shadow-lg"
        style={{ left: isCollapsed ? '8px' : 'calc(400px - 8px)' }}
      >
        {isCollapsed ? (
          <ChevronRight className="w-5 h-5 text-white" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-white" />
        )}
      </button>
    </>
  );
}