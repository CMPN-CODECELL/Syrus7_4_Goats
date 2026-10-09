// Checks a run configuration before it is sent. One place for the rules, used by the wizard (with the stock list,
// so it can also check K against the picks) and by the run provider (without it, for the plain numeric ranges).
import type { Asset, RunRequest } from '../api/types';

export type WizardStep = 1 | 2 | 3 | 4;

export type ConfigField =
  | 'capital' | 'holdings' | 'picks' | 'k' | 'q' | 'sectorCap' | 'sectorFit' | 'target'
  | 'reps' | 'shots' | 'maxiter' | 'seed' | 'qubitCap';

export interface ConfigIssue {
  field: ConfigField;
  /** The wizard step where the user can fix it. */
  step: WizardStep;
  message: string;
}

export const LIMITS = {
  k: { min: 2, max: 15, def: 4 },
  q: { min: 0, max: 1, def: 0.5 },
  sectorCap: { min: 1, max: 5, def: 2 },
  reps: { min: 1, max: 5, def: 2 },
  shots: { min: 256, max: 20000, def: 2048 },
  maxiter: { min: 20, max: 500, def: 80 },
  seed: { def: 7 },
  qubitCap: { min: 8, max: 16, def: 12 },
} as const;

/** Stock symbols the run will use: the picked list, or every stock that has data. */
export function pickedTickers(tickers: string[] | null, assets: Asset[]): string[] {
  return tickers ?? assets.filter((a) => !a.excluded_reason).map((a) => a.ticker);
}

const finite = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x);
const wholeIn = (x: unknown, lo: number, hi: number): x is number => finite(x) && Number.isInteger(x) && x >= lo && x <= hi;

/** Everything that would stop the run. `assets` is optional: without it the stock-list checks are skipped. */
export function validateConfig(config: RunRequest, assets?: Asset[]): ConfigIssue[] {
  const out: ConfigIssue[] = [];
  const add = (field: ConfigField, step: WizardStep, message: string) => out.push({ field, step, message });
  const { k, risk_aversion: q, sector_cap: cap, target_return: target, qaoa, qubit_cap: qubitCap } = config;

  if (!finite(config.capital) || config.capital <= 0) {
    add('capital', 1, 'Enter an investment amount above ₹0.');
  }
  if (!wholeIn(k, LIMITS.k.min, LIMITS.k.max)) {
    add('k', 1, `The number of holdings (K) must be a whole number from ${LIMITS.k.min} to ${LIMITS.k.max}.`);
  }

  if (assets) {
    const picks = pickedTickers(config.tickers, assets);
    if (picks.length < 2) {
      add('picks', 1, `You picked ${picks.length} stock${picks.length === 1 ? '' : 's'}. Pick at least 2.`);
    } else if (finite(k) && k > picks.length) {
      add('picks', 1, `You picked ${picks.length} stocks, so a portfolio of ${k} cannot be built. Add stocks or lower the number of holdings.`);
    } else if (finite(k) && wholeIn(cap, LIMITS.sectorCap.min, LIMITS.sectorCap.max)) {
      const industries = new Set(picks.map((t) => assets.find((a) => a.ticker === t)?.sector ?? t)).size;
      if (cap * industries < k) {
        add('sectorFit', 2, `With at most ${cap} per industry and ${industries} industr${industries === 1 ? 'y' : 'ies'} among your stocks, a portfolio can hold at most ${cap * industries} stocks, fewer than ${k}. Raise the industry limit, add stocks from more industries, or lower the number of holdings.`);
      }
    }
  }

  if (!finite(q) || q < LIMITS.q.min || q > LIMITS.q.max) {
    add('q', 2, 'Risk aversion (q) must be a number from 0 to 1.');
  }
  if (cap !== null && !wholeIn(cap, LIMITS.sectorCap.min, LIMITS.sectorCap.max)) {
    add('sectorCap', 2, `The industry limit must be a whole number from ${LIMITS.sectorCap.min} to ${LIMITS.sectorCap.max}, or off.`);
  }
  if (target !== null && (!finite(target) || target <= 0 || target > 1)) {
    add('target', 2, 'The minimum return must be above 0% and at most 100%.');
  }

  if (!wholeIn(qaoa.reps, LIMITS.reps.min, LIMITS.reps.max)) {
    add('reps', 3, `Circuit depth (p) must be a whole number from ${LIMITS.reps.min} to ${LIMITS.reps.max}.`);
  }
  if (!wholeIn(qaoa.shots, LIMITS.shots.min, LIMITS.shots.max)) {
    add('shots', 3, `Shots must be a whole number from ${LIMITS.shots.min} to ${LIMITS.shots.max.toLocaleString('en-IN')}.`);
  }
  if (!wholeIn(qaoa.maxiter, LIMITS.maxiter.min, LIMITS.maxiter.max)) {
    add('maxiter', 3, `Maximum iterations must be a whole number from ${LIMITS.maxiter.min} to ${LIMITS.maxiter.max}.`);
  }
  if (!finite(qaoa.seed) || !Number.isInteger(qaoa.seed)) {
    add('seed', 3, 'The random seed must be a whole number.');
  }
  if (!wholeIn(qubitCap, LIMITS.qubitCap.min, LIMITS.qubitCap.max)) {
    add('qubitCap', 3, `The qubit cap must be a whole number from ${LIMITS.qubitCap.min} to ${LIMITS.qubitCap.max}.`);
  }
  return out;
}

/** The first message for a field, or undefined. */
export const issueFor = (issues: ConfigIssue[], field: ConfigField): string | undefined =>
  issues.find((i) => i.field === field)?.message;
