import React from 'react';
import { SolverResult } from '../api/types';
import { formatPercent, formatINR } from '../lib/chartColors';

interface PortfolioTableProps {
  solvers: SolverResult[];
  recommendedSolverId: string;
  selectedSolverKey: string;
  onSelectSolver: (key: string) => void;
}

export const PortfolioTable: React.FC<PortfolioTableProps> = ({
  solvers,
  recommendedSolverId,
  selectedSolverKey,
  onSelectSolver
}) => {
  const currentSolver = solvers.find(s => s.solver === selectedSolverKey) || solvers[0];

  if (!currentSolver) return null;

  const isNoFeasible = !currentSolver.feasible || currentSolver.selection === null || !currentSolver.portfolio;

  return (
    <div className="bg-panel border border-line rounded-2xl p-5 shadow-panel mb-6">
      {/* Header & Solver Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line mb-4">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <span>Portfolio Asset Allocation &amp; Shares</span>
            {currentSolver.solver === recommendedSolverId && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-peach/20 text-peach border border-peach/30">
                Recommended Choice
              </span>
            )}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Realised whole share holdings and cash allocation for capital amount.
          </p>
        </div>

        {/* Solver Selector Tabs */}
        <div className="flex bg-ink/70 p-1 rounded-xl border border-line overflow-x-auto max-w-full">
          {solvers.map(s => {
            const isSel = s.solver === currentSolver.solver;
            return (
              <button
                key={s.solver}
                type="button"
                onClick={() => onSelectSolver(s.solver)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  isSel
                    ? 'bg-peach text-ink font-bold shadow'
                    : 'text-muted hover:text-text'
                }`}
              >
                {s.label.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* No Feasible State Handling */}
      {isNoFeasible ? (
        <div className="p-8 bg-wine/30 border border-wine rounded-xl text-center space-y-2">
          <div className="text-xl">⚠️</div>
          <h3 className="font-bold text-[#FF8A8A] text-sm">
            QAOA Found No Feasible Portfolio
          </h3>
          <p className="text-xs text-text max-w-md mx-auto">
            All measured bitstrings violated penalty constraints. Feasible sample rate was{' '}
            <strong className="text-peach">{formatPercent(currentSolver.feasible_rate)}</strong>.
          </p>
        </div>
      ) : (
        <>
          {/* Table Container with overflow-x-auto for 375px mobile responsiveness */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text">
              <thead>
                <tr className="border-b border-line/60 text-[11px] text-muted uppercase font-bold tracking-wider">
                  <th className="py-2.5 px-3">Stock Ticker</th>
                  <th className="py-2.5 px-3">Sector</th>
                  <th className="py-2.5 px-3 text-right">Weight</th>
                  <th className="py-2.5 px-3 text-right">Shares</th>
                  <th className="py-2.5 px-3 text-right">Price</th>
                  <th className="py-2.5 px-3 text-right">Position Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/40">
                {currentSolver.portfolio!.rows.map((row) => (
                  <tr key={row.ticker} className="hover:bg-ink/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-text flex items-center gap-1.5">
                        <span className="text-peach">{row.symbol || row.ticker.replace('.NS', '')}</span>
                      </div>
                      <div className="text-[10px] text-muted truncate max-w-[180px]">{row.name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-line/50 text-muted font-mono text-[10px]">
                        {row.sector}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-peach">
                      {formatPercent(row.weight)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-text font-bold">
                      {row.shares.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-muted">
                      {formatINR(row.price)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-text font-bold">
                      {formatINR(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Capital & Cash Breakdown Footer */}
          <div className="mt-4 pt-3 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-muted">
                Invested Capital: <strong className="text-text font-mono font-bold">{formatINR(currentSolver.portfolio!.invested)}</strong>
              </span>
              <span className="text-line">|</span>
              <span className="text-muted">
                Uninvested Cash: <strong className="text-peach font-mono font-bold">{formatINR(currentSolver.portfolio!.cash_left)}</strong>
              </span>
            </div>

            <span className="text-[11px] text-muted italic">
              Equal-weighted allocation across selected K={currentSolver.selection?.length || 0} stocks.
            </span>
          </div>
        </>
      )}
    </div>
  );
};
