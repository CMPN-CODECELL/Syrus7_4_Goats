# Community pulse: quantum computing in finance (2026-10-09)

Scope: what people are saying in the last 30 days (last30days engine: Reddit and Hacker News), plus 2025-2026 press, bank and research coverage (WebSearch). Anything marked [unverified] could not be confirmed from the snippets seen.

## Coverage and caveats
- Engine ran twice (quantum portfolio optimization; quantum computing finance hype), about 230 s each. Active sources: Reddit, Hacker News. Polymarket and GitHub returned 0 results. X not enabled. YouTube missing (yt-dlp not installed).
- The LLM reranker and fun-scorer returned HTTP 401, so local fallback ranking was used. Arctic Shift listing searches for r/quant and r/investing timed out, so finance-subreddit coverage is partial.
- Most engine hits were off-topic (post-quantum cryptography, hardware news). One Reddit thread (2026-09-24, 110 comments) is substantively about quantum claims for commercial use. Community evidence on finance is thin; the press and research items below carry most of the weight.
- Raw engine output is in the session scratchpad, not in the repo. No other repo file was edited.

## (a) Claims praised and criticised
- HSBC/IBM bond trading (announced 2025-09): HSBC says fill predictions improved "by as much as 34%" over common classical methods. The task is estimating whether a dealer's quote gets accepted; no P&L figure was reported. Coverage called it a "world first" (CBS) and an early win (Reuters, per search summary). Seeking Alpha's headline turned it into "bond trading efficiency". IBM says the gain could not be reproduced by classically simulating the hardware. One independent write-up notes the authors did not claim advantage; social media did. No live-trading follow-up found. No substantive community debate of the 34% surfaced.
- Vanguard/IBM portfolio study (2025-09): hybrid quantum sampling plus classical local search beat purely classical local search on a bond-ETF problem, with the edge growing with size. Benchmarked against CPLEX (relative error 0.49%); the problem was simplified. A secondary blog's "matched CPLEX" wording overstates it; the Finadium write-up is the careful one.
- IBM roadmap: some applications could reach advantage by end-2026 (IBM Quantum, Q1 2026 update). A commitment, not a result.
- JPMorgan: certified-randomness Nature paper with Quantinuum (2025-03-26); up to $10B investment push including quantum (CNBC, 2025-10-13); AWS/Braket hybrid work (2026, detail [unverified]); a June 2026 optimisation data-centre claim rests on one outlet [unverified].
- Community scepticism (Reddit, 2026-09-24): top-voted reply (16 upvotes): "I fell for the hype. I was wrong." Another (13 upvotes): companies and governments "make increasingly speculative claims to secure funding". A 9-upvote reply rejects linear extrapolation of qubit progress.
- Negative signals: Manifold's 2026 prediction markets showed "overwhelming skepticism" of advantage by 2026 (Quantum Insider, 2025-12-30). Over 15 banks run quantum programmes, but none run production-ready systems live (Quantum Insider, 2026-03-27). Goldman Sachs reportedly stepped back on near-term commercial use (2026-04) [unverified].
- Criticised, unproven: QCI faces litigation alleging investor misstatements and reported under $0.4M sales in 2023 and 2024 (Postquantum commentary, date unknown). Allegations only.
- Market sizing: a report puts quantum portfolio optimisation at $142M (2026) rising to $2.42B (2034); methodology not checked [unverified].

## (b) What a credible demo must show
- Measured wall-clock on hardware (or a clearly labelled simulator), not asymptotic scaling. A 2025 benchmark preprint [unverified ID] tested annealing and QAOA on portfolios up to 1,000 assets; off-the-shelf MIP proved optimality in seconds; a tuned heuristic beat the quantum methods at fixed runtime.
- Strong classical baselines: exact MIP or tuned heuristics, not naive greedy. Vanguard used CPLEX as its reference point.
- Scale that matters: hundreds of assets or more. Toy instances do not count.
- Out-of-sample backtest with transaction costs. A 2025 paper's claimed INR 200,000 gain was judged unassessable without test period, baseline or costs [unverified].
- Disclosure of the poster's stake (do they sell quantum products?). Suggested checklist from search synthesis, not a sourced finding.
- Value over speedup: "advantage only counts if it delivers ROI" (Impact Quantum, date unknown). BCG (2026-05) argues near-term gains may come from quantum-inspired software, so a quantum result must also beat that comparator.

