# Demo script: 5 minutes

Team 4 GOATS | PS-03 | Qiskit Fall Fest 2026. For the presenter.

Numbers in steps 1 to 7 come from the live run: read them off the screen and do not round them in our favour. Numbers in steps 8 and 9 come from `backend/data/studies/*.json`. Never say "advantage" or "speedup".

## Before you go on stage

- [ ] Backend and frontend running; http://localhost:8000/api/health returns ok; http://localhost:5173 open on the Optimise tab with the snapshot date in the data banner.
- [ ] Do one full rehearsal run with the exact settings below, so imports are warm. Note how long it took and what the Qubit Split badge says. `TEAMS/CONTRACTS.md` section 2.2 gives about 3 minutes at 16 qubits and under a minute at 12. If your run is longer than the 65 seconds budgeted in step 3, either talk over the wait, or pick about 10 stocks so the badge shows 12 qubits or fewer (the pre-screen notice then says the universe is within the cap; in step 2 say the 50-stock case takes the same path but runs slower).
- [ ] Wi-Fi can be off. Nothing needs it.
- [ ] Recording and screenshots from the last section are ready.

## Script

| Time | Click / action | What to say |
|---|---|---|
| 0:00-0:35 | Optimise tab. Click Custom Sub-Universe and tick about 20 stocks across several sectors (or click Full NIFTY 50 (50)). Set Exact Stock Picks (K) = 5, sector cap = 2, Investment Capital = 10,00,000. Leave q = 0.50. Leave Advanced QAOA closed (standard mixer, p = 2, COBYLA, ramp start, 4096 shots, noise off). | "Choose 5 stocks, at most 2 per sector, for ₹10 lakh. Each stock is yes or no, so 50 stocks is 2 to the 50 portfolios. We write the rules as one QUBO and give the same problem to QAOA and to three classical solvers. Prices are a checked-in snapshot, so this works offline. Expected returns and covariance use only 2023-10-01 to 2025-09-30." |
| 0:35-0:55 | Point at the pre-screen panel: Kept and Screened Out lists, Qubit Split badge. | "A simulator cannot hold 50 qubits, so there is a classical step and we declare it. Stocks are ranked by estimation-window Sharpe ratio and the top ones are kept so assets plus slack bits fit the qubit cap, at most cap + 1 per sector. Every solver gets the same reduced set. QAOA is solving this reduced problem, not the full 50." |
| 0:55-2:00 | Click Run Quantum Portfolio Optimization. Stay on the progress panel: stage text, progress bar, convergence curve filling in. Do not touch Cancel unless the run overruns. | "This is our own QAOA loop on Qiskit primitives. Each point on the curve is the energy of the circuit for the current angles; a classical optimiser, COBYLA, updates the angles and repeats. The loop is hybrid by design. No classical answer is put into the circuit: it starts from the uniform state with a linear-ramp initial point. The job runs in the background, the page polls every half second, and it can be cancelled." |
| 2:00-2:20 | Scroll to the QAOA Bitstring Sample Probability Distribution. | "This is what the circuit produced: sampled bitstrings, first stock leftmost, marked Optimal, Feasible or Infeasible. Our answer is the best feasible string in these samples, checked by an exact function. If no sample were feasible the app would show no selection; it never repairs one. Note how much probability is on infeasible strings. Penalties do not force the rules." |
| 2:20-2:50 | Scroll to the Risk-Return Efficient Frontier, then the Solver Benchmark Comparison. | "The curve is the continuous Markowitz frontier. The dots are each solver's actual 5-stock pick. The table gives objective, return, volatility, feasible rate and runtime for brute force, relaxation with rounding, annealing and QAOA. Brute force is exact at this size, so nothing beats it on the objective; the question is how close QAOA gets. We make no speed claim." |
| 2:50-3:15 | Scroll to the PS-03 Honesty & Verdict Report. | Read the headline aloud exactly as shown. "Approximation ratio 1.0 means the exact optimum. P(opt) is the chance of sampling the exact optimum, next to a random-guess baseline. Feasible rate is the share of samples that satisfy every rule. The verdict text is generated, and a test blocks words like advantage and speedup." |
| 3:15-3:35 | Scroll to the Out-of-Sample Test Window Backtest. | "Chosen on 2023-10-01 to 2025-09-30, scored on 2025-10-01 to 2026-09-30, which no solver saw, against the NIFTY 50 index. It is one year and one outcome, a leakage check and not a claim of skill. The stock list is today's NIFTY 50, so survivorship bias applies." |
| 3:35-4:25 | Click the Evidence Studies tab. Show Effect of circuit depth, Classical optimiser, Parameter initialisation, Mixer choice in turn (about 10 seconds each). | "A full sweep is too slow to run live, so these were precomputed and are served as saved files. Five random 10-stock instances, K = 5, 60 optimiser iterations; the plan was 10 instances and deeper circuits. Numbers below." Then quote the figures in the next section. |
| 4:25-5:00 | Click Effect of hardware noise. | Quote the noise numbers below, then: "This is our negative result. It is one instance, with parameters optimised noiselessly and then sampled on the FakeGuadalupeV2 noise model, so it is simulated noise and not a real device." |

