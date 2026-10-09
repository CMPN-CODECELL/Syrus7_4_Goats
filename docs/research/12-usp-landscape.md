# USP landscape: existing quantum portfolio-optimisation projects

Research date: 2026-10-09. 32 rows (projects, papers, vendors, hackathon entries). Tools: WebSearch (standard mode; extended not needed), WebFetch of project pages and arXiv, GitHub repo-search API (QAOA, Qiskit and VQE queries), plus team notes 01, 02 and 04 in docs/research. Source type per row: [page] = README or docs read; [abstract] = arXiv abstract only; [snippet] = search result only.

Legend: Y yes, P partial, N no, ? not stated or not verified. UI = web UI. HW = real hardware or noise model. OOS = out-of-sample backtest. NSE = NIFTY/NSE data.

| # | Project [source type] | UI | Market data | Constraints beyond cardinality | Exact opt | Uniform random | Honest verdict | XY/Dicke mixer | HW/noise | OOS | NSE + Indian costs |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Qiskit Finance tutorial [snippet; page blocked] [unverified] | N | Synthetic, 4 assets | Budget only | Y | ? | N | N | N | N | N |
| 2 | Classiq QAOA notebook, classiq-library [page] | N | Synthetic, 3 assets | Integer per-asset bounds | Y (Couenne) | P (histograms, no metric) | N (positive) | N | N | N | N |
| 3 | IQM QAOA library docs [page] | N | Synthetic, 7 assets | Exactly 3 assets | N | N | P ("penalty chosen arbitrarily") | N | P (garnet:mock, no noise stated) | N | N |
| 4 | luan521/quantum-portfolio-optimization [page] | N | B3 real, 4 stocks, 2016-21 | None | P (classical Sharpe; exactness unstated) | N | N | N | N | N | N |
| 5 | Ayomide05/Quantum-Portfolio-Optimization, team reference [team note 02] | N | Synthetic, 50 assets | Transaction cost; soft sector cap | P (equal weight vs SLSQP) | N | N (claims +71% Sharpe, an artifact) | N | N (neal SA, not QAOA) | N | N |
| 6 | anishrverma/Hybrid-Quantum-Endowment-Portfolio-Optimization [page] | N | ? | Budget; risk-parity weights | N | N | N | N | N | N | N |
| 7 | AneeshKamat4/QAOA-Portfolio-Generator, QSTH 2022 India [page] | Y (Django) | ? | ? | N | N | N | N | N (D-Wave Ocean, Qiskit) | N | N |
| 8 | sagar25k/Quantum-Portfolio-Optimization-With-DC-QAOA, "1st place" [page] | Y (React, Flask) | Live NSE + US | Cardinality (motivation only) | P (CVXPY MVO, no numbers) | N | N (claims "Quantum Advantage") | Claimed Hamming-preserving [unverified] | N | N | Y (no costs) |
| 9 | nakuljoshidev-coder/Q-Alpha, same README as row 8 [page] | Y | Live NSE + US | Cardinality (motivation only) | P (no numbers) | N | N (claims institutional-grade) | Claimed [unverified] | N | N | Y (no costs) |
| 10 | Akhila707/IBM-Quantum-FoundationsDay13, Streamlit [page] | Y | US 4 stocks, 2023, in-sample | Long-only, fully invested | P (SLSQP Markowitz; brute force not stated) | N | N ("potential exponential advantage", forward-looking) | N | N | N | N |
| 11 | ab-negm/quantum-portfolio-lab [page] | N (FastAPI) | Synthetic one-factor, 6 assets | Equal weights; txn cost planned | Y (brute force) | N (SA planned only) | Y (concentrated picks lose to equal weight) | N | N | P (walk-forward IC 0.204; test window unstated) | N |
| 12 | johngeorgea157/quantum-portfolio-opt [page] | N | NSE/Bank Nifty, 3 stocks, k=2 | Binary selection only | Y (brute force) | P (SA vs random test, no numbers) | Y (greedy 0.0001 s vs QAOA ~75 s) | N | Y (ibm_fez, 1000 shots; best-bitstring prob 34.8% to 28.8%) | N | Y (no costs) |
| 13 | alejomonbar/quantum-portfolio-optimization-encoding [page]; title matches QHack 2023 entry [unverified] | N | S&P 500, 36 stocks, ~3 months | Minimum return | Y (docplex) | N | P (IonQ runs "too limited") | N (unbalanced penalties) | Y (ibm_guadalupe; IonQ) | N | N |
| 14 | Kefebekir/quantum-portfolio-qaoa [page] | N | FTSE 100, 5 and 8 stocks | Exactly B stocks | Y | N | Y ("at the sizes I could simulate, no") | N | N | N | N |
| 15 | ilayd-a/Optimization-of-Premium-Investment-Portfolios, YQuantum [page] | N | Dataset, 4 assets; market unstated | Long-only, 0.25 grid | N (SLSQP, continuous) | N (equal weight only) | N | N | N | N | N |
| 16 | sadieea/quantum-portfolio-optimization, Womanium + WISER 2025 [page] | N | 31 bonds; market unstated | Fixed 10 via penalty | N | N | N | N | N | N | N |
| 17 | Brandhofer et al., arXiv 2207.10555 / QIP 2023 [team note 04] | N | German stocks, n=5 and 10 [data source unverified] | Budget; risk weight | Y | N | Y ("No quantum advantage claimed"; XY edge lost under noise) | Y (XY + Dicke) | P (depolarising sweep, simulated) | N | N |
| 18 | Mancilla et al., arXiv 2602.14827, Feb 2026 [abstract] | ? | 10 US stocks, 2025 | Cardinality K | N (SA and HRP only) | N | P (76.8% turnover flagged) | Y (Dicke + XY) | N | P (protocol unstated) | N |
| 19 | Stopfer and Wagner, arXiv 2509.17876 [abstract] | N | Real stock data, 270 instances up to 1000 assets; market unstated | Variance only | Y (MIP to proven optimum) | N | Y ("very limited room" for advantage) | N | N (quantum capped at 30 assets) | N | N |
| 20 | Carbon-credit XY-QAOA, arXiv 2602.09047 (not equity) [abstract] | N | Carbon credits, 88 variables | k=28 | N (greedy only) | N | N ("empirical quantum utility") | Y (XY, k=28) | Y (ibm_torino, ibm_fez; ZNE) | N (13-day re-run only) | N |
| 21 | Qkrishi Quantum, arXiv 2504.08843 (Morapakula et al.) [abstract] | N | Indian indices; exchange unstated | Mean-variance; quarterly rebalancing | N | N | P (no advantage claimed; v1 cites INR 2 lakh gain) | N | P (D-Wave hybrid) | ? | Y (no costs stated) |
| 22 | Jain and Chandra, arXiv 2305.01480 [abstract] | N | Indian stocks, up to 64 assets | ? | N | N | N | N | N | N | Y (no costs stated) |
| 23 | D-Wave 40 stocks, arXiv 2007.01430 [full text, ar5iv] | N | US liquid equities, 40 | Markowitz, Sharpe, CQNS | P ("approach this first classically") | N | Y ("underperforming the genetic algorithms"; "relative parity with random sampling") | N | Y (D-Wave 2000Q) | N | N |
| 24 | D-Wave investment bands, arXiv 2106.06735 [abstract] | N | S&P 100 and 500 | Investment bands; target vol | N | N | N (positive) | N | Y (Advantage QPU) | N | N |
| 25 | IBM / Global Data Quantum Qiskit Function, preview [page] | N (SDK) | User CSV; Yahoo JP/US/FX/ES, 2023 | Fees; max investment | Y (Gurobi) | Y (random distribution in figure) | Y (Gurobi beats all quantum runs; "experimental") | N | P (backend unspecified) | N | N |
| 26 | Multiverse Singularity, vendor page [page] | Excel plug-in | ? | ? | P (classical solver, no results) | N | N (claims unverified) | N | P (hybrid; D-Wave Leap) | N | N |
| 27 | iQuHACK 2024 Yale team, mean-VaR QUBO [snippet] | N | ? | ? | N | N | N (team's 6% per quarter claim unverified) | N | Y (D-Wave 2000Q) | N | N |
| 28 | QuHack4IA 2023 2nd place, quantum annealing portfolio [event list; no repo] | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| 29 | OscarJHernandez/qc_portfolio_optimization [fetch failed: 503 and 404; snippet] | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? |
| 30 | arXiv 2410.16265, Yuan et al. (QAOA, min-variance) [abstract] | N | ? | Cardinality | N | N | P (hedged: noise rules out advantage today) | ? | Y (simulated thermal relaxation) | N | N |
| 31 | arXiv 2403.04296, VQE with Dicke-state ansatz [abstract] | N | ? | ? (CVaR cost) | N | N | N | P (Dicke ansatz; feasibility unstated) | Y (55 qubits, Wu Kong) | N | N |
| 32 | arXiv 2407.05589 and 2508.18625, VQE trainability; WCVaR + CMA-ES [abstract] | N | ? | ? | N | N | N | N | Y (10 qubits; Wuyue platform) | N | N |

Column counts: exact optimum Y in 9 rows; uniform random Y or P in 2 rows; honest verdict Y in 7 rows and hedged in 5; XY/Dicke Y in 3 rows and P in 1; HW/noise Y in 9 rows and P in 5; OOS documented in 0 rows (3 partial); NSE data in 5 rows; Indian costs in 0 rows; web UI in 4 rows.

## Ratings (rare / uncommon / common, with evidence)

1. **Honest-by-design verdict: UNCOMMON.** Explicit negative verdicts in 7 rows (11, 12, 14, 17, 19, 23, 25); hedged in 5 (3, 13, 18, 21, 30); overclaiming in 6 (5, 8, 9, 10, 20, 26). No automatic, per-run, in-app verdict in any of the 32 rows. Honesty is common in papers; the automation is the gap.
2. **Quantum Trust Score (one composite): RARE.** No composite trust score found. Parts exist separately: random-normalised Q-score (Atos, [snippet]); P(at least one optimum in B draws) (arXiv 2609.22748, [snippet]); feasible-repetition success (QOBLIB, arXiv 2504.03832, [snippet]). The D-Wave CQNS (row 23) is a different composite (Var minus E[R]^(2+alpha)) for portfolio selection, not a trust score. Any weights would be arbitrary unless fixed and published per component.
3. **Indian-retail output (NIFTY 50, STT and stamp duty, whole-share INR list): RARE.** NSE data in 5 rows (8, 9, 12, 21, 22). Indian cost stack in 0 rows. The transaction-cost QUBO paper found (arXiv 2607.03218, [snippet]) is not India-specific. Whole-share INR allocation in 0 rows (rows 11 and 15 use equal or fixed weights; row 12 is binary only). Indian cost figures come from broker sources, [unverified against official notices]: delivery STT 0.1% each side; stamp duty 0.015% on buy. Confidence in "rare" is moderate: one GitHub query gave about 30 of about 140 results, and the NIFTY-specific API query failed.
4. **Constraint-preserving circuits (XY + Dicke, 100% feasible): UNCOMMON.** Verified in rows 17, 18, 20; the same construction appears in PC-QAOA (arXiv 2508.02590, [snippet]) and the Qrisp library portfolio mixer ([snippet]). Rows 8 and 9 claim Hamming-preserving mixers [unverified]. Penalty-only designs are the norm (rows 11, 12, 13). The technique has been published since 2022 (row 17), so the claim is build quality, not novelty.
5. **Noise reality check: UNCOMMON.** Hardware or noise runs in 9 rows (12, 13, 20, 23, 24, 27, 30, 31, 32). Only row 12 (ibm_fez, scored against an exact optimum) and row 17 (simulated depolarising sweep) measure how solution quality degrades. Row 20 compares against greedy, not an exact optimum.
6. **Beginner UX for non-experts: UNCOMMON.** Web UI in 4 rows (7, 8, 9, 10) plus a vendor Excel add-in (row 26). None is a guided, step-by-step flow with plain-language help. Existing UIs are developer-facing (row 8 Bloch sphere and WebSocket progress; row 7 Django form; row 10 Streamlit sliders).

## Most defensible USP

**Honest-by-design verdict (rating 1), specifically an automatic verdict computed from the app's own exact, random and classical numbers on every run.** It is provable from the app's output, so it does not depend on search coverage. The overclaiming gap is real (6 of 32 rows, including the team's own reference repo, row 5), and no automated version was found. Caveat: the problem statement already asks for neutral or negative findings, so judges may treat honesty alone as table stakes; the per-run automation is what differs. Pair it with rating 3 (Indian-retail output) as the market hook. Rating 2 is the least defensible, because its weights would be subjective.

## Notes and limits

- Row 23's abstract reads positive, but the full text (ar5iv) is negative. Abstract-only verdicts in rows 21, 24 and 30-32 may also be incomplete.
- Row 1 (Qiskit tutorial) page fetch was blocked; its details come from snippets [unverified]. Row 29 fetch failed on both master (503) and main (404). Rows 27 and 28 come from search summaries.
- Stopfer and Wagner: affiliation is not on the abstract page; a search summary named Fraunhofer [unverified]. Instance count is 270 on the page and 250 in a search summary.
- QC Ware: no portfolio optimisation product found. The "personalised portfolio" patents are assigned to Wells Fargo, not QC Ware [unverified scope].
- Multiverse: vendor claims only; no independent benchmark found.
- The XY-mixer and NIFTY-specific GitHub API queries failed (domain blocked); web-search substitutes were used.

## Sources

- Classiq docs: https://docs.classiq.io/explore/applications/finance/portfolio_optimization/portfolio_optimization.md
- Qiskit Finance tutorial (blocked): https://qiskit.org/documentation/finance/tutorials/01_portfolio_optimization.html
- IQM QAOA docs: https://docs.iqm.tech/iqm-qaoa/Portfolio%20Optimization.html
- luan521: https://github.com/luan521/quantum-portfolio-optimization
- Ayomide05 (team note docs/research/02-reference-repo.md): https://github.com/Ayomide05/Quantum-Portfolio-Optimization
- anishrverma: https://github.com/anishrverma/Hybrid-Quantum-Endowment-Portfolio-Optimization
- AneeshKamat4: https://github.com/AneeshKamat4/QAOA-Portfolio-Generator
- sagar25k: https://github.com/sagar25k/Quantum-Portfolio-Optimization-With-DC-QAOA
- Q-Alpha: https://github.com/nakuljoshidev-coder/Q-Alpha
- Akhila707: https://github.com/Akhila707/IBM-Quantum-FoundationsDay13
- ab-negm: https://github.com/ab-negm/quantum-portfolio-lab
- johngeorgea157: https://github.com/johngeorgea157-stack/quantum-portfolio-opt
- alejomonbar: https://github.com/alejomonbar/quantum-portfolio-optimization-encoding
- Kefebekir: https://github.com/Kefebekir/quantum-portfolio-qaoa
- ilayd-a: https://github.com/ilayd-a/Optimization-of-Premium-Investment-Portfolios
- sadieea: https://github.com/sadieea/quantum-portfolio-optimization
- Brandhofer (team note docs/research/04-arxiv-2207.10555.md): https://arxiv.org/abs/2207.10555
- Mancilla: https://arxiv.org/abs/2602.14827
- Stopfer and Wagner: https://arxiv.org/abs/2509.17876
- Carbon-credit XY-QAOA: https://arxiv.org/abs/2602.09047
- Qkrishi / 2504.08843: https://arxiv.org/abs/2504.08843
- Jain and Chandra: https://arxiv.org/abs/2305.01480
- D-Wave 40 stocks (full text): https://ar5iv.labs.arxiv.org/html/2007.01430
- D-Wave investment bands: https://arxiv.org/abs/2106.06735
- IBM Qiskit Function: https://quantum.cloud.ibm.com/docs/guides/global-data-quantum-optimizer
- Multiverse Singularity: https://www.multiversecomputing.com/resources/quantum-algorithms-in-multiverse-computing-s-singularity-software
- QuHack4IA 2023: https://www.ifabfoundation.org/en/2023/09/15/quhack4ia-concluded-here-are-the-three-winning-projects/
- iQuHACK 2024 (Yale summary): https://physics.yale.edu/node/7275
- VQE/QAOA abstracts: https://arxiv.org/abs/2410.16265 ; https://arxiv.org/abs/2403.04296 ; https://arxiv.org/abs/2407.05589 ; https://arxiv.org/abs/2508.18625
- PC-QAOA [snippet]: https://arxiv.org/abs/2508.02590
- Qrisp portfolio rebalancing [snippet]: https://qrisp.eu/general/tutorial/QAOAtutorial/PortfolioRebalancing.html
- Atos Q-score [snippet]: https://www.techzine.eu/news/analytics/53107/atos-develops-q-score-benchmark-for-quantum-computing/
- Trapped-ion warm start [snippet]: https://arxiv.org/pdf/2609.22748
- QOBLIB [snippet]: https://arxiv.org/pdf/2504.03832
- Transaction-cost QUBO [snippet]: https://arxiv.org/pdf/2607.03218
- Indian cost figures, broker source [snippet, unverified]: https://shareindia.com/?p=62709
- GitHub repo search (API): https://api.github.com/search/repositories?q=QAOA+portfolio+optimization ; ...q=quantum+portfolio+optimization+qiskit ; ...q=VQE+portfolio+optimization