## (c) Overdone angles
- "Quantum beats classical" on small instances (e.g. 4 assets). If exact MIP solves 1,000 assets in seconds, small wins read as strawmen.
- Asymptotic speedups (quadratic for QAOA-style portfolio methods, exponential for HHL) presented as runtime wins. The HHL-based version needed pieces unsuitable for NISQ hardware.
- "Qubits are 0 and 1 at once" explainers that inflate speedup claims.
- Market-size reports and "next trillion-dollar market" framing.
- Generic quantum-finance think pieces and Medium opinion posts: more noise than evidence.
- "World first" bank pilots with no classical baseline in the headline (HSBC's 34% is a fill-prediction metric).

## (d) Fresh angles (2026)
- Honest-baseline benchmarking: Show HN "Quantum computing experiments with honest classical baselines" (2026-10-06, 9 points, github.com/p10node/qcpa). Only the title was seen; community reaction [unverified].
- Verdict-first honesty: top-voted r/QuantumComputing replies reward admitting error and punish hype. Demand for falsifiable claims is visible.
- Quantum-inspired classical software as the honest comparator (BCG, 2026-05).
- Fault-tolerance timing for portfolio problems: advantage estimated to need hundreds of logical qubits, late 2020s or early 2030s (Entangled Future guide, 2026). Useful for a "when would this matter" section.
- Indian-market angle (NIFTY 50, Indian costs): not searched. This is a gap to fill before the USP is final.

## (e) Three implications for the team's USP
1. Lead with the exact classical baseline and a verdict on the first screen. At NIFTY 50 scale (50 assets) exact MIP should be near-instant [inferred from the preprint, unverified], so the study's value is the honest comparison, not a speedup. Say so.
2. Show the checks sceptics ask for: out-of-sample backtest, transaction costs (the Indian cost model is a concrete differentiator), a uniform-random baseline, and a noise study. Report simulator and hardware wall-clock separately.
3. Avoid the overdone claims: no "beats classical", no asymptotic speedup, no market-size figures. Frame QAOA as a benchmark instrument whose honest verdict may be "no advantage here".

## Sources (accessed 2026-10-09)
Engine (last30days, window 2026-09-09 to 2026-10-09):
- Reddit r/QuantumComputing, "Has there been a recent breakthrough..." (2026-09-24), reddit.com/r/QuantumComputing/comments/1wp3k0v
- Reddit r/QuantumComputing, "I am a Software Engineer... shift to Quantum Computing" (2026-10-06), comments/1wyvcbw
- Reddit r/Stocks_Picks, "quantum bubble?" (2026-10-03), comments/1wwxwq5
- Show HN, "honest classical baselines" (2026-10-06), github.com/p10node/qcpa
- HN, "Ask HN: What happened with quantum computers anyway?" (2026-10-08), news.ycombinator.com/item?id=50008531
WebSearch (press, bank, research; dates as reported):
- HSBC/IBM bond trading: euronews.com/business/2025/09/25/...; cbsnews.com/news/ibm-hsbc-quantum-computing-bond-trading/ (2025-09); seekingalpha.com/news/4498674 (2025-09)
- Vanguard/IBM: quantumcomputingreport.com/ibm-and-vanguard-explore-quantum-optimization-for-portfolio-construction/ (2025-09); finadium.com/vanguard-probes-quantum-optimization-for-portfolio-construction-with-ibm/ (2025-09)
- IBM roadmap: ibm.com/quantum/blog/whats-new-q1-2026 (Q1 2026); ibm.com/roadmaps/quantum/2026/
- JPMorgan: cnbc.com/2025/10/13/quantum-stocks-jpmorgan-investing-push.html (2025-10-13); jpmorgan.com/technology/news/certified-randomness (2025-03-26); cryptobriefing.com/aws-jpmorgan-quantum-computing-finance-partnership/ (date [unverified])
- BCG: bcg.com/publications/2026/how-firms-can-achieve-quantum-advantage-without-a-quantum-computer (2026-05)
- Quantum Insider banks roundup: thequantuminsider.com/2026/03/27/15-plus-global-banks-probing-the-wonderful-world-of-quantum-technologies/ (2026-03-27)
- Quantum Insider, Manifold 2026 predictions: thequantuminsider.com/2025/12/30/manifold-markets-2026-quantum-computing-predictions-industry-heads-into-2026-with-hype-tempered-by-reality/ (2025-12-30)
- Entangled Future guide: entangledfuture.com/guides/quantum-computing-for-finance/ (2026)
- Postquantum, "Quantum Winter Warning": postquantum.com/quantum-computing/quantum-winter-warning/ (date unknown)
- IEEE Spectrum, "Quantum Computing's Hard, Cold Reality Check" (Aaronson and Painter quotes): spectrum.ieee.org/quantum-computing-skeptics (date unknown)
- MIT Technology Review, "Quantum computing has a hype problem": technologyreview.com/2022/03/28/1048355/ (2022-03-28)
- Impact Quantum, "Quantum Finance: Hype vs. Reality": impactquantum.com/quantum-finance-hype-vs-reality/ (date unknown)
- Benchmark preprint, annealing/QAOA vs classical portfolios (2025; arXiv ID not confirmed) [unverified]
- Market-size report, quantum portfolio optimisation (2026) [unverified methodology]
