// Glossary data: one source for the Glossary page, the in-text GlossaryLink and the Method page.
// Facts here mirror the backend (README.md, TEAMS/CONTRACTS.md, qportfolio/*). Numbers in examples are
// arithmetic illustrations and are labelled as such; nothing here is a result of a run.
import { RISK_PROFILES } from './riskProfiles';

export type GlossaryCategory = 'Finance' | 'Optimization' | 'Quantum Computing' | 'Evaluation';

export interface GlossaryTerm {
  /** Kebab-case, unique. The anchor on the Glossary page is `term-{id}`. */
  id: string;
  term: string;
  category: GlossaryCategory;
  /** Plain-language definition for a first-time user. */
  plain: string;
  /** A small worked example. */
  example?: string;
  /** Precise definition, shown in a collapsed "Formal definition" section. */
  formal?: string;
}

export const GLOSSARY_CATEGORIES: readonly GlossaryCategory[] = ['Finance', 'Optimization', 'Quantum Computing', 'Evaluation'];

const profileQs = RISK_PROFILES.map((p) => `${p.label} uses q = ${p.q}`).join(', ');

const TERMS: GlossaryTerm[] = [
  // ---------------------------------------------------------------- Finance
  {
    id: 'expected-return',
    term: 'Expected return',
    category: 'Finance',
    plain: 'The yearly return a portfolio might earn, estimated from how its stocks behaved in the past. It is an estimate, not a promise.',
    example: 'If the stocks in a portfolio averaged +12% a year in the estimation window, its estimated expected return is 12%. Real returns can be higher or lower, and can be negative.',
    formal: 'For each stock, μᵢ is the mean daily log return over the estimation window times 252. For K equal-weight picks the portfolio estimate is μᵀx/K, and net of costs it is μᵀx/K − tc(x). Because it is measured on the same window used to choose the portfolio, it is an in-sample figure.',
  },
  {
    id: 'volatility',
    term: 'Volatility',
    category: 'Finance',
    plain: 'How much a stock or portfolio moves up and down. Higher volatility means bigger swings in both directions. It is one view of risk, not the whole of it.',
    example: 'A portfolio with 20% annualised volatility has yearly returns that often land within about 20 percentage points of their average, and larger moves can happen. It does not cap the possible loss.',
    formal: 'Annualised standard deviation of returns: σᵢ = √(252 × variance of daily log returns). For K equal-weight picks, portfolio volatility is √(xᵀΣx)/K, where Σ is the annualised covariance matrix. It is a historical measure of variability.',
  },
  {
    id: 'sharpe-ratio',
    term: 'Sharpe ratio',
    category: 'Finance',
    plain: 'The return earned above a safe rate, for each unit of volatility. A higher Sharpe ratio means more estimated return for the risk taken.',
    example: 'A stock with a 15% estimated return and 20% volatility, against a 5.57% safe rate: (15% − 5.57%) ÷ 20% = 0.47.',
    formal: '(μᵢ − r_f) / σᵢ with risk-free rate r_f = 5.57%. The screening step ranks stocks by this value on the estimation window. The out-of-sample Sharpe ratio uses the realised annualised return and volatility on the test window.',
  },
  {
    id: 'diversification',
    term: 'Diversification',
    category: 'Finance',
    plain: 'Spreading money across several companies and industries so that no single one decides the outcome. It can reduce the damage from any one stock, but it does not remove risk, and it cannot protect against a whole market falling.',
    example: '₹1,00,000 split equally across 5 stocks is ₹20,000 in each. If one stock falls 30%, the portfolio loses ₹6,000, which is 6%, not 30%.',
    formal: 'Portfolio variance xᵀΣx/K² depends on how stocks move together (the covariances in Σ), not only on each stock alone. Stocks that move less closely together lower it. In this app the sector cap limits how many picks may come from one industry.',
  },
  {
    id: 'portfolio-weight',
    term: 'Portfolio weight',
    category: 'Finance',
    plain: 'The share of your total money held in one stock.',
    example: '₹10,000 of ₹1,00,000 is a 10% weight.',
    formal: 'wᵢ = value of holding i ÷ total portfolio value; weights sum to 100%. This app picks K stocks and gives each the nominal weight 1/K (equal weights). Whole-share rounding makes the actual weights slightly different.',
  },
  {
    id: 'transaction-costs',
    term: 'Transaction costs',
    category: 'Finance',
    plain: 'Charges you pay when you buy or sell shares. They reduce what you keep.',
    example: 'At 0.1187% on purchases, buying ₹50,000 of shares costs about ₹59.35.',
    formal: 'Modelled as tc(x) = lin·x + const, a fraction of capital. A new pick costs the buy rate (0.1187%) divided by K. Selling an existing holding costs the sell rate (0.1037%) times its weight, unless the optimiser keeps it. Not modelled: market impact, bid–ask spread, slippage, capital gains tax and the fixed depository charge per sale.',
  },
  {
    id: 'risk-aversion',
    term: 'Risk aversion (q)',
    category: 'Finance',
    plain: 'A number between 0 and 1 that sets how much the optimiser dislikes risk compared with chasing return. A higher q puts more weight on keeping estimated volatility low. It sets what the optimiser prefers. It does not guarantee how the portfolio will behave.',
    example: `The three risk profiles map to q like this: ${profileQs}.`,
    formal: 'In F(x) = q·xᵀΣx/K² − (1 − q)·(μᵀx/K − tc(x)), q weights estimated variance and 1 − q weights estimated net return. q = 1 ignores return and q = 0 ignores risk. Realised volatility can still differ from the estimate. The request field is risk_aversion, with 0 ≤ q ≤ 1.',
  },
  {
    id: 'annualisation',
    term: 'Annualisation',
    category: 'Finance',
    plain: 'Converting daily figures into yearly ones so that they can be compared.',
    example: 'A stock that averages 0.05% a day has an annualised return of about 12.6% (0.05% × 252).',
    formal: 'Mean daily log return × 252 and daily covariance × 252, where 252 is the assumed number of trading days in a year. Annualised volatility is therefore the daily standard deviation × √252.',
  },
  {
    id: 'adjusted-close',
    term: 'Adjusted close',
    category: 'Finance',
    plain: 'A historical price corrected for stock splits and dividends, so that returns computed from it can be compared across time.',
    example: 'If a stock splits 2-for-1, its raw price halves overnight even though investors lost nothing. Adjusted prices remove that jump.',
    formal: 'Prices come from Yahoo Finance through the yfinance library with auto-adjust on. All returns in this app are computed from these adjusted closes.',
  },
  {
    id: 'whole-shares',
    term: 'Whole shares',
    category: 'Finance',
    plain: 'You can only buy complete shares, so each stock’s amount is rounded down to a whole number of shares and the remainder stays as cash.',
    example: 'With ₹20,000 for a stock priced at ₹3,810.50, you can buy 5 whole shares (₹19,052.50) and ₹947.50 stays as cash.',
    formal: 'shares = floor((capital ÷ K) ÷ price), using the last close in the estimation window. If one share costs more than capital ÷ K, that stock gets zero shares. Leftover cash is capital minus the sum of the whole-share values.',
  },

  // ----------------------------------------------------------- Optimization
  {
    id: 'qubo',
    term: 'QUBO',
    category: 'Optimization',
    plain: 'A constrained choice written as yes/no variables. QUBO stands for Quadratic Unconstrained Binary Optimization: each stock gets a yes/no variable, and one score says how good every combination is. The rules are built into that score as penalties.',
    example: 'With 3 stocks, 1-0-1 means hold stocks 1 and 3 and skip stock 2. A QUBO gives each of the 2³ = 8 combinations a score.',
    formal: 'Minimise E(x) = xᵀQx + cᵀx + const over x ∈ {0,1}^m, where m is the number of stocks plus slack bits (at most 16). Q, c and const come from the objective terms plus a quadratic penalty for each constraint. “Unconstrained” means the rules live inside E as penalties rather than as separate conditions.',
  },
  {
    id: 'objective-function',
    term: 'Objective function',
    category: 'Optimization',
    plain: 'The single score the optimiser tries to make as low as possible. Here it rewards estimated return and penalises risk and costs.',
    example: 'Under the same settings, a portfolio scoring −0.07 beats one scoring −0.03, because lower is better. These numbers are an illustration, not a result.',
    formal: 'F(x) = q·xᵀΣx/K² − (1 − q)·(μᵀx/K − tc(x)). The exact judge computes F without penalties. The QUBO adds penalty terms on top so that solvers are steered away from rule-breaking selections.',
  },
  {
    id: 'constraint',
    term: 'Constraint',
    category: 'Optimization',
    plain: 'A rule a portfolio must obey to count as a valid answer.',
    example: '“Hold exactly 5 stocks” and “no more than 2 from one industry” are constraints.',
    formal: 'Registered constraints: number of holdings Σxᵢ = K; sector cap Σ over a sector of xᵢ ≤ cap; target return μᵀx/K − tc(x) ≥ R. Each is added to the QUBO as a penalty and is also re-checked exactly after solving.',
  },
  {
    id: 'slack-variable',
    term: 'Slack variable',
    category: 'Optimization',
    plain: 'An extra yes/no helper variable that turns an “at most” rule into an exact equation, so the rule can be scored inside a QUBO. Slack variables are not stocks, but each one uses a qubit, so they count against the qubit budget.',
    example: '“At most 2 stocks per industry” uses 2 slack bits per crowded industry. If an industry has 1 pick, the slack bits take up the 1 unused place.',
    formal: 'A sector cap becomes Σ over the sector of xᵢ + Σⱼ wⱼsⱼ = cap with weights 1, 2, 4, …, using ceil(log₂(cap + 1)) bits per sector, and only for sectors with more candidates than the cap. A target return uses 3 slack bits (8 levels). Slack bits are not part of the portfolio.',
  },
  {
    id: 'penalty',
    term: 'Penalty',
    category: 'Optimization',
    plain: 'Extra cost the QUBO adds when a rule is broken, so that breaking a rule scores worse than following it.',
    example: 'If a 6-stock selection breaks “exactly 5”, the penalty is added to its score and it ranks lower.',
    formal: 'Each constraint contributes weight × (violation ÷ scale)². One shared weight is tuned by brute force over the QUBO: it doubles from 0.5 times the spread of feasible objective values until the best infeasible state scores at least halfway between the best and the mean feasible score (Brandhofer et al., Eq. 11). A penalty only discourages violations. Feasibility is still checked exactly.',
  },
  {
    id: 'cardinality',
    term: 'Number of holdings (K)',
    category: 'Optimization',
    plain: 'How many stocks the portfolio holds, also called cardinality. Fewer holdings concentrate your investment. More holdings can spread it across more companies, but they do not make it risk-free.',
    example: 'K = 5 and ₹1,00,000 gives about ₹20,000 per stock.',
    formal: 'The constraint Σxᵢ = K, added as the quadratic penalty A(Σxᵢ − K)². The API accepts 2 ≤ K ≤ 15. With the XY + Dicke mixer the circuit itself keeps the number of picks at K.',
  },
  {
    id: 'sector-cap',
    term: 'Sector cap',
    category: 'Optimization',
    plain: 'A limit on how many of your picks may come from the same industry. It limits how much your portfolio concentrates in one industry.',
    example: 'A sector cap of 2 with K = 5 means at most 2 of the 5 stocks can come from Financial Services.',
    formal: 'Σ over sector s of xᵢ ≤ cap for each sector, encoded with slack bits. Sectors are the NSE industry labels in the NIFTY 50 constituents list, not GICS sectors.',
  },
  {
    id: 'target-return',
    term: 'Target return',
    category: 'Optimization',
    plain: 'An optional minimum estimated return the portfolio must reach after costs. Setting it too high can leave no valid portfolio.',
    example: 'A 12% target asks that the portfolio’s estimated annual return, minus costs, is at least 12%. If no combination of the chosen stocks reaches that, the run reports that no portfolio fits.',
    formal: 'μᵀx/K − tc(x) ≥ R, an estimated in-sample figure. It is encoded with a 3-bit slack and re-checked exactly. It adds 3 qubits, so the budget available to stocks falls by 3 before screening.',
  },
  {
    id: 'convergence',
    term: 'Convergence',
    category: 'Optimization',
    plain: 'When the optimiser’s score stops improving from one iteration to the next. For QAOA the curve plots the average score over iterations. A flat curve suggests the search has settled for this run. It does not prove the best portfolio was found.',
    example: 'If the curve is flat for the last 30 iterations, the optimiser has probably settled, but it may have settled on a local minimum.',
    formal: 'The classical optimiser (COBYLA, Nelder–Mead or SPSA) updates the 2p angles to lower the estimated energy ⟨H⟩. A stable ⟨H⟩ indicates a local optimum of the angle landscape. It is not a global optimum, and it does not mean the sampled portfolios are optimal.',
  },

  // ------------------------------------------------------ Quantum Computing
  {
    id: 'qaoa',
    term: 'QAOA',
    category: 'Quantum Computing',
    plain: 'Quantum Approximate Optimization Algorithm: a quantum–classical loop that searches for good configurations. A circuit with adjustable angles assigns a probability to every possible portfolio, a classical optimiser keeps adjusting the angles to lower the average score, and the finished circuit is measured many times to sample portfolios.',
    example: 'With 12 yes/no variables there are 2¹² = 4,096 combinations. After the loop, measuring the circuit tends to return lower-scoring portfolios more often, but not necessarily the best one.',
    formal: 'p repeated pairs of a cost unitary e^(−iγₖH_C) and a mixer unitary e^(−iβₖH_M) act on an initial state. The energy ⟨H_C⟩ is estimated with Qiskit’s StatevectorEstimator, a classical optimiser updates the 2p angles, and the final samples come from StatevectorSampler. This app simulates the circuit on a classical computer. There is no run on real quantum hardware.',
  },
  {
    id: 'qubit',
    term: 'Qubit',
    category: 'Quantum Computing',
    plain: 'The quantum counterpart of a bit. Here each qubit stands for one yes/no variable: either a stock (hold or skip) or a slack bit. The number of qubits limits how large a problem can be simulated, because the cost roughly doubles with each extra qubit.',
    example: '12 stocks plus 4 slack bits need 16 qubits.',
    formal: 'n qubits span 2ⁿ basis states, and a statevector simulation stores 2ⁿ amplitudes. This app caps the total at 16 (the size of the FakeGuadalupeV2 fake backend). The default cap is 12.',
  },
  {
    id: 'mixer',
    term: 'Mixer',
    category: 'Quantum Computing',
    plain: 'The part of the circuit that moves probability from one candidate portfolio to others so the search can explore. The standard mixer flips each stock independently. The XY mixer swaps picks between stocks and keeps the number of holdings fixed.',
    example: 'From {A, B, C}, an XY step may swap C for D and give {A, B, D}, still 3 stocks. A standard step might switch D on as well and give 4 stocks, which the penalty has to discourage.',
    formal: 'Standard: X rotations on every qubit, with rules enforced by penalties only. XY + Dicke: start in the Dicke state (an equal superposition of all selections with exactly K stocks), use an XXPlusYYGate ring mixer on the stock qubits and an X mixer on the slack qubits, which preserves the number of selected stocks. Sector cap and target return are still handled by penalties and re-checked exactly.',
  },
  {
    id: 'circuit-depth',
    term: 'Circuit depth',
    category: 'Quantum Computing',
    plain: 'How many sequential layers of operations the circuit needs. Deeper circuits take longer to run and, on real devices, collect more errors.',
    example: 'A circuit reported with depth 96 needs 96 sequential steps, even if several operations run side by side in each step.',
    formal: 'The length of the longest path of gates through the (transpiled) circuit, reported together with the two-qubit gate count. Noise grows with both. It is not the same as the QAOA depth p, which counts repetitions of the cost-and-mixer pair.',
  },
  {
    id: 'qaoa-depth',
    term: 'QAOA depth (p)',
    category: 'Quantum Computing',
    plain: 'How many times the cost-and-mixer pair is repeated. More repeats give the circuit more freedom to shape the probabilities, but also more angles to tune and a longer circuit. More is not always better.',
    example: 'p = 2 repeats the pair twice and has 4 angles to tune (two per repeat).',
    formal: 'p is between 1 and 5 in this app, with 2p angles γ₁…γₚ and β₁…βₚ. Whether more depth helps is measured in the benchmark studies on the Evidence tab, not assumed.',
  },
  {
    id: 'bitstring',
    term: 'Bitstring',
    category: 'Quantum Computing',
    plain: 'A row of 0s and 1s, one per yes/no variable. For stocks, 1 means hold and 0 means skip. Each bitstring is one candidate portfolio.',
    example: 'With 8 stocks, 10100110 means hold stocks 1, 3, 6 and 7.',
    formal: 'In the app’s data and charts the first character is the first stock (asset order, leftmost). Qiskit reports counts with qubit 0 on the right, so the engine reverses them before they leave the quantum module. Bitstrings cover the stock bits only.',
  },
  {
    id: 'shots',
    term: 'Shots',
    category: 'Quantum Computing',
    plain: 'How many times the finished circuit is run and measured to collect samples. More shots give a steadier estimate of how often each portfolio appears.',
    example: 'With 4,096 shots, a portfolio that appears 410 times has an estimated probability of about 10%.',
    formal: 'The API accepts 256 to 20,000 shots. Measured frequencies are estimates with sampling noise of order √(p(1 − p) ÷ shots).',
  },
  {
    id: 'warm-start',
    term: 'Warm start',
    category: 'Quantum Computing',
    plain: 'Starting the optimiser from angles that already worked for a smaller version of the circuit, instead of from scratch.',
    example: 'A depth-3 run that begins from the stretched-out depth-2 angles found by the same method.',
    formal: 'INTERP interpolates QAOA’s own optimal depth p − 1 angles. No classical solution is ever placed in the circuit. INTERP is the only warm start, and it is labelled wherever it is used.',
  },
  {
    id: 'noise-model',
    term: 'Noise model',
    category: 'Quantum Computing',
    plain: 'A simulation of the errors that real quantum hardware makes. Turning it on shows how errors would affect the sampled portfolios.',
    example: 'With noise on, the share of samples that obey every rule can fall sharply compared with the noiseless run.',
    formal: 'FakeGuadalupeV2 through Aer’s NoiseModel.from_backend, transpiled at optimisation level 1. Angles are optimised without noise, then the same angles are sampled ideally and with noise, and both sets of metrics are reported. It models a device. It is not a run on a real device.',
  },

  // ------------------------------------------------------------- Evaluation
  {
    id: 'exact-optimum',
    term: 'Exact optimum',
    category: 'Evaluation',
    plain: 'The best portfolio that obeys every rule, found by checking all allowed combinations (brute force).',
    example: 'Choosing 5 stocks from 12 gives 792 combinations. Checking them all and discarding those that break a rule leaves the exact optimum.',
    formal: 'min F(x) over feasible x, from the brute-force solver over every K-subset. It is available because the problem has at most 16 variables. It is the reference for the approximation ratio and P(optimum). It is exact for the screened short list, not necessarily for the whole NIFTY 50.',
  },
  {
    id: 'feasibility',
    term: 'Feasibility',
    category: 'Evaluation',
    plain: 'Whether a portfolio obeys every rule you set. A feasible portfolio is not necessarily the best one. The optimal portfolio is the best feasible one.',
    example: 'With K = 5, an answer that holds 6 stocks is infeasible. An answer with 5 stocks that obeys the sector cap but scores slightly worse than the best is feasible but not optimal.',
    formal: 'Judged only by Problem.evaluate, the single exact judge. It recomputes the objective, return, variance and costs, and checks the number of holdings, the sector cap and the target return. No solver’s own feasibility flag is trusted, and no repair is applied.',
  },
  {
    id: 'approximation-ratio',
    term: 'Approximation ratio',
    category: 'Evaluation',
    plain: 'How close the sampled portfolios are to the best possible, on a scale where 1 means always the exact optimum.',
    example: 'An illustration: 0.83 means the average sample sits 83% of the way from the worst feasible portfolio to the best. Samples that break a rule count as 0.',
    formal: 'For a feasible sample, r = (F_max − F) ÷ (F_max − F_min), using the brute-force feasible landscape. Infeasible samples count as 0. The ratio is the probability-weighted mean of r. It depends on the range of that landscape, so it is not comparable between different instances.',
  },
  {
    id: 'p-optimum',
    term: 'P(optimum)',
    category: 'Evaluation',
    plain: 'The chance that one measurement of the circuit returns the exact optimum portfolio. Compare it with the chance of picking the optimum by luck.',
    example: 'If 252 portfolios are feasible, a uniform-random pick hits the optimum with probability 1/252, about 0.4%. A P(optimum) well above 0.4% beats random guessing on that instance.',
    formal: 'P(optimum) is the total probability of sampled bitstrings whose objective equals the brute-force minimum (within 1e-9). The baseline p_random = 1 ÷ (number of feasible portfolios) is the probability that one uniform draw from the feasible set is optimal. Beating random guessing says nothing about beating brute force, which finds the optimum exactly.',
  },
  {
    id: 'classical-baseline',
    term: 'Classical baseline',
    category: 'Evaluation',
    plain: 'A standard non-quantum method run on the same data, rules and short list, so QAOA is judged against something.',
    example: 'Brute force (exact), relaxation with rounding, and simulated annealing.',
    formal: 'Brute force checks every K-subset. Relaxation solves a continuous convex version with CVXPY and then rounds to the top K, reporting the rule with no hidden repair. Simulated annealing runs seeded single-flip Metropolis moves on the same QUBO, slack bits included.',
  },
  {
    id: 'estimation-window',
    term: 'Estimation window',
    category: 'Evaluation',
    plain: 'The past period used to estimate returns and risk and to choose the portfolio: 2023-10-01 to 2025-09-30.',
    example: 'Expected returns and risk come only from these dates, so nothing after 2025-09-30 can influence the choice.',
    formal: 'Returns, covariance, the pre-screen and the prices used for whole-share counts use this window only. A test checks that no later data leaks in.',
  },
  {
    id: 'test-window',
    term: 'Test window',
    category: 'Evaluation',
    plain: 'A later period kept aside to check how the chosen portfolio would have done: 2025-10-01 to 2026-09-30. It is not used to choose the portfolio.',
    example: 'A portfolio picked from 2023–2025 data is replayed over 2025-10-01 to 2026-09-30 and compared with the NIFTY 50 index.',
    formal: 'Out-of-sample annualised return, volatility, Sharpe ratio and maximum drawdown of the equal-weight buy-and-hold selection, with no rebalancing, against ^NSEI. One window is a leakage check, not evidence of skill.',
  },
  {
    id: 'snapshot-date',
    term: 'Snapshot date',
    category: 'Evaluation',
    plain: 'The date of the latest prices in the stored price data the app is using. It is different from the estimation and test windows.',
    example: 'The estimation window can end in September 2025 while the snapshot holds prices up to October 2026.',
    formal: 'The data source is reported as “snapshot” (the checked-in file), “cache” or “live”, together with the last date in the data (as_of). The app shows it in the data banner and on results.',
  },
  {
    id: 'out-of-sample',
    term: 'Out-of-sample',
    category: 'Evaluation',
    plain: 'Results measured on data that was not used to choose the portfolio. They are a fairer check than in-sample numbers, but they cover only one period.',
    example: 'Choosing on 2023–2025 data and then measuring on 2025–2026 data.',
    formal: 'In-sample figures (estimated return and volatility on the estimation window) were available when the portfolio was chosen, so they flatter the choice. The out-of-sample result here covers one year. It is a leakage check, not evidence of skill.',
  },
  {
    id: 'survivorship-bias',
    term: 'Survivorship bias',
    category: 'Evaluation',
    plain: 'Applying today’s list of companies to the past, which leaves out companies that dropped out of the index. This can make past results look better than they were.',
    example: 'A stock added to the NIFTY 50 in 2025 appears in a 2024 analysis as if it had always been a member.',
    formal: 'The app uses the current NIFTY 50 constituents for all past dates, not point-in-time membership. The bias is stated, not corrected.',
  },
];

/** Alphabetical by term, so the page reads like a dictionary. */
export const GLOSSARY: GlossaryTerm[] = [...TERMS].sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }));

const byId = new Map(GLOSSARY.map((t) => [t.id, t]));
export const findTerm = (id: string): GlossaryTerm | undefined => byId.get(id);

/** Where a link to a term goes. The Glossary tab reads this hash and scrolls to `#term-{id}`. */
export const glossaryHref = (id: string) => `#glossary/term-${id}`;

/** The term id in a location hash such as `#glossary/term-qubo`, or null. */
export function glossaryIdFromHash(hash: string): string | null {
  const m = /^#glossary\/term-([a-z0-9-]+)$/.exec(hash);
  return m ? m[1] : null;
}

/** Case-insensitive match of every whitespace-separated word against the term and all of its text. */
export function matchesQuery(t: GlossaryTerm, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const hay = `${t.term} ${t.category} ${t.plain} ${t.example ?? ''} ${t.formal ?? ''}`.toLowerCase();
  return words.every((w) => hay.includes(w));
}
