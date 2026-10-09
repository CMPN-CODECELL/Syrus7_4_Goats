import React, { useState } from 'react';
import { Optimise } from './pages/Optimise';
import { Evidence } from './pages/Evidence';
import { Method } from './pages/Method';
import { GlossaryDrawer } from './components/Glossary';

type Tab = 'optimise' | 'evidence' | 'method';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('optimise');
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'optimise', label: 'Optimise' },
    { id: 'evidence', label: 'Evidence' },
    { id: 'method', label: 'Method' }
  ];

  return (
    <div className="min-h-screen bg-bg text-text flex flex-col selection:bg-text selection:text-bg">
      {/* Header: one compact row */}
      <header className="bg-bg border-b border-line sm:sticky sm:top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0 pt-3 sm:py-3">
            <h1 className="text-2xl leading-none whitespace-nowrap">Quantum Portfolio</h1>
            <span className="label whitespace-nowrap">PS-03 · NIFTY 50</span>
          </div>

          <nav className="flex items-stretch gap-4 sm:gap-5 w-full sm:w-auto" aria-label="Sections">
            {tabs.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                aria-current={activeTab === t.id ? 'page' : undefined}
                className={`label min-h-[44px] px-0 border-0 border-b-2 flex items-center ${
                  activeTab === t.id
                    ? 'border-text text-text'
                    : 'border-transparent text-muted hover:text-text'
                }`}
                style={{ borderColor: activeTab === t.id ? '#FFFFFF' : 'transparent' }}
              >
                {t.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGlossaryOpen(true)}
              className="label min-h-[44px] px-0 border-0 border-b-2 border-transparent text-muted hover:text-text flex items-center"
              style={{ borderColor: 'transparent' }}
              title="Quantum Glossary"
            >
              Glossary
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {/* Kept mounted so a running job and its results survive a tab switch */}
        <div hidden={activeTab !== 'optimise'}><Optimise /></div>
        {activeTab === 'evidence' && <Evidence />}
        {activeTab === 'method' && <Method />}
      </main>

      {/* Footer */}
      <footer className="border-t border-line py-6 px-4 text-center mt-12 space-y-2">
        <p className="label">Qiskit Fall Fest 2026 · Team 4 GOATS · Qiskit 2.5 V2 Primitives &amp; Aer Simulator</p>
        <p className="label">Data: Yahoo Finance via yfinance (adjusted close), cached snapshot</p>
        <p className="text-xs text-muted">
          Educational tool, not investment advice. Past performance does not guarantee future returns.
        </p>
      </footer>

      {/* Quantum Glossary Side Drawer */}
      <GlossaryDrawer
        isOpen={glossaryOpen}
        onClose={() => setGlossaryOpen(false)}
      />
    </div>
  );
};

export default App;
