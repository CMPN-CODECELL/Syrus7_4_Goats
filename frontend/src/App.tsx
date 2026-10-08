import React, { useState } from 'react';
import { Optimise } from './pages/Optimise';
import { Evidence } from './pages/Evidence';
import { Method } from './pages/Method';
import { GlossaryDrawer } from './components/Glossary';

type Tab = 'optimise' | 'evidence' | 'method';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('optimise');
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ink text-text flex flex-col selection:bg-peach selection:text-ink">
      {/* Top Hero Band Gradient Bar */}
      <div className="h-1.5 w-full bg-hero-bar"></div>

      {/* Main App Header */}
      <header className="bg-panel border-b border-line shadow-panel sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-hero-gradient flex items-center justify-center text-text font-black text-xl shadow border border-peach/30">
              Q
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-extrabold text-text tracking-tight">
                  Quantum Portfolio Optimiser
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-peach/20 text-peach border border-peach/30">
                  PS-03
                </span>
              </div>
              <p className="text-xs text-muted">
                Qiskit Fall Fest 2026 — NIFTY 50 QAOA &amp; Classical Solvers
              </p>
            </div>
          </div>

          {/* Navigation Tabs & Glossary Button */}
          <div className="flex items-center justify-between sm:justify-end space-x-2">
            <nav className="flex bg-ink/70 p-1 rounded-xl border border-line">
              <button
                type="button"
                onClick={() => setActiveTab('optimise')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'optimise'
                    ? 'bg-peach text-ink shadow'
                    : 'text-muted hover:text-text'
                }`}
              >
                ⚡ Optimise
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('evidence')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'evidence'
                    ? 'bg-peach text-ink shadow'
                    : 'text-muted hover:text-text'
                }`}
              >
                📊 Evidence Studies
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('method')}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'method'
                    ? 'bg-peach text-ink shadow'
                    : 'text-muted hover:text-text'
                }`}
              >
                📜 Methodology
              </button>
            </nav>

            <button
              type="button"
              onClick={() => setGlossaryOpen(true)}
              className="p-2 bg-panel hover:bg-line text-peach border border-line rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow"
              title="Quantum Glossary"
            >
              <span>📖</span>
              <span className="hidden md:inline">Glossary</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'optimise' && <Optimise />}
        {activeTab === 'evidence' && <Evidence />}
        {activeTab === 'method' && <Method />}
      </main>

      {/* Footer */}
      <footer className="bg-panel border-t border-line py-6 px-4 text-center text-xs text-muted space-y-2 mt-12">
        <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
          <span>Qiskit Fall Fest 2026 (Team 4 GOATS)</span>
          <span className="text-line">•</span>
          <span>Powered by Qiskit 2.5 V2 Primitives &amp; Aer Simulator</span>
          <span className="text-line">•</span>
          <span className="text-peach">Strict PS-03 Honesty Protocol</span>
        </div>
        <p className="text-[10px] text-muted/70 max-w-2xl mx-auto">
          No quantum advantage is claimed. Classical brute force evaluates exact solutions on small instances. QAOA solutions represent the best feasible bitstrings sampled from quantum state measurements.
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
