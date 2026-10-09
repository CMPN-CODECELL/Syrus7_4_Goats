// D. Why were these stocks selected? Only values the backend actually computed are shown.
// Estimation-window stats come from the optional result.assets[]; risk share and correlation from the optional
// portfolio.rows[i] fields. When a value is absent the card says "not computed for this run" and shows nothing else.
import { formatPct, isNum } from '../../lib/format';
import { WhatThisMeans } from '../ui';
import { Fact, Gain, NotComputed } from './parts';
import { fmtNum, symbolOf, type PortfolioRowX, type ResultX, type UsableSolver } from './model';

export function WhySelected({ result, solver }: { result: ResultX; solver: UsableSolver }) {
  const rows = solver.portfolio.rows as PortfolioRowX[];
  const assets = result.assets ?? [];
  const byTicker = new Map(assets.map((a) => [a.ticker, a]));
  const pool = (result.screen?.kept?.length ?? 0) + (result.screen?.dropped?.length ?? 0);
  const cap = result.request?.sector_cap;

  const perSector = new Map<string, number>();
  for (const r of rows) perSector.set(r.sector, (perSector.get(r.sector) ?? 0) + 1);

  const anyStats = rows.some((r) => byTicker.has(r.ticker));
  const anyRisk = rows.some((r) => isNum(r.risk_contribution) || isNum(r.avg_corr));

  return (
    <div>
      <p className="mb-3 max-w-prose text-sm text-muted">
        {result.screen?.applied && result.screen.rule
          ? <>Screen: {result.screen.rule} </>
          : <>No screen was applied; every usable stock was a candidate. </>}
        The constraints then required exactly {rows.length} stocks{isNum(cap) ? `, at most ${cap} per sector` : ''}.
        {' '}Picks per sector: {[...perSector.entries()].map(([s, n]) => `${s} ${n}`).join(', ')}.
      </p>
      {(!anyStats || !anyRisk) && (
        <p className="mb-3 text-sm text-muted">
          {!anyStats && 'Per-stock return, volatility, Sharpe ratio and screen rank were not computed for this run. '}
          {!anyRisk && 'Risk share and correlation with the other picks were not computed for this run.'}
        </p>
      )}

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {rows.map((r) => {
          const a = byTicker.get(r.ticker);
          const rank = a?.screen_rank;
          return (
            <li key={r.ticker} className="min-w-0 border border-line bg-surface p-4">
              <h4><span className="font-mono text-base">{symbolOf(r)}</span></h4>
              <p className="text-sm text-muted">{r.name}</p>
              <p className="text-sm">Sector: {r.sector || '—'}</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
                <Fact label="Est. return" value={a && isNum(a.exp_return) ? <Gain value={a.exp_return} /> : <NotComputed />} hint={a ? 'Annualised, estimation window' : undefined} />
                <Fact label="Volatility" value={a && isNum(a.volatility) ? formatPct(a.volatility) : <NotComputed />} hint={a ? 'Annualised, estimation window' : undefined} />
                <Fact label="Sharpe ratio" value={a && isNum(a.sharpe) ? fmtNum(a.sharpe, 2) : <NotComputed />} hint={a ? 'Return above 5.57% risk-free, per unit of volatility' : undefined} />
                <Fact
                  label="Screen rank"
                  value={isNum(rank) ? `#${rank}${pool > 0 ? ` of ${pool}` : ''}` : <NotComputed />}
                  hint={isNum(rank) ? 'By Sharpe ratio, 1 = highest' : undefined}
                />
                <Fact label="Share of portfolio risk" value={isNum(r.risk_contribution) ? formatPct(r.risk_contribution) : <NotComputed />} hint={isNum(r.risk_contribution) ? 'Of total estimated variance' : undefined} />
                <Fact label="Correlation with other picks" value={isNum(r.avg_corr) ? fmtNum(r.avg_corr, 2) : <NotComputed />} hint={isNum(r.avg_corr) ? 'Average, from −1 to 1' : undefined} />
              </dl>
            </li>
          );
        })}
      </ul>

      <WhatThisMeans
        shows="Figures computed for each pick from the estimation-window prices, and how much each pick contributes to the portfolio's estimated risk."
        infer="Which picks carry more of the estimated risk, and which move closely with the others (a higher correlation means less diversification)."
        cannot="That a stock was chosen for one number alone. The optimiser selects the group together, weighing return against how the stocks move as a set, so a stock with a modest score of its own can still be picked because it diversifies the rest. Past figures do not guarantee future results."
      >
        <p>Share of portfolio risk is the stock&apos;s weight times its covariance with the whole portfolio, divided by the portfolio variance; the shares add up to 100%. Correlation is the mean correlation of the stock&apos;s returns with the other picks.</p>
      </WhatThisMeans>
    </div>
  );
}
