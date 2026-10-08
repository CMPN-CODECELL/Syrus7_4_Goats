import React from 'react';
import { Sample } from '../api/types';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from 'recharts';
import { CHART_COLORS, formatPercent } from '../lib/chartColors';

interface BitstringHistogramProps {
  samples: Sample[];
}

export const BitstringHistogram: React.FC<BitstringHistogramProps> = ({ samples }) => {
  if (!samples || samples.length === 0) return null;

  // Take top 20 samples sorted by probability
  const topSamples = [...samples]
    .sort((a, b) => b.prob - a.prob)
    .slice(0, 20)
    .map(s => ({
      ...s,
      displayLabel: s.bitstring.length > 10 ? `${s.bitstring.substring(0, 10)}...` : s.bitstring,
      stateType: s.optimal ? 'Optimal' : s.feasible ? 'Feasible' : 'Infeasible',
      color: s.optimal ? CHART_COLORS.optimal : s.feasible ? CHART_COLORS.feasible : CHART_COLORS.infeasible
    }));

  return (
    <div className="bg-panel border border-line rounded-2xl p-5 shadow-panel mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line mb-4">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <span>📊 QAOA Bitstring Sample Probability Distribution</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Top sampled portfolio bitstrings (x0 asset first). Optimal, feasible, and infeasible states marked.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1.5 text-peach font-medium">
            <span className="w-3 h-3 rounded bg-peach"></span> Optimal
          </span>
          <span className="flex items-center gap-1.5 text-slate font-medium">
            <span className="w-3 h-3 rounded bg-slate"></span> Feasible
          </span>
          <span className="flex items-center gap-1.5 text-red font-medium">
            <span className="w-3 h-3 rounded bg-red"></span> Infeasible
          </span>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topSamples} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#384358" opacity={0.5} />
            <XAxis
              dataKey="displayLabel"
              stroke="#A9B3C9"
              fontSize={9}
              fontFamily="monospace"
              angle={-45}
              textAnchor="end"
              interval={0}
            />
            <YAxis
              stroke="#A9B3C9"
              fontSize={10}
              tickFormatter={(v) => formatPercent(v, 0)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#242F49', borderColor: '#384358', borderRadius: '8px', fontSize: '11px', color: '#F4EFEA' }}
              formatter={(val: any, _, item: any) => [
                `${formatPercent(Number(val))} (${item.payload.stateType})`,
                'Probability'
              ]}
              labelFormatter={(label) => `Bitstring: ${label}`}
            />
            <Bar dataKey="prob" radius={[4, 4, 0, 0]}>
              {topSamples.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
