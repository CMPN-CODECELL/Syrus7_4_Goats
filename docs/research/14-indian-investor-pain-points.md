# Indian retail investors: pain points for a portfolio-building USP

Date: 2026-10-09. Method: WebSearch (standard) and WebFetch. Several primary documents returned HTTP 403 or only a headline (SEBI cash-segment press release, NSE Market Pulse, Harvard/CEPR papers, Business Standard survey page), so most figures come from press coverage and are labelled. Items marked [unverified] could not be confirmed against a primary source. Tool features were read from vendor help pages and blogs, not tested hands-on.

## 1. Top 5 pain points

**P1. Speculative derivatives losses. Headline: 91% of individual equity-derivative traders lost money in FY25; aggregate net loss Rs 1,05,603 crore (up 41% from Rs 74,812 crore in FY24).**
- SEBI comparative study, July 2025 (window Dec 2024 to May 2025; FY25 figures). Average loss per trader Rs 1.1 lakh.
- Earlier SEBI F&O study, Sept 2024: 93% of over 1 crore individual traders lost about Rs 2 lakh each over FY22 to FY24; aggregate loss above Rs 1.8 lakh crore [secondary: Outlook Money].
- Newer SEBI study covering FY25-26: 87.7% still lost money [unverified: search summary only].
- Sources: https://www.business-standard.com/amp/markets/capital-market-news/sebi-sees-dip-in-derivatives-turnover-91-of-retail-traders-lose-money-in-fy25-125070800660_1.html ; https://moneylife.in/article/91-percentage-of-retail-traders-lost-money-in-derivatives-losses-in-fo-surged-41-percentage-to-rs105-lakh-crore-in-fy25-sebi-study/77613.html ; https://www.outlookmoney.com/invest/93-of-individual-traders-suffered-losses-in-fo-in-last-3-years-sebi-study

**P2. Costs that compound losses. Headline: loss-making individual intraday traders paid trading costs equal to 57% of their losses (FY23).**
- SEBI cash-segment study, July 2024 (top-10 brokers, about 86% of individual clients). 7 in 10 intraday traders (71%) lost money in FY23. Loss share rose to 80% for traders with more than 500 trades a year. 76% of under-30s lost money. Profitable traders paid costs equal to 19% of profits.
- Delivery round trip on Rs 1 lakh (buy and sell, zero brokerage): about Rs 245, or 0.24%. STT is about 80% of it. Our calculation from published rates: STT 0.1% each side, stamp 0.015% on buy, exchange charge, SEBI fee, GST 18%, DP Rs 18.50 per scrip on sell. DP charges alone make a Rs 5,000 sale cost about 0.44%.
- Sources: https://taxmann.com/post/blog/sebi-study-finds-that-7-out-of-10-individual-intraday-traders-in-equity-cash-segment-make-losses ; https://www.motilaloswal.com/learning-centre/2024/7/sebi-study-reveals-key-insights-on-individual-intraday-traders-in-india ; https://www.sebi.gov.in/media-and-notifications/press-releases/jul-2024/sebi-study-finds-that-7-out-of-10-individual-intraday-traders-in-equity-cash-segment-make-losses_84948.html (headline only) ; https://upstox.com/pricing/ ; https://www.zerodha.com/charges

**P3. Under-diversification. Headline: 29% of accounts hold a single listed equity; over half hold fewer than three [unverified: 2016 blog analysis, period not stated].**
- Academic corroboration, dated: Balasubramaniam, Campbell, Ramadorai and Ranish, "Who Owns What?" (Journal of Finance 2023). Built on about 9.7 million Indian accounts, August 2011 snapshot. Single-stock accounts are an identifiable investor group.
- NSE economics study (2021): over 80% of retail investors had net investment under Rs 50,000 in a year. Stock counts per investor were not accessible.
- Trading concentration: retail traded value in top-decile stocks by free-float rose from 53.4% (Q1 2017) to 70.5% (Q3 2021).
- Sources: https://www.nber.org/papers/w29065 ; https://blog.theleapjournal.org/2016/11/direct-participation-in-indian-equity.html ; https://money9.com/news/investment-planning/retail-investors-have-not-fared-badly-in-stocks-says-a-report-95607.html ; https://bseindia.com/xml-data/corpfiling/AttachHis/5d9445db-5787-4565-adfc-4963184906c2.pdf

