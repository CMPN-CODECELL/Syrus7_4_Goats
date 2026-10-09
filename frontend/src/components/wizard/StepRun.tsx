// Step 4: run the optimiser, show truthful progress, then the results.
import { useRun } from '../../state/run';
import type { ConfigIssue, WizardStep } from '../../state/validate';
import { ConvergenceChart } from '../ConvergenceChart';
import { ResultsDashboard } from '../results/ResultsDashboard';
import { RunProgress } from '../RunProgress';
import { Status } from '../ui';
import { Btn } from './fields';

export function StepRun({ issues, goTo, onOpenEvidence }: {
  issues: ConfigIssue[]; goTo: (s: WizardStep) => void; onOpenEvidence?: () => void;
}) {
  const { job, running, result, isStale, error, run, cancel, retry } = useRun();
  const blocked = issues.length > 0;
  const cancelled = !running && job?.state === 'cancelled';

  return (
    <div className="space-y-6">
      <div className="border border-line bg-surface p-4 sm:p-5">
        <p className="max-w-prose text-base leading-relaxed text-text">
          This runs the full pipeline: it screens the stocks, then solves the problem with three classical methods and with QAOA on a simulated quantum circuit, and compares them. Nothing here guarantees a result.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Btn
            variant="primary"
            data-tour="run"
            disabled={running || blocked}
            aria-disabled={running || blocked}
            onClick={() => { void run(); }}
            className="px-6 sm:min-w-[260px]"
          >
            {running ? 'Optimizing…' : 'Optimize My Portfolio'}
          </Btn>
          {blocked && !running && (
            <p className="text-sm text-text" aria-live="polite">
              <span aria-hidden="true">⚠ </span>{issues.length} problem{issues.length === 1 ? '' : 's'} to fix first.{' '}
              <button type="button" onClick={() => goTo(3)} className="underline underline-offset-4">Go to the review</button>
            </p>
          )}
        </div>
      </div>

      {running && job && (
        <>
          <RunProgress jobStatus={job} onCancel={cancel} />
          {(job.convergence?.length ?? 0) > 0 && <ConvergenceChart convergence={job.convergence ?? []} live />}
        </>
      )}

      {cancelled && (
        <div className="border border-line-strong p-4">
          <Status>Run cancelled. Your settings are kept.</Status>
          <Btn variant="secondary" className="mt-2" onClick={() => { void run(); }}>Run again</Btn>
        </div>
      )}

      {error && !running && (
        <div className="space-y-3">
          <Status error>{error}</Status>
          <div className="flex flex-wrap gap-2">
            <Btn variant="primary" onClick={retry}>Retry</Btn>
            <Btn onClick={() => goTo(3)}>Review settings</Btn>
          </div>
          <p className="text-sm text-muted">Your settings are kept, so you can retry as they are or change them first.</p>
        </div>
      )}

      {result && !running && (
        <>
          {isStale && (
            <div role="status" className="border border-line-strong p-4">
              <p className="text-base text-text"><span aria-hidden="true">⚠ </span>These results are for your previous settings. Run again to update.</p>
              <Btn variant="primary" className="mt-3" disabled={blocked} onClick={() => { void run(); }}>Optimize My Portfolio</Btn>
            </div>
          )}
          {onOpenEvidence && (
            <p>
              <Btn variant="link" onClick={onOpenEvidence}>See the evidence<span aria-hidden="true"> →</span></Btn>
              <span className="text-sm text-muted"> Charts and checks of how the optimisers compared on this run.</span>
            </p>
          )}
          <ResultsDashboard />
        </>
      )}
    </div>
  );
}
