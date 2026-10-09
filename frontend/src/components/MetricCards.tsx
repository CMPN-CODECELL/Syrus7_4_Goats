import React from 'react';
import { SolverResult } from '../api/types';
import { formatPercent, formatSignedPercent, gainLossClass, formatINR, formatNumber } from '../lib/chartColors';

interface MetricCardsProps {
  solver: SolverResult;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ solver }) => {
  const isFeasible = solver.feasible && solver.selection !== null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {/* Expected Return */}
      <div className="bg-surface border border-line p-4">
        <div className="label mb-1">
          Expected Return
        </div>
        <div className={`text-xl font-medium ${isFeasible ? gainLossClass(solver.exp_return) : 'text-text'}`}>
          {isFeasible ? formatSignedPercent(solver.exp_return) : '—'}
        </div>
        <div className="text-[10px] text-muted mt-1">Annualised, before costs</div>
      </div>

      {/* Volatility */}
      <div className="bg-surface border border-line p-4">
        <div className="label mb-1">
          Annualised Risk (Vol)
        </div>
        <div className="text-xl font-medium text-text">
          {isFeasible ? formatPercent(solver.volatility) : '—'}
        </div>
        <div className="text-[10px] text-muted mt-1">Variance: {isFeasible ? formatNumber(solver.variance, 4) : '—'}</div>
      </div>

      {/* Objective F(x) */}
      <div className="bg-surface border border-line p-4">
        <div className="label mb-1">
          QUBO Objective F(x)
        </div>
        <div className="text-xl font-medium text-text">
          {isFeasible ? formatNumber(solver.objective, 4) : '—'}
        </div>
        <div className="text-[10px] text-muted mt-1">Lower is better</div>
      </div>

      {/* Transaction Cost */}
      <div className="bg-surface border border-line p-4">
        <div className="label mb-1">
          Transaction Cost
        </div>
        <div className="text-xl font-medium text-text">
          {isFeasible ? formatPercent(solver.txn_cost, 3) : '—'}
        </div>
        <div className="text-[10px] text-muted mt-1">
          {isFeasible && solver.portfolio && solver.txn_cost !== null
            ? `of capital, about ${formatINR((solver.portfolio.invested + solver.portfolio.cash_left) * solver.txn_cost)}`
            : 'Buy 0.1187% / Sell 0.1037%'}
        </div>
      </div>
    </div>
  );
};
