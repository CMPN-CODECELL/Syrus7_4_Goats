// Step 2: risk profile, industry limit, optional minimum return, optional existing holdings.
import { useRun } from '../../state/run';
import { issueFor, type ConfigIssue } from '../../state/validate';
import { HoldingsField, RiskProfileField, SectorCapField, TargetReturnField } from '../ConstraintsForm';
import type { HoldingsParse } from './holdings';

export function StepPreferences({ issues, holdingsText, setHoldingsText, parsed }: {
  issues: ConfigIssue[]; holdingsText: string; setHoldingsText: (t: string) => void; parsed: HoldingsParse;
}) {
  const { config, setConfig, mode } = useRun();
  const research = mode === 'research';
  return (
    <div className="space-y-8">
      <RiskProfileField q={config.risk_aversion} onChange={(risk_aversion) => setConfig({ risk_aversion })} research={research} error={issueFor(issues, 'q')} />
      <SectorCapField
        cap={config.sector_cap}
        onChange={(sector_cap) => setConfig({ sector_cap })}
        research={research}
        error={issueFor(issues, 'sectorCap') ?? issueFor(issues, 'sectorFit')}
      />
      <TargetReturnField target={config.target_return} onChange={(target_return) => setConfig({ target_return })} research={research} error={issueFor(issues, 'target')} />
      <HoldingsField text={holdingsText} setText={setHoldingsText} parsed={parsed} />
    </div>
  );
}
