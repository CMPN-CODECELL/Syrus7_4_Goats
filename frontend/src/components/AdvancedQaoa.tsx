import React, { type ReactNode } from 'react';
import { QaoaSettings } from '../api/types';
import { LIMITS, issueFor, type ConfigIssue } from '../state/validate';
import { GlossaryLink } from './Glossary';
import { FieldError, NumField, ParamNote, Switch } from './wizard/fields';

interface AdvancedQaoaProps {
  settings: QaoaSettings;
  onChange: (newSettings: QaoaSettings) => void;
  qubitCap: number;
  onQubitCapChange: (n: number) => void;
  issues: ConfigIssue[];
}

const selectClass = 'mt-1 min-h-[44px] w-full max-w-sm border border-line-strong bg-bg px-3 text-base text-text';

/** One advanced control: plain name, technical name, plain explanation, the control, then range, default and effect. */
function Param({ id, label, tech, plain, children, error, range, def, effect }: {
  id: string; label: ReactNode; tech: string; plain: ReactNode; children: ReactNode; error?: string;
  range: ReactNode; def: ReactNode; effect: ReactNode;
}) {
  return (
    <div className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <label htmlFor={id} className="block text-sm font-medium text-text">{label}</label>
      <p className="mt-0.5 text-sm text-muted">{plain}</p>
      {children}
      <FieldError id={`${id}-error`}>{error}</FieldError>
      <ParamNote name={tech} range={range} def={def} effect={effect} />
    </div>
  );
}

function Group({ title, lead, defaultOpen = true, children }: { title: string; lead: string; defaultOpen?: boolean; children: ReactNode }) {
  return (
    <details open={defaultOpen} className="border border-line bg-bg">
      <summary className="flex min-h-[44px] cursor-pointer flex-col justify-center px-4 py-2">
        <span className="text-base font-medium text-text">{title}</span>
        <span className="text-sm text-muted">{lead}</span>
      </summary>
      <div className="border-t border-line px-4 py-4">{children}</div>
    </details>
  );
}

