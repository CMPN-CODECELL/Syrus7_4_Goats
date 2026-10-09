# DESIGN: Monochrome (Sunset Navy retired)
Very basic, clean black and white. No gradients, glass, blur, glow, shadows, emoji or rounded corners.
- Tokens (Tailwind v4 `@theme` in `src/index.css`): bg #000000, surface #0A0A0A, line #262626, line-strong #6B6B6B, text #FFFFFF, muted #A3A3A3, faint #737373, gain #22C55E, loss #EF4444.
- Type: headings Barlow Condensed 300 UPPERCASE; small labels Geist Mono 11px UPPERCASE, 0.08em tracking, muted; body Hanken Grotesk 400/500. All numbers are tabular-nums in Hanken Grotesk, never mono.
- Header: one compact row, "QUANTUM PORTFOLIO" plus mono label "PS-03 · NIFTY 50". Tabs Optimise / Evidence / Method are plain uppercase mono text, active tab has a 2px white underline.
- Primary button is white with black text. Inputs and buttons use a line-strong border. Focus-visible is a 2px solid white ring. `prefers-reduced-motion` is respected.
- Green and red mean gain and loss only: "▲ +x%" in gain, "▼ −x%" in loss. Infeasible and error states are neutral grey or white with a "⚠" text prefix, never red.
- Charts are monochrome and shape-coded: QAOA white circle; XY white hollow diamond, dashed; brute force #D4D4D4 square; relaxation #A3A3A3 triangle; annealing #737373 cross; NIFTY #A3A3A3 dashed line.
- Chart chrome: grid #262626, axis ticks #A3A3A3, no animation. Histogram: optimal white with "★ optimal" label, feasible #737373, infeasible #1A1A1A with a #6B6B6B outline.
- Stock picker: dense 32px rows (checkbox, bold symbol, muted name, small sector), two columns on desktop, with search, sector filter and selected count.
- Defaults for a faster run: QAOA variant xy, reps 2, maxiter 80, shots 2048, qubit_cap 12.
- Data source is always named "Yahoo Finance via yfinance (adjusted close), cached snapshot", beside the as-of date.
- Footer: "Educational tool, not investment advice. Past performance does not guarantee future returns."
