# 15 - Novel quantum features for the optimiser (research note, 2026-10-09)

Scope: 2024-2026 literature on QAOA for portfolio optimisation, scored against the repo as it stands. Sources are tagged `[abs]` (arXiv abstract fetched and read), `[snip]` (search summary only, not read in full), or `[unverified]` (not confirmed in any source I could read). Effort figures are my estimates for a 3-6 h hackathon slot. Source list is at the bottom as [S#].

## What the repo already has (not counted as novel)
- `qaoa.uniform_control`: uniform-random baseline over the feasible Dicke subspace (XY) or all bitstrings (standard) - p_opt, feasible_rate, approx_ratio, best_of_shots_hit. The "uniform baseline" candidate is already done.
- Dicke initial state (`ansatz.dicke_circuit`, O(nk) per [S7]) and XY ring mixer.
- INTERP and TQA-style ramp initial points (`init_points.py`); no classical solution enters them.
- FakeGuadalupeV2 noisy sampling, `transpile_stats` (depth, two-qubit gate count).
- Honesty rules (AGENTS.md rule 4): no classical initial state, no silent repair of infeasible samples, no "advantage" wording.
- Pins: qiskit 2.5.2, qiskit-aer 0.17.2, qiskit-ibm-runtime 0.50.0. Cap: 16 variables including slack bits (sector-cap slack bits count toward it).

## Idea records

**1. Tail (CVaR-style) objective with equal-budget ablation**
- Source: [S1] Barkoutsos et al., arXiv:1907.04769 `[abs]`; ascending-CVaR follow-up arXiv:2105.11766 `[snip]`.
- What: optimise the mean of the best alpha-share of sampled energies instead of <H>. Label it "tail objective" in the UI to avoid confusion with financial CVaR.
- Impact: abstract says CVaR gives "faster convergence to better solutions" on all combinatorial problems tested, in simulation and on hardware `[abs]`. Body summary says CVaR-QAOA at small depth gives flat states and CVaR-VQE was preferred `[snip, unverified]`. No portfolio P(opt) number found. A third-party "1% vs 60%" figure is `[unverified]`; do not quote it.
- Effort: 2-3 h (exact tail from statevector probabilities, at most 2^16 entries; one flag; ablation runs).
- Risk: may show no gain at p=1-2, which is still a valid result. Naming confusion with financial CVaR.
- Honest comparison: yes, if run at equal shots against the expectation objective and `uniform_control`.

**2. Parameter transfer 10 to 12 assets, with fixed-schedule control**
- Source: [S3] Basso et al., arXiv:2305.15201 (Quantum 8:1231, 2024) `[abs]`; [S4] Galda et al., arXiv:2106.07531 `[abs]`; [S5] Montanez-Barrera et al., arXiv:2402.05549 (QIP 24:129, 2025) `[abs]`, portfolio among six problems, no numbers.
- What: reuse (gamma, beta) optimised at n=10 on an n=12 instance after rescaling; compare with random, ramp and INTERP at the same evaluation budget.
- Impact: Basso et al. report, for XY-mixer portfolio, about 7.4x fewer optimiser iterations on average `[abs]`; fixed parameters within 1.1 percentage points of optimised energy on average `[abs]`, context unclear. Galda et al.: 6-node to 64-node MaxCut transfer with under 1% approximation-ratio loss `[abs]`. Our own gain is unmeasured.
- Effort: 3-4 h. 10 to 20 assets breaks the 16-variable cap and the 16-qubit noise backend, so it needs a TEAM-1 decision and is noiseless-only. 10 to 12 fits if slack stays small (`[unverified]` for our QUBO).
- Risk: few instances; slack bits may break transfer; a 2025 preprint reports transfer limits at high round counts `[snip, unverified]` [S34].
- Honest comparison: yes; uses only QAOA-derived parameters.

**3. LR-QAOA fixed linear-ramp schedule (zero-optimiser control)**
- Source: [S6] Montanez-Barrera et al., arXiv:2405.09169 (npj QI 2025) `[abs]`.
- What: two parameters, dBeta and dGamma, with beta_i = (1 - i/p) dBeta and gamma_i = ((i+1)/p) dGamma; grid-search them, no classical optimiser.
- Impact: simulated success probability scales as 2^(-eta(p) N_q + C), with eta(10)=0.22 and eta(100)=0.05 for weighted MaxCut `[abs]`. Hardware runs reached 109 qubits at p=100 with 21,200 CNOTs, across IonQ, Quantinuum and IBM `[abs]`. Portfolio is not mentioned `[abs]`.
- Effort: 1-2 h. Not free: the repo's `init_points.ramp` is TQA-style with fixed dt=0.75, so the two-parameter schedule is new code.
- Risk: low; may lose to COBYLA.
- Honest comparison: strong as a zero-optimiser control.

**4. Reachable-set ceiling diagnostic**
- Source: [S10] Ubale et al., arXiv:2610.00736 `[abs]`, preprint submitted 30 Sep 2026 `[unverified]`. Reports Pearson 0.7003 and Spearman 0.8057 between reachable-quality score Q_R and shallow-QAOA performance over 207 CVaR configurations `[abs]`.
- What: breadth-first search over the XY-ring support reachable in p layers from the Dicke start; the maximum objective in that set bounds any parameter choice for that circuit. Parameter-independent.
- Impact: separates "the circuit cannot reach the optimum at depth p" from "the optimiser failed"; expected value unknown.
- Effort: 3-4 h. Risk: preprint; slack-bit handling needs care.
- Honest comparison: strong; it stops us blaming the optimiser.

**5. Warm-start QAOA (Egger et al.)**
- Source: [S2] Egger, Marecek, Woerner, arXiv:2009.10095 (Quantum 5:479, 2021) `[abs]`: warm-starting "is particularly beneficial at low depth" in portfolio optimisation. [S11] Somkuwar et al., arXiv:2606.07727 (June 2026) `[abs]`: warm-start QAOA suffers "catastrophic hardware decoherence" versus a hardware-efficient ansatz on NIFTY 50 subsets up to 16 assets. Its transpiled-depth figures (301 vs 51) are `[snip, unverified]`.
- What: product initial state from a continuous relaxation, with a per-qubit warm-start mixer and a regularisation epsilon.
- Impact: abstract-level only; no numbers verified.
- Effort: 2-3 h.
- Risk: conflicts with AGENTS.md rule 4, which allows only INTERP as a warm start. The relaxation reads as classical injection. Needs a TEAM-1 rule change and a clear label.
- Honest comparison: weak unless shipped as a separately labelled hybrid variant.

**6. Sector decomposition for all 50 stocks**
- Sources: [S12] Acharya et al., arXiv:2409.10301 (PRR 7:023142, 2025) `[abs]`: RMT denoising and spectral clustering, about 80% subproblem size reduction, no performance numbers. [S14] DQAOA, arXiv:2407.20212 `[abs]`: 1,000-bit problem in about 276 s, no baselines. [S13] arXiv:2602.23976 `[abs]`: 250 assets on a 64-qubit trapped-ion system using BF-DCQO, not QAOA, no numbers. [S15] DC-QAOA, arXiv:2102.13288 `[snip]`.
- What: split 50 assets into clusters of at most about 12 (sectors or correlation clusters), solve each with QAOA, recombine under the cardinality and sector caps.
- Impact: unlocks 50 stocks; I found no verified accuracy numbers for sector-based splits.
- Effort: 6-10 h. Over the 3-6 h budget.
- Risk: high. The 16-variable cap must change; the recombination step is classical; an exact 50-asset baseline is required.
- Honest comparison: only if the recombination is labelled as classical post-processing.

**7. Error mitigation: readout, ZNE, feasibility post-selection**
- Sources: [S23] M3, Nation et al., arXiv:2108.12518 (PRX Quantum, 2021) `[snip]`: calibration cost 2L circuits, corrects measurement errors only. [S24] Temme, Bravyi, Gambetta, arXiv:1612.02058 `[snip]`. [S25] IBM docs `[snip]`: resilience level 1 is TREX readout mitigation; level 2 adds ZNE and gate twirling at about 3x overhead; the Sampler has no resilience_level. [S18] arXiv:2602.09047 `[abs]`: ZNE on an 88-variable carbon-credit QAOA on ibm_torino and ibm_fez; scores 58.47 +/- 6.98 vs greedy 44.42 (+31.6%, p=0.0009, d=2.01). The comparator is greedy, not the exact optimum, and no feasibility numbers are given. [S17] arXiv:2604.19426 `[abs]`: on ibm_fez (Heron r2), hardware landscape compression reaches 0.72-0.81 at n=16, and noise mainly erodes feasible samples.
- What: TREX on the Estimator path, or M3 on the Sampler path, plus feasibility post-selection with no repair.
- Impact: readout correction addresses measurement bias, not the gate-noise feasibility loss in [S17] (inference). ZNE on feasible fraction is unvalidated (inference). A ZNE overcorrection at p of 3 or more is reported in an XY-mixer study `[snip, unverified]` [S20].
- Effort: TREX 1-2 h; M3 path 2-3 h plus a new dependency (mthree, TEAM-1 approval).
- Honest comparison: yes, given the no-repair rule.

**8. Real IBM Heron run, one 16-variable instance**
- Sources: [S19] arXiv:2607.11637 `[abs]`: on Heron r1/r2 with resilience level 2, the noise-dominated operating point is about 770 two-qubit gates at median CZ error; a uniform-random control is matched. [S17] `[abs]` as above. [S20] arXiv:2604.02083 `[abs]`: iterative warm-start XY on ibm_boston with classical repair, which conflicts with our rules.
- What: one instance, p=1-2, transpiled to a Heron device, TREX on, post-select feasible shots (no repair), compare with FakeGuadalupeV2 and `uniform_control`.
- Impact: first-hand hardware evidence. Prior from [S17] points to feasibility collapse, an honest negative. Quantitative outcome unknown.
- Effort: 4-5 h, plus uncontrolled queue time; QPU quota `[unverified]`.
- Risk: the user must supply IBM credentials; I must not enter them. AGENTS.md bans qiskit_ibm_runtime SamplerV2/EstimatorV2 as "deprecated in 0.50" (docs/research/08-env-spike.md line 54), while IBM docs describe EstimatorV2 resilience options. This conflict needs TEAM-1 resolution `[unverified]`. Check transpiled CZ count against about 770.
- Honest comparison: strong, provided negative results are reported.

**9. Quantum-inspired classical baselines**
- Simulated bifurcation: [S26] Bouquet, arXiv:2108.03092 `[snip]`: fixed-cardinality subsets of 6 to 18 assets, optimum returned in 138 of 150 runs. [S31] Steinhauer, arXiv:2009.08412 `[snip]`: up to 1,000 assets.
- Tensor networks: [S27] Tindall et al., arXiv:2306.14887 `[snip]`: belief-propagation tensor-network simulation of IBM's Eagle kicked-Ising experiment. I found no 2024-2025 tensor-network baseline for QAOA optimisation `[gap]`. At 16 variables brute force is exact, so tensor networks add nothing here.
- Effort: simulated bifurcation in numpy 2-3 h (no new dependency).
- Honest comparison: strong, as a classical baseline that scales toward 50 assets.

**10. Exact MIP baseline (honesty gap)**
- Source: [S21] Stopfer and Wagner, arXiv:2509.17876 (Fraunhofer, Sept 2025) `[snip]`: 250 instances up to 1,000 assets; mixed-integer programming proves optimality in seconds; a problem-tailored heuristic beats QAOA and annealing at fixed runtime. Abstract not read in full `[unverified]`.
- What: an exact MIP/MIQP reference. Our CVXPY relaxation-plus-rounding baseline is weak by comparison.
- Effort: 1-2 h if the pinned cvxpy 1.9.3 has a usable MIP solver `[unverified]`; otherwise a new dependency needing TEAM-1 approval.
- Honest comparison: essential before any scaling claim.

## Rejected, or already covered
- RQAOA [S22] Bravyi et al., arXiv:1910.08980 (PRL 125:260505, 2020) `[abs]`: non-local QAOA beats standard QAOA on frustrated 3-regular Ising instances, numerically. RQAOA attribution to this group is `[unverified]`, from secondary sources [S30]. At 16 variables it is unnecessary, and each elimination step is classical. Effort 4-6 h.
- Circuit cutting [S28] Peng et al., PRL 125:150504 (2020) `[snip]`: overhead exponential in cuts; a 2025 study reports sampling distributions shifted toward suboptimal values `[unverified]`. Effort above 6 h. Rejected.
- Dicke state preparation and XY mixer: already implemented. Constraint-preserving evidence: [S8] arXiv:2602.14827 `[abs]`, 10 US equities, Sharpe 1.81 (QAOA) vs 1.31 (SA) vs 0.98 (HRP), turnover 76.8%, hardware not stated. [S9] arXiv:2605.06858 `[abs]`, counterdiabatic XY beats XY, Grover and penalty at fixed depth, simulation only, no numbers.

## Ranking: top 3 for judge impact with honest evidence
1. **Real IBM Heron run (idea 8), with TREX and no-repair feasibility post-selection.** Effort 4-5 h plus queue. Impact: first-hand hardware evidence against the uniform control and FakeGuadalupeV2; the expected result is an honest negative on feasibility. Gate: IBM credentials from the user and a TEAM-1 decision on the runtime primitives.
2. **Tail objective with equal-budget ablation (idea 1), plus the LR-QAOA zero-optimiser control (idea 3).** Effort 4-5 h combined. Impact: P(opt) and best-of-shots against expectation and uniform baselines; magnitude unknown, so the ablation is the evidence.
3. **Parameter transfer 10 to 12 assets (idea 2).** Effort 3-4 h. Impact: fewer optimiser evaluations at matched quality; literature suggests up to about 7.4x `[abs]`, unmeasured here.
Not recommended within 3-6 h: sector decomposition for 50 stocks (idea 6), 6-10 h and cap-breaking, a stretch goal. Add the exact MIP baseline (idea 10) regardless, since it is cheap and guards the honesty story.

## Unverified or gaps
- Galda, Basso and Montanez-Barrera results are abstract-level only; no portfolio P(opt) figures were verified.
- Brandao et al. 2018 (concentration) and Akshay et al. 2021 are cited by title only; arXiv IDs `[unverified]`.
- Dicke CNOT constants (5kn CNOT, 4kn Ry) are from a search summary `[unverified]`.
- Qiskit 2.5 APIs were not checked against docs; all Qiskit effort figures are estimates.

## Sources
- [S1] Barkoutsos et al., arXiv:1907.04769, https://arxiv.org/abs/1907.04769 `[abs]`
- [S2] Egger, Marecek, Woerner, arXiv:2009.10095, https://arxiv.org/abs/2009.10095 `[abs]`
- [S3] Basso et al., arXiv:2305.15201, https://arxiv.org/abs/2305.15201 `[abs]`
- [S4] Galda et al., arXiv:2106.07531, https://arxiv.org/abs/2106.07531 `[abs]`
- [S5] Montanez-Barrera, Willsch, Michielsen, arXiv:2402.05549, https://arxiv.org/abs/2402.05549 `[abs]`
- [S6] Montanez-Barrera et al., arXiv:2405.09169, https://arxiv.org/abs/2405.09169 `[abs]`
- [S7] Bartschi and Eidenbenz, arXiv:1904.07358, https://arxiv.org/abs/1904.07358 `[snip]`
- [S8] Mancilla et al., arXiv:2602.14827, https://arxiv.org/abs/2602.14827 `[abs]`
- [S9] Falla and Safro, arXiv:2605.06858, https://arxiv.org/abs/2605.06858 `[abs]`
- [S10] Ubale et al., arXiv:2610.00736, https://arxiv.org/abs/2610.00736 `[abs]` (preprint)
- [S11] Somkuwar et al., arXiv:2606.07727, https://arxiv.org/abs/2606.07727 `[abs]`
- [S12] Acharya et al., arXiv:2409.10301, https://arxiv.org/abs/2409.10301 `[abs]`
- [S13] arXiv:2602.23976, https://arxiv.org/abs/2602.23976 `[abs]`
- [S14] DQAOA, arXiv:2407.20212, https://arxiv.org/abs/2407.20212 `[abs]`
- [S15] Li, DC-QAOA, arXiv:2102.13288, https://arxiv.org/abs/2102.13288 `[snip]`
- [S16] IBM and Vanguard, arXiv:2508.13557, https://arxiv.org/abs/2508.13557 `[abs]`
- [S17] Landscape compression in constrained QAOA, arXiv:2604.19426, https://arxiv.org/abs/2604.19426 `[abs]`
- [S18] Carbon-credit QAOA with ZNE, arXiv:2602.09047, https://arxiv.org/abs/2602.09047 `[abs]`
- [S19] Real-hardware QAOA benchmark, arXiv:2607.11637, https://arxiv.org/abs/2607.11637 `[abs]`
- [S20] Iterative warm-start XY mixers, arXiv:2604.02083, https://arxiv.org/abs/2604.02083 `[abs]`
- [S21] Stopfer and Wagner, arXiv:2509.17876, https://arxiv.org/abs/2509.17876 `[snip]`
- [S22] Bravyi et al., arXiv:1910.08980, https://arxiv.org/abs/1910.08980 `[abs]`
- [S23] Nation et al. (M3), arXiv:2108.12518, https://arxiv.org/abs/2108.12518 `[snip]`
- [S24] Temme, Bravyi, Gambetta, arXiv:1612.02058, https://arxiv.org/abs/1612.02058 `[snip]`
- [S25] IBM Qiskit docs, configure error mitigation, https://quantum.cloud.ibm.com/docs/guides/configure-error-mitigation `[snip]`
- [S26] Bouquet, arXiv:2108.03092, https://arxiv.org/abs/2108.03092 `[snip]`
- [S27] Tindall et al., arXiv:2306.14887, https://arxiv.org/abs/2306.14887 `[snip]`
- [S28] Peng et al., PRL 125:150504 (2020), no arXiv ID verified `[snip]`
- [S29] Brandhofer et al., arXiv:2207.10555 (repo note docs/research/04) `[repo]`
- [S30] Bae and Lee, arXiv:2211.15832, https://arxiv.org/abs/2211.15832 `[snip]`
- [S31] Steinhauer et al., arXiv:2009.08412, https://arxiv.org/abs/2009.08412 `[snip]`
- [S34] arXiv:2509.13528, https://arxiv.org/abs/2509.13528 `[snip, unverified]`
