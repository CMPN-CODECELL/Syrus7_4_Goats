import React from 'react';
import { SolverResult, BenchmarkMetrics } from '../api/types';
import { formatPercent, formatNumber, getSolverColor } from '../lib/chartColors';

interface OutOfSampleProps {
  solvers: SolverResult[];
  nifty50Benchmark: BenchmarkMetrics;
  testWindow?: [string, string];
}

export const OutOfSample: React.FC<OutOfSampleProps> = ({
  solvers,
  nifty50Benchmark,
  testWindow = ['2025-10-01', '2026-09-30']
}) => {
  return (
    <div className="bg-panel border border-line rounded-2xl p-5 shadow-panel mb-6">
      <div className="pb-3 border-b border-line mb-4">
        <h2 className="text-base font-bold text-text flex items-center gap-2">
          <span>📅 Out-of-Sample Test Window Backtest</span>
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Realised holding returns over test window (<strong className="text-text">{testWindow[0]}</strong> to <strong className="text-text">{testWindow[1]}</strong>) vs NIFTY 50 benchmark (^NSEI).
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-text">
          <thead>
            <tr className="border-b border-line/60 text-[11px] text-muted uppercase font-bold tracking-wider">
              <th className="py-2.5 px-3">Strategy / Solver</th>
              <th className="py-2.5 px-3 text-right">OOS Annualised Return</th>
              <th className="py-2.5 px-3 text-right">OOS Volatility</th>
              <th className="py-2.5 px-3 text-right">Sharpe Ratio (rf 5.57%)</th>
              <th className="py-2.5 px-3 text-right">Max Drawdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {/* NIFTY 50 Benchmark Row */}
            <tr className="bg-ink/60 font-medium">
              <td className="py-3 px-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-0.5 bg-muted border-t border-dashed border-muted shrink-0"></span>
                  <span className="font-bold text-text">NIFTY 50 Index Benchmark (^NSEI)</span>
                </div>
              </td>
              <td className="py-3 px-3 text-right font-mono font-bold text-peach">
                {formatPercent(nifty50Benchmark.ann_return)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-slate">
                {formatPercent(nifty50Benchmark.ann_vol)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-text">
                {formatNumber(nifty50Benchmark.sharpe, 2)}
              </td>
              <td className="py-3 px-3 text-right font-mono text-red font-bold">
                {formatPercent(nifty50Benchmark.max_drawdown)}
              </td>
            </tr>

            {/* Solvers OOS Rows */}
            {solvers.map(s => {
              if (!s.oos || !s.feasible || s.selection === null) return null;
              const color = getSolverColor(s.solver);

              return (
                <tr key={s.solver} className="hover:bg-ink/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></span>
                      <span className="font-bold text-text">{s.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold text-peach">
                    {formatPercent(s.oos.ann_return)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate">
                    {formatPercent(s.oos.ann_vol)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-text font-bold">
                    {formatNumber(s.oos.sharpe, 2)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-red font-bold">
                    {formatPercent(s.oos.max_drawdown)}
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
