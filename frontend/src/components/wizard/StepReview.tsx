// Step 3: a readable summary of every choice, the shortlist preview, checks before running, and the advanced settings.
import { useEffect, useState } from 'react';
import type { Asset } from '../../api/types';
import { useRun } from '../../state/run';
import type { ConfigIssue, WizardStep } from '../../state/validate';
import { AdvancedQaoa } from '../AdvancedQaoa';
import { ScreenPreview } from '../ScreenPreview';
import { Btn } from './fields';
import { buildSummary } from './Stepper';
import type { ScreenState } from './hooks';

export function StepReview({ assets, issues, screen, goTo }: {
  assets: Asset[]; issues: ConfigIssue[]; screen: ScreenState; goTo: (s: WizardStep) => void;
}) {
  const { config, setConfig, mode } = useRun();
  const research = mode === 'research';
  const rows = buildSummary(config, assets, research);
  const q = config.qaoa;

  // Advanced settings start open in Research mode, and open when the user switches to it.
  const [advOpen, setAdvOpen] = useState(research);
  useEffect(() => { if (research) setAdvOpen(true); }, [research]);

  const advancedLine = `${q.variant === 'xy' ? 'XY ring mixer' : 'Standard mixer'}, depth p = ${q.reps}, ${q.optimizer}, ${Number.isFinite(q.shots) ? q.shots.toLocaleString('en-IN') : '?'} shots, max ${q.maxiter} iterations, noise ${q.noise ? 'on' : 'off'}, seed ${q.seed}, qubit cap ${config.qubit_cap}`;

  return (
    <div className="space-y-6">
      <p className="max-w-prose text-base leading-relaxed text-text">
        Check your choices. The optimiser searches for a feasible portfolio under these assumptions. The result is an estimate based on past prices, not a prediction or a guarantee.
      </p>

      <div data-tour="review" className="border border-line bg-surface">
        <dl className="divide-y divide-line">
          {rows.map((r) => (
            <div key={r.key} className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <dt className="font-mono text-xs uppercase tracking-[0.08em] text-muted">{r.label}</dt>
                <dd className="text-base text-text">{r.value}</dd>
              </div>
              <Btn variant="link" aria-label={`Edit ${r.label}`} onClick={() => goTo(r.step)} className="self-start sm:self-auto">Edit<span aria-hidden="true"> →</span></Btn>
            </div>
          ))}
          <div className="p-3">
            <dt className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Cost assumptions</dt>
            <dd className="text-base text-text">Buying costs 0.1187% and selling costs 0.1037% of the traded value. These are fixed assumptions, so returns are shown after costs where stated.</dd>
          </div>
          <div className="flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <dt className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Quantum settings</dt>
              <dd className="text-base text-text">{advancedLine}</dd>
            </div>
            <Btn variant="link" aria-label="Edit quantum settings" onClick={() => setAdvOpen(true)} className="self-start sm:self-auto">Edit<span aria-hidden="true"> ↓</span></Btn>
          </div>
        </dl>
      </div>

      <ScreenPreview screenInfo={screen.info} loading={screen.loading} error={screen.error} qubitCap={config.qubit_cap} />

      <section aria-labelledby="checks-title">
        <h3 id="checks-title" className="text-xl">Checks before running</h3>
        <div aria-live="polite" className="mt-2">
          {issues.length === 0 && !screen.error ? (
            <p className="text-base text-text"><span aria-hidden="true">✓ </span>No problems found. You can continue to the run step.</p>
          ) : (
            <ul role="list" className="space-y-2">
              {issues.map((i) => (
                <li key={`${i.field}-${i.message}`} className="flex flex-col gap-1 border border-loss p-3 text-sm text-text sm:flex-row sm:items-center sm:justify-between">
                  <span><span aria-hidden="true">⚠ </span>{i.message}</span>
                  <Btn variant="link" aria-label={`Fix: go to step ${i.step}`} onClick={() => (i.step === 3 ? setAdvOpen(true) : goTo(i.step))}>
                    {i.step === 3 ? 'Open the settings' : `Go to step ${i.step}`}
                  </Btn>
                </li>
              ))}
              {screen.error && (
                <li className="border border-loss p-3 text-sm text-text">
                  <span aria-hidden="true">⚠ </span>The server could not build a shortlist for these settings, so a run is likely to fail. The message is shown in the preview above. You can still try the run.
                </li>
              )}
            </ul>
          )}
        </div>
      </section>

      <details open={advOpen} onToggle={(e) => setAdvOpen((e.currentTarget as HTMLDetailsElement).open)} className="border border-line-strong">
        <summary className="flex min-h-[44px] cursor-pointer flex-col justify-center px-4 py-2">
          <span className="text-base font-medium text-text">Advanced research settings</span>
          <span className="text-sm text-muted">Circuit, optimiser, sampling and qubit cap. The defaults are fine for most runs.</span>
        </summary>
        <div className="border-t border-line p-3">
          <AdvancedQaoa
            settings={config.qaoa}
            onChange={(qaoa) => setConfig({ qaoa })}
            qubitCap={config.qubit_cap}
            onQubitCapChange={(qubit_cap) => setConfig({ qubit_cap })}
            issues={issues}
          />
        </div>
      </details>
    </div>
  );
}
