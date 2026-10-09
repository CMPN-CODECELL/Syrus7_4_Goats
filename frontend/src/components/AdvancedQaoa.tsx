import React, { useState } from 'react';
import { QaoaSettings } from '../api/types';
import { GlossaryTermTooltip } from './Glossary';

interface AdvancedQaoaProps {
  settings: QaoaSettings;
  onChange: (newSettings: QaoaSettings) => void;
}

export const AdvancedQaoa: React.FC<AdvancedQaoaProps> = ({ settings, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const update = <K extends keyof QaoaSettings>(key: K, value: QaoaSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="bg-surface border border-line overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-line/20 transition-colors text-left"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text uppercase tracking-wider">
              Advanced Quantum Settings
            </span>
            <span className="text-[10px] text-muted font-mono">
              [Click to {isOpen ? 'collapse' : 'expand'}]
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-muted">
            <span className="px-1.5 py-0.5 bg-bg border border-line text-text">
              {settings.variant === 'xy' ? 'XY Ring Mixer' : 'Standard Pauli-X'}
            </span>
            <span className="px-1.5 py-0.5 bg-bg border border-line text-text">
              p={settings.reps}
            </span>
            <span className="px-1.5 py-0.5 bg-bg border border-line text-text">
              {settings.shots} shots
            </span>
            <span className="px-1.5 py-0.5 bg-bg border border-line text-text">
              {settings.optimizer}
            </span>
            <span className={`px-1.5 py-0.5 border ${settings.noise ? 'bg-loss/10 border-loss text-loss' : 'bg-bg border-line text-muted'}`}>
              {settings.noise ? 'Noise: FakeGuadalupe' : 'Noise: None (Ideal)'}
            </span>
          </div>
        </div>

        <span className={`text-muted transition-transform text-xs font-medium shrink-0 self-end sm:self-center ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-line bg-bg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {/* QAOA Variant & Mixer */}
          <div>
            <label htmlFor="qaoa-variant" className="text-xs font-medium text-text mb-1.5 block flex items-center gap-1">
              Mixer Variant
              <GlossaryTermTooltip termKey="mixer">
                <span>[?]</span>
              </GlossaryTermTooltip>
            </label>
            <select
              id="qaoa-variant"
              value={settings.variant}
              onChange={(e) => update('variant', e.target.value as 'standard' | 'xy')}
              className="w-full bg-bg border border-line px-3 py-2 text-xs text-text focus:border-text"
            >
              <option value="standard">Standard Pauli-X Mixer</option>
              <option value="xy">XY Ring Mixer + Dicke State Init</option>
            </select>
            <span className="text-[10px] text-muted mt-1 block">
              {settings.variant === 'xy' ? 'Preserves stock count K automatically.' : 'Standard unconstrained mixer.'}
            </span>
          </div>

          {/* Circuit Depth p */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="qaoa-reps" className="text-xs font-medium text-text flex items-center gap-1">
                Circuit Depth (p)
                <GlossaryTermTooltip termKey="depth">
                  <span>[?]</span>
                </GlossaryTermTooltip>
              </label>
              <span className="text-xs font-medium text-text">p = {settings.reps}</span>
            </div>
            <input
              id="qaoa-reps"
              type="range"
              min={1}
              max={5}
              value={settings.reps}
              onChange={(e) => update('reps', Number(e.target.value))}
              className="w-full accent-white bg-bg h-2 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>p=1 (Fast)</span>
              <span>p=5 (High Expressiveness)</span>
            </div>
          </div>

          {/* Optimizer */}
          <div>
            <label htmlFor="qaoa-optimizer" className="text-xs font-medium text-text mb-1.5 block">
              Classical Optimizer
            </label>
            <select
              id="qaoa-optimizer"
              value={settings.optimizer}
              onChange={(e) => update('optimizer', e.target.value as any)}
              className="w-full bg-bg border border-line px-3 py-2 text-xs text-text focus:border-text"
            >
              <option value="COBYLA">COBYLA (Gradient-free, Default)</option>
              <option value="SPSA">SPSA (Stochastic, Noise-resilient)</option>
              <option value="NELDER_MEAD">Nelder-Mead (Simplex Search)</option>
            </select>
          </div>

          {/* Initialization */}
          <div>
            <label htmlFor="qaoa-init" className="text-xs font-medium text-text mb-1.5 block flex items-center gap-1">
              Parameter Initialization
              <GlossaryTermTooltip termKey="warm_start">
                <span>[?]</span>
              </GlossaryTermTooltip>
            </label>
            <select
              id="qaoa-init"
              value={settings.init}
              onChange={(e) => update('init', e.target.value as any)}
              className="w-full bg-bg border border-line px-3 py-2 text-xs text-text focus:border-text"
            >
              <option value="ramp">Linear Ramp (Standard)</option>
              <option value="interp">Interp (Warm Start from depth p-1)</option>
              <option value="random">Random Initialization</option>
            </select>
            {settings.init === 'interp' && (
              <span className="text-[10px] text-text font-medium mt-1 block">
                Warm Start: Uses previous depth parameters. PS-03 compliant.
              </span>
            )}
          </div>

          {/* Measurement Shots */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label htmlFor="qaoa-shots" className="text-xs font-medium text-text flex items-center gap-1">
                Measurement Shots
                <GlossaryTermTooltip termKey="shots">
                  <span>[?]</span>
                </GlossaryTermTooltip>
              </label>
              <span className="text-xs font-medium text-text">{settings.shots}</span>
            </div>
            <select
              id="qaoa-shots"
              value={settings.shots}
              onChange={(e) => update('shots', Number(e.target.value))}
              className="w-full bg-bg border border-line px-3 py-2 text-xs text-text focus:border-text"
            >
              <option value={1024}>1,024 shots</option>
              <option value={2048}>2,048 shots (Default)</option>
              <option value={4096}>4,096 shots</option>
              <option value={8192}>8,192 shots</option>
              <option value={16384}>16,384 shots (High Precision)</option>
            </select>
          </div>

          {/* Random Seed & Max Iterations */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="qaoa-maxiter" className="text-xs font-medium text-text mb-1 block">Max Iterations</label>
                <input
                  id="qaoa-maxiter"
                  type="number"
                  min={20}
                  max={500}
                  value={settings.maxiter}
                  onChange={(e) => update('maxiter', Number(e.target.value))}
                  className="w-full bg-bg border border-line px-3 py-1.5 text-xs text-text focus:border-text"
                />
              </div>
              <div>
                <label htmlFor="qaoa-seed" className="text-xs font-medium text-text mb-1 block">RNG Seed</label>
                <input
                  id="qaoa-seed"
                  type="number"
                  value={settings.seed}
                  onChange={(e) => update('seed', Number(e.target.value))}
                  className="w-full bg-bg border border-line px-3 py-1.5 text-xs text-text focus:border-text"
                />
              </div>
            </div>
          </div>

          {/* Noise Simulation Toggle */}
          <div className="sm:col-span-2 md:col-span-3 pt-3 border-t border-line/60 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  aria-label="Simulate hardware noise"
                  checked={settings.noise}
                  onChange={(e) => update('noise', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-bg border border-line-strong peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-faint peer-checked:after:bg-bg after:h-4 after:w-4 after:transition-all peer-checked:bg-text"></div>
              </label>
              <div>
                <span className="text-xs font-medium text-text block">
                  Simulate IBM Guadalupe Hardware Noise
                </span>
                <span className="text-[11px] text-muted">
                  Samples the optimised circuit on Aer with the FakeGuadalupeV2 noise model, next to the noiseless run.
                </span>
              </div>
            </div>
            {settings.noise && (
              <span className="text-xs font-medium text-text bg-surface px-2.5 py-1 border border-line-strong">
                Noise Model Active
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
