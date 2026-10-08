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
    <div className="bg-panel border border-line rounded-2xl shadow-panel mb-6 overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-line/20 transition-colors text-left"
      >
        <div className="flex items-center space-x-3">
          <span className="text-peach font-bold text-sm">⚛</span>
          <div>
            <h2 className="text-sm font-bold text-text flex items-center gap-2">
              Advanced QAOA Hyperparameters
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-peach/10 text-peach font-normal border border-peach/20">
                {settings.variant.toUpperCase()} (p={settings.reps}, {settings.shots} shots)
              </span>
            </h2>
            <p className="text-[11px] text-muted">
              Configure quantum circuit depth p, mixer type, classical optimizer, and noise simulation.
            </p>
          </div>
        </div>

        <span className={`text-muted transition-transform duration-200 text-xs font-bold ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="p-5 border-t border-line bg-ink/30 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {/* QAOA Variant & Mixer */}
          <div>
            <label className="text-xs font-bold text-text mb-1.5 block flex items-center gap-1">
              Mixer Variant
              <GlossaryTermTooltip termKey="mixer">
                <span>[?]</span>
              </GlossaryTermTooltip>
            </label>
            <select
              value={settings.variant}
              onChange={(e) => update('variant', e.target.value as 'standard' | 'xy')}
              className="w-full bg-ink border border-line rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-peach"
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
              <label className="text-xs font-bold text-text flex items-center gap-1">
                Circuit Depth (p)
                <GlossaryTermTooltip termKey="depth">
                  <span>[?]</span>
                </GlossaryTermTooltip>
              </label>
              <span className="text-xs font-bold text-peach font-mono">p = {settings.reps}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              value={settings.reps}
              onChange={(e) => update('reps', Number(e.target.value))}
              className="w-full accent-peach bg-ink h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted mt-1">
              <span>p=1 (Fast)</span>
              <span>p=5 (High Expressiveness)</span>
            </div>
          </div>

          {/* Optimizer */}
          <div>
            <label className="text-xs font-bold text-text mb-1.5 block">
              Classical Optimizer
            </label>
            <select
              value={settings.optimizer}
              onChange={(e) => update('optimizer', e.target.value as any)}
              className="w-full bg-ink border border-line rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-peach"
            >
              <option value="COBYLA">COBYLA (Gradient-free, Default)</option>
              <option value="SPSA">SPSA (Stochastic, Noise-resilient)</option>
              <option value="NELDER_MEAD">Nelder-Mead (Simplex Search)</option>
            </select>
          </div>

          {/* Initialization */}
          <div>
            <label className="text-xs font-bold text-text mb-1.5 block flex items-center gap-1">
              Parameter Initialization
              <GlossaryTermTooltip termKey="warm_start">
                <span>[?]</span>
              </GlossaryTermTooltip>
            </label>
            <select
              value={settings.init}
              onChange={(e) => update('init', e.target.value as any)}
              className="w-full bg-ink border border-line rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-peach"
            >
              <option value="ramp">Linear Ramp (Standard)</option>
              <option value="interp">Interp (Warm Start from depth p-1)</option>
              <option value="random">Random Initialization</option>
            </select>
            {settings.init === 'interp' && (
              <span className="text-[10px] text-peach font-medium mt-1 block">
                ⚡ Warm Start: Uses previous depth parameters. PS-03 compliant.
              </span>
            )}
          </div>

          {/* Measurement Shots */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-text flex items-center gap-1">
                Measurement Shots
                <GlossaryTermTooltip termKey="shots">
                  <span>[?]</span>
                </GlossaryTermTooltip>
              </label>
              <span className="text-xs font-bold text-peach font-mono">{settings.shots}</span>
            </div>
            <select
              value={settings.shots}
              onChange={(e) => update('shots', Number(e.target.value))}
              className="w-full bg-ink border border-line rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-peach"
            >
              <option value={1024}>1,024 shots</option>
              <option value={4096}>4,096 shots (Standard)</option>
              <option value={8192}>8,192 shots</option>
              <option value={16384}>16,384 shots (High Precision)</option>
            </select>
          </div>

          {/* Random Seed & Max Iterations */}
          <div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-text mb-1 block">Max Iterations</label>
                <input
                  type="number"
                  min={20}
                  max={500}
                  value={settings.maxiter}
                  onChange={(e) => update('maxiter', Number(e.target.value))}
                  className="w-full bg-ink border border-line rounded-xl px-3 py-1.5 text-xs text-text focus:outline-none focus:border-peach"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-text mb-1 block">RNG Seed</label>
                <input
                  type="number"
                  value={settings.seed}
                  onChange={(e) => update('seed', Number(e.target.value))}
                  className="w-full bg-ink border border-line rounded-xl px-3 py-1.5 text-xs text-text focus:outline-none focus:border-peach"
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
                  checked={settings.noise}
                  onChange={(e) => update('noise', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-ink peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text after:border-line after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-peach"></div>
              </label>
              <div>
                <span className="text-xs font-bold text-text block">
                  Simulate IBM Guadalupe Hardware Noise
                </span>
                <span className="text-[11px] text-muted">
                  Runs Aer density-matrix noise model (FakeGuadalupeV2) alongside noiseless simulation.
                </span>
              </div>
            </div>
            {settings.noise && (
              <span className="text-xs font-bold text-peach bg-peach/10 px-2.5 py-1 rounded-full border border-peach/30">
                Noise Model Active
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
