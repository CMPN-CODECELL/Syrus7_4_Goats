// QAOA evidence block of the honesty report: P(optimum) against a random baseline, the random control,
// circuit size and the optional noise simulation. Used inside results/ResultSummary.
// Every figure and sentence comes from the run result; nothing here is a fixed success message.
import type { QaoaResult, Verdict } from '../api/types';
import { formatInt, formatPct, isNum } from '../lib/format';
import { Badge, TD, TDR, TH, THR, ScrollTable } from './results/parts';
import { fmtNum, type QaoaResultX } from './results/model';

interface HonestyPanelProps {
  verdict: Verdict;
  qaoaResult: QaoaResult | QaoaResultX;
  /** Shots the QAOA run used (request.qaoa.shots). */
  shots?: number | null;
  /** Number of feasible portfolios (landscape.n_feasible), used to describe the random baseline. */
  nFeasible?: number | null;
}

const LEVEL_TEXT: Record<Verdict['level'], string> = {
  matched: 'Matched the exact optimum',
  near: 'Near the exact optimum',
  worse: 'Worse than the exact optimum',
  'no-feasible': 'No feasible QAOA sample',
};

function ratioWords(ratio: number | null): string {
  if (ratio === null) return 'a comparison that cannot be made because no baseline is available';
  if (ratio >= 1.05) return `${ratio.toFixed(1)} times the baseline`;
  if (ratio <= 0.95) return `below the baseline (${ratio.toFixed(2)} times)`;
  return 'about the same as the baseline';
}

export function HonestyPanel({ verdict, qaoaResult, shots, nFeasible }: HonestyPanelProps) {
  const qr = qaoaResult as QaoaResultX;
  const m = qr.metrics;
  const control = qr.control ?? null;
  const noise = qr.noise ?? null;
  const circuit = qr.circuit ?? null;

  const ratio = isNum(m?.p_opt) && isNum(m?.p_random) && m.p_random > 0 ? m.p_opt / m.p_random : null;
  const oneInN = isNum(nFeasible) && nFeasible > 0 && isNum(m?.p_random) && Math.abs(m.p_random * nFeasible - 1) < 1e-6;
  const baseline = oneInN
    ? `picking one of the ${formatInt(nFeasible)} feasible portfolios at random (1 in ${formatInt(nFeasible)})`
    : 'a uniform random pick';
  const shotsText = isNum(shots) ? `${formatInt(shots)} shots` : 'the same number of shots';

  const lines: string[] = [];
  if (isNum(m?.p_opt)) {
    lines.push(m.p_opt === 0
      ? `P(opt), the chance that one shot is the exact optimum: QAOA never sampled it. ${baseline.charAt(0).toUpperCase()}${baseline.slice(1)} would hit it ${formatPct(m.p_random, { digits: 2 })} of the time.`
      : `P(opt), the chance that one shot is the exact optimum: ${formatPct(m.p_opt, { digits: 2 })} for QAOA, against ${formatPct(m.p_random, { digits: 2 })} for ${baseline}. That is ${ratioWords(ratio)}.`);
  }
  if (control && isNum(control.p_opt) && isNum(m?.p_opt)) {
    const cmp = control.p_opt > 0 ? m.p_opt / control.p_opt : null;
    lines.push(cmp === null
      ? `The random control (${shotsText} drawn uniformly, no optimisation) never sampled the optimum.`
      : `Against the random control (${shotsText} drawn uniformly, no optimisation), QAOA's P(opt) was ${ratioWords(cmp).replace('baseline', 'control')}.`);
  }
  if (control && isNum(control.best_of_shots_hit) && isNum(m?.best_of_shots_hit)) {
    lines.push(`The chance that at least one of the shots is the exact optimum was ${formatPct(m.best_of_shots_hit, { digits: 2 })} for QAOA and ${formatPct(control.best_of_shots_hit, { digits: 2 })} for the random control.`);
    if (control.best_of_shots_hit >= 0.9) {
      lines.push('Random draws of this size would very likely also include the optimum, so finding it here does not by itself show that the QAOA circuit helped.');
    }
  }

  const rows: { label: string; hint?: string; q: string; c: string }[] = [
    { label: 'P(opt)', hint: 'chance one shot is the exact optimum', q: formatPct(m?.p_opt, { digits: 2 }), c: formatPct(control?.p_opt, { digits: 2 }) },
    { label: 'Feasible rate', hint: 'share of shots that meet every constraint', q: formatPct(m?.feasible_rate, { digits: 1 }), c: formatPct(control?.feasible_rate, { digits: 1 }) },
    { label: 'Approximation ratio', hint: 'expected quality of one shot: 1 = the optimum, 0 = infeasible or worst feasible', q: fmtNum(m?.approx_ratio, 2), c: fmtNum(control?.approx_ratio, 2) },
    { label: 'Best-of-shots hit', hint: 'chance at least one shot is the optimum', q: formatPct(m?.best_of_shots_hit, { digits: 2 }), c: formatPct(control?.best_of_shots_hit, { digits: 2 }) },
  ];

  return (
    <div className="border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-display text-lg uppercase font-light">QAOA against a random baseline</h3>
        <Badge>{LEVEL_TEXT[verdict?.level] ?? String(verdict?.level ?? 'unknown')}</Badge>
      </div>
      {verdict?.headline && <p className="mt-1 text-sm text-muted">Backend verdict: {verdict.headline}</p>}

      {lines.length > 0 && (
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
          {lines.map((l) => <li key={l}>{l}</li>)}
        </ul>
      )}

      <div className="mt-3">
        <ScrollTable label="QAOA compared with a random control">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className={TH}>Measure</th>
                <th scope="col" className={THR}>QAOA</th>
                <th scope="col" className={THR}>Random control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.label}>
                  <th scope="row" className={`${TD} text-left font-normal`}>
                    <span className="text-text">{r.label}</span>
                    {r.hint && <span className="block text-xs text-muted">{r.hint}</span>}
                  </th>
                  <td className={TDR}>{r.q}</td>
                  <td className={TDR}>{control ? r.c : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        {!control && (
          <p className="mt-1 text-xs text-muted">This result has no random-control run, so only the analytic baseline above is available.</p>
        )}
      </div>

      {circuit && (
        <p className="mt-3 font-mono text-xs text-muted">
          Circuit: {formatInt(circuit.qubits)} qubits, {formatInt(circuit.reps)} {circuit.reps === 1 ? 'layer' : 'layers'}, depth {formatInt(circuit.depth)},
          {' '}{formatInt(circuit.two_qubit_gates)} two-qubit gates, optimiser {circuit.optimizer}, start {circuit.init}, seed {circuit.seed}
        </p>
      )}

      {noise && (
        <div className="mt-3 border border-line-strong p-3 text-sm">
          <p className="text-text">Noise simulation ({noise.backend ?? 'backend not named'})</p>
          <p className="mt-1 text-muted">
            P(opt) {formatPct(noise.ideal?.p_opt, { digits: 2 })} without noise, {formatPct(noise.noisy?.p_opt, { digits: 2 })} with noise.
            Approximation ratio {fmtNum(noise.ideal?.approx_ratio, 2)} without noise, {fmtNum(noise.noisy?.approx_ratio, 2)} with noise.
            After compiling for that backend the circuit has depth {formatInt(noise.transpiled?.depth)} and {formatInt(noise.transpiled?.two_qubit_gates)} two-qubit gates.
            This is a simulated noise model, not a run on real hardware.
          </p>
        </div>
      )}
    </div>
  );
}
