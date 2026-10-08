import React from 'react';
import { Verdict, QaoaResult } from '../api/types';
import { formatPercent, formatNumber } from '../lib/chartColors';

interface HonestyPanelProps {
  verdict: Verdict;
  qaoaResult: QaoaResult;
}

export const HonestyPanel: React.FC<HonestyPanelProps> = ({ verdict, qaoaResult }) => {
  const { metrics, noise, circuit } = qaoaResult;

  const getLevelBadge = (level: Verdict['level']) => {
    switch (level) {
      case 'exact':
        return { text: 'EXACT OPTIMUM FOUND', bg: 'bg-peach/20 text-peach border-peach/40' };
      case 'near':
        return { text: 'NEAR OPTIMAL (CLOSE APPROXIMATION)', bg: 'bg-peach/15 text-peach border-peach/30' };
      case 'poor':
        return { text: 'SUBOPTIMAL SAMPLING', bg: 'bg-line/60 text-muted border-line' };
      case 'infeasible':
        return { text: 'INFEASIBLE (CONSTRAINTS VIOLATED)', bg: 'bg-wine/40 text-red border-wine' };
    }
  };

  const badge = getLevelBadge(verdict.level);
  const pOptMultiplier = metrics.p_random > 0 ? (metrics.p_opt / metrics.p_random).toFixed(1) : '1.0';

  return (
    <div className="bg-panel border border-line rounded-2xl p-6 shadow-panel mb-6 space-y-5">
      {/* Header & Verdict Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <span>🛡️ PS-03 Honesty &amp; Verdict Report</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Automated verdict evaluation based on exact brute force comparison. No quantum advantage is claimed.
          </p>
        </div>

        <span className={`px-3 py-1 text-xs font-mono font-bold rounded-full border shadow-sm self-start sm:self-auto ${badge.bg}`}>
          {badge.text}
        </span>
      </div>

      {/* Headline & Details */}
      <div className="bg-ink/60 border border-line rounded-xl p-4 space-y-2">
        <h3 className="font-extrabold text-sm text-peach">{verdict.headline}</h3>
        <ul className="space-y-1.5 text-xs text-text/90 list-disc list-inside">
          {verdict.details.map((detail, idx) => (
            <li key={idx} className="leading-relaxed">{detail}</li>
          ))}
        </ul>
      </div>

      {/* Key Metric Comparison Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-ink/40 p-3 rounded-xl border border-line/60">
          <span className="text-[10px] text-muted font-bold uppercase block mb-1">Approximation Ratio</span>
          <span className="text-base font-extrabold text-peach font-mono">
            {formatNumber(metrics.approx_ratio, 2)}
          </span>
          <span className="text-[10px] text-muted block mt-0.5">1.0 = Exact Optimum</span>
        </div>

        <div className="bg-ink/40 p-3 rounded-xl border border-line/60">
          <span className="text-[10px] text-muted font-bold uppercase block mb-1">P(opt) Probability</span>
          <span className="text-base font-extrabold text-peach font-mono">
            {formatPercent(metrics.p_opt)}
          </span>
          <span className="text-[10px] text-muted block mt-0.5">{pOptMultiplier}x random guess ({formatPercent(metrics.p_random)})</span>
        </div>

        <div className="bg-ink/40 p-3 rounded-xl border border-line/60">
          <span className="text-[10px] text-muted font-bold uppercase block mb-1">Feasible Rate</span>
          <span className="text-base font-extrabold text-slate font-mono">
            {formatPercent(metrics.feasible_rate)}
          </span>
          <span className="text-[10px] text-muted block mt-0.5">Bitstrings meeting rules</span>
        </div>

        <div className="bg-ink/40 p-3 rounded-xl border border-line/60">
          <span className="text-[10px] text-muted font-bold uppercase block mb-1">Circuit Complexity</span>
          <span className="text-base font-extrabold text-text font-mono">
            {circuit.depth} d / {circuit.two_qubit_gates} 2q
          </span>
          <span className="text-[10px] text-muted block mt-0.5">{circuit.qubits} Qubits (p={circuit.reps})</span>
        </div>
      </div>

      {/* Hardware Noise Simulation Report (if active) */}
      {noise && (
        <div className="bg-wine/20 border border-wine/50 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-peach flex items-center gap-1.5">
              <span>⚠️</span> Hardware Noise Simulation ({noise.backend})
            </h4>
            <span className="text-[10px] font-mono text-muted">Transpiled Depth: {noise.transpiled.depth} | 2-Qubit Gates: {noise.transpiled.two_qubit_gates}</span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 bg-ink/70 rounded-lg border border-line">
              <span className="text-[10px] text-muted block">Ideal Statevector</span>
              <span className="text-peach font-bold">Ratio: {noise.ideal.approx_ratio.toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-ink/70 rounded-lg border border-line">
              <span className="text-[10px] text-muted block">Noisy Backend</span>
              <span className="text-red font-bold">Ratio: {noise.noisy.approx_ratio.toFixed(2)}</span>
            </div>
            <div className="p-2.5 bg-ink/70 rounded-lg border border-line">
              <span className="text-[10px] text-muted block">P(opt) Drop</span>
              <span className="text-text font-bold">{formatPercent(noise.ideal.p_opt)} → {formatPercent(noise.noisy.p_opt)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
