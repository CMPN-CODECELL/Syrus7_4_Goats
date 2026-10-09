import React from 'react';
import { SolverResult } from '../api/types';
import { formatPercent, formatSignedPercent, gainLossClass, negativeClass, formatNumber, getSolverStyle } from '../lib/chartColors';
import { SolverMarker } from './SolverMarker';

interface SolverTableProps {
  solvers: SolverResult[];
  recommendedId: string;
  selectedSolverKey: string;
  onSelectSolver: (key: string) => void;
}

export const SolverTable: React.FC<SolverTableProps> = ({
  solvers,
  recommendedId,
  selectedSolverKey,
  onSelectSolver
}) => {
  return (
    <div className="bg-surface border border-line p-5">
      <div className="pb-3 border-b border-line mb-4">
        <h2 className="text-sm font-medium text-text flex items-center gap-2 uppercase tracking-wide">
          <span>Solver Benchmark Comparison</span>
          <span className="text-[13px] font-mono text-muted font-medium lowercase">(Quantum vs Classical Solvers)</span>
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Side-by-side objective evaluation, risk metrics, feasibility rates, and execution runtimes.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-text">
          <thead>
            <tr className="border-b border-line/60 label">
              <th className="py-2.5 px-3">Solver</th>
              <th className="py-2.5 px-3 text-right">Objective F(x)</th>
              <th className="py-2.5 px-3 text-right">Return</th>
              <th className="py-2.5 px-3 text-right">Volatility</th>
              <th className="py-2.5 px-3 text-center">Feasible</th>
              <th className="py-2.5 px-3 text-right">Approx Ratio</th>
              <th className="py-2.5 px-3 text-right">P(opt)</th>
              <th className="py-2.5 px-3 text-right">Feasible Rate</th>
              <th className="py-2.5 px-3 text-right">Runtime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {solvers.map(s => {
              const isSelected = s.solver === selectedSolverKey;
              const isRec = s.solver === recommendedId;
              const style = getSolverStyle(s.solver);

              return (
                <tr
                  key={s.solver}
                  onClick={() => onSelectSolver(s.solver)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-surface-elevated font-medium text-white'
                      : 'hover:bg-bg'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <SolverMarker style={style} />
                      <span className="font-medium text-text">{s.label}</span>
                      {isRec && (
                        <span className="text-[12px] px-1.5 py-0.5 bg-surface text-text border border-line-strong font-medium uppercase">
                          Rec
                        </span>
                      )}
                    </div>
                  </td>

                  <td className={`py-3 px-3 text-right font-medium ${negativeClass(s.objective)}`}>
                    {s.objective != null ? formatNumber(s.objective, 4) : '—'}
                  </td>

                  <td className={`py-3 px-3 text-right font-medium ${gainLossClass(s.exp_return)}`}>
                    {formatSignedPercent(s.exp_return)}
                  </td>

                  <td className="py-3 px-3 text-right text-muted">
                    {formatPercent(s.volatility)}
                  </td>

                  <td className="py-3 px-3 text-center font-medium">
                    {s.feasible && s.selection !== null ? (
                      <span className="text-gain">✓ Feasible</span>
                    ) : (
                      <span className="text-loss">⚠ Infeasible</span>
                    )}
                  </td>

                  <td className={`py-3 px-3 text-right ${negativeClass(s.approx_ratio)}`}>
                    {s.approx_ratio != null ? formatNumber(s.approx_ratio, 2) : '—'}
                  </td>

                  <td className="py-3 px-3 text-right text-text">
                    {s.p_opt != null ? formatPercent(s.p_opt) : '—'}
                  </td>

                  <td className="py-3 px-3 text-right text-muted">
                    {s.feasible_rate != null ? formatPercent(s.feasible_rate) : '—'}
                  </td>

                  <td className="py-3 px-3 text-right text-muted">
                    {formatNumber(s.runtime_s, 2)} s
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
