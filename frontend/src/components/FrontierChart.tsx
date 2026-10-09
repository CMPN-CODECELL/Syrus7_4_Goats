import React from 'react';
import { Frontier, SolverResult } from '../api/types';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { CHART_COLORS, getSolverColor, formatPercent } from '../lib/chartColors';

interface FrontierChartProps {
  frontier: Frontier;
  solvers: SolverResult[];
  selectedSolverKey: string;
  onSelectSolver: (key: string) => void;
}

export const FrontierChart: React.FC<FrontierChartProps> = ({
  frontier,
  solvers,
  selectedSolverKey,
  onSelectSolver
}) => {
  // Sort continuous frontier by risk for smooth line rendering
  const continuousData = [...frontier.continuous]
    .sort((a, b) => a.risk - b.risk)
    .map(p => ({ ...p, name: 'Continuous frontier' }));
  const discreteData = frontier.discrete.map(p => ({
    ...p,
    name: `Discrete frontier: ${p.selection.map(t => t.replace('.NS', '')).join(', ')}`
  }));

  // Plottable solver points (filtering null volatility/return)
  const validSolverPoints = solvers
    .filter(s => s.volatility !== null && s.exp_return !== null && s.selection !== null)
    .map(s => ({
      solverKey: s.solver,
      label: s.label,
      risk: s.volatility!,
      ret: s.exp_return!,
      color: getSolverColor(s.solver),
      isSelected: s.solver === selectedSolverKey
    }));

  const unplottableSolvers = solvers.filter(
    s => s.volatility === null || s.exp_return === null || s.selection === null
  );

  return (
    <div className="bg-panel border border-line rounded-2xl p-5 shadow-panel mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line mb-4">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <span>📈 Risk-Return Efficient Frontier</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Long-only Markowitz frontier (line), the discrete frontier of feasible K-stock picks (grey) and each solver's pick.
          </p>
        </div>
      </div>

      {/* Recharts Wrapper */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#384358" opacity={0.5} />
            <XAxis
              dataKey="risk"
              type="number"
              domain={['auto', 'auto']}
              stroke="#A9B3C9"
              fontSize={11}
              tickFormatter={(v: any) => formatPercent(v, 0)}
              label={{ value: 'Annualised Volatility (Risk)', position: 'insideBottom', offset: -12, fill: '#A9B3C9', fontSize: 11 }}
            />
            <YAxis
              dataKey="ret"
              type="number"
              domain={['auto', 'auto']}
              stroke="#A9B3C9"
              fontSize={11}
              tickFormatter={(v: any) => formatPercent(v, 0)}
              label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', offset: 10, fill: '#A9B3C9', fontSize: 11 }}
            />
            <Tooltip
              shared={false}
              cursor={false}
              content={({ active, payload }) => {
                const p = active ? payload?.[0]?.payload : null;
                if (!p) return null;
                return (
                  <div className="bg-panel border border-line rounded-lg px-3 py-2 text-[11px] text-text max-w-64">
                    <div className="font-bold mb-0.5">{p.name}</div>
                    <div className="text-muted">Volatility {formatPercent(p.risk)} · Return {formatPercent(p.ret)}</div>
                  </div>
                );
              }}
            />

            {/* Continuous Markowitz Frontier Line */}
            <Line
              data={continuousData}
              dataKey="ret"
              stroke={CHART_COLORS.muted}
              strokeWidth={2}
              dot={false}
              name="Continuous frontier"
              isAnimationActive={false}
            />

            {/* Discrete frontier of feasible K-stock picks, greyed out */}
            <Scatter
              name="Discrete frontier"
              data={discreteData}
              fill={CHART_COLORS.muted}
              fillOpacity={0.35}
              isAnimationActive={false}
            />

            {/* Plotted Discrete Solvers */}
            {validSolverPoints.map(point => (
              <Scatter
                key={point.solverKey}
                name={point.label}
                data={[{ risk: point.risk, ret: point.ret, name: point.label }]}
                fill={point.color}
                shape="circle"
                onClick={() => onSelectSolver(point.solverKey)}
                className="cursor-pointer"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend in words (colour is never the only signal) */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted">
        <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-muted"></span> Continuous frontier</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-muted/40"></span> Discrete frontier</span>
        {validSolverPoints.map(p => (
          <span key={p.solverKey} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span> {p.label}
          </span>
        ))}
      </div>

      {/* Listed Unplottable Solvers */}
      {unplottableSolvers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line/60 text-xs text-muted flex items-center gap-2">
          <span>⚠️ Solvers without valid feasible solutions:</span>
          {unplottableSolvers.map(s => (
            <span key={s.solver} className="px-2 py-0.5 rounded bg-wine/30 border border-wine text-[#FF8A8A] font-mono text-[10px]">
              {s.label} (Infeasible)
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
