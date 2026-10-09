// Reads the "existing holdings" text box: one "SYMBOL shares" per line -> {"TCS.NS": 52}.
import type { Asset } from '../../api/types';

export interface HoldingsParse {
  holdings: Record<string, number>;
  /** One plain-language message per bad line. The run is blocked while this is not empty. */
  errors: string[];
  /** Holdings the run will accept but ignore when it prices transaction costs, with the reason. */
  ignored: string[];
}

export const HOLDINGS_EXAMPLE = 'TCS 52\nINFY 120';

export function parseHoldings(text: string, assets: Asset[], picks: string[]): HoldingsParse {
  const known = new Map(assets.map((a) => [a.ticker, a]));
  const pickSet = new Set(picks);
  const holdings: Record<string, number> = {};
  const errors: string[] = [];
  const ignored: string[] = [];

  text.split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const label = `Line ${i + 1} (“${line}”)`;
    const [sym, count, ...rest] = line.toUpperCase().split(/[\s,:=]+/);
    if (!sym || count === undefined || rest.length > 0) {
      errors.push(`${label}: write a stock symbol and a share count, like “TCS 52”.`);
      return;
    }
    const ticker = sym.includes('.') ? sym : `${sym}.NS`;
    const asset = known.get(ticker);
    if (!asset) {
      errors.push(`${label}: “${sym}” is not a NIFTY 50 symbol. Use symbols such as TCS or INFY.`);
      return;
    }
    const shares = Number(count);
    if (!Number.isInteger(shares) || shares <= 0) {
      errors.push(`${label}: the share count must be a whole number above 0.`);
      return;
    }
    if (ticker in holdings) {
      errors.push(`${label}: ${sym} is listed twice. Combine the shares on one line.`);
      return;
    }
    holdings[ticker] = shares;
    if (asset.excluded_reason) ignored.push(`${asset.symbol} has no usable price data (${asset.excluded_reason}), so it is ignored when costs are priced.`);
    else if (!pickSet.has(ticker)) ignored.push(`${asset.symbol} is not in your stock list, so it is ignored when costs are priced.`);
  });

  return { holdings, errors, ignored };
}