**P4. Whole-share and high-price barrier. Headline: one MRF share at Rs 1,32,050 (23 June 2026 quote) is about 26% of a Rs 5 lakh portfolio.**
- India has no fractional shares for listed equity. The Companies Act change is still pending (5paisa, 24 Aug 2026). Sandbox trials exist (SEBI innovation sandbox; GIFT City IFSC regulatory sandbox).
- Page Industries was quoted at about Rs 39,612 in 2023 [unverified current price].
- Our inference: a small portfolio forced into whole shares gets lumpy weights, so concentration rises.
- Sources: https://www.5paisa.com/news/sebi-seeks-legal-recognition-for-fractional-shares-under-companies-amendment-bill ; https://www.angelone.in/live-blog/mrf-ltd-23-jun-2026-297665 ; https://www.kotaksecurities.com/investing-guide/share-market/why-is-mrf-share-price-so-high ; https://www.icicidirect.com/research/equity/finace/buying-fractional-shares-in-india

**P5. Weak trust and advice access; finfluencer-driven choices. Headline: about 941 SEBI-registered investment advisers (all types, March 2025) against about 19.2 crore demat accounts, roughly one adviser per 200,000 accounts [secondary: The Ken].**
- SEBI Investor Survey 2025 (Kantar, over 90,000 households): 63% aware of securities products, 9.5% participate (about 3.21 crore of 33.72 crore households). Risk aversion and trust deficit are the main barriers. A majority say finfluencers shape their decisions.
- A "36% have moderate market knowledge" figure appeared in one summary; not confirmed [unverified].
- Sources: https://moneylife.in/article/just-1-in-10-indian-households-invests-in-stocks-finfluencers-driving-retail-trends-sebi-survey/78471.html ; https://oga-prod.angelone.in/news/market-updates/sebi-report-reveals-low-household-participation-in-securities-at-9-5 ; https://the-ken.com/story/sebi-registered-advisors-are-an-endangered-species-so-who-guides-retail-investors/

## 2. What existing Indian tools offer (read from public material; not tested)

- **smallcase:** model portfolios by managers; rebalancing by "proprietary algorithms" tied to earnings and news. Updates are one-click and never automatic. Weight caps and sector limits are not disclosed in sources reviewed. Fees differ by manager; amounts not found. A rebalance buffer hides orders at or below Rs 500 or 1% of net worth to avoid DP charges (Capitalmind, 2020/21) [unverified for 2026].
- **Zerodha Kite / Console:** holdings grouped by sector; analytics (returns, dividends, "red flags"). A sector nudge appears when an order pushes one sector above 50% of holdings; it does not block the order. Sector limits are "planned". Baskets hold up to 20 orders, 50 baskets, no fee, but no target weights. No built-in optimiser or rebalancer (one forum reply, not official).
- **INDmoney:** stock analytics (XIRR, sector and market-cap split, Nifty 50 comparison). Its MF scan flags sector overexposure and stock concentration across funds.
- **Paytm Money:** analytics by sector and market cap; warns when too heavy in one industry. Vendor blog claims.
- **Kuvera:** family dashboard, alerts for rebalancing and tax-loss harvesting. No holding-level sector view found.
- **Groww:** no own portfolio-analysis documentation found (gap in our research).
- **Benchmark:** FundsIndia "X-ray" (not one of the four) shows asset allocation, sectors, geography, top 10 holdings.
- **Default for small capital is SIP into funds:** August 2026 SIP flow Rs 32,297 crore; 10.02 crore contributing accounts; SIP assets about 21.4% of AUM (AMFI via Angel One). Any stock tool competes with SIPs, not only with other apps.

