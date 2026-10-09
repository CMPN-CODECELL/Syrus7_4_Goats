// Optimize: a four-step wizard (Build, Preferences, Review, Run). All state lives in useRun(), so Back keeps every choice.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DataBanner } from '../components/DataBanner';
import { StepBuild } from '../components/wizard/StepBuild';
import { StepPreferences } from '../components/wizard/StepPreferences';
import { StepReview } from '../components/wizard/StepReview';
import { StepRun } from '../components/wizard/StepRun';
import { Stepper, SummaryBar, buildSummary } from '../components/wizard/Stepper';
import { Btn } from '../components/wizard/fields';
import { parseHoldings } from '../components/wizard/holdings';
import { useScreen, useUniverse } from '../components/wizard/hooks';
import { Status } from '../components/ui';
import { useRun } from '../state/run';
import { pickedTickers, validateConfig, type ConfigIssue, type WizardStep } from '../state/validate';

const TITLES: Record<WizardStep, { title: string; lead: string }> = {
  1: { title: 'Build your portfolio', lead: 'Choose how much to invest, which stocks to pick from, and how many companies to hold.' },
  2: { title: 'Choose your preferences', lead: 'Tell the optimiser how to weigh estimated return against risk, and add any limits.' },
  3: { title: 'Review your configuration', lead: 'Check everything before the run. You can jump back to any step.' },
  4: { title: 'Run', lead: 'Start the optimiser. Progress is reported by the server as it happens.' },
};

export const Optimise: React.FC<{ onOpenEvidence?: () => void }> = ({ onOpenEvidence }) => {
  const { config, setConfig, mode, result, isStale } = useRun();
  const { universe, error: loadError, loading, reload } = useUniverse();
  const [step, setStep] = useState<WizardStep>(1);
  const [maxStep, setMaxStep] = useState<WizardStep>(1);
  const [capitalDraft, setCapitalDraft] = useState<string | null>(null);
  const [holdingsText, setHoldingsTextState] = useState('');
  const [blocked, setBlocked] = useState<ConfigIssue[]>([]);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const moved = useRef(false);

  const assets = useMemo(() => universe?.assets ?? [], [universe]);
  const picks = pickedTickers(config.tickers, assets);
  const holdingsParse = useMemo(() => parseHoldings(holdingsText, assets, picks), [holdingsText, assets, picks.join('|')]);

  // The run carries the holdings that were read correctly; unreadable lines block the run instead.
  const setHoldingsText = useCallback((text: string) => {
    setHoldingsTextState(text);
    const p = parseHoldings(text, assets, []);
    setConfig({ holdings: p.errors.length ? {} : p.holdings });
  }, [assets, setConfig]);

  const issues = useMemo<ConfigIssue[]>(() => {
    const list = validateConfig(config, assets);
    if (holdingsParse.errors.length > 0) {
      list.push({ field: 'holdings', step: 2, message: `Existing holdings: ${holdingsParse.errors[0]}` });
    }
    return list;
  }, [config, assets, holdingsParse]);

  const screen = useScreen(config, universe !== null);

  const goTo = useCallback((s: WizardStep) => {
    setBlocked([]);
    setStep(s);
    setMaxStep((m) => (s > m ? s : m));
  }, []);

  // Move focus to the new step's heading, so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
  }, [step]);

  const next = () => {
    const here = step === 3 ? issues : issues.filter((i) => i.step === step);
    if (here.length > 0) {
      setBlocked(here);
      return;
    }
    goTo((step + 1) as WizardStep);
  };

  if (loading) {
    return <Status>Connecting to the Quantum Portfolio backend…</Status>;
  }
  if (loadError || !universe) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Status error>Could not load the stock list. {loadError}</Status>
        <Btn variant="primary" onClick={() => { void reload(); }}>Retry</Btn>
      </div>
    );
  }

  const research = mode === 'research';
  const summary = buildSummary(config, assets, research);
  const { title, lead } = TITLES[step];

  return (
    <div className="space-y-6">
      <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Optimize · Step {step} of 4</p>

      <Stepper step={step} maxStep={maxStep} onGo={goTo} />
      <SummaryBar rows={summary} stale={!!result && isStale} />

      <section aria-labelledby="step-title" className="border border-line bg-surface p-4 sm:p-6">
        <h2 id="step-title" ref={headingRef} tabIndex={-1} className="text-2xl outline-offset-4">{title}</h2>
        <p className="mt-1 max-w-prose text-base text-muted">{lead}</p>

        <div className="mt-6">
          {step === 1 && <StepBuild assets={assets} issues={issues} capitalDraft={capitalDraft} setCapitalDraft={setCapitalDraft} />}
          {step === 2 && <StepPreferences issues={issues} holdingsText={holdingsText} setHoldingsText={setHoldingsText} parsed={holdingsParse} />}
          {step === 3 && <StepReview assets={assets} issues={issues} screen={screen} goTo={goTo} />}
          {step === 4 && <StepRun issues={issues} goTo={goTo} onOpenEvidence={onOpenEvidence} />}
        </div>

        {blocked.length > 0 && (
          <div className="mt-6" aria-live="assertive">
            <Status error>
              Fix this to continue:
              <ul role="list" className="mt-1 list-disc pl-5">
                {blocked.map((b) => <li key={b.message}>{b.message}</li>)}
              </ul>
            </Status>
          </div>
        )}

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:justify-between">
          <Btn disabled={step === 1} onClick={() => goTo((step - 1) as WizardStep)}>
            <span aria-hidden="true">← </span>Back
          </Btn>
          {step < 4 && (
            <Btn variant="primary" onClick={next} className="sm:min-w-[200px]">
              {step === 3 ? 'Continue to run' : 'Continue'}<span aria-hidden="true"> →</span>
            </Btn>
          )}
        </div>
      </section>

      {step >= 3 && (
        <DataBanner
          source={universe.source}
          asOf={universe.as_of}
          estWindow={result?.data.est_window}
          testWindow={result?.data.test_window}
          notes={result?.data.notes}
        />
      )}
    </div>
  );
};
