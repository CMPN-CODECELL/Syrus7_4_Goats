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
  CartesianGrid,
  Legend
} from 'recharts';
import { getSolverColor, formatPercent } from '../lib/chartColors';

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
  const continuousData = [...frontier.continuous].sort((a, b) => a.risk - b.risk);

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
            Continuous unconstrained Markowitz frontier vs discrete QUBO portfolio solver selections.
          </p>
        </div>

        {/* Legend pills */}
        <div className="flex items-center space-x-3 text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-peach"></span> Continuous Frontier
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-peach"></span> Quantum/Classical Pick
          </span>
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
              name="Annualised Volatility"
              label={{ value: 'Annualised Volatility (Risk)', position: 'insideBottom', offset: -12, fill: '#A9B3C9', fontSize: 11 }}
            />
            <YAxis
              dataKey="ret"
              type="number"
              domain={['auto', 'auto']}
              stroke="#A9B3C9"
              fontSize={11}
              tickFormatter={(v: any) => formatPercent(v, 0)}
              name="Annualised Return"
              label={{ value: 'Expected Return', angle: -90, position: 'insideLeft', offset: 10, fill: '#A9B3C9', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#242F49', borderColor: '#384358', borderRadius: '10px', fontSize: '11px', color: '#F4EFEA' }}
              formatter={(val: any, name: any) => [
                formatPercent(Number(val)),
                name === 'risk' ? 'Volatility' : 'Expected Return'
              ]}
              labelFormatter={() => ''}
            />

            {/* Continuous Markowitz Frontier Line */}
            <Line
              data={continuousData}
              dataKey="ret"
              stroke="#FFA586"
              strokeWidth={2}
              dot={false}
              name="Markowitz Continuous Frontier"
              isAnimationActive={false}
            />

            {/* Plotted Discrete Solvers */}
            {validSolverPoints.map(point => (
              <Scatter
                key={point.solverKey}
                name={point.label}
                data={[{ risk: point.risk, ret: point.ret }]}
                fill={point.color}
                shape="circle"
                onClick={() => onSelectSolver(point.solverKey)}
                className="cursor-pointer"
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Listed Unplottable Solvers */}
      {unplottableSolvers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-line/60 text-xs text-muted flex items-center gap-2">
          <span>⚠️ Solvers without valid feasible solutions:</span>
          {unplottableSolvers.map(s => (
            <span key={s.solver} className="px-2 py-0.5 rounded bg-wine/30 border border-wine text-red font-mono text-[10px]">
              {s.label} (Infeasible)
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
