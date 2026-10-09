import React from 'react';
import { SolverResult } from '../api/types';
import { formatPercent, formatNumber, getSolverColor } from '../lib/chartColors';

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
    <div className="bg-panel border border-line rounded-2xl p-5 shadow-panel mb-6">
      <div className="pb-3 border-b border-line mb-4">
        <h2 className="text-base font-bold text-text flex items-center gap-2">
          <span>Solver Benchmark Comparison</span>
          <span className="text-xs text-muted font-normal">(Quantum vs Classical Solvers)</span>
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Side-by-side objective evaluation, risk metrics, feasibility rates, and execution runtimes.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-text">
          <thead>
            <tr className="border-b border-line/60 text-[11px] text-muted uppercase font-bold tracking-wider">
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
              const color = getSolverColor(s.solver);

              return (
                <tr
                  key={s.solver}
                  onClick={() => onSelectSolver(s.solver)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-peach/10 font-medium'
                      : 'hover:bg-ink/40'
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                      <span className="font-bold text-text">{s.label}</span>
                      {isRec && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-peach/20 text-peach border border-peach/30 font-bold uppercase">
                          Rec
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-bold text-text">
                    {s.objective !== null ? formatNumber(s.objective, 4) : '—'}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-peach font-bold">
                    {formatPercent(s.exp_return)}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-slate">
                    {formatPercent(s.volatility)}
                  </td>

                  <td className="py-3 px-3 text-center font-bold">
                    {s.feasible && s.selection !== null ? (
                      <span className="text-peach">✓ Feasible</span>
                    ) : (
                      <span className="text-[#FF8A8A]">✕ Infeasible</span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-text">
                    {s.approx_ratio !== null ? formatNumber(s.approx_ratio, 2) : '—'}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-peach">
                    {s.p_opt !== null ? formatPercent(s.p_opt) : '—'}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-muted">
                    {s.feasible_rate !== null ? formatPercent(s.feasible_rate) : '—'}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-muted">
                    {s.runtime_s.toFixed(2)} s
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
