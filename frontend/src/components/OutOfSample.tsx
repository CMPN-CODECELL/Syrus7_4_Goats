import React from 'react';
import { SolverResult, BenchmarkMetrics } from '../api/types';
import { formatPercent, formatSignedPercent, gainLossClass, formatDrawdown, drawdownClass, formatNumber, getSolverStyle, SOLVER_STYLES } from '../lib/chartColors';
import { SolverMarker } from './SolverMarker';

interface OutOfSampleProps {
  solvers: SolverResult[];
  nifty50Benchmark?: BenchmarkMetrics | null;
  testWindow?: [string, string];
}

export const OutOfSample: React.FC<OutOfSampleProps> = ({ solvers, nifty50Benchmark, testWindow }) => {
  return (
    <div className="bg-surface border border-line p-5 mb-6">
      <div className="pb-3 border-b border-line mb-4">
        <h2 className="text-base font-medium text-text flex items-center gap-2">
          <span>Out-of-Sample Test Window Backtest</span>
        </h2>
        <p className="text-xs text-muted mt-0.5">
          Realised holding returns over the test window
          {testWindow && (<> (<strong className="text-text">{testWindow[0]}</strong> to <strong className="text-text">{testWindow[1]}</strong>)</>)}
          {' '}vs the NIFTY 50 benchmark (^NSEI).
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-text">
          <thead>
            <tr className="border-b border-line/60 label">
              <th className="py-2.5 px-3">Strategy / Solver</th>
              <th className="py-2.5 px-3 text-right">OOS Annualised Return</th>
              <th className="py-2.5 px-3 text-right">OOS Volatility</th>
              <th className="py-2.5 px-3 text-right">Sharpe Ratio (rf 5.57%)</th>
              <th className="py-2.5 px-3 text-right">Max Drawdown</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/40">
            {/* NIFTY 50 Benchmark Row */}
            {nifty50Benchmark && (
              <tr className="bg-bg font-medium">
                <td className="py-3 px-3">
                  <div className="flex items-center space-x-2">
                    <SolverMarker style={SOLVER_STYLES.nifty50} />
                    <span className="font-medium text-text">NIFTY 50 Index Benchmark (^NSEI)</span>
                  </div>
                </td>
                <td className={`py-3 px-3 text-right font-medium ${gainLossClass(nifty50Benchmark.ann_return)}`}>
                  {formatSignedPercent(nifty50Benchmark.ann_return)}
                </td>
                <td className="py-3 px-3 text-right text-muted">
                  {formatPercent(nifty50Benchmark.ann_vol)}
                </td>
                <td className="py-3 px-3 text-right text-text">
                  {formatNumber(nifty50Benchmark.sharpe, 2)}
                </td>
                <td className={`py-3 px-3 text-right font-medium ${drawdownClass(nifty50Benchmark.max_drawdown)}`}>
                  {formatDrawdown(nifty50Benchmark.max_drawdown)}
                </td>
              </tr>
            )}

            {/* Solvers OOS Rows */}
            {solvers.map(s => {
              if (!s.oos || !s.feasible || s.selection === null) return null;
              const style = getSolverStyle(s.solver);

              return (
                <tr key={s.solver} className="hover:bg-bg transition-colors">
                  <td className="py-3 px-3">
                    <div className="flex items-center space-x-2">
                      <SolverMarker style={style} />
                      <span className="font-medium text-text">{s.label}</span>
                    </div>
                  </td>
                  <td className={`py-3 px-3 text-right font-medium ${gainLossClass(s.oos.ann_return)}`}>
                    {formatSignedPercent(s.oos.ann_return)}
                  </td>
                  <td className="py-3 px-3 text-right text-muted">
                    {formatPercent(s.oos.ann_vol)}
                  </td>
                  <td className="py-3 px-3 text-right text-text font-medium">
                    {formatNumber(s.oos.sharpe, 2)}
                  </td>
                  <td className={`py-3 px-3 text-right font-medium ${drawdownClass(s.oos.max_drawdown)}`}>
                    {formatDrawdown(s.oos.max_drawdown)}
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
