// The allocation table now lives in results/AllocationTable. This wrapper keeps the older "pick a solver, see its
// allocation" entry point working; ResultsDashboard uses AllocationTable directly.
import type { SolverResult } from '../api/types';
import { Section, Status } from './ui';
import { AllocationTable } from './results/AllocationTable';
import { isUsable } from './results/model';

interface PortfolioTableProps {
  solvers: SolverResult[];
  recommendedSolverId: string;
  selectedSolverKey: string;
  onSelectSolver: (key: string) => void;
  capital?: number | null;
  priceDate?: string | null;
}

export function PortfolioTable({ solvers, recommendedSolverId, selectedSolverKey, onSelectSolver, capital, priceDate }: PortfolioTableProps) {
  const current = solvers.find((s) => s.solver === selectedSolverKey) ?? solvers[0];
  if (!current) return null;

  return (
    <Section id="allocation" eyebrow="Allocation" title="Your allocation">
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
        <label htmlFor="allocation-solver" className="text-muted">Portfolio from</label>
        <select
          id="allocation-solver"
          value={current.solver}
          onChange={(e) => onSelectSolver(e.target.value)}
          className="min-h-[44px] border bg-bg px-2 text-sm"
        >
          {solvers.map((s) => (
            <option key={s.solver} value={s.solver}>
              {s.label}{s.solver === recommendedSolverId ? ' (recommended)' : ''}{isUsable(s) ? '' : ' (no feasible portfolio)'}
            </option>
          ))}
        </select>
      </div>
      {isUsable(current)
        ? <AllocationTable solver={current} capital={capital} priceDate={priceDate} />
        : <Status error>{current.label} found no feasible portfolio{current.violations?.length ? `: ${current.violations.join('; ')}` : '.'}</Status>}
    </Section>
  );
}
