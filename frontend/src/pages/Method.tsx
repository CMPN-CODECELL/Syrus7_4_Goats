import React from 'react';
import { GlossaryTermTooltip } from '../components/Glossary';

export const Method: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Hero Header */}
      <div className="bg-surface border border-line p-6">
        <h1 className="text-xl font-medium text-text mb-2 flex items-center gap-2">
          Portfolio-Pulse — Methodology, QUBO Formulation &amp; Honesty Standard
        </h1>
        <p className="text-xs text-muted leading-relaxed">
          Portfolio-Pulse translates modern portfolio theory into a Quadratic Unconstrained Binary Optimization (QUBO) problem of up to 16 qubits (12 by default), solved with Qiskit 2.5 QAOA primitives and three classical benchmark solvers.
        </p>
      </div>

      {/* PS-03 Honesty Charter */}
      <div className="bg-surface border border-line-strong p-5">
        <h2 className="text-sm font-medium text-text mb-3 flex items-center gap-2">
          Qiskit Fall Fest 2026 Honesty Charter (PS-03 Rules)
        </h2>
        <ul className="space-y-2 text-xs text-text/90">
          <li className="flex items-start gap-2">
            <span className="text-text font-medium">•</span>
            <span><strong>Honest Quantum Evaluation:</strong> We never claim quantum superiority or classical displacement on current noisy hardware.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text font-medium">•</span>
            <span><strong>No Classical Wrapping:</strong> QAOA's portfolio selection comes purely from sampling bitstrings from the optimized quantum state, never from classical solvers.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text font-medium">•</span>
            <span><strong>No Injected Known Optimum:</strong> Initial states are unbiased (random, ramp, or depth p-1 interp warm starts). Classical optimums are never injected into QAOA.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-text font-medium">•</span>
            <span><strong>No Infeasible Repair:</strong> Infeasible bitstrings sampled from QAOA are not silently post-processed into feasible ones. If QAOA samples no feasible state, it returns <code className="text-text">selection: null</code>.</span>
          </li>
        </ul>
      </div>

      {/* QUBO Equation */}
      <div className="bg-surface border border-line p-6 space-y-4">
        <h2 className="text-base font-medium text-text flex items-center gap-2">
          QUBO Formulation
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          Given asset expected returns μ, covariance Σ, risk aversion q ∈ [0, 1], and target cardinality K, the objective function without penalties is:
        </p>

        <div className="bg-bg p-4 border border-line text-center overflow-x-auto">
          <code className="text-sm text-text">
            F(x) = q · (xᵀ Σ x / K²) − (1 − q) · (μᵀ x / K − tc(x))
          </code>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-3 bg-bg border border-line/60">
            <h3 className="font-medium text-text mb-1">Risk-Weighted Variance</h3>
            <p className="text-muted text-[11px]">
              Encodes portfolio variance scaled by risk aversion <code className="text-text">q</code>.
            </p>
          </div>
          <div className="p-3 bg-bg border border-line/60">
            <h3 className="font-medium text-text mb-1">Net Expected Return</h3>
            <p className="text-muted text-[11px]">
              Deducts transaction costs <code className="text-text">tc(x)</code> from raw expected return.
            </p>
          </div>
        </div>
      </div>

      {/* Solver Benchmarks */}
      <div className="bg-surface border border-line p-6">
        <h2 className="text-base font-medium text-text mb-4">
          Classical Benchmark Architecture
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-bg border border-line">
            <div className="font-medium text-text mb-1">1. Brute Force (Exact)</div>
            <p className="text-muted text-[11px]">Evaluates all C(N, K) combinations to guarantee finding the exact global minimum.</p>
          </div>
          <div className="p-4 bg-bg border border-line">
            <div className="font-medium text-text mb-1">2. Relaxation + Rounding</div>
            <p className="text-muted text-[11px]">Relaxes 0/1 integer constraints to continuous [0, 1] bounds, solved via CVXPY then rounded.</p>
          </div>
          <div className="p-4 bg-bg border border-line">
            <div className="font-medium text-text mb-1">3. Simulated Annealing</div>
            <p className="text-muted text-[11px]">Classical thermal fluctuation heuristic over the 2ⁿ QUBO energy landscape.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
