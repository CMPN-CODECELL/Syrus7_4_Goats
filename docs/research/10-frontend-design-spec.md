# 10. Frontend design spec: Quantum Portfolio Optimiser

Date: 2026-10-09. Scope: `frontend/` visual system and components. The palette is fixed by `TEAMS/TEAM-4-antigravity-frontend/DESIGN.md` and is not changed here. **[unverified]** marks claims not checked against a primary page: NN/g, Material 3, Carbon and Linear pages were blocked from fetch, so their claims come from search excerpts. "read" means the page was fetched and read this session.

## 0. Decisions that matter most
- **Results order:** verdict first, then metric cards, portfolio and frontier, solver table, histogram, honesty detail, out-of-sample. The brief lists the verdict last; the rubric scores honesty, so it moves to the top.
- **Font:** system stack with tabular numerals. No Inter until TEAM-1 approves a font dependency (AGENTS.md: no new dependencies without TEAM-1).
- **Header:** 64 px panel row plus a 6 px gradient bar beneath it. No text sits on the gradient: cream text is 1.67:1 on #FFA586.
- **Motion:** no count-up on money or returns. Results fade in once, 200 ms.
- **Infeasible bars:** #B51A2B is 1.99:1 against the panel, below the 3:1 non-text threshold, so they get a #FF8A8A 1 px stroke and a text label.
- **Progress:** percent-done from backend fractions only. Never a decorative or fake bar.

