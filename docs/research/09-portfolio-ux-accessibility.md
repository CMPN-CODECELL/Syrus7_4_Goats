# Portfolio optimiser: accessibility and UX checklist for retail investors (India)

Date: 2026-10-09. Scope: the React 19 / Vite / Tailwind 4 / Recharts 3 frontend in `frontend/src`, dark "Sunset Navy" palette.

## Read first

- Contrast ratios are computed with the WCAG 2.x relative-luminance formula. Everything else comes from the Sources list at the end.
- `[unverified]` marks claims I could not confirm on a primary source, or that come from secondary news or blog sources.
- last30days: setup was already complete, so I ran the engine with a 3-subquery plan. It returned 23 items, mostly personal portfolio-website GitHub PRs (the word "portfolio" collided). The LLM rerank failed with HTTP 401 and fell back to local scoring. One item is relevant: an r/SideProject post (2026-09-16) about an Indian investor-portfolio app that does not hold broker logins `[unverified; not read in full]`. Treated as a weak signal only. Raw file: `C:\Users\Wahab\Documents\Last30Days\portfolio-app-ux-accessibility-for-retail-investors-raw-v3.md`.
- Vanguard: only questionnaire-scope material found, no accessibility data. Groww: thin results, not used.
- The WCAG 2.2 quick reference was truncated. Criterion levels come from the W3C pages I fetched and search summaries. Levels marked `[from memory]` are not verified in this session.

## 0. Contrast check (palette pairs)

Text pairs all pass 4.5:1. The failures are non-text (WCAG 1.4.11) and red used as a graphic.

| Pair | Ratio | Verdict |
|---|---|---|
| Text #F4EFEA on ink #161E2F | 14.58:1 | Pass |
| Text #F4EFEA on panel #242F49 | 11.65:1 | Pass |
| Muted #A9B3C9 on ink | 7.91:1 | Pass |
| Muted #A9B3C9 on panel | 6.32:1 | Pass |
| Peach #FFA586 on ink | 8.71:1 | Pass |
| Peach #FFA586 on panel | 6.96:1 | Pass |
| Ink #161E2F text on peach button | 8.71:1 | Pass. Use this, not off-white text on peach (1.67:1, fails) |
| Error text #FF8A8A on ink (already in code) | 7.34:1 | Pass |
| Line #384358 on ink (input border) | 1.67:1 | FAIL, needs 3:1 |
| Line #384358 on panel | 1.34:1 | FAIL |
| Switch track ink on panel (AdvancedQaoa) | 1.25:1 | FAIL |
| Red #B51A2B on ink | 2.50:1 | FAIL, as text or graphic |
| Red #B51A2B on panel | 1.99:1 | FAIL |
| Wine #541A2E on ink | 1.24:1 | Surface only, never a foreground |
| Chart series peach vs muted | 1.10:1 | Series must differ by shape or dash, not colour |
| Chart series peach vs off-white | 1.67:1 | Same rule |

## 1. What the code shows (frontend/src)

- Sliders are native `input type="range"` with `label htmlFor` (ConstraintsForm.tsx:46-64, 74-90). Good base.
- No `aria-live`, `role="status"` or `role="alert"` anywhere. Validation, run-error and API-error banners are plain divs (Optimise.tsx:248-253, 307-310, 346-353).
- No `aria-label`, `role="img"` or text summary on any chart: FrontierChart, ConvergenceChart, RunProgress, BitstringHistogram, StudyChart.
- SolverTable.tsx:52-54: rows are `<tr onClick>`, not focusable, no key handler. Keyboard users cannot choose a solver.
- FrontierChart.tsx:125-135: Scatter `onClick` is mouse-only.
- Inputs use `focus:outline-none focus:border-peach` (ConstraintsForm.tsx:127,164; AdvancedQaoa.tsx:58-182). UniversePicker.tsx:121,136 adds a 1px peach ring, which is better but still thin.
- No `prefers-reduced-motion` or `motion-reduce:` anywhere. Animated: animate-ping (RunProgress.tsx:19, Optimise.tsx:447), animate-spin (Optimise.tsx:242, Evidence.tsx:107), animate-pulse (Evidence.tsx:60, ScreenPreview.tsx:13).
- Indian format: `toLocaleString('en-IN')` in chartColors.ts:44 and ConstraintsForm.tsx:180. Bare `toLocaleString()` with no locale in PortfolioTable.tsx:115.
- Top nav is three `button`s (App.tsx:43-68) with no tab roles and no `aria-current`.
- Slider end captions are `text-[10px]` (ConstraintsForm.tsx:65-68, 91-95).
- Jargon in visible text: "QUBO Objective & Slack Terms", "Min Variance", "Growth Focus", "Exact Stock Picks (K)".
- The Infeasible legend swatch is `bg-red` (BitstringHistogram.tsx:44).

