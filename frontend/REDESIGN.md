# Redesign: how the work is split (read with `docs/plans/2026-10-09-frontend-redesign-brief.md`)

## Shared, already written (do not change the interfaces)
- `src/lib/format.ts`: `formatINR`, `formatINRCompact`, `formatPct(x, {sign})`, `formatInt`, `trend(x)`, `isNum`. Use these for every number.
- `src/lib/riskProfiles.ts`: `RISK_PROFILES` (Lower risk q=0.8, Balanced q=0.5, Higher growth q=0.2) and `profileForQ`. This is the only place the profile-to-q mapping lives.
- `src/components/ui.tsx`: `Section`, `Eyebrow`, `Card`, `Stat`, `WhatThisMeans`, `InfoTip` (keyboard-accessible), `Status` (aria-live and alert).
- `src/state/run.tsx`: the `RunState` interface and `useRun()`. W1 implements `RunProvider`. Everyone else only reads it through `useRun()`.
- Theme tokens are in `src/index.css`: `bg-bg`, `bg-surface`, `border-line`, `border-line-strong`, `text-text`, `text-muted`, `text-faint`, `text-gain`, `text-loss`, plus the `font-display`, `font-mono` and `font-sans` utilities.
  - Monochrome only. Green and red are reserved for gain and loss, always with +/− and ▲/▼.
  - Corners are square. No emoji.

## Ownership (strict: edit only your own files)
| Worker | Owns |
|---|---|
| **W1: Optimize wizard + state + shell** | `src/state/run.tsx` (implement), `src/App.tsx` (4 tabs Optimize/Evidence/Method/Glossary, mode switch Simple/Research in the header, `<RunProvider>`), `src/pages/Optimise.tsx`, new `src/components/wizard/*`, `UniversePicker.tsx`, `ConstraintsForm.tsx`, `AdvancedQaoa.tsx`, `ScreenPreview.tsx`, `RunProgress.tsx`, `DataBanner.tsx` |
| **W2: Results dashboard** | new `src/components/results/*` (PortfolioSummary, KeyMetrics, AllocationTable + allocation bars, WhySelected, ResultSummary), `PortfolioTable.tsx`, `MetricCards.tsx`, `HonestyPanel.tsx`, `OutOfSample.tsx`. Export `<ResultsDashboard />` from `src/components/results/ResultsDashboard.tsx`; W1 renders it on Optimize after a run |
| **W3: Evidence** | `src/pages/Evidence.tsx`, `FrontierChart.tsx`, `ConvergenceChart.tsx`, `BitstringHistogram.tsx`, `SolverTable.tsx`, `StudyChart.tsx`, `AccuracyChart.tsx`, `src/lib/chartColors.ts`, `SolverMarker.tsx`. Evidence shows the current run's charts via `useRun().result`, plus the existing studies |
| **W4: Method + Glossary** | `src/pages/Method.tsx`, new `src/pages/Glossary.tsx`, new `src/lib/glossary.ts` (terms data), `src/components/Glossary.tsx` (drawer: keep or turn into a `GlossaryLink` that jumps to the Glossary page) |
| **Backend: TEAM-1 (only if needed for "Why selected")** | adds per-pick stats to `RunResult` (optional field). Frontend falls back to "not computed" when absent |

## Rules
- Do not edit `src/api/*`. Do not mock failed calls.
- Never show a stale result as current; use `isStale`.
- Run `npm run build` before finishing. If it fails only because of another worker's file, report it and do not edit their file.
- No new npm dependencies.
