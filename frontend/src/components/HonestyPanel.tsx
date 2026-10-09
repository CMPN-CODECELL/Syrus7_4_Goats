import React from 'react';
import { Verdict, QaoaResult } from '../api/types';
import { formatPercent, formatNumber, negativeClass } from '../lib/chartColors';

interface HonestyPanelProps {
  verdict: Verdict;
  qaoaResult: QaoaResult;
}

export const HonestyPanel: React.FC<HonestyPanelProps> = ({ verdict, qaoaResult }) => {
  const { metrics, noise, circuit } = qaoaResult;

  const badges: Record<Verdict['level'], { text: string; bg: string }> = {
    matched: { text: 'MATCHED THE EXACT OPTIMUM', bg: 'bg-gain/10 text-gain border-gain/40' },
    near: { text: 'NEAR THE OPTIMUM', bg: 'bg-surface text-text border-line-strong' },
    worse: { text: 'WORSE THAN THE OPTIMUM', bg: 'bg-loss/10 text-loss border-loss/40' },
    'no-feasible': { text: '⚠ NO FEASIBLE SAMPLE', bg: 'bg-loss/10 text-loss border-loss/40' }
  };
  const badge = badges[verdict.level] ?? { text: verdict.level.toUpperCase(), bg: 'bg-surface text-muted border-line-strong' };
  const pOptMultiplier =
    metrics.p_random != null && metrics.p_random > 0 && metrics.p_opt != null
      ? (metrics.p_opt / metrics.p_random).toFixed(1)
      : '—';

  return (
    <div className="bg-surface border border-line p-6 space-y-5">
      {/* Header & Verdict Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
        <div>
          <h2 className="text-sm font-medium text-text flex items-center gap-2 uppercase tracking-wide">
            <span>Portfolio-Pulse · PS-03 Honesty &amp; Verdict Report</span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Automated verdict evaluation based on exact brute force comparison. No quantum superiority is claimed.
          </p>
        </div>

        <span className={`px-3 py-1 text-xs font-medium border self-start sm:self-auto ${badge.bg}`}>
          {badge.text}
        </span>
      </div>

      {/* Headline & Details */}
      <div className="bg-bg border border-line p-4 space-y-2">
        <h3 className="font-medium text-sm text-text">{verdict.headline}</h3>
        <ul className="space-y-1.5 text-xs text-text/90 list-disc list-inside">
          {(verdict.details ?? []).map((detail, idx) => (
            <li key={idx} className="leading-relaxed">{detail}</li>
          ))}
        </ul>
      </div>

      {/* Key Metric Comparison Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-bg p-3 border border-line/60">
          <span className="label block mb-1">Approximation Ratio</span>
          <span className={`text-base font-medium ${negativeClass(metrics.approx_ratio)}`}>
            {formatNumber(metrics.approx_ratio, 2)}
          </span>
          <span className="text-[13px] text-muted block mt-0.5">1.0 = Exact Optimum</span>
        </div>

        <div className="bg-bg p-3 border border-line/60">
          <span className="label block mb-1">P(opt) Probability</span>
          <span className="text-base font-medium text-text">
            {formatPercent(metrics.p_opt, 2)}
          </span>
          <span className="text-[13px] text-muted block mt-0.5">{pOptMultiplier}x random guess ({formatPercent(metrics.p_random, 2)})</span>
        </div>

        <div className="bg-bg p-3 border border-line/60">
          <span className="label block mb-1">Feasible Rate</span>
          <span className={`text-base font-medium ${metrics.feasible_rate === 0 ? 'text-loss' : 'text-text'}`}>
            {formatPercent(metrics.feasible_rate)}
          </span>
          <span className="text-[13px] text-muted block mt-0.5">Bitstrings meeting rules</span>
        </div>

        <div className="bg-bg p-3 border border-line/60">
          <span className="label block mb-1">Circuit Complexity</span>
          <span className="text-base font-medium text-text">
            {circuit?.depth ?? '—'} d / {circuit?.two_qubit_gates ?? '—'} 2q
          </span>
          <span className="text-[13px] text-muted block mt-0.5">{circuit?.qubits ?? '—'} Qubits (p={circuit?.reps ?? '—'})</span>
        </div>
      </div>

      {/* Hardware Noise Simulation Report (if active) */}
      {noise && (
        <div className="bg-surface border border-line-strong p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-medium text-text flex items-center gap-1.5">
              <span>⚠</span> Hardware Noise Simulation ({noise.backend})
            </h4>
            <span className="text-[13px] text-muted">Transpiled depth: {noise.transpiled?.depth ?? '—'} | 2-qubit gates: {noise.transpiled?.two_qubit_gates ?? '—'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 bg-bg border border-line">
              <span className="text-[13px] text-muted block">Ideal (no noise)</span>
              <span className={`font-medium ${negativeClass(noise.ideal?.approx_ratio)}`}>Ratio: {formatNumber(noise.ideal?.approx_ratio, 2)}</span>
            </div>
            <div className="p-2.5 bg-bg border border-line">
              <span className="text-[13px] text-muted block">Noisy backend</span>
              <span className={`font-medium ${negativeClass(noise.noisy?.approx_ratio)}`}>Ratio: {formatNumber(noise.noisy?.approx_ratio, 2)}</span>
            </div>
            <div className="p-2.5 bg-bg border border-line">
              <span className="text-[13px] text-muted block">P(opt), ideal to noisy</span>
              <span className="text-text font-medium">{formatPercent(noise.ideal?.p_opt, 2)} → {formatPercent(noise.noisy?.p_opt, 2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
