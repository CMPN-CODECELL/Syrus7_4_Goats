// Out-of-sample check against the NIFTY 50: how the chosen stocks did in a later window the optimiser never saw.
// Methods that picked the same stocks share one row, so identical results are not repeated.
import type { BenchmarkMetrics, SolverResult } from '../api/types';
import { formatPct, isNum, trend } from '../lib/format';
import { Section, WhatThisMeans } from './ui';
import { Gain, ScrollTable, TD, TDR, TH, THR } from './results/parts';
import { fmtNum, isUsable, RF, selectionKey, symbolOf, windowText } from './results/model';

interface OutOfSampleProps {
  solvers: SolverResult[];
  nifty50Benchmark?: BenchmarkMetrics | null;
  testWindow?: readonly string[] | null;
  /** Marks the recommended method's row. */
  recommendedSolverId?: string;
}

/** A drawdown is a fall, whichever sign the server uses, so it is always shown as a loss. */
const Drawdown = ({ value }: { value: number | null | undefined }) => {
  if (!isNum(value)) return <>—</>;
  const loss = -Math.abs(value);
  const { tone, arrow } = trend(loss);
  return <span className={tone}>{arrow && <span aria-hidden="true">{arrow} </span>}{formatPct(loss, { sign: true })}</span>;
};

export function OutOfSample({ solvers, nifty50Benchmark, testWindow, recommendedSolverId }: OutOfSampleProps) {
  // Group methods that chose exactly the same stocks.
  const groups = new Map<string, { labels: string[]; symbols: string[]; oos: NonNullable<SolverResult['oos']>; recommended: boolean }>();
  for (const s of solvers ?? []) {
    if (!isUsable(s) || !s.oos) continue;
    const key = selectionKey(s.selection);
    const g = groups.get(key);
    const isRec = s.solver === recommendedSolverId;
    if (g) {
      g.labels.push(s.label);
      g.recommended = g.recommended || isRec;
    } else {
      groups.set(key, { labels: [s.label], symbols: s.portfolio.rows.map(symbolOf), oos: s.oos, recommended: isRec });
    }
  }
  const list = [...groups.values()];
  const bench = nifty50Benchmark ?? null;
  const win = windowText(testWindow);

  const lead = list[0]?.oos && bench && isNum(list[0].oos.ann_return) && isNum(bench.ann_return)
    ? (() => {
        const d = (list[0].oos.ann_return - bench.ann_return) * 100;
        return `Over this window the ${list.length > 1 ? 'first portfolio' : 'portfolio'} returned ${Math.abs(d).toFixed(1)} percentage points ${d >= 0 ? 'more' : 'less'} per year than the NIFTY 50.`;
      })()
    : undefined;

  return (
    <Section
      id="out-of-sample"
      eyebrow="Out-of-sample check"
      title="Against the NIFTY 50"
      lead={<>A single historical test window ({win}), after the history the optimiser used. {lead}</>}
    >
      {list.length === 0 && !bench ? (
        <p className="text-sm text-muted">No out-of-sample results are available for this run.</p>
      ) : (
        <ScrollTable label="Out-of-sample results against the NIFTY 50">
          <table className="w-full min-w-[38rem] text-sm">
            <caption className="sr-only">Annualised return, volatility, Sharpe ratio and maximum drawdown over {win}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className={TH}>Portfolio</th>
                <th scope="col" className={THR}>Annual return</th>
                <th scope="col" className={THR}>Volatility</th>
                <th scope="col" className={THR}>Sharpe (risk-free {formatPct(RF, { digits: 2 })})</th>
                <th scope="col" className={THR}>Worst fall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {bench && (
                <tr>
                  <th scope="row" className={`${TD} text-left font-normal`}>
                    NIFTY 50 index (^NSEI)
                    <span className="block text-xs text-muted">Benchmark</span>
                  </th>
                  <td className={TDR}><Gain value={bench.ann_return} /></td>
                  <td className={TDR}>{formatPct(bench.ann_vol)}</td>
                  <td className={TDR}>{fmtNum(bench.sharpe, 2)}</td>
                  <td className={TDR}><Drawdown value={bench.max_drawdown} /></td>
                </tr>
              )}
              {list.map((g) => (
                <tr key={g.symbols.join(',')}>
                  <th scope="row" className={`${TD} text-left font-normal`}>
                    {g.labels.length > 1 ? `Chosen by ${g.labels.length} methods` : g.labels[0]}
                    {g.recommended && <span className="block text-xs text-muted">includes the recommended portfolio</span>}
                    <span className="block text-xs text-muted">{g.labels.length > 1 ? `${g.labels.join(', ')}. ` : ''}Stocks: <span className="font-mono">{g.symbols.join(', ')}</span></span>
                  </th>
                  <td className={TDR}><Gain value={g.oos.ann_return} /></td>
                  <td className={TDR}>{formatPct(g.oos.ann_vol)}</td>
                  <td className={TDR}>{fmtNum(g.oos.sharpe, 2)}</td>
                  <td className={TDR}><Drawdown value={g.oos.max_drawdown} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
      )}
      <p className="mt-1 text-xs text-muted">
        Portfolio returns assume an equal-weight buy-and-hold with no transaction costs. Worst fall is the largest drop from a peak to a later low. The NIFTY 50 line is the index, not an investable fund.
      </p>
      <WhatThisMeans
        shows="How the chosen stocks actually performed over one later period, next to the NIFTY 50 over the same period."
        infer="Whether the picks held up on data the optimiser had not seen, in this one window."
        cannot="That the result will repeat. One window is a single sample, and a different period could look very different. A higher past return is not a promise of a higher future return."
      />
    </Section>
  );
}
