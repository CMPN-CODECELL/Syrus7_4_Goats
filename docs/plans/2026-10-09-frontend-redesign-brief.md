# Frontend redesign brief: beginner-friendly UX (user-provided, 2026-10-09)

This is the authoritative product brief for the redesign. Implementation splits and file ownership are in `frontend/REDESIGN.md`.

## Goal
Turn the technical research dashboard into a polished, beginner-friendly app without losing any financial optimisation, scientific transparency or advanced quantum functionality.
- Make it **approachable for a first-time user** (User A, who knows no finance or quantum).
- Make it **transparent for a researcher** (User B).
- **Improve how capabilities are discovered and understood.** Do not rebuild them.

## Information architecture
There are 4 top tabs: **Optimize** (default), **Evidence**, **Method**, **Glossary**. Each has a clear purpose. Beginners must reach their portfolio without visiting technical tabs.

## Optimize: four-step wizard
The wizard shows a visible progress indicator, Back and Continue buttons, and a concise summary of the current selections. It has four steps.

### Step 1: Build your portfolio
- **Investment amount.** Presets ₹1 lakh, ₹5 lakh, ₹10 lakh and ₹50 lakh, plus a custom amount. These are presets, not recommendations.
- **Stock universe.** A NIFTY 50 preset, with a short explanation.
- **Number of holdings (K).** Use this text: "Choose how many companies you want your portfolio to hold. Fewer holdings concentrate your investment, while more holdings can spread it across more companies." Never claim that more holdings eliminate risk.
- **Customize stock selection** (collapsed). Full search, industry filters and individual picks.

### Step 2: Choose your preferences
- **Three risk profiles:**
  - **Lower risk:** "Prefer a portfolio with lower estimated return volatility, even if it gives up some expected return."
  - **Balanced:** "Balance estimated return against portfolio risk."
  - **Higher growth potential:** "Prioritize estimated return while accepting the possibility of greater fluctuations."
  - Each profile maps to the actual `risk_aversion` (q) parameter. The numeric q stays visible in Research mode / Advanced.
  - Never guarantee an outcome.
- **Diversification:** the max-stocks-per-sector setting, explained as "Limit how much your portfolio concentrates in one industry."
- **Optional target-return floor:** explain that it adds a minimum estimated-return constraint and may make the problem infeasible.
- **Optional existing holdings:** show examples and validate the input.

### Step 3: Review your configuration
- Show a readable summary:
  - amount, universe, available and shortlisted stocks, K, risk preference, sector cap;
  - target return, if set;
  - cost assumptions;
  - holdings, if any.
- Detect before running: missing information, invalid values, incompatible constraints, insufficient data.
- Let the user jump back to any step.
- Explain that the optimiser picks a feasible portfolio under these assumptions.
- Put the existing technical controls in a collapsible "Advanced research settings" panel.

### Step 4: Run
- The primary action is labelled **Optimize My Portfolio**.
- Block duplicate submissions.
- Show truthful stage messages taken from real backend progress. Never invent percentages or stages.
- Handle timeouts, infeasibility and solver errors helpfully.
- Preserve the configuration, and offer Retry.

## Results dashboard: the portfolio comes first, algorithms second
- **A. Portfolio summary:**
  - title, amount, number of holdings, invested, uninvested cash, transaction costs;
  - snapshot date, estimation and test windows;
  - one generated sentence describing what the optimiser did (built from the real config, never hardcoded).
- **B. Key metrics cards, each with a short explanation:**
  - Expected annual return: say whether it is in-sample or out-of-sample, and whether costs are included.
  - Annualized volatility: a historical variability indicator, not complete risk.
  - Transaction costs: assumptions plus the ₹ amount.
  - Uninvested cash: why some cash is left, e.g. whole-share rounding.
  - Never present estimates as guaranteed.
- **C. Allocation:**
  - Table columns: symbol, company, sector, weight %, whole shares, price and price date, position value.
  - A horizontal allocation bar chart.
  - Totals for invested and cash. Totals must reconcile.
  - Explain any deviation from equal weights caused by rounding.
  - Sorting, with optional row details.
- **D. Why were these stocks selected?** Per stock, show only data that was actually computed: sector, estimated return, volatility, risk contribution, correlation with the other picks, and screening criteria. Never fabricate. If a value is not computed, compute it properly in the backend or say it isn't available.
- **E. Plain-English result summary,** generated from the real solver status. Never claim feasible or optimal unless validated.

## Simple Mode / Research Mode
- There is a mode switch, and Simple is the default.
- Research mode exposes everything: exact K, risk aversion q, sector cap, target return, QAOA depth, mixer, optimiser, shots, noise, seed, maxiter, and solver/execution controls.
- Group the settings into collapsible sections.
- **Each advanced control shows:**
  - its technical name;
  - a plain explanation;
  - its range and default;
  - the consequences of changing it;
  - validation.
- Do not confuse a parameter with its effect. For example, risk aversion is not a guarantee of lower realised risk.
- Do not change defaults or silently override user choices.
- **Both modes call the same pipeline.**

