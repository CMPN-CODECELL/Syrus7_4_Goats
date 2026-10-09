import type { ReactNode } from 'react';
import { GlossaryLink } from '../components/Glossary';
import { Section, WhatThisMeans } from '../components/ui';
import { RISK_PROFILES } from '../lib/riskProfiles';

// ---------------------------------------------------------------------------------------------------------------
// Small building blocks for the technical details.
// ---------------------------------------------------------------------------------------------------------------

/** Wrapper for the text inside a step's "Technical details". */
const Tech = ({ children }: { children: ReactNode }) => (
  <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted">{children}</div>
);

const Bullets = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <ul role="list" className={`list-disc space-y-1.5 pl-5 ${className}`}>{children}</ul>
);

/** A scrollable, keyboard-focusable block for a formula, so it never clips on a phone. */
const Formula = ({ label, children }: { label: string; children: ReactNode }) => (
  <div
    role="region"
    aria-label={label}
    tabIndex={0}
    className="overflow-x-auto whitespace-nowrap border border-line bg-bg p-3 font-mono text-sm text-text"
  >
    {children}
  </div>
);

/** Term / explanation pairs. */
const Defs = ({ items }: { items: [ReactNode, ReactNode][] }) => (
  <dl className="space-y-2">
    {items.map(([dt, dd], i) => (
      <div key={i}>
        <dt className="text-text">{dt}</dt>
        <dd>{dd}</dd>
      </div>
    ))}
  </dl>
);

const num = (n: number) => String(+n.toFixed(4)); // 1 − 0.8 -> "0.2", not 0.19999999999999996

// ---------------------------------------------------------------------------------------------------------------
// The pipeline. Plain language first (four parts), technical details folded below.
// ---------------------------------------------------------------------------------------------------------------

interface Step {
  id: string;
  title: string;
  tagline: string;
  inputs: ReactNode;
  happens: ReactNode;
  outputs: ReactNode;
  why: ReactNode;
  technical: ReactNode;
}

