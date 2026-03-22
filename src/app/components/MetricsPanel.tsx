import { GeologicalMetrics } from '../types/geological';
import { TrendingUp, Mountain, AlertTriangle, MapPin } from 'lucide-react';

interface MetricsPanelProps {
  metrics: GeologicalMetrics;
}

export function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-zinc-400 uppercase tracking-wider">
        Geological Metrics
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Mountain className="w-5 h-5 text-cyan-400" />}
          label="Avg Elevation"
          value={`${Math.round(metrics.averageElevation)}m`}
          trend="+2.3%"
        />
        
        <MetricCard
          icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
          label="Stability Index"
          value={`${Math.round(metrics.stabilityIndex)}%`}
          trend="-1.1%"
        />
        
        <MetricCard
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
          label="High Risk Zones"
          value={metrics.highRiskAreas.toString()}
          trend="+0.5%"
        />
        
        <MetricCard
          icon={<MapPin className="w-5 h-5 text-emerald-400" />}
          label="Landmarks"
          value={metrics.detectedLandmarks.toString()}
          trend="+3.2%"
        />
      </div>

      <div className="mt-4 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-zinc-400">Production</span>
          <span className="text-sm font-semibold text-white">
            {metrics.totalAnalyzedPoints}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
            style={{ width: `${Math.min(100, (metrics.totalAnalyzedPoints / 100) * 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-zinc-400">Consumption</span>
          <span className="text-sm font-semibold text-white">
            {Math.round(metrics.elevationVariability)}m
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            style={{ width: `${Math.min(100, (metrics.elevationVariability / 500) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: string;
}

function MetricCard({ icon, label, value, trend }: MetricCardProps) {
  const isPositive = trend.startsWith('+');
  
  return (
    <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-700/50">
      <div className="flex items-start justify-between mb-2">
        {icon}
        <span className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend}
        </span>
      </div>
      <div className="text-xl font-bold text-white mb-0.5">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}
