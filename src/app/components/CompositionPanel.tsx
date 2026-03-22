import { TerrainComposition } from '../types/geological';

interface CompositionPanelProps {
  composition: TerrainComposition;
}

export function CompositionPanel({ composition }: CompositionPanelProps) {
  const total = Object.values(composition).reduce((sum, val) => sum + val, 0);
  
  const items = [
    { label: 'Plains', value: composition.plains, color: 'bg-emerald-500' },
    { label: 'Hills', value: composition.hills, color: 'bg-amber-500' },
    { label: 'Mountains', value: composition.mountains, color: 'bg-purple-500' },
    { label: 'Valleys', value: composition.valleys, color: 'bg-blue-500' },
    { label: 'Ridges', value: composition.ridges, color: 'bg-pink-500' },
    { label: 'Plateaus', value: composition.plateaus, color: 'bg-cyan-500' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider">
        Terrain Composition
      </h3>

      <div className="space-y-3">
        {items.map((item) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0;
          
          return (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-sm text-zinc-300">{item.label}</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {percentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${item.color} transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
        <div className="text-xs text-zinc-400 mb-1">Total Terrain Types</div>
        <div className="text-2xl font-bold text-white">{total}</div>
        <div className="text-xs text-zinc-500 mt-1">Analyzed Regions</div>
      </div>
    </div>
  );
}