const STEPS: Step[] = [
  {
    id: 'market-data',
    title: 'Market data',
    tagline: 'Prices become return and risk estimates.',
    inputs: 'Daily prices for the NIFTY 50 stocks, plus the NIFTY 50 index as a yardstick.',
    happens: 'Prices are turned into daily returns. Each stock’s average return, and how every pair of stocks moves together, are measured over a fixed past period (the estimation window) and scaled to a yearly figure. Stocks with too many gaps are left out.',
    outputs: 'For each stock, an estimated yearly return and volatility, plus a table of how the stocks move together.',
    why: 'The optimiser needs numbers for return and risk. Measuring them on a past window only keeps the later test window honest.',
    technical: (
      <Tech>
        <Defs
          items={[
            ['Source', <>Yahoo Finance through the yfinance library, <GlossaryLink id="adjusted-close">adjusted close</GlossaryLink> prices. Runs read a stored snapshot (or cache) of those prices, so they work offline. The data banner and the results show the <GlossaryLink id="snapshot-date">snapshot date</GlossaryLink>.</>],
            ['Estimation window', <>2023-10-01 to 2025-09-30. Used for returns, risk, screening and the prices behind whole-share counts. See <GlossaryLink id="estimation-window">estimation window</GlossaryLink>.</>],
            ['Test window', <>2025-10-01 to 2026-09-30. Used only to score the finished portfolio. A test enforces that nothing from it leaks into the estimates. See <GlossaryLink id="test-window">test window</GlossaryLink>.</>],
            ['Annualisation', <>Daily log returns. μ is the mean × 252 and Σ is the covariance × 252, where 252 is the assumed number of trading days. Σ is symmetrised and checked to be positive semi-definite. See <GlossaryLink id="annualisation">annualisation</GlossaryLink>.</>],
            ['Missing data', 'A stock missing more than 5% of its estimation-window prices is excluded, and the reason is reported. Gaps of up to 3 days are forward-filled, and the count is reported. A day that still has a missing return is dropped for every stock, so all stocks are measured on the same dates.'],
            ['Excluded by default', 'TMPV.NS, because a demerger on 2025-10-14 breaks its price series in the test window.'],
            ['Survivorship note', <>Today’s NIFTY 50 list is applied to past dates, so stocks that joined recently appear in older periods and stocks that left are absent. This is stated, not corrected. See <GlossaryLink id="survivorship-bias">survivorship bias</GlossaryLink>.</>],
          ]}
        />
      </Tech>
    ),
  },
  {
    id: 'stock-screening',
    title: 'Stock screening',
    tagline: 'Many stocks become a short list.',
    inputs: 'The stocks you chose, how many to hold (K), the sector cap and the qubit budget.',
    happens: 'If the problem would need more qubits than the budget allows, the stocks are ranked by Sharpe ratio on the estimation window and the best are kept. If everything already fits, nothing is dropped. Every method receives the same short list.',
    outputs: 'A short list of stocks and a plain-language rule saying what was kept and what was dropped.',
    why: 'The quantum simulation roughly doubles in cost for every extra qubit. A short list keeps the run small enough to finish.',
    technical: (
      <Tech>
        <Defs
          items={[
            ['Ranking rule', <>(μᵢ − r_f) ÷ σᵢ, the <GlossaryLink id="sharpe-ratio">Sharpe ratio</GlossaryLink> with risk-free rate r_f = 5.57%, on the estimation window only. Highest first.</>],
            ['Qubit budget', <>Each stock takes one <GlossaryLink id="qubit">qubit</GlossaryLink> and each <GlossaryLink id="slack-variable">slack bit</GlossaryLink> takes one more. The default budget is 12 qubits and the maximum is 16, the size of the FakeGuadalupeV2 fake backend. A higher budget keeps more stocks but takes longer. The screen runs only when stocks plus slack bits exceed the budget.</>],
            ['With a sector cap', 'The screen keeps at most (cap + 1) stocks per sector, then drops the lowest-ranked stocks until stocks plus slack bits fit the budget.'],
            ['With a target return', 'The budget used by the screen is reduced by 3, to leave room for the return constraint’s 3 slack bits.'],
            ['Example', '12 stocks where two sectors have more candidates than a cap of 2 need 12 + 2 × 2 = 16 qubits.'],
            ['If too few stocks fit', 'If fewer than K stocks fit the budget, the run stops with an explanation. Your settings are not changed behind your back.'],
            ['Limitation', 'The screen ranks by past Sharpe ratio, so it can drop a stock that belongs in the best portfolio of the whole universe. Every method solves the short-listed problem, so “exact optimum” means exact for the short list.'],
          ]}
        />
      </Tech>
    ),
  },
  {
    id: 'portfolio-formulation',
    title: 'Portfolio formulation',
    tagline: 'Goals and rules become one score.',
    inputs: 'Return and risk estimates, K, your risk preference (q), the sector cap, an optional target return and optional existing holdings.',
    happens: (
      <>
        Each stock gets one yes/no variable: 1 means hold it, 0 means skip it. Your goal becomes a single score to minimise, where lower is better. Rules such as “exactly K stocks” become penalties on that score, and “at most” rules need extra helper variables called slack variables. Written this way the problem is a <GlossaryLink id="qubo">QUBO</GlossaryLink>: a constrained choice written as yes/no variables.
      </>
    ),
    outputs: 'A QUBO: a score for every yes/no combination, using at most 16 variables.',
    why: 'One score and one set of rules lets every method be compared fairly.',
    technical: (
      <Tech>
        <p>The score to minimise is the <GlossaryLink id="objective-function">objective function</GlossaryLink>, with xᵢ = 1 if stock i is held:</p>
        <Formula label="Objective function">F(x) = q·xᵀΣx/K² − (1 − q)·(μᵀx/K − tc(x))</Formula>
        <Defs
          items={[
            [<>xᵀΣx/K²</>, 'The estimated risk: the variance of an equal-weight portfolio of the stocks held. It is multiplied by q.'],
            [<>μᵀx/K</>, 'The estimated annual return of that portfolio: the average of the held stocks’ μ.'],
            [<>tc(x)</>, <>The <GlossaryLink id="transaction-costs">transaction cost</GlossaryLink> as a fraction of your money, subtracted from the return.</>],
            [<>q</>, <>The <GlossaryLink id="risk-aversion">risk aversion</GlossaryLink>, from 0 to 1. A higher q puts more weight on keeping estimated risk low, and 1 − q is the weight on estimated net return.</>],
            [<>K</>, <>The <GlossaryLink id="cardinality">number of holdings</GlossaryLink>. Every held stock gets the weight 1/K.</>],
          ]}
        />
        <p className="text-text">Rules in the QUBO</p>
        <Bullets>
          <li>Number of holdings: Σxᵢ = K, as the penalty A(Σxᵢ − K)². No slack bits are needed.</li>
          <li>Sector cap: the picks in a sector plus its slack bits equal the cap. Each sector with more candidates than the cap gets ceil(log₂(cap + 1)) slack bits, so a cap of 2 uses 2 bits per crowded sector.</li>
          <li>Target return: μᵀx/K − tc(x) ≥ R, using 3 slack bits (8 levels). It adds 3 qubits.</li>
          <li>Transaction cost: part of the score, with no penalty. Buying a new stock costs 0.1187% ÷ K of your money. Keeping an existing holding avoids its sale cost (0.1037% of its weight).</li>
        </Bullets>
        <p>
          Penalty weights are tuned by brute force over the QUBO (at most 65,536 states). One shared weight starts at half the spread of feasible scores and doubles until the best rule-breaking state scores at least halfway between the best and the average feasible score. A <GlossaryLink id="penalty">penalty</GlossaryLink> only discourages rule-breaking. Feasibility is still re-checked exactly in the validation step.
        </p>
        <p>Total variables = stocks + slack bits, at most 16. μ and Σ are historical estimates, so the score describes the past, not a forecast.</p>
      </Tech>
    ),
  },
  {
    id: 'optimization',
    title: 'Optimization',
    tagline: 'Several methods search for good picks.',
    inputs: 'The QUBO from the previous step.',
    happens: (
      <>
        <GlossaryLink id="qaoa">QAOA</GlossaryLink> is a quantum–classical loop that searches for good configurations. A circuit with adjustable angles assigns a probability to every combination, a classical optimiser keeps adjusting the angles to lower the average score, and the finished circuit is measured many times to sample portfolios. Three classical methods (brute force, relaxation with rounding, and simulated annealing) solve the same problem for comparison.
      </>
    ),
    outputs: 'From QAOA, a list of sampled portfolios with how often each appeared. From each classical method, one portfolio.',
    why: 'Putting the methods side by side on the same instance shows how well each does. It does not assume the quantum one is best.',
    technical: (
      <Tech>
        <Defs
          items={[
            ['The QAOA loop', <>The circuit repeats a cost layer and a mixer layer p times (<GlossaryLink id="qaoa-depth">depth p</GlossaryLink>, 1 to 5). Qiskit’s StatevectorEstimator gives the average score. A classical optimiser (COBYLA, Nelder–Mead or SPSA) tunes the 2p angles. Then StatevectorSampler draws the <GlossaryLink id="shots">shots</GlossaryLink> (256 to 20,000). The circuit is simulated on a classical computer. No real quantum hardware is used.</>],
            ['Standard mixer', 'An X rotation on every qubit. Samples can hold any number of stocks, so the rules are enforced by penalties only.'],
            ['XY + Dicke mixer', <>Starts in the Dicke state, an equal superposition of every selection with exactly K stocks, and uses an XY ring <GlossaryLink id="mixer">mixer</GlossaryLink> that swaps picks between stocks. The number of holdings stays at K by construction. Sector cap and target return are still handled by penalties. Slack qubits get an X mixer.</>],
            ['Starting angles', <>Random (seeded), a linear ramp, or INTERP, a <GlossaryLink id="warm-start">warm start</GlossaryLink> that reuses QAOA’s own optimal angles from depth p − 1. No classical answer is ever placed in the circuit, and INTERP is labelled wherever it is used.</>],
            ['Noise (optional)', <>A <GlossaryLink id="noise-model">noise model</GlossaryLink> of the FakeGuadalupeV2 device is applied to the final sampling only. The angles are optimised without noise.</>],
            ['Brute force', 'Checks every K-subset and keeps the best that obeys the rules. It is exact, and it also supplies the full picture of feasible scores used by the metrics. It is practical here because the problem has at most 16 variables.'],
            ['Relaxation + rounding', 'Lets each yes/no variable take any value from 0 to 1, solves that smooth problem with CVXPY, then keeps the K largest values. The rounding rule is reported and no hidden repair is applied, so the rounded answer can break a rule.'],
            ['Simulated annealing', 'A seeded random search that flips one variable at a time on the same QUBO, slack bits included, accepting worse moves less and less often as it cools.'],
          ]}
        />
        <p>See <GlossaryLink id="classical-baseline">classical baseline</GlossaryLink>. Research mode shows each QAOA setting with its range and default.</p>
      </Tech>
    ),
  },
  {
    id: 'validation',
    title: 'Validation',
    tagline: 'One exact judge checks every answer.',
    inputs: 'Every candidate portfolio from every method.',
    happens: 'A single exact checker recomputes each portfolio’s return, risk, costs and rule violations. There is no repair: a portfolio that breaks a rule is reported as infeasible and never quietly fixed, and if QAOA samples no valid portfolio the app says it found none. QAOA is then compared with the exact optimum and with a uniform-random baseline, which picks a valid portfolio at random.',
    outputs: 'For each method: whether it obeys the rules (with reasons if not) and its score. For QAOA also how close it got and how often it hit the exact optimum compared with chance.',
    why: 'A method should get credit only for answers that obey the rules, and its success should be measured against a fair yardstick.',
    technical: (
      <Tech>
        <Defs
          items={[
            ['The judge', <>Problem.evaluate recomputes the score, return, variance and costs, and checks the number of holdings, the sector cap and the target return. Every solver and every metric uses it, and nobody re-implements <GlossaryLink id="feasibility">feasibility</GlossaryLink>.</>],
            ['Reported QAOA portfolio', 'The best feasible bitstring among the samples. If no sample is feasible, the selection is empty and shown as such.'],
            ['Approximation ratio', <>For a feasible sample, (F_max − F) ÷ (F_max − F_min) over the feasible scores, and 0 for an infeasible sample. The <GlossaryLink id="approximation-ratio">approximation ratio</GlossaryLink> is the probability-weighted average.</>],
            ['P(optimum) and chance', <><GlossaryLink id="p-optimum">P(optimum)</GlossaryLink> is the total probability of sampling the exact optimum. The uniform-random baseline is 1 ÷ (number of feasible portfolios), the chance that one random valid portfolio is the optimum.</>],
            ['Role of brute force', <>It supplies the <GlossaryLink id="exact-optimum">exact optimum</GlossaryLink> for scoring and for tuning penalty weights. It is never placed in the circuit as a starting state.</>],
            ['Written verdict', 'The verdict text is generated from these computed values. By test, it may not contain “advantage”, “outperforms classical” or “quantum speedup”.'],
          ]}
        />
      </Tech>
    ),
  },
  {
    id: 'final-allocation',
    title: 'Final allocation',
    tagline: 'Picks become whole shares.',
    inputs: 'The chosen stocks, your investment amount and each stock’s price.',
    happens: 'Each chosen stock gets an equal share of your money (amount ÷ K). The app buys as many whole shares as that share can pay for, rounding down, and whatever is left stays as cash.',
    outputs: 'Shares, price and value for each stock, the total invested, the leftover cash, and a test of how the portfolio would have done in the test window.',
    why: 'You cannot buy part of a share, and the test shows how the choice behaved on data it had never seen.',
    technical: (
      <Tech>
        <Defs
          items={[
            ['Shares', <>floor((amount ÷ K) ÷ price), using the last close in the estimation window. A stock whose single share costs more than amount ÷ K gets zero shares. See <GlossaryLink id="whole-shares">whole shares</GlossaryLink>.</>],
            ['Weights', <>Every pick has the nominal <GlossaryLink id="portfolio-weight">weight</GlossaryLink> 1/K. The actual weights differ slightly after rounding. QAOA chooses stocks only. It does not optimise weights.</>],
            ['Costs', <>Buying costs 0.1187% and selling costs 0.1037% of the amount traded. These add delivery-trade STT, exchange charge, SEBI fee, stamp duty (buy only) and GST, and assume zero brokerage. They enter the score as a fraction of your money. Not modelled: market impact, bid–ask spread, slippage, capital gains tax and the fixed depository charge per sale.</>],
            ['Leftover cash', 'Amount minus the value of the whole shares. It is a rounding remainder. The modelled costs are reported separately and are not taken out of it.'],
            ['Price date', 'Prices are the last close in the estimation window. They are not live prices, so check current prices before trading.'],
            ['Out-of-sample test', <>An equal-weight buy-and-hold of the picks over the test window with no rebalancing, compared with the NIFTY 50 index: annualised return, volatility, Sharpe ratio (risk-free rate 5.57%) and maximum drawdown. One window is a leakage check, not evidence of skill. See <GlossaryLink id="out-of-sample">out-of-sample</GlossaryLink>.</>],
          ]}
        />
      </Tech>
    ),
  },
];

