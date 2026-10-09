import React from 'react';
import { GlossaryTermTooltip } from './Glossary';

interface ConstraintsFormProps {
  k: number;
  setK: (val: number) => void;
  riskAversion: number;
  setRiskAversion: (val: number) => void;
  sectorCap: number | null;
  setSectorCap: (val: number | null) => void;
  targetReturn: number | null;
  setTargetReturn: (val: number | null) => void;
  capital: number;
  setCapital: (val: number) => void;
  holdingsText: string;
  setHoldingsText: (val: string) => void;
  maxKLimit?: number;
}

export const ConstraintsForm: React.FC<ConstraintsFormProps> = ({
  k,
  setK,
  riskAversion,
  setRiskAversion,
  sectorCap,
  setSectorCap,
  targetReturn,
  setTargetReturn,
  capital,
  setCapital,
  holdingsText,
  setHoldingsText,
  maxKLimit = 15
}) => {
  return (
    <div className="bg-panel border border-line rounded-2xl p-5 shadow-panel mb-6">
      <h2 className="text-base font-bold text-text mb-4 pb-3 border-b border-line flex items-center gap-2">
        <span>Portfolio &amp; Risk Constraints</span>
        <span className="text-xs text-muted font-normal">(QUBO Objective &amp; Slack Terms)</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cardinality (k) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="k" className="text-xs font-bold text-text flex items-center gap-1">
              Exact Stock Picks (K)
              <GlossaryTermTooltip termKey="qubo">
                <span>[?]</span>
              </GlossaryTermTooltip>
            </label>
            <span className="text-sm font-extrabold text-peach bg-peach/10 px-2 py-0.5 rounded border border-peach/30 font-mono">
              {k} stocks
            </span>
          </div>
          <input
            id="k"
            type="range"
            min={2}
            max={maxKLimit}
            value={k}
            onChange={(e) => setK(Number(e.target.value))}
            className="w-full accent-peach bg-ink h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>2 (Concentrated)</span>
            <span>{maxKLimit} (Diversified)</span>
          </div>
        </div>

        {/* Risk Aversion (q) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="risk-aversion" className="text-xs font-bold text-text flex items-center gap-1">
              Risk Aversion Parameter (q)
            </label>
            <span className="text-xs font-bold text-peach bg-peach/10 px-2 py-0.5 rounded border border-peach/30 font-mono">
              q = {riskAversion.toFixed(2)} ({riskAversion < 0.3 ? 'Growth Focus' : riskAversion > 0.7 ? 'Min Variance' : 'Balanced'})
            </span>
          </div>
          <input
            id="risk-aversion"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={riskAversion}
            onChange={(e) => setRiskAversion(Number(e.target.value))}
            className="w-full accent-peach bg-ink h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted mt-1">
            <span>0.0 (Max Return)</span>
            <span>0.5 (Balanced)</span>
            <span>1.0 (Min Risk)</span>
          </div>
        </div>

        {/* Sector Cap Constraint */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="sector-cap" className="text-xs font-bold text-text flex items-center gap-1">
              Max Stocks Per Sector
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSectorCap(sectorCap === null ? 2 : null)}
                className={`text-xs px-3 py-1.5 min-h-[44px] rounded-xl font-medium transition-colors flex items-center justify-center ${
                  sectorCap === null
                    ? 'bg-line text-muted'
                    : 'bg-peach text-ink font-bold shadow'
                }`}
              >
                {sectorCap === null ? 'OFF' : `ON (${sectorCap})`}
              </button>
            </div>
          </div>
          {sectorCap !== null ? (
            <div className="flex items-center gap-3 mt-2">
              <input
                id="sector-cap"
                type="number"
                min={1}
                max={5}
                value={sectorCap}
                onChange={(e) => setSectorCap(Math.max(1, Math.min(5, Number(e.target.value))))}
                className="w-24 min-h-[44px] bg-ink border border-line rounded-xl px-3 py-1.5 text-xs text-text focus:outline-none focus:border-peach"
              />
              <span className="text-xs text-muted">Max stocks per individual industry sector</span>
            </div>
          ) : (
            <p className="text-[11px] text-muted mt-1">No sector concentration limit applied.</p>
          )}
        </div>

        {/* Target Net Return Constraint */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="target-return" className="text-xs font-bold text-text flex items-center gap-1">
              Target Annual Net Return (%)
            </label>
            <button
              type="button"
              onClick={() => setTargetReturn(targetReturn === null ? 0.12 : null)}
              className={`text-xs px-3 py-1.5 min-h-[44px] rounded-xl font-medium transition-colors flex items-center justify-center ${
                targetReturn === null
                  ? 'bg-line text-muted'
                  : 'bg-peach text-ink font-bold shadow'
              }`}
            >
              {targetReturn === null ? 'OFF' : `ON (${(targetReturn * 100).toFixed(1)}%)`}
            </button>
          </div>
          {targetReturn !== null ? (
            <div className="flex items-center gap-3 mt-2">
              <input
                id="target-return"
                type="number"
                min={5}
                max={30}
                step={0.5}
                value={Math.round(targetReturn * 10000) / 100}
                onChange={(e) => setTargetReturn(Number(e.target.value) / 100)}
                className="w-24 min-h-[44px] bg-ink border border-line rounded-xl px-3 py-1.5 text-xs text-text focus:outline-none focus:border-peach"
              />
              <span className="text-xs text-muted">Min required net annual return after transaction costs</span>
            </div>
          ) : (
            <p className="text-[11px] text-muted mt-1">No target return floor applied.</p>
          )}
        </div>

        {/* Total Capital */}
        <div className="md:col-span-2">
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-text">
              Investment Capital (INR ₹)
            </label>
            <span className="text-xs font-mono text-muted">
              ₹{capital.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[100000, 500000, 1000000, 5000000].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setCapital(val)}
                className={`py-2 px-3 min-h-[44px] text-xs font-medium rounded-xl border transition-all flex items-center justify-center ${
                  capital === val
                    ? 'bg-peach/15 border-peach text-peach font-bold'
                    : 'bg-ink/50 border-line text-muted hover:text-text'
                }`}
              >
                ₹{val / 100000} Lakh{val > 100000 ? 's' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Current Holdings (optional): transaction costs are charged relative to these */}
        <div className="md:col-span-2">
          <label htmlFor="holdings" className="text-xs font-bold text-text block mb-1.5">
            Current Holdings <span className="font-normal text-muted">(optional)</span>
          </label>
          <textarea
            id="holdings"
            rows={3}
            value={holdingsText}
            onChange={(e) => setHoldingsText(e.target.value)}
            placeholder={'One per line: symbol and shares, e.g.\nTCS 52\nINFY 120'}
            className="w-full bg-ink border border-line rounded-xl px-3 py-2 text-xs text-text font-mono placeholder-muted focus:outline-none focus:border-peach"
          />
          <p className="text-[11px] text-muted mt-1">
            Costs are charged relative to these shares (selling a dropped holding costs 0.1037%). Leave empty to start from cash.
          </p>
        </div>
      </div>
    </div>
  );
};
