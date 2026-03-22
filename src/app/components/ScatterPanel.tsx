import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ScatterPanelProps {
  data: Array<{ elevation: number; risk: number; type: string }>;
}

export function ScatterPanel({ data }: ScatterPanelProps) {
  const getColor = (type: string) => {
    switch (type) {
      case 'stable': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'critical': return '#dc2626';
      default: return '#06b6d4';
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider">
        Risk vs Elevation Distribution
      </h3>

      <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis
              type="number"
              dataKey="elevation"
              name="Elevation"
              stroke="#71717a"
              style={{ fontSize: '12px' }}
              label={{ value: 'Elevation (m)', position: 'insideBottom', offset: -5, fill: '#71717a' }}
            />
            <YAxis
              type="number"
              dataKey="risk"
              name="Risk"
              stroke="#71717a"
              style={{ fontSize: '12px' }}
              label={{ value: 'Risk Level', angle: -90, position: 'insideLeft', fill: '#71717a' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Scatter name="Terrain Points" data={data}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.type)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>

        <div className="flex flex-wrap gap-3 mt-3 justify-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-400">Stable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-xs text-zinc-400">Moderate</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-xs text-zinc-400">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600" />
            <span className="text-xs text-zinc-400">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
