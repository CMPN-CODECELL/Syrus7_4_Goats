import React, { useState } from 'react';

export interface GlossaryTerm {
  key: string;
  term: string;
  short: string;
  description: string;
}

export const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    key: 'qaoa',
    term: 'QAOA',
    short: 'Quantum Approximate Optimization Algorithm',
    description: 'A hybrid quantum-classical algorithm that alternates problem-encoding cost layers and mixer layers to find high-quality solutions to combinatorial problems.'
  },
  {
    key: 'qubo',
    term: 'QUBO',
    short: 'Quadratic Unconstrained Binary Optimization',
    description: 'A mathematical formulation using 0/1 binary decision variables (buying or skipping a stock) where constraint violations are turned into penalty values added to the objective.'
  },
  {
    key: 'qubit',
    term: 'Qubit',
    short: 'Quantum Bit',
    description: 'The basic unit of quantum info. In our model, each qubit represents either a stock selection bit (1 = pick stock, 0 = omit) or a slack bit for inequality constraints.'
  },
  {
    key: 'mixer',
    term: 'Mixer',
    short: 'Quantum Mixer Operator',
    description: 'The quantum circuit layer responsible for exploring different candidate portfolios. Standard uses Pauli-X mixers; XY mixers preserve fixed particle count (stock count K) automatically.'
  },
  {
    key: 'depth',
    term: 'Depth (p)',
    short: 'Circuit Repetitions',
    description: 'The number of alternating cost-and-mixer layers in QAOA. Higher depth p allows more expressiveness and higher quality, but requires longer circuit execution time.'
  },
  {
    key: 'shots',
    term: 'Shots',
    short: 'Circuit Measurement Repeated Runs',
    description: 'The number of times the quantum circuit is prepared and measured. More shots yield more accurate probability estimates for sampled portfolio bitstrings.'
  },
  {
    key: 'approx_ratio',
    term: 'Approximation Ratio',
    short: 'Solution Quality Metric',
    description: 'The ratio of the expected energy achieved by QAOA to the exact minimum energy from brute force. 1.0 means exact optimum reached.'
  },
  {
    key: 'p_opt',
    term: 'P(opt)',
    short: 'Probability of Optimal State',
    description: 'The frequency with which measurement of the final QAOA state produces the exact globally optimal portfolio bitstring.'
  },
  {
    key: 'warm_start',
    term: 'Warm Start',
    short: 'Parameter Reuse (Interp)',
    description: 'Initializing QAOA angles for depth p using interpolated parameters from depth p-1 optimization, accelerating convergence without classical pre-solving.'
  },
  {
    key: 'noise_model',
    term: 'Noise Model',
    short: 'Hardware Error Simulation',
    description: 'Simulates realistic physical quantum hardware errors (gate depolarisation, thermal relaxation, readout errors) on backends like FakeGuadalupeV2.'
  }
];

export const GlossaryTermTooltip: React.FC<{ termKey: string; children: React.ReactNode }> = ({ termKey, children }) => {
  const [open, setOpen] = useState(false);
  const termObj = GLOSSARY_TERMS.find(t => t.key === termKey);

  if (!termObj) return <>{children}</>;

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="underline decoration-dotted decoration-muted hover:decoration-text text-text cursor-help font-medium"
        aria-expanded={open}
        aria-label={`What is ${termObj.term}?`}
      >
        {children}
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-surface border border-line text-left text-xs text-text pointer-events-none transition-all"
        >
          <div className="font-medium text-text mb-1">{termObj.term} <span className="text-[10px] text-muted font-medium">({termObj.short})</span></div>
          <p className="text-muted text-[11px] leading-relaxed">{termObj.description}</p>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-surface"></div>
        </div>
      )}
    </span>
  );
};

export const GlossaryDrawer: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-bg/80 transition-opacity">
      <div className="w-full max-w-md bg-surface border-l border-line p-6 overflow-y-auto flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-line mb-4">
            <h2 className="text-lg font-medium text-text flex items-center gap-2">
              Portfolio-Pulse Investor Glossary
            </h2>
            <button
              onClick={onClose}
              className="text-muted hover:text-text text-xl font-medium p-1 hover:bg-line/50 transition-colors"
              aria-label="Close glossary"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-muted mb-6">
            Plain-language explanations of quantum computing and optimization terms used across this application.
          </p>

          <div className="space-y-4">
            {GLOSSARY_TERMS.map((t) => (
              <div key={t.key} className="p-3.5 bg-bg border border-line/60 hover:border-text transition-colors">
                <div className="flex items-baseline justify-between mb-1">
                  <h3 className="font-medium text-text text-sm">{t.term}</h3>
                  <span className="text-[10px] text-muted">{t.short}</span>
                </div>
                <p className="text-xs text-text/90 leading-relaxed">{t.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-line mt-6 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-line text-text hover:bg-line/80 font-medium text-xs transition-colors"
          >
            Close Glossary
          </button>
        </div>
      </div>
    </div>
  );
};
