import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GraphPanelProps {
  data: Array<{ time: string; elevation: number; stability: number }>;
}

export function GraphPanel({ data }: GraphPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider">
        Elevation Trend Analysis
      </h3>

      <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-700/50">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis 
              dataKey="time" 
              stroke="#71717a"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#71717a"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff',
              }}
            />
            <Line
              type="monotone"
              dataKey="elevation"
              stroke="#06b6d4"
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="stability"
              stroke="#a855f7"
              strokeWidth={2}
              dot={{ fill: '#a855f7', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="flex gap-4 mt-3 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-500" />
            <span className="text-xs text-zinc-400">Elevation (m)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-zinc-400">Stability Index</span>
          </div>
        </div>
      </div>
    </div>
  );
}
