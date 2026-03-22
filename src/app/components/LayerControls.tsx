import { Layers, Mountain, Grid, MapPin, Flame, Sun, Waves } from 'lucide-react';
import { Switch } from './ui/switch';

interface LayerControlsProps {
  layers: {
    elevation: boolean;
    terrain: boolean;
    boundaries: boolean;
    landmarks: boolean;
    heatmap: boolean;
    hillshade: boolean;
    contours: boolean;
  };
  onLayerToggle: (layer: keyof LayerControlsProps['layers']) => void;
}

export function LayerControls({ layers, onLayerToggle }: LayerControlsProps) {
  const layerConfig = [
    { key: 'elevation' as const, label: 'Elevation', icon: Mountain, color: 'text-cyan-400' },
    { key: 'hillshade' as const, label: 'Hillshade', icon: Sun, color: 'text-amber-400' },
    { key: 'terrain' as const, label: 'Terrain Class', icon: Grid, color: 'text-purple-400' },
    { key: 'landmarks' as const, label: 'Landmarks', icon: MapPin, color: 'text-emerald-400' },
    { key: 'boundaries' as const, label: 'Boundaries', icon: Layers, color: 'text-pink-400' },
    { key: 'heatmap' as const, label: 'Risk Heatmap', icon: Flame, color: 'text-red-400' },
    { key: 'contours' as const, label: 'Contours', icon: Waves, color: 'text-blue-400' },
  ];

  return (
    <div className="w-full rounded-lg border border-zinc-700 bg-zinc-900/95 p-4 shadow-xl backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <Layers className="h-5 w-5 text-cyan-400" />
        <h3 className="font-semibold text-white">Map Layers</h3>
      </div>

      <div className="space-y-2">
        {layerConfig.map((config) => {
          const Icon = config.icon;
          const isActive = layers[config.key];

          return (
            <div
              key={config.key}
              className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-zinc-800/50"
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm ${isActive ? 'text-white' : 'text-zinc-400'}`}>
                  {config.label}
                </span>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={() => onLayerToggle(config.key)}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-zinc-700 pt-4">
        <div className="text-xs text-zinc-500">
          Active Layers: {Object.values(layers).filter(Boolean).length}/7
        </div>
      </div>
    </div>
  );
}
