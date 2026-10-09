import React from 'react';
import { ConvergencePoint } from '../api/types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CHART_COLORS, formatNumber, negativeClass } from '../lib/chartColors';

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
    <div className="bg-surface border border-line p-5">
      <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
        <div>
          <h2 className="text-sm font-medium text-text flex items-center gap-2 uppercase tracking-wide">
            <span>{title}</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Classical optimizer expectation value trajectory <code className="text-text">⟨H⟩</code> across iterations.
          </p>
        </div>

        <div className="text-right">
          <span className="label block">Final Energy</span>
          <span className={`text-sm font-medium ${negativeClass(finalEnergy)}`}>
            {formatNumber(finalEnergy, 5)}
          </span>
        </div>
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={convergence} margin={{ top: 5, right: 15, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-grid)" />
            <XAxis dataKey="iter" stroke="var(--c-muted2)" tick={{ fill: 'var(--c-muted2)' }} fontSize={12} tickLine={false} />
            <YAxis stroke="var(--c-muted2)" tick={{ fill: 'var(--c-muted2)' }} fontSize={12} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--c-surface2)', borderColor: 'var(--c-mid)', borderRadius: 0, fontSize: '11px', color: 'var(--c-fg)' }}
              labelFormatter={(iter: any) => `Iteration ${iter}`}
              formatter={(val: any) => [formatNumber(Number(val), 5), 'Energy ⟨H⟩']}
            />
            <Line
              type="monotone"
              dataKey="energy"
              stroke={CHART_COLORS.qaoa_standard}
              strokeWidth={2}
              dot={{ r: 2, fill: CHART_COLORS.qaoa_standard }}
              activeDot={{ r: 5, fill: CHART_COLORS.qaoa_standard, stroke: 'var(--c-bg2)', strokeWidth: 2 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
