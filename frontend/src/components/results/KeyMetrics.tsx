// B. Key metrics: each card says what it is, whether it is in-sample or out-of-sample, and whether costs are included.
// Semantics checked against backend/qportfolio/problem.py and data/evaluate.py:
//   exp_return = mu'x/K, annualised and BEFORE costs. The optimiser (and the target-return rule) score exp_return - txn_cost.
//   txn_cost   = fraction of capital, one-off, from the assumed buy and sell rates.
//   oos.ann_return = compound annualised return of an equal-weight buy-and-hold over the test window, BEFORE costs.
import type { SolverResult } from '../../api/types';
import { formatINR, formatPct, isNum } from '../../lib/format';
import { Stat, WhatThisMeans } from '../ui';
import { Gain } from './parts';
import { C_BUY, C_SELL, windowText } from './model';

interface KeyMetricsProps {
  solver: SolverResult;
  /** Capital of the run. Falls back to invested plus cash when omitted. */
  capital?: number | null;
  estWindow?: readonly string[] | null;
  testWindow?: readonly string[] | null;
  /** Number of existing holdings in the request (affects what the cost figure includes). */
  holdingsCount?: number;
  /** Price date for the cash explanation. */
  priceDate?: string | null;
}

export function KeyMetrics({ solver, capital, estWindow, testWindow, holdingsCount = 0, priceDate }: KeyMetricsProps) {
  const p = solver.portfolio;
  const cap = isNum(capital) ? capital : p ? p.invested + p.cash_left : null;
  const gross = solver.exp_return;
  const txn = solver.txn_cost;
  const net = isNum(gross) && isNum(txn) ? gross - txn : null;
  const txnRupees = isNum(txn) && isNum(cap) ? txn * cap : null;
  const oos = solver.oos;
  const cashShare = p && isNum(cap) && cap > 0 ? p.cash_left / cap : null;

  return (
    <div>
      <p className="mb-3 text-xs text-muted">Figures for the portfolio from {solver.label}.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Stat
          label="Expected annual return"
          value={<Gain value={net ?? gross} />}
          hint={
            <>
              <span className="text-text">
                {net !== null ? 'In-sample estimate, net of transaction costs.' : 'In-sample estimate, before transaction costs (cost figure unavailable).'}
              </span>{' '}
              {net !== null && <>Before costs {formatPct(gross, { sign: true })}, minus {formatPct(txn, { digits: 2 })} of capital in one-off costs. </>}
              Average historical return over {windowText(estWindow)}, annualised. Not a forecast or a guarantee.
            </>
          }
        />
        <Stat
          label="Out-of-sample test return"
          value={oos ? <Gain value={oos.ann_return} /> : '—'}
          hint={
            oos ? (
              <>
                Annualised return of these stocks held equally over {windowText(testWindow)}, a period the optimiser did not see. Before transaction costs.
                One historical window, so it does not predict the future.
              </>
            ) : 'No out-of-sample result is available for this method.'
          }
        />
        <Stat
          label="Annualised volatility"
          value={formatPct(solver.volatility)}
          hint={
            <>
              How much the portfolio&apos;s value moved up and down in {windowText(estWindow)}, scaled to a year. A historical variability indicator, not complete risk:
              it does not measure the chance or size of a large loss.
              {oos && isNum(oos.ann_vol) && <> In the test window it was {formatPct(oos.ann_vol)}.</>}
            </>
          }
        />
        <Stat
          label="Transaction costs"
          value={formatINR(txnRupees)}
          hint={
            <>
              {formatPct(txn, { digits: 3 })} of your capital. Assumed rates: buy {formatPct(C_BUY, { digits: 4 })}, sell {formatPct(C_SELL, { digits: 4 })} of the trade value.
              {holdingsCount > 0 ? ' Includes selling existing holdings that are not kept.' : ' Counted as buying every position from cash.'} Real brokers and taxes may differ.
            </>
          }
        />
        <Stat
          label="Uninvested cash"
          value={formatINR(p?.cash_left)}
          hint={
            <>
              {cashShare !== null ? `${formatPct(cashShare, { digits: 2 })} of your capital. ` : ''}
              Shares are whole units. Each stock gets an equal budget, and what that budget cannot buy at the {priceDate ? `${priceDate} ` : ''}price stays as cash.
            </>
          }
        />
      </div>
      <WhatThisMeans
        shows={<>Estimates built from historical prices in the estimation window ({windowText(estWindow)}), next to how the same stocks actually did in the later test window ({windowText(testWindow)}).</>}
        infer="How the portfolio behaved in the past, and how well the in-sample estimate held up on data it had not seen."
        cannot="What the portfolio will earn or lose in future. These are estimates, not guarantees. The stocks were chosen using the same history the in-sample figure comes from, so that figure tends to look better than what follows. One test window is not enough to judge a strategy."
      >
        <p>Expected return is the average annualised log return of the picked stocks (daily mean times 252) minus the one-off transaction cost, which is the same net figure the optimiser scores and the target-return rule checks. Volatility is the square root of the portfolio variance from the estimation-window covariance. The out-of-sample return compounds an equal-weight buy-and-hold over the test window with no costs.</p>
      </WhatThisMeans>
    </div>
  );
}
