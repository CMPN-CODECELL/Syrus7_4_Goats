import React from 'react';
import { SolverResult } from '../api/types';
import { formatPercent, formatINR, formatNumber } from '../lib/chartColors';

interface MetricCardsProps {
  solver: SolverResult;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ solver }) => {
  const isFeasible = solver.feasible && solver.selection !== null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {/* Expected Return */}
      <div className="bg-panel border border-line rounded-2xl p-4 shadow-panel">
        <div className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1">
          Expected Return (Net)
        </div>
        <div className="text-xl font-extrabold text-peach font-mono">
          {isFeasible ? formatPercent(solver.exp_return) : '—'}
        </div>
        <div className="text-[10px] text-muted mt-1">Annualised estimation window</div>
      </div>

      {/* Volatility */}
      <div className="bg-panel border border-line rounded-2xl p-4 shadow-panel">
        <div className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1">
          Annualised Risk (Vol)
        </div>
        <div className="text-xl font-extrabold text-slate font-mono">
          {isFeasible ? formatPercent(solver.volatility) : '—'}
        </div>
        <div className="text-[10px] text-muted mt-1">Variance: {isFeasible ? formatNumber(solver.variance, 4) : '—'}</div>
      </div>

      {/* Objective F(x) */}
      <div className="bg-panel border border-line rounded-2xl p-4 shadow-panel">
        <div className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1">
          QUBO Objective F(x)
        </div>
        <div className="text-xl font-extrabold text-text font-mono">
          {isFeasible ? formatNumber(solver.objective, 4) : '—'}
        </div>
        <div className="text-[10px] text-muted mt-1">Lower is better</div>
      </div>

      {/* Transaction Cost */}
      <div className="bg-panel border border-line rounded-2xl p-4 shadow-panel">
        <div className="text-[11px] text-muted uppercase font-bold tracking-wider mb-1">
          Transaction Cost
        </div>
        <div className="text-xl font-extrabold text-text font-mono">
          {isFeasible ? formatINR(solver.portfolio?.invested ? solver.portfolio.invested * (solver.txn_cost || 0) : 0) : '—'}
        </div>
        <div className="text-[10px] text-muted mt-1">Buy 0.1187% / Sell 0.1037%</div>
      </div>
    </div>
  );
};
