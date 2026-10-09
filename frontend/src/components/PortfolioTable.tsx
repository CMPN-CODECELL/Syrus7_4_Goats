import React from 'react';
import { SolverResult } from '../api/types';
import { formatPercent, formatINR, formatSignedPercent, gainLossClass } from '../lib/chartColors';

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
    <div className="bg-surface border border-line p-5">
      {/* Header & Solver Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line mb-4">
        <div>
          <h2 className="text-sm font-medium text-text flex items-center gap-2 uppercase tracking-wide">
            <span>Portfolio Asset Allocation &amp; Shares</span>
            {currentSolver.solver === recommendedSolverId && (
              <span className="text-[10px] font-mono px-2 py-0.5 bg-accent-blue/10 text-accent-blue-hover border border-accent-blue/40 uppercase">
                Recommended Choice
              </span>
            )}
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Realised whole share holdings and cash allocation for capital amount.
          </p>
        </div>

        {/* Solver Selector Tabs */}
        <div className="flex bg-bg p-1 border border-line overflow-x-auto max-w-full gap-0.5">
          {solvers.map(s => {
            const isSel = s.solver === currentSolver.solver;
            return (
              <button
                key={s.solver}
                type="button"
                onClick={() => onSelectSolver(s.solver)}
                className={`px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all border ${
                  isSel
                    ? 'bg-surface-elevated text-white border-accent-blue/60'
                    : 'border-transparent text-muted hover:text-text'
                }`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* No Feasible State Handling */}
      {isNoFeasible ? (
        <div className="p-8 bg-surface border border-loss/40 text-center space-y-2">
          <h3 className="font-medium text-loss text-sm">
            ⚠ {currentSolver.label} found no feasible portfolio
          </h3>
          {currentSolver.kind === 'quantum' ? (
            <p className="text-xs text-text max-w-md mx-auto">
              No sampled bitstring met every constraint, so no portfolio is shown. Feasible sample rate was{' '}
              <strong className="text-loss">{formatPercent(currentSolver.feasible_rate)}</strong>.
            </p>
          ) : (
            <p className="text-xs text-text max-w-md mx-auto">
              Its answer violates: <span className="text-loss">{currentSolver.violations.join('; ') || 'a constraint'}</span>.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Table Container with overflow-x-auto for 375px mobile responsiveness */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-text">
              <thead>
                <tr className="border-b border-line/60 label">
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
                  <tr key={row.ticker} className="hover:bg-bg transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-medium text-text flex items-center gap-1.5">
                        <span className="text-text">{row.symbol || row.ticker.replace('.NS', '')}</span>
                      </div>
                      <div className="text-[10px] text-muted truncate max-w-[180px]">{row.name}</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-line/50 text-muted text-[10px]">
                        {row.sector}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-text">
                      {formatPercent(row.weight)}
                    </td>
                    <td className="py-3 px-3 text-right font-medium">
                      {row.shares === 0 ? (
                        <span className="text-loss">0</span>
                      ) : (
                        <span className="text-text">{row.shares.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right text-muted">
                      {formatINR(row.price)}
                    </td>
                    <td className="py-3 px-3 text-right text-text font-medium">
                      {formatINR(row.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Capital & Cash Breakdown Footer */}
          <div className="mt-4 pt-3 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-muted">
                Invested Capital: <strong className={`font-medium ${currentSolver.portfolio!.invested < 0 ? 'text-loss' : 'text-text'}`}>{formatINR(currentSolver.portfolio!.invested)}</strong>
              </span>
              <span className="text-faint">|</span>
              <span className="text-muted">
                Uninvested Cash: <strong className={`font-medium ${currentSolver.portfolio!.cash_left < 0 ? 'text-loss' : 'text-text'}`}>{formatINR(currentSolver.portfolio!.cash_left)}</strong>
              </span>
              {currentSolver.exp_return != null && (
                <>
                  <span className="text-faint">|</span>
                  <span className="text-muted">
                    Expected Stake Return:{' '}
                    <strong className={`font-medium ${gainLossClass(currentSolver.exp_return)}`}>
                      {formatSignedPercent(currentSolver.exp_return)}
                    </strong>
                  </span>
                </>
              )}
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