Gaps against the user's list:
- Transparent optimisation: none of the four states its objective or constraints.
- Cost-aware rebalancing: only smallcase's order buffer; no tool found that weighs trade cost against expected benefit.
- Why a stock was picked: no per-stock rationale found; smallcase cites a proprietary algorithm.
- Fractional mismatch: no tool bridges to whole shares for small capital, other than SIPs and ETFs.
- Enforced sector caps: none found. Kite and Paytm warn; INDmoney flags.

## 3. What a constrained optimiser can realistically address

Realistic to build and to state honestly:
- Pick K of N NIFTY 50 names under sector caps (binary selection plus linear caps).
- Whole-share allocation for a stated budget (integer variables). Show the gap between target weights and buyable shares.
- Cost-aware choices: STT, stamp, exchange, SEBI fee, GST, DP and brokerage as explicit costs; a rebalance penalty for turnover. This addresses P2 directly.
- Explanations: each holding's contribution to expected return, risk, sector weight and cost; which constraints bind. These describe the model's choice, not a forecast.
- Out-of-sample test against NIFTY 50: needs point-in-time constituents (avoid survivorship bias), a total-return index, cost-inclusive returns, and several windows. One window is weak evidence.

Not realistic, do not claim:
- Reliably beating the index out of sample.
- Fractional shares, tax planning, or live execution.
- Personalised advice. Robo-advice falls under SEBI investment-adviser rules (Mondaq explainer). Label any demo as educational.

Is quantum relevant to the user?
- To the user: no. P1 to P5 are solved by costs, whole shares, constraints, explanations and honest testing. None needs quantum hardware.
- To the team: only the method. A K-of-N problem with sector caps on N=50 is a small integer program, and a classical MIP solver is the natural baseline. Whether QAOA or quantum-inspired solvers match it is a method question we have not benchmarked [unverified].
- Recommendation: present quantum as solver research, not the USP. Benchmark the classical solver first and report it alongside.

## 4. Three honest USP framings

1. **"Buy what you can afford, with every rupee of cost shown."** Whole-share allocation for a stated budget; costs itemised before you buy; rebalance suggested only when modelled benefit exceeds modelled cost. Grounded in P2 and P4. Claim: cost transparency, not better returns.
2. **"Every pick explained, every limit visible."** Each holding carries a plain-language reason tied to the stated constraints (K names, sector cap, costs). The backtest against NIFTY 50 shows losing windows too. Grounded in P3 and P5. Claim: transparent process, no forecast.
3. **"Guardrails for a small portfolio, not a stock tip."** Enforced sector caps and a fixed number of names address the single-stock and single-sector risk that Kite's warning-only nudge leaves to the user. Grounded in P1 and P3. Claim: lower concentration risk; the model cannot promise returns.

None of the three claims quantum-driven returns.

## 5. Unverified items and gaps

- SEBI cash-segment report, NSE Market Pulse and Harvard/CEPR PDFs were not accessible (403 or headline only). Figures are from secondary coverage.
- FY25 F&O figures are from press coverage; the SEBI PDF was not opened.
- MRF latest price found is 23 June 2026; price on 9 Oct 2026 [unverified]. Page Industries figure is from 2023 [unverified].
- DP and exchange rates vary by broker; the worked example uses published rates and no NSE or SEBI circular was checked.
- 29% single-stock figure: 2016 blog, period not stated [unverified].
- Investor-knowledge 36% figure [unverified]. Academic study with n=257 linking diversification to herding and overconfidence [unverified].
- Sector-bias evidence for bank and IT overconcentration: not found. Do not use as a pain point without new data.
- smallcase fees and 2026 rebalance-buffer rule [unverified].
- The 941-adviser count covers all investment advisers, not robo-advisers only.
