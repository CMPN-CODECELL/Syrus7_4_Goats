import React, { useState, useMemo } from 'react';
import { GLOSSARY_TERMS, GlossaryTerm } from '../components/Glossary';

const CATEGORIES = [
  { id: 'ALL', label: 'All Terms' },
  { id: 'QUANTUM', label: 'Quantum Algorithms & Circuits' },
  { id: 'OPTIMIZATION', label: 'Formulation & Objective' },
  { id: 'METRICS', label: 'Benchmark & Solution Metrics' },
  { id: 'HARDWARE', label: 'Hardware & Noise' }
];

const TERM_CATEGORY_MAP: Record<string, string> = {
  qaoa: 'QUANTUM',
  mixer: 'QUANTUM',
  depth: 'QUANTUM',
  shots: 'QUANTUM',
  qubo: 'OPTIMIZATION',
  qubit: 'QUANTUM',
  warm_start: 'QUANTUM',
  approx_ratio: 'METRICS',
  p_opt: 'METRICS',
  noise_model: 'HARDWARE'
};

export const GlossaryPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filteredTerms = useMemo(() => {
    return GLOSSARY_TERMS.filter((t: GlossaryTerm) => {
      const matchSearch =
        t.term.toLowerCase().includes(search.toLowerCase()) ||
        t.short.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());

      const category = TERM_CATEGORY_MAP[t.key] || 'QUANTUM';
      const matchCategory = selectedCategory === 'ALL' || category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [search, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-line p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-accent-blue"></span>
              <h1 className="text-xl font-medium text-text">
                Portfolio-Pulse — Quantum Computing &amp; Quantitative Lexicon
              </h1>
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Definitive terminology guide for the Portfolio-Pulse hybrid quantum-classical pipeline (PS-03 · NIFTY 50).
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto text-xs">
            <span className="px-2.5 py-1 bg-surface-elevated text-text border border-line text-[11px] font-mono">
              {GLOSSARY_TERMS.length} Terms Documented
            </span>
            <span className="px-2.5 py-1 bg-accent-blue/10 text-accent-blue-hover border border-accent-blue/30 text-[11px] font-mono">
              Qiskit 2.5
            </span>
          </div>
        </div>

        {/* Search and Category Filters */}
        <div className="mt-5 pt-4 border-t border-line/60 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Filter terms (e.g. QAOA, QUBO, Approximation Ratio, Mixer)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-bg border border-line px-3.5 py-2.5 text-xs text-text placeholder-muted focus:border-accent-blue focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-text"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 text-xs transition-colors min-h-[38px] ${
                  selectedCategory === cat.id
                    ? 'bg-text text-bg font-medium'
                    : 'bg-surface text-muted hover:text-text border border-line hover:border-line-strong'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Terms Grid */}
      {filteredTerms.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted bg-surface border border-line">
          No glossary terms match your filter "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTerms.map((t: GlossaryTerm) => {
            const category = TERM_CATEGORY_MAP[t.key] || 'QUANTUM';
            return (
              <div
                key={t.key}
                id={`term-${t.key}`}
                className="bg-surface border border-line hover:border-accent-blue/60 transition-colors p-5 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div>
                      <h2 className="text-base font-medium text-text flex items-center gap-2">
                        <span>{t.term}</span>
                      </h2>
                      <span className="text-xs text-muted block mt-0.5">
                        {t.short}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-bg text-muted border border-line shrink-0">
                      {category}
                    </span>
                  </div>

                  <p className="text-xs text-text/90 leading-relaxed mt-2 pt-2 border-t border-line/40">
                    {t.description}
                  </p>
                </div>

                <div className="pt-2 text-[11px] text-muted flex items-center justify-between border-t border-line/30">
                  <span className="font-mono text-[10px] text-faint">ID: {t.key}</span>
                  <span className="text-accent-blue-hover text-[11px]">PS-03 Standard</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Plain Language Note */}
      <div className="bg-surface border border-line p-5 text-xs text-muted space-y-1.5">
        <div className="font-medium text-text flex items-center gap-2">
          <span>ℹ PS-03 Technical Disclosure</span>
        </div>
        <p>
          All quantum circuit operations execute via pure Qiskit 2.5 V2 primitives (<code className="text-text">StatevectorEstimator</code> and <code className="text-text">StatevectorSampler</code>) on exact statevectors or noisy Aer backends. No high-level abstractions or hidden classical solvers are utilized.
        </p>
      </div>
    </div>
  );
};

export default GlossaryPage;
