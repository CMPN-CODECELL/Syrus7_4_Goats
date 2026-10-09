// Single source of truth: beginner risk profiles -> the real `risk_aversion` (q) sent to the solver.
// The objective is F(x) = q·Var − (1−q)·(Return − costs), so a higher q weights estimated variance more.
// A profile changes the objective's weighting only. It does not guarantee lower realised risk.
export type RiskProfileId = 'lower' | 'balanced' | 'growth';

export interface RiskProfile {
  id: RiskProfileId;
  label: string;
  description: string;
  q: number;
}

export const RISK_PROFILES: RiskProfile[] = [
  { id: 'lower', label: 'Lower risk', q: 0.8,
    description: 'Prefer a portfolio with lower estimated return volatility, even if it gives up some expected return.' },
  { id: 'balanced', label: 'Balanced', q: 0.5,
    description: 'Balance estimated return against portfolio risk.' },
  { id: 'growth', label: 'Higher growth potential', q: 0.2,
    description: 'Prioritize estimated return while accepting the possibility of greater fluctuations.' },
];

/** The profile whose q matches exactly, or null when Research mode has set a custom q. */
export const profileForQ = (q: number) => RISK_PROFILES.find((p) => Math.abs(p.q - q) < 1e-9) ?? null;