## Evidence
- **Risk-return analysis.** Keep the frontier. Give plain-language axes, a legend for every marker, and an explanation of what the frontier is and its limits. Do not fabricate or interpolate frontier points.
- **"How the Quantum Optimizer Improved"** (the convergence chart). Explain that the curve is the objective over iterations and that stabilisation suggests convergence for this run, which is not proof of a global optimum.
- **"Probability of Different Portfolios Being Sampled"** (the bitstring chart).
  - Explain that each bitstring is a selection state.
  - Explain feasible, infeasible and optimal.
  - "Optimal" means validated against the true objective and constraints, not the highest probability.
- **"Compare Optimization Methods"** (the solver table).
  - Key fields come first: solver, feasibility, objective, runtime, return and volatility, whether the exact optimum was established, sampling statistics.
  - An expandable full technical table holds the rest.
  - Distinguish exact, approximate and heuristic results.
- **Every chart has "What this means":** what it shows, what can be inferred, and what cannot be concluded. Keep it short, with an expandable section for more.
- **Precomputed benchmark studies:** keep the existing studies.

## Honesty and verification report (a core, visible feature)
The report must answer, using computed values only:
- Did QAOA find the exact classical optimum?
- Was the result feasible, approximately optimal, or exactly optimal?
- What was each solver's runtime?
- What was P(target), and how does it compare with the appropriate baseline (uniform random with the same shots)?
- Were all methods run on the same instance?
- What are the limits?

If brute force finds the optimum quickly and QAOA only matches it, say so. Never claim quantum advantage, speed, better returns or scalability without evidence. A small instance does not demonstrate scalability. Never hardcode success text.

## Method
- Show the pipeline as a visual: **Market Data → Stock Screening → Portfolio Formulation → Optimization → Validation → Final Allocation.**
- For each stage, give its inputs, what happens, its outputs, and why it is needed.
- Use plain language first, with expandable technical details below.
- Explain QUBO as constrained optimisation written in binary variables, and QAOA as a hybrid quantum-classical search.
- Explain slack variables and the qubit budget.
- Do not imply that QAOA automatically gives better results.
- Include the objective, variables, assumptions, and the exact parameter mapping for the risk profiles.

## Glossary
- Make it searchable, with the categories Finance, Optimization, Quantum Computing and Evaluation.
- Terms: expected return, volatility, Sharpe ratio, diversification, portfolio weight, transaction costs, QUBO, QAOA, qubit, mixer, circuit depth, bitstring, objective function, constraint, slack variable, exact optimum, feasibility, convergence.
- Give a simple example for each where possible, e.g. "₹10,000 of ₹1,00,000 = 10% weight".
- Put formal definitions in an expandable section.
- Use the same terms consistently across the whole app.

## Visual design
- **Keep the current monochrome research identity.** Black and white, with green and red only for gain and loss.
- Differentiated surfaces, bright primary text, muted secondary text, and one restrained accent (white).
- Subtle borders and more spacing between unrelated sections.
- Consistent padding, alignment and radii.
- No gradients, glow, decorative animation or random colours.
- **Type sizes:** body 14–16px, metadata 12–14px, primary metrics 24–32px.
- A condensed or mono face only for labels, tickers and metadata.
- **Layout:** a consistent grid, with the main workflow dominant and research panels collapsible.

## Responsive design and accessibility
- Must work on desktop, tablet and mobile. On mobile: stack controls, use 1–2 column metric grids, resize charts without clipping, keep tables readable.
- Semantic headings and labels.
- Full keyboard use and visible focus.
- Sufficient contrast.
- Accessible names on icon-only buttons.
- Screen-reader status and error messages.
- Never rely on colour alone.
- Honour reduced motion.
- Tooltips must work without a mouse.

## Validation and trust
- **Inline errors for:** invalid capital, no stocks, too few eligible assets, invalid holdings, out-of-range parameters, incompatible constraints, stale or insufficient data, solver failure, timeout or infeasibility, and non-finite metrics.
- **Never show stale results as current.**
- **Separate clearly:** the estimation window, the test window, and the snapshot date.
- **Say whether a metric is gross or net of costs.**
- **State the assumptions:** annualisation, adjusted close, costs, rounding.
- **Integrity:** never fabricate data, and never alter constraints to look successful.

## Engineering constraints
- Keep the backend, endpoints, algorithms and formulation unless a verified issue needs a deliberate fix.
- No hardcoded demo values in result components, and no mock fallback for failed API calls.
- One source of truth for the configuration and results. Do not duplicate business logic.
- Use typed reusable components and add no unnecessary dependencies.
- Preserve selections when moving backward through the wizard.
- Simple and Research modes submit the same pipeline request.
- Recompute the display whenever the results change.
- Validate formatting and totals.
- Keep the app working throughout.

## Definition of done
- A beginner can complete the 4-step workflow.
- Simple and Research modes both work, and the advanced features are still reachable.
- Runs go through the real pipeline.
- Results show allocation, invested, cash, costs and correctly interpreted metrics, all from the current run.
- Charts have labels, legends and a "What this means" section.
- Exact, approximate and infeasible results are distinguished.
- The honesty report makes no unproven advantage claims.
- Dates and assumptions are transparent, and errors are handled.
- The app is responsive, accessible and consistent, with nothing broken.
- Tests and the build pass, and any remaining failure is documented.
