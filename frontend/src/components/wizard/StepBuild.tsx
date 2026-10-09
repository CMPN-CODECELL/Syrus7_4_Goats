// Step 1: amount, stock universe and number of holdings.
import { useState } from 'react';
import type { Asset, RunRequest } from '../../api/types';
import { useRun } from '../../state/run';
import { issueFor, pickedTickers, type ConfigIssue } from '../../state/validate';
import { CapitalField, HoldingsCountField } from '../ConstraintsForm';
import { UniversePicker } from '../UniversePicker';
import { FieldError, ParamNote, RadioCards } from './fields';

export function StepBuild({ assets, issues, capitalDraft, setCapitalDraft }: {
  assets: Asset[]; issues: ConfigIssue[]; capitalDraft: string | null; setCapitalDraft: (d: string | null) => void;
}) {
  const { config, setConfig, mode } = useRun();
  const research = mode === 'research';
  const available = assets.filter((a) => !a.excluded_reason);
  const custom = config.tickers !== null;
  const [open, setOpen] = useState(custom);
  const picks = pickedTickers(config.tickers, assets).length;

  const chooseUniverse = (v: string) => {
    const tickers: RunRequest['tickers'] = v === 'nifty' ? null : available.slice(0, 10).map((a) => a.ticker);
    setConfig({ tickers });
    if (v === 'custom') setOpen(true);
  };

  return (
    <div className="space-y-8">
      <CapitalField
        capital={config.capital}
        onChange={(capital) => setConfig({ capital })}
        draft={capitalDraft}
        setDraft={setCapitalDraft}
        error={issueFor(issues, 'capital')}
      />
      {research && (
        <ParamNote
          name="capital"
          range="above 0."
          def="1,000,000 (₹10 lakh)."
          effect="The rupee amount converted into whole shares. It also sets how large your existing holdings are relative to the portfolio, which affects transaction costs."
        />
      )}

      <div data-tour="universe">
        <RadioCards
          name="universe"
          legend="Stock universe"
          value={custom ? 'custom' : 'nifty'}
          columns="sm:grid-cols-2"
          describedBy="universe-hint"
          onChange={chooseUniverse}
          options={[
            { value: 'nifty', label: 'NIFTY 50', description: `The index of 50 large companies listed on India's National Stock Exchange. ${available.length} of them have usable price data and are used.` },
            { value: 'custom', label: 'My own list', description: custom ? `${picks} stocks picked. Edit them under Customize stock selection.` : 'Pick individual stocks under Customize stock selection.' },
          ]}
        />
        <p id="universe-hint" className="mt-1 text-sm text-muted">This is a starting point, not a recommendation of any stock.</p>
        <FieldError id="picks-error">{issueFor(issues, 'picks')}</FieldError>
        {research && (
          <ParamNote
            name="tickers"
            range="null (all stocks with data) or a list of at least 2 NIFTY 50 tickers."
            def="null."
            effect="A shorter list shrinks the set of candidate portfolios. K cannot be larger than the list."
          />
        )}
        <details
          open={open}
          onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}
          className="mt-3 border border-line"
        >
          <summary className="flex min-h-[44px] cursor-pointer items-center px-4 text-base font-medium text-text">Customize stock selection</summary>
          <div className="border-t border-line p-3">
            <UniversePicker assets={assets} selectedTickers={config.tickers} onChange={(tickers) => setConfig({ tickers })} />
          </div>
        </details>
      </div>

      <HoldingsCountField k={config.k} onChange={(k) => setConfig({ k })} research={research} error={issueFor(issues, 'k')} />
    </div>
  );
}