If the run is slow, keep talking through the convergence panel and shorten step 7; do not skip steps 8 and 9, because they need no run.

## Numbers to quote (steps 8 and 9)

Axis on the first three charts is 1 minus approximation ratio, so lower is better. Source files in brackets.

- **Depth** (`depth.json`, COBYLA, ramp start, p = 1 to 4). Standard mixer: 0.858, 0.737, 0.799, 0.862. XY ring + Dicke: 0.347, 0.289, 0.293, 0.241. Say: "More depth did not help the standard mixer; the error bars are about 0.05 to 0.10. XY improves slowly."
- **Optimiser** (`optimizer.json`, standard mixer, p = 3). COBYLA 0.799, SPSA 0.850, Nelder-Mead 0.916. Say: "COBYLA is best at this budget. 60 iterations is small, so the ranking holds for this budget only."
- **Initial point** (`init.json`, standard mixer, p = 3, COBYLA). Random 0.793, ramp 0.799, INTERP warm start 0.853. Say: "The declared warm start, which reuses QAOA's own depth p-1 angles, did not help here."
- **Mixer** (`mixer.json`, p = 3). Feasible rate: standard 0.394, XY 1.000. P(opt): standard 0.0023, XY 0.0339. Say: "XY keeps every sample feasible by construction. The optimum still shows up in only about 3% of samples."
- **Noise** (`noise.json`, XY + Dicke, p = 2, one instance, seed 1). Same parameters, ideal then noisy: approximation ratio 0.697 to 0.081; P(opt) 0.0034 to 0.00024; feasible rate 1.000 to 0.160. Say: "Under simulated noise only 16% of samples stay feasible."

## Judge Q&A

**1. Is this classical in disguise?**
No wrapper. The reported portfolio is the best feasible bitstring sampled from the optimised QAOA circuit and judged by an exact function. No classical solution enters the circuit, and the only warm start (INTERP) reuses QAOA's own depth p-1 angles and is labelled. A classical optimiser tunes the angles, which is how QAOA works. Two classical steps are declared: the pre-screen, and penalty tuning by enumerating the QUBO (16 variables at most). Neither puts an answer into the circuit. The circuits run on a classical simulator.

**2. Why not 50 qubits?**
Simulation cost doubles with every qubit, and noisy simulation is slower still. We cap at 16 (stocks plus slack bits), the size of FakeGuadalupeV2, so every configuration can be noise-simulated. A 50-stock universe goes through the declared pre-screen and QAOA solves the reduced set.

