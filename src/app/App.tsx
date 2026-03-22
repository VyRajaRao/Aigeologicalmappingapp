import { useState } from 'react';
import { DashboardSidebar } from './components/DashboardSidebar';
import { MapboxCanvas } from './components/MapboxCanvas';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { useIsMobile } from './components/ui/use-mobile';
import { useTerrainMap } from './context/TerrainMapContext';

export default function App() {
  const isMobile = useIsMobile();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false,
  );

  const { markers, isAnalyzing } = useTerrainMap();

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

      <DashboardSidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {isMobile && !isSidebarCollapsed && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-[2px]"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}

      <div className="relative flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <MapboxCanvas sidebarCollapsed={isSidebarCollapsed} />

        {isAnalyzing && (
          <div className="pointer-events-none absolute inset-x-0 bottom-[max(5.5rem,env(safe-area-inset-bottom,0px)+4rem)] z-10 flex justify-center px-4">
            <div className="flex max-w-md items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900/95 px-4 py-3 shadow-2xl backdrop-blur-sm sm:rounded-full sm:px-6">
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-cyan-400" />
              <span className="text-center text-sm font-medium text-white">Analyzing terrain…</span>
            </div>
          </div>
        )}

        {markers.length === 0 && !isAnalyzing && (
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