## 2. Must-have for the demo (do first)

1. **Visible label on every control, linked in code.** Sliders already do this. Check UniversePicker search, the holdings textarea (ConstraintsForm.tsx:212 uses placeholder-muted, so confirm it has a visible label) and the AdvancedQaoa selects. Placeholders are not labels: they vanish and get skipped. WCAG 3.3.2 (A). NN/g position via secondary summaries `[unverified]`.
2. **Risk slider: keyboard and spoken meaning.** Native range gives Right/Up +1 step, Left/Down -1, Home/End, matching the APG slider table. Add `aria-valuetext="0.50, Balanced"` so the meaning is spoken, not just the number. APG slider; WCAG 4.1.2 (A) `[from memory]`.
3. **Run and Cancel by keyboard, with the reason shown.** Run is disabled while a run is active (Optimise.tsx:318). Put a short text reason beside it instead of a silent disabled button. Keep Cancel reachable in RunProgress and the sticky mobile banner (Optimise.tsx:443-457). WCAG 2.1.1 Keyboard (A).
4. **Live regions.** `role="status"` (polite) on RunProgress stage changes only (queued, running, done), not every poll tick. `role="alert"` on the validation banner (Optimise.tsx:307) and the run-error banner (346-353). Sources disagree on adding `aria-live` to `role="alert"` (VoiceOver double speech), so test it. WCAG 4.1.3 Status Messages (AA) `[from memory]`; MDN live regions.
5. **Peach focus ring everywhere.** Replace `focus:outline-none focus:border-peach` with `focus-visible:ring-2 focus-visible:ring-peach focus-visible:ring-offset-2 focus-visible:ring-offset-ink`. Peach on ink is 8.71:1, well above 3:1. WCAG 2.4.7 Focus Visible (AA). 2.4.13 Focus Appearance is AAA (search summary).
6. **Non-text contrast on controls.** Input borders (#384358, 1.67:1), the switch track (1.25:1) and the slider track must reach 3:1. Use #A9B3C9 (7.91:1 on ink) for input borders and the switch track. WCAG 1.4.11 Non-text Contrast (AA).
7. **Colour is never the only signal.** The histogram's Infeasible red fails as text and as a graphic. Use #FF8A8A text plus a diagonal hatch and an "x" marker, and show the same pattern in the legend. Frontier and study series: add marker shape and line dash. Verdict panel: icon, word and one sentence. WCAG 1.4.1 Use of Color (A).
8. **Text alternative and summary for every chart.** Add a visible one-sentence summary above each chart and an `aria-label` on a `role="img"` wrapper. Pair each chart with its table: solver table, top-10 bitstring table, out-of-sample table. WCAG 1.1.1 (A). W3C complex-image guidance: short alt plus a visible long description. `aria-describedby` flattens tables into one paragraph, so do not use it for tables.
9. **Keyboard reach for selection.** SolverTable: make the solver name a `<button>`, or add tabIndex=0 with Enter and Space handlers. Frontier points stay mouse-only, so the table is the keyboard path. Top nav: add `aria-current="page"`, or implement the full APG tabs pattern (roving tabindex, Left/Right, Home/End). WCAG 2.1.1 (A); APG tabs.
10. **Touch targets.** Most controls use `min-h-[44px]`. Gaps: the switch is 44x24 px (AdvancedQaoa.tsx:199), which meets the 24 px floor but not the 44 px recommendation, and slider end captions are 10 px text. WCAG 2.5.8 Target Size (Minimum) is 24x24 CSS px (AA, fetched). 2.5.5 Target Size (Enhanced) is 44x44 (AAA).
11. **Reduced motion.** Add `motion-reduce:animate-none` to the ping, spin and pulse classes. Set `isAnimationActive={!reduced}` on Recharts series, reading `matchMedia('(prefers-reduced-motion: reduce)')`. WCAG 2.3.3 Animation from Interactions (AAA, not required for AA, cheap to do now).
12. **One Indian-format helper.** `new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })`, used everywhere, including PortfolioTable.tsx:115 and the chart ticks in chartColors.ts. MDN's en-IN example gives 1,23,456.789, so grouping is confirmed. Check the ₹ prefix output in the browser `[unverified]`. Lakh and crore words would need custom code, but grouping does not.

## 3. Investor UX

- **Plain risk labels.** The slider is risk aversion q (0 = max return, 1 = min risk), but users read "Growth Focus / Balanced / Min Variance". Show risk appetite = 1 - q in three bands: Aggressive (0.67 to 1.00), Balanced (0.34 to 0.66), Conservative (0.00 to 0.33). Keep q in a small technical disclosure.
- **Plain words.** "Exact Stock Picks (K)" becomes "How many stocks". "Max Stocks Per Sector" becomes "Limit per industry". "QUBO Objective & Slack Terms" becomes "Portfolio settings". Short sentences and familiar words, per GOV.UK clear-language guidance.
- **"What this means" on every result.** Two sentences: what the weights mean in rupees, and what the likely swing range means. Fill the templates from data. Never invent the text.
- **Defaults that work.** Start from a Balanced preset with no sector cap, a round example amount, and a stock count inside the 12-qubit cap that commit c294a6a made the default. Offer "Use this preset" and "Start from scratch".
- **Progressive disclosure.** AdvancedQaoa is already collapsible (AdvancedQaoa.tsx:19-21). Add `aria-expanded` and `aria-controls` `[verify in code]`. One line above it: "Defaults work. Change these only if you know what they do."
- **Uncertainty and past performance.** Show out-of-sample numbers with the test period stated, never as a promised return. Put "Past performance does not guarantee future returns" beside each performance chart.
- **Rename "Target Annual Net Return (%)"** to "Return you would like to aim for (not guaranteed)". SEBI's advertising guidance reportedly bars promising target or assured returns `[unverified; secondary sources]`.
- **Not-advice disclaimer (draft, needs compliance review).** Show at the top of results and in the footer: "This is a research and education tool. It is not investment advice or a recommendation to buy or sell any security. We are not SEBI-registered investment advisers. Past results do not guarantee future returns. Investments in the securities market are subject to market risks. Read all related documents carefully before investing." The last sentence matches the SEBI standard warning as reported in 2023 coverage `[unverified wording]`. Avoid "recommended for you" and "your risk profile is". Those move toward SEBI risk-profiling and advice rules, which require registration `[secondary]`.
- **First-run state.** Three steps (pick stocks, set risk, run), a "Try the Balanced preset" button, and a link to a sample result. Never show empty charts.
- **Error recovery.** GOV.UK pattern: error summary at the top of main, each message links to its field, focus moves to the summary, "Error:" prefix in the page title, and an inline message per field. The existing wording ("Cardinality (K) must be between 2 and 15 stocks") is good; add the fix. Validate on submit only, and do not disable Run to block errors.

## 4. Data viz: the five charts

Each entry gives label, text alternative and encoding.

**Efficient frontier** (FrontierChart.tsx)
- Label: x "Annualised Volatility (Risk)" (add units, %), y "Expected Return" (% a year). Label each point with its solver name.
- Text alt: wrapper `aria-label` "Efficient frontier, N solvers; [best solver] has the highest return for its risk." Plus the solver table with row selection (item 9).
- Encoding: shape per solver family (circle QAOA, square classical, triangle brute force). Colour is secondary. The selected point gets a peach ring and a "Selected" text tag.

**Convergence** (ConvergenceChart.tsx, RunProgress.tsx)
- Label: x "Iteration", y "Objective value (lower is better)" `[confirm direction in code]`. Axis titles are missing today.
- Text alt: "Stopped after N iterations; objective moved from A to B." Show the final value as text.
- Encoding: one peach series, markers every 10 iterations, end-point label. Under reduced motion, no draw-in animation.

**Bitstring histogram** (BitstringHistogram.tsx)
- Label: x "Bitstring (top 10 shown)", y "Share of shots (%)" `[confirm unit in code]`.
- Text alt: "X% of shots were feasible; the most frequent outcome is [bitstring] at P%." Plus a top-10 table.
- Encoding: Optimal peach solid, Feasible muted with dots, Infeasible #FF8A8A with diagonal hatch. Legend swatches use the same patterns.

**Study charts** (StudyChart.tsx, multi-series with ErrorBar)
- Label: keep the existing x and y label props, add units and the run count n.
- Text alt: one sentence per series with mean and interval at the final x, plus a table of mean, low and high.
- Encoding: series differ by marker shape and dash (solid, dashed, dotted). Use direct end labels rather than a colour-only legend. Tooltip reads error bars in words ("plus or minus X").

**Out-of-sample vs NIFTY 50** (OutOfSample.tsx has a table; whether a chart exists `[unverified]`)
- Label: test period in the caption, y "Cumulative return (%)".
- Text alt: "Over the test period your portfolio returned X% against Y% for NIFTY 50." Table: return, volatility, largest fall, difference vs NIFTY.
- Encoding: NIFTY 50 as a muted dashed line, portfolio as a solid peach line with markers. The peach and muted series are 1.10:1 apart by colour, so the dash is required. Caption carries the past-performance warning.

## 5. Nice-to-have (later)

- Test forced-colours (Windows high contrast) and 200%/400% zoom with reflow (WCAG 1.4.4 and 1.4.10, AA) `[from memory]`.
- Glossary tooltip: link the trigger with `aria-describedby`, dismiss on Escape, keep content visible while hovered (WCAG 1.4.13, AA) `[from memory]`.
- Hindi and regional-language labels for the top 10 terms.
- CSV download of each chart's data.
- Moderated test with 3-5 users: NVDA with Chrome, VoiceOver on iOS.
- SEBI riskometer names (Low to Very High) if mutual-fund labels appear later.
- Recharts version check: `accessibilityLayer` is documented only for AreaChart and defaults to true there. Confirm it for LineChart, BarChart and ScatterChart in the installed Recharts 3 `[unverified]`.

## Sources

WCAG and ARIA
- W3C WCAG 2.2 Understanding Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html (fetched)
- W3C WCAG 2.2 quick reference: https://www.w3.org/WAI/WCAG22/quickref/ (truncated read)
- W3C WCAG 2.2 Understanding Target Size (Enhanced): https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html (search)
- W3C WCAG Understanding SC 2.3.3: https://w3c.github.io/wcag/understanding/animation-from-interactions.html (search)
- WAI-ARIA APG Slider: https://www.w3.org/WAI/ARIA/apg/patterns/slider/ (fetched)
- WAI-ARIA APG Tabs: https://www.w3.org/WAI/ARIA/apg/patterns/tabs/ (fetched)
- MDN ARIA live regions: https://developer.mozilla.org/en/AJAX/WAI_ARIA_Live_Regions (search)
- Toronto ARIA live regions course: https://pressbooks.library.torontomu.ca/wafd/chapter/live-regions/ (secondary)
- WCAG 1.4.11 summary, Tabnav: https://tabnav.com/academy/wcag/success-criterion-1.4.11 (secondary)
- Deque on placeholders: https://www.deque.com/blog/accessible-forms-the-problem-with-placeholders/ (search)

Charts
- W3C WAI complex images: https://www.w3.org/WAI/tutorials/images/complex/ (fetched)
- Highcharts accessibility module: https://www.highcharts.com/docs/accessibility/accessibility-module (search summary)
- Recharts API, AreaChart accessibilityLayer: https://recharts.github.io/en-US/api/ (fetched)
- Recharts discussions on keyboard and VoiceOver: https://github.com/recharts/recharts/discussions/4484 and https://github.com/recharts/recharts/discussions/4662 (search)
- Niagara College, charts and graphs: https://accessibilityhub.niagaracollege.ca/articles/websites/charts-and-graphs/ (search)

Forms and plain language
- GOV.UK Design System, error summary: https://design-system.service.gov.uk/components/error-summary/ (fetched)
- GOV.UK Design System, validation pattern: https://design-system.service.gov.uk/patterns/validation (search)
- GOV.UK clear language: https://guidance.publishing.service.gov.uk/writing-to-gov-uk-standards/writing-guidelines/clear-language/ (search)
- Inside GOV.UK, sentence length (2014, historical): https://insidegovuk.blog.gov.uk/2014/08/04/sentence-length-why-25-words-is-our-limit/ (search)
- MoJ form validator (archived): https://design-patterns.service.justice.gov.uk/components/form-validator (search)

Number format
- MDN Intl.NumberFormat (en-IN example): https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/NumberFormat (search, older URL form)

SEBI and India (all secondary unless noted)
- Business Standard, SEBI risk-profiling precondition (Dec 2019): https://www.business-standard.com/amp/article/markets/no-advice-sans-risk-profile-of-the-client-sebi-to-investment-advisers-119122701195_1.html
- K&S, Investor Charter for IAs (June 2025 circular): https://ksandk.com/investment/investor-charter-for-investment-advisers/
- Business Standard, SEBI advertising code for IAs (Apr 2023): https://www.business-standard.com/markets/news/sebi-crackdowns-on-misleading-investment-ads-bars-superlative-terms-123040501056_1.html
- CA Club, SEBI advertising code summary: https://caclub.in/sebis-advertising-code-guidelines-for-investment-advisers-research-analysts/
- Ujjivan SFB, SEBI riskometer six levels: https://www.ujjivansfb.bank.in/banking-blogs/mutual-funds/what-is-the-risk-o-meter-in-mutual-funds-sebi-classification-explained

Retail investing UX
- Zerodha support, why Kite and Coin are separate: https://support.zerodha.com/category/console/reports/other-queries/articles/separate-apps-for-each-offering (search)
- Yellow Slice, Kite UX review (2020, dated): https://www.yellowslice.in/blog/zerodha-app-rating-kite-ux-review-key-improvement-tips (secondary)
- Vanguard, investor questionnaire limitations: https://personal.vanguard.com/us/content/MyPortfolio/analytics/pwIQLimitationsContent.jsp (search)
