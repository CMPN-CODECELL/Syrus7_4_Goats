import React from 'react';
import { ConvergencePoint } from '../api/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CHART_COLORS, formatNumber } from '../lib/chartColors';

interface ConvergenceChartProps {
  convergence: ConvergencePoint[];
  title?: string;
}

export const ConvergenceChart: React.FC<ConvergenceChartProps> = ({
  convergence,
  title = 'QAOA Parameter Convergence Curve'
}) => {
  if (!convergence || convergence.length === 0) return null;

  const finalEnergy = convergence[convergence.length - 1]?.energy;

  return (
    <div className="bg-panel border border-line rounded-2xl p-5 shadow-panel mb-6">
      <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <span>📉 {title}</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Classical optimizer expectation value trajectory <code className="text-peach font-mono">⟨H⟩</code> across iterations.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-muted uppercase font-bold block">Final Energy</span>
          <span className="text-sm font-extrabold text-peach font-mono">
            {formatNumber(finalEnergy, 5)}
          </span>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={convergence} margin={{ top: 5, right: 15, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#384358" opacity={0.5} />
            <XAxis dataKey="iter" stroke="#A9B3C9" fontSize={10} tickLine={false} />
            <YAxis stroke="#A9B3C9" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: '#242F49', borderColor: '#384358', borderRadius: '8px', fontSize: '11px', color: '#F4EFEA' }}
              labelFormatter={(iter: any) => `Iteration ${iter}`}
              formatter={(val: any) => [formatNumber(Number(val), 5), 'Energy ⟨H⟩']}
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke={CHART_COLORS.qaoa_standard}
              strokeWidth={2}
              dot={{ r: 2, fill: CHART_COLORS.qaoa_standard }}
              activeDot={{ r: 5, fill: CHART_COLORS.qaoa_standard, stroke: '#161E2F', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