export const AdvancedQaoa: React.FC<AdvancedQaoaProps> = ({ settings, onChange, qubitCap, onQubitCapChange, issues }) => {
  const update = <K extends keyof QaoaSettings>(key: K, value: QaoaSettings[K]) => onChange({ ...settings, [key]: value });
  const bad = (field: Parameters<typeof issueFor>[1]) => issueFor(issues, field);

  return (
    <div className="space-y-3">
      <Group title="Circuit" lead="The shape of the quantum circuit.">
        <Param
          id="qaoa-variant"
          label={<>Mixer <GlossaryLink id="mixer">(what is a mixer?)</GlossaryLink></>}
          tech="variant: 'standard' | 'xy'"
          plain="The mixer decides how the circuit moves between candidate portfolios."
          range="standard or xy."
          def="xy."
          effect="The XY ring mixer starts from states that already hold exactly K stocks and keeps it that way. The standard mixer can also sample states with the wrong number of stocks, which then count as infeasible."
        >
          <select id="qaoa-variant" value={settings.variant} onChange={(e) => update('variant', e.target.value as QaoaSettings['variant'])} className={selectClass}>
            <option value="xy">XY ring mixer with Dicke-state start</option>
            <option value="standard">Standard Pauli-X mixer</option>
          </select>
        </Param>

        <Param
          id="qaoa-reps"
          label={<>Circuit depth p <GlossaryLink id="qaoa-depth">(what is depth?)</GlossaryLink></>}
          tech="reps (p)"
          plain="How many times the circuit repeats its cost-and-mixer layers."
          error={bad('reps')}
          range={`${LIMITS.reps.min} to ${LIMITS.reps.max}, whole number.`}
          def={LIMITS.reps.def}
          effect="More layers give the circuit more freedom and add two angles to tune per layer, but the circuit gets deeper and the run slower. It does not by itself guarantee a better result."
        >
          <NumField id="qaoa-reps" inputMode="numeric" value={settings.reps} onCommit={(n) => update('reps', n)} aria-invalid={!!bad('reps')} aria-describedby="qaoa-reps-error" className="mt-1 w-28" />
        </Param>
      </Group>

      <Group title="Classical optimiser" lead="How the circuit's angles are tuned.">
        <Param
          id="qaoa-optimizer"
          label="Optimiser"
          tech="optimizer: 'COBYLA' | 'SPSA' | 'NELDER_MEAD'"
          plain="The classical method that adjusts the circuit angles between runs of the circuit."
          range="COBYLA, SPSA or NELDER_MEAD."
          def="COBYLA."
          effect="All three need no gradients. SPSA is designed for noisy evaluations; COBYLA and Nelder-Mead are common choices for noiseless ones. Each can end at a different result."
        >
          <select id="qaoa-optimizer" value={settings.optimizer} onChange={(e) => update('optimizer', e.target.value as QaoaSettings['optimizer'])} className={selectClass}>
            <option value="COBYLA">COBYLA (default)</option>
            <option value="SPSA">SPSA (built for noise)</option>
            <option value="NELDER_MEAD">Nelder-Mead (simplex search)</option>
          </select>
        </Param>

        <Param
          id="qaoa-init"
          label={<>Starting angles <GlossaryLink id="warm-start">(what is a warm start?)</GlossaryLink></>}
          tech="init: 'ramp' | 'interp' | 'random'"
          plain="Where the optimiser begins."
          range="ramp, interp or random."
          def="ramp."
          effect="Ramp starts from a gradual schedule. Interp reuses the angles found at depth p−1 (a warm start). Random starts anywhere, so the result depends more on the seed."
        >
          <select id="qaoa-init" value={settings.init} onChange={(e) => update('init', e.target.value as QaoaSettings['init'])} className={selectClass}>
            <option value="ramp">Linear ramp (default)</option>
            <option value="interp">Interp (warm start from depth p−1)</option>
            <option value="random">Random</option>
          </select>
        </Param>

        <Param
          id="qaoa-maxiter"
          label="Maximum iterations"
          tech="maxiter"
          plain="The most tuning steps the optimiser may take."
          error={bad('maxiter')}
          range={`${LIMITS.maxiter.min} to ${LIMITS.maxiter.max}, whole number.`}
          def={LIMITS.maxiter.def}
          effect="A higher limit allows more tuning but a longer run, and the optimiser may stop sooner on its own. Stopping at the limit does not mean the best angles were found."
        >
          <NumField id="qaoa-maxiter" inputMode="numeric" value={settings.maxiter} onCommit={(n) => update('maxiter', n)} aria-invalid={!!bad('maxiter')} aria-describedby="qaoa-maxiter-error" className="mt-1 w-28" />
        </Param>
      </Group>

      <Group title="Sampling and noise" lead="How the final circuit is measured.">
        <Param
          id="qaoa-shots"
          label={<>Measurement shots <GlossaryLink id="shots">(what are shots?)</GlossaryLink></>}
          tech="shots"
          plain="How many times the finished circuit is measured to estimate which portfolios it favours."
          error={bad('shots')}
          range={`${LIMITS.shots.min} to ${LIMITS.shots.max.toLocaleString('en-IN')}, whole number.`}
          def={LIMITS.shots.def.toLocaleString('en-IN')}
          effect="More shots make the probability estimates steadier and the run longer. With noise simulation on, the noisy sample uses at most 1,024 shots."
        >
          <NumField id="qaoa-shots" inputMode="numeric" value={settings.shots} onCommit={(n) => update('shots', n)} aria-invalid={!!bad('shots')} aria-describedby="qaoa-shots-error" className="mt-1 w-32" />
        </Param>

        <div className="border-t border-line py-4">
          <Switch
            id="qaoa-noise"
            checked={settings.noise}
            onChange={(v) => update('noise', v)}
            label={<>Simulate hardware noise <GlossaryLink id="noise-model">(what is a noise model?)</GlossaryLink></>}
            description="Also samples the tuned circuit on Aer with the FakeGuadalupeV2 noise model, next to the noiseless run."
          />
          <ParamNote
            name="noise: boolean"
            range="on or off."
            def="off."
            effect="Adds a second, noisy sample so you can compare. The run takes longer, and the noisy sample is capped at 1,024 shots."
          />
        </div>

        <Param
          id="qaoa-seed"
          label="Random seed"
          tech="seed"
          plain="A number that fixes the random choices, so the same settings can be repeated."
          error={bad('seed')}
          range="any whole number."
          def={LIMITS.seed.def}
          effect="The same seed and settings repeat the same run. A different seed can change the starting angles and the sampled results."
        >
          <NumField id="qaoa-seed" inputMode="numeric" value={settings.seed} onCommit={(n) => update('seed', n)} aria-invalid={!!bad('seed')} aria-describedby="qaoa-seed-error" className="mt-1 w-32" />
        </Param>
      </Group>

      <Group title="Execution" lead="Limits on the size of the quantum problem.">
        <Param
          id="qubit-cap"
          label={<>Qubit cap <GlossaryLink id="qubit">(what is a qubit?)</GlossaryLink></>}
          tech="qubit_cap"
          plain="The most qubits the circuit may use: one per shortlisted stock plus slack qubits for the constraints."
          error={bad('qubitCap')}
          range={`${LIMITS.qubitCap.min} to ${LIMITS.qubitCap.max}, whole number.`}
          def={LIMITS.qubitCap.def}
          effect="A larger cap keeps more stocks on the shortlist, but the simulation time grows steeply: about 3 minutes at 16 against under a minute at 12."
        >
          <NumField id="qubit-cap" inputMode="numeric" value={qubitCap} onCommit={onQubitCapChange} aria-invalid={!!bad('qubitCap')} aria-describedby="qubit-cap-error" className="mt-1 w-28" />
        </Param>
      </Group>
    </div>
  );
};
