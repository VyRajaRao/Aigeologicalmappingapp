import { MetricsPanel } from './MetricsPanel';
import { CompositionPanel } from './CompositionPanel';
import { GraphPanel } from './GraphPanel';
import { ScatterPanel } from './ScatterPanel';
import { RightOverlayPanel } from './RightOverlayPanel';
import { LayerControls } from './LayerControls';
import { GeologicalMetrics, TerrainComposition, AnalysisResult } from '../types/geological';
import { Layers, Activity, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from './ui/utils';

type ActiveLayersState = {
  elevation: boolean;
  terrain: boolean;
  boundaries: boolean;
  landmarks: boolean;
  heatmap: boolean;
  hillshade: boolean;
  contours: boolean;
};

interface DashboardSidebarProps {
  metrics: GeologicalMetrics;
  composition: TerrainComposition;
  trendData: Array<{ time: string; elevation: number; stability: number }>;
  scatterData: Array<{ elevation: number; risk: number; type: string }>;
  isCollapsed: boolean;
  onToggle: () => void;
  currentAnalysis: AnalysisResult | null;
  onCloseAnalysis: () => void;
  activeLayers: ActiveLayersState;
  onLayerToggle: (layer: keyof ActiveLayersState) => void;
  /** Drawer overlay on small viewports */
  isMobile: boolean;
}

export function DashboardSidebar({
  metrics,
  composition,
  trendData,
  scatterData,
  isCollapsed,
  onToggle,
  currentAnalysis,
  onCloseAnalysis,
  activeLayers,
  onLayerToggle,
  isMobile,
}: DashboardSidebarProps) {
  return (
    <>
      <div
        className={cn(
          'flex min-h-0 flex-col overflow-hidden border-zinc-800 bg-zinc-900 transition-[width,transform] duration-300 ease-out',
          isMobile
            ? [
                'fixed inset-y-0 left-0 z-40 h-[100dvh] w-[min(100vw,400px)] max-w-full border-r shadow-2xl',
                isCollapsed ? '-translate-x-full' : 'translate-x-0',
              ]
            : [
                'relative h-screen shrink-0 border-r',
                isCollapsed ? 'w-0' : 'w-[400px]',
              ],
        )}
      >
        {/* Header */}
        <div className="shrink-0 border-b border-zinc-800 p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-white sm:text-xl">GeoMapper AI</h1>
              <p className="text-xs text-zinc-500">Geological Intelligence Platform</p>
            </div>
            {isMobile && !isCollapsed && (
              <button
                type="button"
                onClick={onToggle}
                className="shrink-0 rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable content — scrollbar hidden, scroll/touch still works */}
        <div className="scrollbar-hidden min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:gap-6">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-emerald-500" />
                </div>
                <span className="text-sm font-medium text-emerald-400">System Active</span>
              </div>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>

            <section className="flex flex-col gap-4" aria-label="Map tools">
              {currentAnalysis ? (
                <RightOverlayPanel
                  analysis={currentAnalysis}
                  onClose={onCloseAnalysis}
                  embedded
                />
              ) : (
                <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/50 p-4 text-center">
                  <p className="text-sm font-medium text-zinc-300">Terrain analysis</p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-500">
                    Click the map to run an analysis. Results appear here.
                  </p>
                </div>
              )}
              <LayerControls layers={activeLayers} onLayerToggle={onLayerToggle} />
            </section>

            <div className="border-t border-zinc-800 pt-6">
              <MetricsPanel metrics={metrics} />
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <CompositionPanel composition={composition} />
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <GraphPanel data={trendData} />
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <ScatterPanel data={scatterData} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/50 p-4 sm:p-6">
          <div className="text-center text-xs text-zinc-500">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {!(isMobile && !isCollapsed) && (
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'fixed z-50 rounded-lg border border-zinc-700 bg-zinc-900/95 p-2 shadow-lg backdrop-blur-sm transition-colors hover:bg-zinc-800',
            isMobile && 'top-[max(1rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))]',
            !isMobile && 'top-4',
          )}
          style={
            !isMobile
              ? { left: isCollapsed ? 8 : 400 - 12 }
              : undefined
          }
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5 text-white" />
          ) : (
            <ChevronLeft className="h-5 w-5 text-white" />
          )}
        </button>
      )}
    </>
  );
}