**3. Do you claim quantum advantage?**
No. Brute force solves every instance here exactly. In our studies the standard mixer's 1 - r is 0.74 to 0.86 over p = 1 to 4, and XY reaches 0.24 at best. XY's P(opt) of 0.0339 at p = 3 is about 8.5 times a uniform draw over the 252 feasible subsets (1/252; our arithmetic from n = 10, K = 5, not a study output), yet the optimum still appears in about 3% of samples. The PS welcomes neutral and negative findings, so we report them.

**4. Is there look-ahead?**
No. Expected returns, covariance, the pre-screen and the prices used for share counts come from 2023-10-01 to 2025-09-30 only. 2025-10-01 to 2026-09-30 is used only for out-of-sample scoring, and a test enforces the split. Survivorship bias remains: today's NIFTY 50 list is applied to past dates.

**5. Why is XY worse under noise?**
We can only say it degrades. In one instance, with parameters optimised noiselessly and then sampled on the FakeGuadalupeV2 noise model, its approximation ratio fell from 0.697 to 0.081 and its feasible rate from 1.000 to 0.160. We did not run the standard mixer under noise, so we cannot say XY is worse than standard. Likely cause, not tested here: XY keeps samples feasible only if its gates act almost exactly, and the Dicke preparation and ring mixer add many two-qubit gates, so noise pushes states out of the constraint subspace. Brandhofer et al. (arXiv 2207.10555) report that the XY advantage disappears under gate noise.

**6. Why equal weights?**
Each binary variable is one stock, and encoding weights needs extra qubits per stock, which we cannot afford at 16 qubits. QAOA selects the stocks; the picks get equal weight and are converted to whole shares for the capital, which is how lot sizes are honoured. The objective is scaled so every solver scores the same equal-weight portfolio. Optimised weights would likely do better, and lot-encoded weights are deferred.

**7. How are the penalty weights chosen?**
By brute force over the QUBO, which has at most 65,536 states. Start at half the objective spread and double until the best infeasible state is at least halfway between the best and the average feasible objective (Brandhofer Eq. 11). That sets the weights only; it does not enter the circuit. Feasibility is then judged exactly, never by the penalty.

**8. Did you run on real hardware?**
No. All noise results come from the FakeGuadalupeV2 noise model in Aer, a simulation that can differ from a real device. We have no hardware job IDs and report none. A hardware run is optional in the PS and is on our deferred list.

## If the live demo fails

- [ ] **Backend will not start or the page says Backend Connection Offline.** Check that http://localhost:8000/api/health answers; restart uvicorn with `--reload-dir qportfolio` and `$env:PYTHONUTF8="1"` set. Show the Evidence Studies tab, which only reads the saved study files.
- [ ] **No internet.** Expected. The app runs from `backend/data/snapshot/prices.parquet`; point at the snapshot date in the data banner.
- [ ] **Run too slow or stuck.** Click Cancel Optimization, reduce the number of stocks, and run again. If time is gone, switch to the recording.
- [ ] **Screen recording.** Record one full run of this script beforehand (Win+G on Windows) and keep the file open in a player. Say "this is a recording of the same script" before playing it.
- [ ] **Screenshots.** Keep one PNG per table row, named 01 to 09, in a local folder so you can show them if both the app and the recording fail.
- [ ] **Mock mode, last resort.** `$env:VITE_USE_MOCKS="1"; npm run dev` replays example payloads, not a live run. Say so out loud, and do not quote its numbers as results.
- [ ] **Phone demo.** Use the LAN steps in `README.md`; if the phone cannot connect, show the laptop only.

## Mentor questions to ask

1. Is a declared Sharpe-ranked pre-screen an acceptable way to cover a 50-stock universe under a 16-qubit cap, or would you prefer sector decomposition or another reduction?
2. Our noise result samples noiselessly optimised parameters on one instance. With the remaining time, is it worth running the standard mixer under noise and noise-aware optimisation, or should we spend it on more instances and a larger iteration budget for the noiseless studies?
3. Depth and the INTERP warm start showed no gain at 60 iterations. Is that budget too small to conclude anything, and what budget would you consider fair? Is a real-hardware run with job IDs worth the queue time?
