import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Optimise } from './pages/Optimise';
import { Evidence } from './pages/Evidence';
import { Method } from './pages/Method';
import { Glossary } from './pages/Glossary';
import { Landing } from './pages/Landing';
import { Tour } from './components/tour/Tour';
import { TOUR_DONE_KEY } from './components/tour/tourSteps';
import { RunProvider, useRun, type Mode } from './state/run';

type Tab = 'optimize' | 'evidence' | 'method' | 'glossary';

const TABS: { id: Tab; label: string }[] = [
  { id: 'optimize', label: 'Optimize' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'method', label: 'Method' },
  { id: 'glossary', label: 'Glossary' },
];

const MODES: { id: Mode; label: string }[] = [
  { id: 'simple', label: 'Simple' },
  { id: 'research', label: 'Research' },
];

/** Simple | Research: one switch that changes how much detail the app shows. Both modes submit the same request. */
function ModeSwitch() {
  const { mode, setMode } = useRun();
  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="sr-only">Detail level</legend>
      <div className="flex border border-line-strong">
        {MODES.map((m) => {
          const on = mode === m.id;
          return (
            <label key={m.id} className="relative cursor-pointer">
              <input
                type="radio"
                name="mode"
                value={m.id}
                checked={on}
                onChange={() => setMode(m.id)}
                className="peer sr-only"
              />
              <span className={`flex min-h-[44px] items-center px-4 font-mono text-xs uppercase tracking-[0.08em] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white ${
                on ? 'bg-text text-bg' : 'text-muted hover:text-text'
              }`}>
                {on && <span aria-hidden="true" className="mr-1">✓</span>}{m.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const tabFromHash = (): Tab | null => (window.location.hash.startsWith('#glossary') ? 'glossary' : null);

function Shell() {
  const [activeTab, setActiveTab] = useState<Tab>(() => tabFromHash() ?? 'optimize');
  const [home, setHome] = useState(() => tabFromHash() === null);
  const [tourOpen, setTourOpen] = useState(false);
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({ optimize: null, evidence: null, method: null, glossary: null });

  // A link to a glossary term (#glossary/term-…) opens the Glossary tab.
  useEffect(() => {
    const onHash = () => {
      const t = tabFromHash();
      if (t) setActiveTab(t);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const select = useCallback((t: Tab) => {
    setHome(false);
    setActiveTab(t);
    window.scrollTo({ top: 0 });
  }, []);

  const start = (tour: boolean) => {
    select('optimize');
    let seen = false;
    try { seen = localStorage.getItem(TOUR_DONE_KEY) === '1'; } catch { /* storage blocked */ }
    if (tour || !seen) setTourOpen(true);
  };

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    let to = -1;
    if (e.key === 'ArrowRight') to = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') to = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = TABS.length - 1;
    if (to < 0) return;
    e.preventDefault();
    const id = TABS[to].id;
    setActiveTab(id);
    tabRefs.current[id]?.focus();
  };

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text selection:bg-text selection:text-bg">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-text focus:px-3 focus:py-2 focus:text-bg">
        Skip to content
      </a>

      <header className="z-40 border-b border-line bg-bg sm:sticky sm:top-0">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 sm:px-6">
          <div className="flex flex-wrap items-baseline gap-x-3 pt-3 sm:py-3">
            <h1 className="whitespace-nowrap text-2xl leading-none">
              <button type="button" onClick={() => { setHome(true); window.scrollTo({ top: 0 }); }} className="border-0 bg-transparent p-0 text-inherit">Quantum Portfolio</button>
            </h1>
            <span className="whitespace-nowrap font-mono text-xs uppercase tracking-[0.08em] text-muted">PS-03 · NIFTY 50</span>
          </div>

          <div className="flex w-full flex-wrap items-center justify-between gap-x-6 sm:w-auto sm:flex-nowrap">
            <div role="tablist" aria-label="Sections" className="flex items-stretch gap-4 sm:gap-5">
              {TABS.map((t, i) => {
                const on = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    ref={(el) => { tabRefs.current[t.id] = el; }}
                    type="button"
                    role="tab"
                    id={`tab-${t.id}`}
                    aria-selected={on && !home}
                    aria-controls={`panel-${t.id}`}
                    tabIndex={on ? 0 : -1}
                    data-tour={t.id === 'evidence' ? 'evidence-tab' : undefined}
                    onClick={() => select(t.id)}
                    onKeyDown={(e) => onKeyDown(e, i)}
                    className={`flex min-h-[44px] items-center border-0 border-b-2 px-0 font-mono text-xs uppercase tracking-[0.08em] ${
                      on && !home ? 'border-text text-text' : 'border-transparent text-muted hover:text-text'
                    }`}
                    style={{ borderColor: on && !home ? '#FFFFFF' : 'transparent' }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => start(true)} className="flex min-h-[44px] items-center border border-line-strong px-4 font-mono text-xs uppercase tracking-[0.08em] text-muted hover:text-text">Tour</button>
            <ModeSwitch />
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {home && <Landing onStart={() => start(false)} onTour={() => start(true)} />}
        <div hidden={home}>
        {/* Kept mounted so a wizard in progress, a running job and its results survive a tab switch */}
        <div role="tabpanel" id="panel-optimize" aria-labelledby="tab-optimize" hidden={activeTab !== 'optimize'}>
          <Optimise onOpenEvidence={() => select('evidence')} />
        </div>
        {activeTab === 'evidence' && (
          <div role="tabpanel" id="panel-evidence" aria-labelledby="tab-evidence"><Evidence /></div>
        )}
        {activeTab === 'method' && (
          <div role="tabpanel" id="panel-method" aria-labelledby="tab-method"><Method /></div>
        )}
        {activeTab === 'glossary' && (
          <div role="tabpanel" id="panel-glossary" aria-labelledby="tab-glossary"><Glossary /></div>
        )}
        </div>
      </main>
      <Tour open={tourOpen} onClose={() => setTourOpen(false)} />

      <footer className="mt-12 space-y-2 border-t border-line px-4 py-6 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Qiskit Fall Fest 2026 · Team 4 GOATS · Qiskit 2.5 V2 Primitives &amp; Aer Simulator</p>
        <p className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Data: Yahoo Finance via yfinance (adjusted close), cached snapshot</p>
        <p className="text-sm text-muted">
          Educational tool, not investment advice. Past performance does not guarantee future returns.
        </p>
      </footer>
    </div>
  );
}

export const App: React.FC = () => (
  <RunProvider>
    <Shell />
  </RunProvider>
);

export default App;