## 1. Design principles (each tied to a source)
1. **Earn visual weight.** Content leads and navigation recedes. Linear's March 2026 refresh dimmed its sidebar so the work area leads **[unverified: search excerpt]**. Refactoring UI: "Not all elements deserve equal emphasis" and "De-emphasize secondary elements" (refactoringui.com, read).
2. **Numbers are the hero; labels are quiet.** Robinhood's designers use colour to signal market state, not decoration (Behance blog, read). Right-align numeric columns so decimals line up, and put units in headers, not cells (Ambitious Designer, read).
3. **Summary first, detail on demand.** Vanguard's 2026 dashboard centres performance and moves trend charts higher, citing information overload and inertia from its research (Vanguard press release 2 Sep 2026, read). Stripe's merchant dashboard uses design tokens and colour generated from WCAG contrast rules (Ström-Awn case study, read).
4. **Uncertainty stays visible beside the chart.** Betterment shows a 50% median line, an 80% band, stated assumptions and disclaimers next to its goal projection (Betterment disclosure, read). Our honesty panel does the same for QAOA against classical solvers.
5. **Progress tells the truth.** Show percent-done only when it is measured. Never stall, reset or fake it. Say why when work pauses. Past 10 s show percent-done; past about 1 min, notify on completion (Smashing Magazine and Nielsen's UX Tigers notes, read).
6. **Forms: one concern per group, labels above fields, one-sentence hints, no asterisks.** Mark optional fields "(optional)" (GOV.UK question pages, read).
7. **Colour is never the only signal.** Each solver has a colour, a Recharts marker shape and a legend word (WCAG 1.4.1, read; Recharts Scatter `shape`, read).

## 1b. Product patterns adopted (the brief's list)
| Product | Specific pattern (source) | What the app takes |
|---|---|---|
| Zerodha Kite | Held stocks get a small briefcase icon in screener rows, showing invested, value and P&L (Z-Connect, read). Users asked for a "My Portfolio" preset; Holdings is not a preset (comments, read). | "Held" icon on picker rows; add a "My holdings" preset |
| Groww | No usable UI source. The Tibba page fetched as a studio header with no Groww content (read); other case studies are shallow or fan work. | Nothing copied |
| smallcase | No UI source found; one learning-module case study (search excerpt) [unverified]. | Nothing copied |
| INDmoney | Learning module as a persistent bottom-tab entry, framed as non-intrusive (Plotline, read). | Method tab stays in the header in every state |
| Vanguard | Dashboard built around two questions, "How is my money performing?" and "How can I manage accounts?"; trend charts moved up (release, read). | Verdict and performance first |
| Wealthfront | Ten questions (four ability, six willingness) feed one risk score; a "why this risk score" link; allocation updates live as risk changes (blog and Appcues, read). | Live preview as the slider moves; "why" popover on risk |
| Betterment | Goal projection shows a median line and an 80% band, lists assumptions, defines On Track, and states pre-tax and nominal (disclosure, read). | Basis labels on every chart; band on out-of-sample |
| Robinhood | Colour signals market state, decoration is stripped, and day and night modes follow market hours (Behance, read). | Colour only for sign and status |
| Portfolio Visualizer | Lists efficient frontier, Monte Carlo and backtests; no chart detail on the page (index, read). Economatica circles the chosen frontier point and shows its composition beside the chart (manual, read). | Click a frontier point to select it; composition in the table |
| Koyfin, TradingView | Koyfin saves table templates (help page, search excerpt) [unverified]. TradingView's agency case blames complex panels and "meshed" data (agency claims, read). | One question per chart; no panel sprawl |
| Stripe Dashboard | Design tokens and an extensible theme; colour tokens generated from WCAG contrast rules; tables and modals adapt to small screens (Ström-Awn, read). Table-first emphasis is per a secondary guide [unverified]. | Tokens in `@theme`; the table stays primary |
| Linear | Dimmer sidebar, header actions in fixed places, density kept (search excerpt) [unverified]. | Fixed header action slots |

## 2. Layout
### 2.1 Grid and breakpoints (Tailwind v4 defaults)
- Container: `mx-auto w-full max-w-[1440px] px-4 lg:px-6` (16 px mobile gutter, 24 px desktop).
- Desktop `lg` (1024 px+): `grid lg:grid-cols-[360px_minmax(0,1fr)] gap-6`. Left rail: `lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto`. Results: `min-w-0`. At `xl` (1280 px+), portfolio table and frontier sit side by side; everything else is full width.
- Tablet 768–1023 px: one column. Setup collapses to a summary bar ("K 5 · Risk 4 · ₹10,00,000 · Edit"). Run button sticks to the foot of the rail.
- Mobile 375 px: one column. Setup is an accordion, open while empty. Sticky Run bar: `fixed inset-x-0 bottom-0 border-t border-line bg-panel p-4` (solid, no blur). The page never scrolls sideways; wide tables scroll inside their own card with a sticky first column.

### 2.2 Header
- Row: `h-16 border-b border-line bg-panel px-4 lg:px-6`. Left: 32 px SVG mark and title "Quantum Portfolio Optimiser" (`text-base font-semibold`). Right: tabs Optimise, Evidence, Method.
- Mobile: title row `h-14`, tabs on a second row `h-10`. Three tabs fit in 343 px, so nothing scrolls.
- Gradient bar: `h-1.5 bg-hero-bar` directly under the header. Cream text contrast per stop: #541A2E 11.75:1, #B51A2B 5.84:1, #FFA586 1.67:1, so keep text off the peach stop.
- Logo tile: SVG mark on `bg-hero-gradient`, no letters. The current App.tsx puts a "Q" letter on the gradient.

### 2.3 Optimise page wireframe (E = empty, R = running, D = results)
```
E  [Header 64px: mark  Quantum Portfolio Optimiser              Optimise Evidence Method]
   [gradient bar 6px]
   SETUP RAIL (360px, sticky)           | RESULTS
   Stocks  [Search NIFTY 50         ]   | No portfolio yet
   [IT 6] [Bank 5] [Energy 4] ...       | Pick 5 stocks and set capital, then run.
   3 of 50 picked, need 5               | [ ] 5 stocks picked    [x] Capital set
   K [5]        Risk [----o-----]       | [Run optimiser]  (disabled until ready)
   Sector cap [35 %]  Target [12 %]     |
   Capital  ₹ [10,00,000]               |
   Holdings  [+ Add]                    |
   > Advanced quantum settings          |
   [Run optimiser]                      |
   Footer: disclaimer (section 8)

R  Rail fields disabled, with note "Run in progress". Results show:
   Stage 3 of 6 · Building the QUBO                    12 s elapsed     [Cancel run]
   [##########----------------------]  38%
   Prices [x]  Screen [x]  QUBO [>]  Classical [ ]  QAOA [ ]  Check [ ]
   Live convergence: best energy so far [line chart, 200 px tall]

D  Verdict banner: headline + one line                                  [Run again]
   Metric cards x4: Expected return · Volatility · Objective · Feasible rate
   Portfolio table (xl, left) | Efficient frontier (xl, right)
   Solver comparison table (full width)
   Bitstring histogram: top 20 + "Other" bar, legend in words (full width)
   Honesty panel: What we found | What it does not show | How we checked
   Out-of-sample vs NIFTY 50, with a small table
```

## 3. Typography
- **Stack:** `font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;`. Remove "Inter" from `index.css` until it is bundled, because no font file loads and it never renders. Inter (OFL 1.1, tnum and cv11 features) is the option if TEAM-1 approves a dependency (rsms.me, read).
- **Numbers:** every numeric element gets `tabular-nums` (`font-variant-numeric: tabular-nums`). MDN: figures become equal width so columns align (read). Covers table cells, KPI values, tooltips, axis ticks and inputs.
- **Scale** (px / line-height / weight):

| Role | Size / LH | Weight | Class |
|---|---|---|---|
| Display (verdict headline, hero KPI) | 32 / 40 | 600 | `text-[32px] leading-10 font-semibold tracking-tight` |
| H1 (page title) | 24 / 32 | 600 | `text-2xl leading-8 font-semibold` |
| H2 (card title) | 18 / 24 | 600 | `text-[18px] leading-6 font-semibold` |
| Label (uppercase) | 12 / 16 | 600, +0.06em | `text-xs leading-4 font-semibold uppercase tracking-[0.06em] text-muted` |
| Body | 14 / 22 | 400 | `text-sm leading-[22px]` |
| Table cell | 14 / 20 | 500 | `text-sm leading-5 font-medium tabular-nums` |
| Caption / help | 12 / 18 | 400 | `text-xs leading-[18px] text-muted` |
| KPI value | 28 / 32 | 600 | `text-[28px] leading-8 font-semibold tabular-nums` |
| Code (job id, bitstrings) | 12 / 16 | 400 | `font-mono text-xs leading-4` |

## 4. Spacing, shape and elevation
- **Spacing:** 4 px base. Use only 4, 8, 12, 16, 20, 24, 32, 40, 48 px (Tailwind 1, 2, 3, 4, 5, 6, 8, 10, 12).
- **Card:** `rounded-2xl border border-line bg-panel p-5 lg:p-6`. Sections `space-y-6`. Card header to body `mb-4`.
- **Radius:** cards `rounded-2xl` (16 px); inputs, buttons, banners `rounded-xl` (12 px); pills, chips, badges `rounded-full`. No other radii.
- **Borders vs shadows:** the 1 px `border-line` (#384358) separates cards, rows and inputs. Shadows are for floating layers only (popover, toast, mobile Run bar): `shadow-panel` = `0 10px 30px rgb(0 0 0 / .35)`.
- **Dark elevation recipe:** no glow; surfaces step lighter as they rise. L0 page `bg-ink` (#161E2F). L1 card `bg-panel` (#242F49) plus `border-line`. L2 floating `bg-panel` plus `border border-slate/40` plus `shadow-panel`. Row hover `hover:bg-ink/40` inside a card. Material 2 dark theme adds white overlays from 5% (1 dp) to 16% (24 dp) **[unverified: search excerpt; page not fetched]**.
- Remove `glass-panel` (backdrop blur). It adds decoration without information.

## 5. Components (Tailwind v4 classes; join variants with a small `cx()` helper)
**Button.** Minimum 44 px height for touch. Focus: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-peach`.
- Primary: `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-peach px-5 text-sm font-semibold text-ink transition-colors duration-150 hover:bg-peach/90 disabled:bg-line disabled:text-muted motion-reduce:transition-none`. Ink on peach is 8.7:1.
- Secondary: same base with `rounded-xl border border-line bg-panel px-5 text-sm font-semibold text-text hover:border-slate`.
- Ghost: `inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted hover:bg-line/30 hover:text-text`.
- Danger (cancel run): `inline-flex min-h-11 items-center rounded-xl border border-red/60 bg-wine px-5 text-sm font-semibold text-[#FF8A8A] hover:bg-red/25`. #FF8A8A on wine is 5.9:1. Red text on navy is 2.5:1 and fails.

**Input and select.** `h-11 w-full rounded-xl border border-line bg-ink px-3 text-sm tabular-nums text-text placeholder:text-muted focus:border-peach focus:outline-none focus-visible:ring-2 focus-visible:ring-peach/60 disabled:opacity-50`. Select adds `appearance-none pr-9` and a 16 px chevron. Error: `border-[#FF8A8A]` plus a caption in `text-[#FF8A8A]`. Label `mb-1.5 block text-xs font-semibold text-muted`. Hint `mt-1.5 text-xs text-muted`, one sentence. Units (%, ₹) sit inside the field in `text-muted`.

**Risk slider.** Native `<input type="range">` on a 1–10 scale (proposed), styled with `accent-peach`. Native keeps keyboard and screen-reader behaviour.
```html
<div class="relative pt-9">
  <output class="absolute top-0 -translate-x-1/2 rounded-full bg-peach px-2.5 py-0.5 text-xs font-semibold tabular-nums text-ink" style="left: 44.4%">Balanced · 5</output>
  <input type="range" min="1" max="10" class="h-1.5 w-full cursor-pointer accent-peach" aria-valuetext="Balanced, 5 of 10" />
</div>
<div class="mt-2 flex justify-between text-xs text-muted"><span>Conservative</span><span>Balanced</span><span>Aggressive</span></div>
```
Bubble position: `left = (value - 1) / 9 * 100%`, set inline. Help text: "Risk limits how much volatile stocks can weigh in this run. It is not a recommendation of how much risk you should take."

**Stock picker.** Search input (input recipe) with a right-aligned count, `text-xs tabular-nums text-muted`: "3 of 5 picked". Sector chips: `flex flex-wrap gap-2`; chip `h-8 rounded-full border px-3 text-xs font-medium`. Off: `border-line text-muted hover:border-slate hover:text-text`. On: `border-peach bg-peach/15 text-peach`. Each chip shows its count ("IT 6"). Picked stocks appear as removable chips `h-7 rounded-full bg-line/40 px-2.5 text-xs`. List: `max-h-72 overflow-y-auto rounded-xl border border-line`; rows `flex h-10 items-center gap-3 px-3 text-sm hover:bg-ink/40`, with an `accent-peach size-4` checkbox, mono ticker, name, and right-aligned tabular price.

**Metric card.** `rounded-2xl border border-line bg-panel p-5`. Label row: label style plus a help button `grid size-7 place-items-center rounded-full text-muted hover:text-text` with an `aria-label`. Value: `text-[28px] leading-8 font-semibold tabular-nums text-text`. Delta: `mt-1 flex items-center gap-1 text-xs tabular-nums text-muted`, an arrow icon, the signed difference, and the words "above" or "below" NIFTY 50. Positive text `text-text`, negative `text-[#FF8A8A]`. No green, on purpose: the palette has none, and colour must not carry the meaning alone. Caption states the basis ("in-sample" or "out-of-sample").

**Data table.** Wrapper `overflow-x-auto rounded-2xl border border-line bg-panel`. Table `w-full min-w-[560px] border-separate border-spacing-0 text-sm tabular-nums`. Header cell `sticky top-0 z-10 h-9 border-b border-line bg-panel px-3 text-left text-xs font-semibold uppercase tracking-[0.06em] text-muted`. Body cell `h-10 border-b border-line/70 px-3`. Numeric cells add `text-right`. Hover `hover:bg-ink/40`. No zebra: borders carry the rows. First column `sticky left-0 bg-panel` on mobile. Units go in headers: "Weight (%)", "Shares", "Value (₹)". Totals row `font-semibold`. Missing value "—" in `text-muted`.

**Badge (state always has a word).** Base `inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-semibold`. Optimal: `bg-peach text-ink`. Feasible: `border border-slate/50 text-slate` (5.2:1 on panel). Infeasible: `border border-[#FF8A8A]/50 bg-wine text-[#FF8A8A]`. Labels: "Optimal", "Feasible", "Infeasible".

**Tabs.** Container `flex gap-1 border-b border-line` with `role="tablist"`. Tab `relative h-10 px-3 text-sm font-medium text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-peach`. Selected: `text-text after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:rounded-full after:bg-peach`. Arrow keys move between tabs (WAI-ARIA tabs pattern).

**Progress and stage indicator.** Track `h-2 overflow-hidden rounded-full border border-line bg-ink`. Fill `h-full rounded-full bg-peach transition-[width] duration-300 ease-out motion-reduce:transition-none`, width set inline. Above the bar: stage name `text-sm font-semibold text-text` on the left; "38%" and "12 s elapsed" in `text-sm tabular-nums text-muted` on the right. Stage row `grid grid-cols-3 gap-2 text-xs sm:grid-cols-6`: done `text-text` with a check icon; active `text-peach` with a static dot (no `animate-ping`); pending `text-muted` with a hollow dot. ARIA: `role="progressbar" aria-valuenow="38" aria-valuetext="38%, Building the QUBO"`.

Stage text, keyed to the plan's fractions (U10) and the contract's stage strings:

| Progress | Text shown |
|---|---|
| 0–5% | Fetching NIFTY 50 prices |
| 5–10% | Screening stocks against your limits |
| 10–15% | Building the QUBO |
| 15–30% | Running classical solvers: brute force, relaxation, annealing |
| 30–90% | Optimising QAOA parameters (iteration 63 of 150); drop the iteration part if the API omits it |
| 90–100% | Checking results on held-out data |
| 100% | Done |

Under the bar: "Usually 30 to 60 seconds. You can keep this tab open or come back to it." After 60 s: "Still running. You can cancel and try fewer stocks." If the tab is hidden at completion, set `document.title` to "Done: Quantum Portfolio Optimiser".

**Skeleton loaders.** Blocks `animate-pulse rounded-md bg-line/60 motion-reduce:animate-none`, shaped like the final content. Use only for the NIFTY 50 list and Evidence charts while data loads. Show after 300 ms so fast loads do not flash. Not used for run results (RunProgress covers those). Wrap in `aria-busy="true"` with visually hidden text "Loading stocks".

**Toast and error banner.** Toast: `fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-line bg-panel p-4 text-sm shadow-panel`, `role="status"`, auto-dismiss after 5 s. Error banner (inline, stays until resolved): `rounded-2xl border border-red/60 bg-wine p-4`, `role="alert"`, title `text-sm font-semibold text-[#FF8A8A]`, body `text-sm text-text`, Retry as the secondary button.

**Tooltip and "What this means" popover.** Chart tooltips are in section 6. Help icons open a popover (`aria-expanded`, `aria-controls`): `w-72 rounded-xl border border-slate/40 bg-panel p-3 text-xs leading-[18px] text-text shadow-panel`. Per WCAG 1.4.13 it closes on Esc, stays open while hovered, and stays until dismissed (W3C, read).

**Disclaimer footer.** `mx-auto mt-12 max-w-3xl border-t border-line pt-6 text-xs leading-[18px] text-muted`. Copy in section 8.

## 6. Charts (Recharts 3.10.1, as locked in `frontend/package-lock.json`)
**Shared defaults** (one `chartTheme.ts` imported by every chart):
- Ticks `tick={{ fill: '#A9B3C9', fontSize: 12 }}` (6.3:1 on panel). Axis line `stroke="#384358"`, `tickLine={false}`.
- Gridlines `<CartesianGrid stroke="#384358" strokeOpacity={0.6} vertical={false} />`. Horizontal only. Gridlines are decorative, so their 1.3:1 contrast is acceptable.
- Tooltip `contentStyle={{ background:'#242F49', border:'1px solid #384358', borderRadius:12, color:'#F4EFEA', fontSize:12, fontVariantNumeric:'tabular-nums', boxShadow:'0 10px 30px rgb(0 0 0 / 0.35)' }}`, and `cursor={{ stroke:'#8FA3C8', strokeOpacity:0.5, strokeDasharray:'3 3' }}`. Tooltips show full precision; axes round.
- Legend `<Legend position="top" wrapperStyle={{ paddingBottom: 12, fontSize: 12 }} />`. `position` is documented from 3.10 (read). The histogram uses HTML legend text instead (6.3).
- Formats: INR via the existing `formatINR` (`toLocaleString('en-IN')` gives 10,00,000, matching MDN's en-IN grouping, read). Axis ticks in lakh and crore with a small helper: values ≥1e7 show `x.xx Cr`, values ≥1e5 show `x.x L`. Do not rely on `notation: 'compact'` for en-IN **[unverified]**. Percent at 1 dp (`formatPercent`), except probabilities under 1%, which get 2 dp (0.48%).
- Animation: `isAnimationActive={running ? false : 'auto'}`. Recharts documents that `'auto'` respects reduced motion (read). Live charts never animate, so points do not replay on each update.
- Colour: the series table below. Never more than three hues on one chart; four or more series become small multiples.

**Series key** (colour plus shape; each marker passes 3:1 on the panel):

| Series | Hex | Scatter `shape` | Contrast on panel |
|---|---|---|---|
| QAOA standard | #FFA586 | circle | 6.96 |
| QAOA XY | #FFD2C2 | star | 9.66 |
| Brute force (exact) | #F4EFEA | square | 11.65 |
| Relaxation | #8FA3C8 | diamond | 5.22 |
| Simulated annealing | #C9566A | triangle | 3.18 |
| NIFTY 50 | #A9B3C9 | cross; dashed line `strokeDasharray="6 4"` | 6.32 |

**6.1 Efficient frontier** (`ScatterChart` plus a frontier `Line`). X = annualised volatility (%, 1 dp). Y = annualised return (%, 1 dp).
- Frontier: `Line` in #8FA3C8, 2 px, `dot={false}`, no smoothing. Solver markers r = 5; the chosen portfolio r = 8 with a 2 px #FFA586 ring.
- Annotate the exact optimum with a `ReferenceDot` (`r={6}`, `ifOverflow="extendDomain"`, `label={{ value: 'Exact optimum', position: 'top', fill: '#F4EFEA', fontSize: 12 }}`).
- Do not join solver points with lines; they are not a path. When a run is selected, dim the unselected markers to 50% opacity.
- Tooltip: solver, return, volatility, objective, status word.

**6.2 Convergence** (`LineChart`, live). X = iteration (integer). Y = energy, lower is better, 3 dp.
- "This evaluation" #8FA3C8 at 1 px and 50% opacity; "Best so far" #FFA586 at 2 px. Both `dot={false}`.
- Exact-optimum energy, once brute force has finished, as a dashed `ReferenceLine` in #F4EFEA labelled "Exact optimum".
- Caption: "Energy: lower is better. The curve can flatten early; a flat curve does not prove the answer is final."

**6.3 Bitstring histogram** (`BarChart layout="vertical"`, top 20 by probability). Y = bitstring in mono, most probable at the top. X = probability (2 dp under 1%).
- Fills: optimal #FFA586; feasible #8FA3C8; infeasible #B51A2B with a #FF8A8A 1 px stroke (the fill alone is 1.99:1).
- Legend as HTML text: "Optimal: best feasible portfolio" / "Feasible: meets the constraints, not optimal" / "Infeasible: breaks a constraint".
- Add an "Other (N bitstrings)" bar. Qiskit's `plot_histogram` merges the remainder into one bar under `number_to_keep` (Qiskit docs, read), so do not drop them silently.
- `ReferenceLine x={randomGuess}` dashed #A9B3C9, labelled "Random guess 0.48%" (value from the API).
- Tooltip: bitstring, decoded stock names, probability, state word.

**6.4 Study charts** (five Evidence charts: depth, optimiser, init, mixer, noise). Mean as a 2 px line; spread as an `Area` at 20% opacity in the series colour, with min–max or CI stated in the caption. X = depth p or noise level. Y = approximation ratio (0–1, 2 dp). At most three series per chart; direct end labels replace the legend. Caption gives runs per point.

**6.5 Out-of-sample vs NIFTY 50** (`LineChart`). Both series indexed to 100 at the start of the held-out window. Portfolio #FFA586 at 2 px; NIFTY #A9B3C9 dashed. Shade the held-out window with `ReferenceArea` (fill #384358 at 35%), labelled "Held-out period, not used to choose the portfolio." Below, a small table (CAGR, volatility, max drawdown, Sharpe) with the NIFTY row in muted text. Footnote: survivorship bias, as the app states it.

## 7. Motion
- Durations: 150 ms for colour and border hover; 200 ms for the result fade-in; 300 ms for the progress fill; static chart draw-in at Recharts' 400 ms default or less.
- Easing `ease-out`. Results fade in once: opacity 0 to 1 and `translate-y` 4 px to 0, stagger at most 60 ms, total under 300 ms. Define `--animate-reveal` and its `@keyframes` inside `@theme`. `tw-animate-css` is not installed, so the current `animate-in` classes do nothing.
- No count-up on money or returns. A counting number looks like it is still computing; the final value should appear once, with its unit and basis.
- Reduced motion: `motion-reduce:` variants on every transition and animation, plus a backstop in `index.css`: `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`. MDN advises keeping the default animation and overriding it inside the media query (read).
- Remove `animate-ping` (RunProgress.tsx, Optimise.tsx). A pulsing dot adds motion and no information.

## 8. Microcopy (exact strings)
- **Empty state.** Title "No portfolio yet". Body "Pick {K} NIFTY 50 stocks and set your capital, then run the optimiser. You will see the portfolio QAOA selected, next to classical answers to the same problem." Checklist "[ ] {n} of {K} stocks picked", "[x] Capital set to ₹{amount}". Button "Run optimiser", disabled until both are true.
- **Running.** Stage text from section 5. Cancel button "Cancel run". Cancelled notice: "Run cancelled. Your inputs are unchanged."
- **Success headline** (from `verdict.level`). Banned anywhere in the app: "advantage", "outperforms classical", "quantum speedup".
  - matched: "QAOA matched the exact optimum."
  - near: "QAOA came within 1% of the exact optimum."
  - worse: "Brute force found a better portfolio than QAOA on this instance."
  - no-feasible: "QAOA found no feasible portfolio in this run."
  Sub-line: the first `verdict.details` item, then the runtime sentence and size disclaimer that the verdict always adds (plan U9).
- **Errors.** Setup cannot be solved, verbatim from the contract: "Only 4 of the 6 chosen stocks have enough price history in the estimation window, so a portfolio of 5 cannot be built. Add more stocks or lower the number of picks." Action "Edit inputs". No Retry, because retrying cannot fix the input. Server unreachable: title "Cannot reach the optimiser"; body "Your inputs are kept. Check that the server is running, then retry."; action "Retry".
- **Risk help.** See section 5. Optional: map the slider to SEBI's six riskometer labels (Low to Very High) for familiarity **[unverified: Business Standard excerpt]**.
- **Disclaimer (footer, always visible).** "Educational tool, not investment advice. This app shows what an optimisation method found on past NIFTY 50 prices. It does not recommend buying, selling or holding any security, and it is not a financial plan. Past performance does not guarantee future results. Past dates use today's NIFTY 50 list (survivorship bias), which can make past results look better than they were. Consult a SEBI-registered investment adviser before investing." **[unverified]:** the SEBI regulations page returned 404, so the wording is not checked against SEBI text. Have it reviewed before the demo.
- **Honesty panel tone.** Plain and specific. No exclamation marks, and no praise for QAOA. Headings: "What we found", "What it does not show", "How we checked". Example bullets from the contract: "It sampled the exact optimum with probability 8.3%, 17x more often than a random guess (0.48%)." and "This is a noiseless simulation on 14 qubits; it says nothing about larger instances."

## 9. Anti-patterns to avoid
- Gradients beyond the 6 px header bar and logo mark; no gradient text or gradient buttons.
- Glows, pulsing dots (`animate-ping`), coloured halos, `glass-panel` blur, and emoji icons (RunProgress.tsx uses an emoji chart icon). Use 16 px line icons.
- Centred everything, a marketing hero above the tool, or mixed radii. Left-align text, right-align numbers, centre only the empty state; the first screen is the form.
- Grey text below 4.5:1 (use `text-muted`, 7.9:1 on ink; #384358 text is 1.7:1), or red text on navy (#B51A2B on #161E2F is 2.5:1; use #FF8A8A on wine).
- Rainbow charts (more than three hues, or hue as the only signal), count-up animations, and false precision (₹10,00,000.47): round rupees, show returns at 1 dp.
- "Advantage" or "speedup" wording; green or red P&L with no sign or word; fake or stalled progress bars; a decorative icon on every card.

## 10. Deltas for the current code (TEAM-4)
1. Remove `animate-in fade-in` (3 uses), `glass-panel`, the gradient progress fill and the emoji. No animation plugin is installed (`package.json` has no `tw-animate-css`) **[inferred; verify in the browser]**. Replace `animate-ping` (RunProgress.tsx line 19; Optimise.tsx line 457) with a static dot.
2. Move the header title off the gradient: App.tsx puts letter text on `bg-hero-gradient`. Drop "Inter" from `index.css` unless the font is bundled.
3. Version mismatch: the lock file pins Vite 6.4.4, but AGENTS.md and plan KTD14 say Vite 8. Resolve before the build is judged. Recharts 3.10.1 and Tailwind 4.3.3 match this spec.

## 11. Sources
**Read (fetched this session):**
- Refactoring UI, https://www.refactoringui.com/ ; Vanguard press release (2 Sep 2026), https://corporate.vanguard.com/content/corporatesite/us/en/corp/who-we-are/pressroom/press-release-vanguard-expands-access-to-updated-website-shaped-by-investor-feedback-090226.html
- Betterment goal-projection disclosure, https://www.betterment.com/legal/goal-projection ; Wealthfront risk-tolerance blog, https://www.wealthfront.com/blog/what-is-risk-tolerance/
- Appcues GoodUX on Wealthfront, https://goodux.appcues.com/blog/wealthfront-personalized-ux-copy ; Zerodha Z-Connect on Kite Screener, https://zerodha.com/z-connect/business-updates/introducing-screener-on-kite-web
- Ström-Awn, Stripe Merchant Dashboard, https://mattstromawn.com/projects/stripe-dashboard/ ; Robinhood design philosophy (Behance, 2018), https://www.behance.net/blog/how-robinhood-emphasizes-design-to-make-stock-trading-more-accessible
- Plotline, INDmoney teardown, https://plotline.so/inspiration/indmoney-bottom-tabs ; RonDesignLab, TradingView case (agency claims), https://www.rondesignlab.com/cases/tradingview-platform-for-traders ; Tibba, Groww page (no Groww content), https://www.tibba.design/groww-casestudy
- Ambitious Designer, data tables, https://ambitiousdesigner.substack.com/p/from-overwhelming-to-intuitive-effective ; Economatica manual, efficient frontier, https://cdn.economatica.com/manual/english/Portfolio_Optimization/Efficient_Frontiier.htm
- Portfolio Visualizer tool index, https://www.portfoliovisualizer.com/ ; Smashing Magazine, progress indicators, https://www.smashingmagazine.com/2016/12/best-practices-for-animated-progress-indicators/
- UX Tigers (Nielsen), progress indicators, https://www.uxtigers.com/post/progress-indicators ; onething.design, skeletons vs spinners, https://www.onething.design/post/skeleton-screens-vs-loading-spinners
- Flutter docs, Material 3 progress indicators, https://docs.flutter.dev/release/breaking-changes/updated-material-3-progress-indicators ; GOV.UK question pages, https://design-system.service.gov.uk/patterns/question-pages/
- W3C WCAG 2.2 Understanding: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html (1.4.1), .../contrast-minimum.html (1.4.3), .../non-text-contrast.html (1.4.11), .../content-on-hover-or-focus.html (1.4.13)
- MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/font-variant-numeric ; https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion ; https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- Recharts 3 API: https://recharts.github.io/en-US/api/Tooltip/ (also /Scatter/, /CartesianGrid/, /Legend/, /ReferenceDot/)
- Tailwind CSS v4 theme, https://tailwindcss.com/docs/theme ; Inter, https://rsms.me/inter/ ; Qiskit plot_histogram, https://quantum.cloud.ibm.com/docs/api/qiskit/qiskit.visualization.plot_histogram
- SEBI Investment Advisers FAQ (search excerpt), https://www.sebi.gov.in/sebi_data/attachdocs/1424862077270.pdf ; Business Standard, riskometer levels (search excerpt), https://www.business-standard.com/amp/article/markets/decoding-risk-o-meter-3-0-and-its-use-as-an-investment-tool-in-the-mf-space-120100601112_1.html
**Search excerpt only, not read [unverified]:** Linear, "A calmer interface for a product in motion" (12 Mar 2026), https://linear.app/now/behind-the-latest-design-refresh ; NN/g progress indicators, https://www.nngroup.com/articles/progress-indicators ; NN/g dark mode, https://www.nngroup.com/articles/dark-mode/ ; Carbon loading pattern, https://carbondesignsystem.com/patterns/loading-pattern ; Material 2 dark theme, https://m2.material.io/design/color/dark-theme.html ; Groww portfolio concept, https://adityakolte.com/project/groww ; Koyfin help, https://www.koyfin.com/help/topic/functionality/
**Not found:** a primary Robinhood "Cosmos" design system (third-party token sites conflict, so none is used); a primary smallcase or INDmoney UI case study.