const jumpTo = (id: string) => {
  const el = document.getElementById(`step-${id}`);
  if (!el) return;
  el.scrollIntoView({ block: 'start' });
  el.focus({ preventScroll: true });
};

/** Six connected steps: horizontal from the lg breakpoint up, a vertical rail below it. */
function PipelineOverview() {
  return (
    <nav aria-label="Pipeline overview" className="mt-6">
      <ol role="list" className="flex flex-col lg:grid lg:grid-cols-6">
        {STEPS.map((s, i) => (
          <li key={s.id} className="flex gap-4 lg:block lg:pr-2">
            <div className="flex flex-col items-center lg:flex-row">
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center border border-text font-mono text-sm text-text">
                {i + 1}
              </span>
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="my-1 min-h-6 w-px flex-1 bg-line-strong lg:mx-2 lg:my-0 lg:h-px lg:min-h-0 lg:w-auto" />
              )}
            </div>
            <div className="pb-6 lg:mt-3 lg:pb-0">
              <button
                type="button"
                onClick={() => jumpTo(s.id)}
                className="min-h-[44px] text-left font-display text-lg font-light uppercase leading-tight tracking-[0.04em] text-text underline-offset-4 hover:underline lg:min-h-0"
              >
                {s.title}
              </button>
              <p className="mt-1 text-sm text-muted">{s.tagline}</p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const parts: [string, ReactNode][] = [
    ['Inputs', step.inputs],
    ['What happens', step.happens],
    ['Outputs', step.outputs],
    ['Why it’s needed', step.why],
  ];
  return (
    <li
      id={`step-${step.id}`}
      tabIndex={-1}
      aria-labelledby={`step-${step.id}-title`}
      className="scroll-mt-24 border border-line bg-surface"
    >
      <div className="flex items-center gap-3 border-b border-line p-4">
        <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center border border-text font-mono text-sm text-text">{index + 1}</span>
        <h3 id={`step-${step.id}-title`} className="text-xl">{step.title}</h3>
      </div>
      <dl className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {parts.map(([label, body]) => (
          <div key={label} className="bg-surface p-4">
            <dt className="font-mono text-xs uppercase tracking-[0.08em] text-muted">{label}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-text">{body}</dd>
          </div>
        ))}
      </dl>
      <details className="border-t border-line px-4 pb-4">
        <summary className="cursor-pointer py-3 text-sm text-text">Technical details</summary>
        {step.technical}
      </details>
    </li>
  );
}

// ---------------------------------------------------------------------------------------------------------------

export function Method() {
  return (
    <div>
      <Section
        id="pipeline"
        eyebrow="Method"
        title="From prices to a portfolio"
        lead="Six steps turn market prices into a shortlist of stocks, then into a whole-share portfolio. Each step is explained in plain words first, with technical details folded underneath. This is an educational tool. It is not investment advice, and nothing here is guaranteed."
      >
        <PipelineOverview />
      </Section>

      <Section
        id="pipeline-steps"
        eyebrow="Pipeline in detail"
        title="The six steps"
        lead="Open Technical details under any step for the formulas, rules and settings."
      >
        <ol role="list" className="space-y-6">
          {STEPS.map((s, i) => <StepCard key={s.id} step={s} index={i} />)}
        </ol>
      </Section>

      <Section
        id="quantum-role"
        eyebrow="Honest scope"
        title="What quantum does and doesn’t do here"
        lead="Read this before reading any result."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-line bg-surface p-4">
            <h3 className="text-xl">What it does</h3>
            <Bullets className="mt-3 text-sm leading-relaxed text-muted">
              <li>Runs <GlossaryLink id="qaoa">QAOA</GlossaryLink>, a real quantum algorithm, as a simulation on a classical computer. An optional noise model imitates a device. No real quantum hardware is used.</li>
              <li>Samples candidate portfolios from the circuit. The reported QAOA portfolio is the best feasible sample, as judged by the exact checker.</li>
              <li>Reports, from computed values, how often it found the exact optimum compared with chance and with the classical methods.</li>
            </Bullets>
          </div>
          <div className="border border-line bg-surface p-4">
            <h3 className="text-xl">What it does not do</h3>
            <Bullets className="mt-3 text-sm leading-relaxed text-muted">
              <li>It does not automatically give a better portfolio. At this size brute force finds the exact optimum, so QAOA can at best match it. If brute force is quick and QAOA only matches it, the results say so.</li>
              <li>It claims no quantum advantage, no speed-up and no scalability. A problem with at most 16 variables says nothing about larger ones.</li>
              <li>It does not forecast returns, choose weights or guarantee any outcome. It does not repair infeasible samples or start from a classical answer.</li>
            </Bullets>
          </div>
        </div>
        <WhatThisMeans
          shows="A simulated QAOA run, sampled and judged by the same exact checker as the classical methods, on the same instance."
          infer="How often, on this instance, the circuit finds the exact optimum compared with random chance and with the classical baselines."
          cannot="That quantum is faster or better than classical methods, or that results on a small instance carry over to larger ones."
        >
          The precomputed benchmark studies on the Evidence tab report neutral and negative results next to positive ones, with their settings and sample sizes.
        </WhatThisMeans>
      </Section>

      <Section
        id="risk-profiles"
        eyebrow="Parameter mapping"
        title="Risk profiles and q"
        lead={<>Each risk profile sets the <GlossaryLink id="risk-aversion">risk aversion</GlossaryLink> q (the request field risk_aversion) that the optimiser receives. The same q is used in Simple and Research mode. Research mode lets you set any q from 0 to 1.</>}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Risk profile, the q it sends, and the weights it gives risk and return in the objective function</caption>
            <thead>
              <tr className="border-b border-line-strong text-left">
                <th scope="col" className="py-2 pr-3 text-left">Profile</th>
                <th scope="col" className="px-3 py-2 text-right">q (weight on risk)</th>
                <th scope="col" className="py-2 pl-3 text-right">1 − q (weight on return)</th>
              </tr>
            </thead>
            <tbody>
              {RISK_PROFILES.map((p) => (
                <tr key={p.id} className="border-b border-line align-top">
                  <th scope="row" className="py-3 pr-3 text-left font-normal">
                    <span className="block font-sans text-base text-text">{p.label}</span>
                    <span className="mt-1 block font-sans text-sm text-muted">{p.description}</span>
                  </th>
                  <td className="px-3 py-3 text-right tabular-nums text-text">{num(p.q)}</td>
                  <td className="py-3 pl-3 text-right tabular-nums text-text">{num(1 - p.q)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <WhatThisMeans
          shows="How each profile weights estimated risk against estimated net return in F(x) = q·xᵀΣx/K² − (1 − q)·(μᵀx/K − tc(x))."
          infer="A higher q makes the optimiser prefer portfolios with lower estimated volatility, and a lower q makes it prefer higher estimated return."
          cannot="That a profile guarantees lower realised risk or higher realised return. It changes what the optimiser prefers, using past estimates only."
        />
      </Section>

      <Section
        id="assumptions"
        eyebrow="Assumptions"
        title="Assumptions and limits"
        lead="Every result in the app rests on these."
      >
        <ul role="list" className="max-w-prose list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted">
          <li>Expected return and volatility are historical estimates measured on the estimation window (2023-10-01 to 2025-09-30). They are in-sample and are not forecasts.</li>
          <li>Figures are annualised with 252 trading days and computed from adjusted close prices.</li>
          <li>The risk-free rate in Sharpe ratios is 5.57%.</li>
          <li>Weights are equal (1/K) and converted to whole shares, so some cash is usually left over.</li>
          <li>Costs are a simple proportional model: buy 0.1187%, sell 0.1037%. Market impact, spread, slippage and tax are not modelled.</li>
          <li>The out-of-sample test uses one window (2025-10-01 to 2026-09-30). It checks for leakage and is not evidence of skill.</li>
          <li>Today’s NIFTY 50 list is used for past dates (survivorship bias is stated, not corrected).</li>
          <li>Problems are limited to 16 qubits (stocks plus slack bits), and larger universes are reduced by the screening step first.</li>
        </ul>
      </Section>
    </div>
  );
}

export default Method;
