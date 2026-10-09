// The form fields of the wizard's first two steps: amount, number of holdings, risk profile, industry limit,
// minimum return and existing holdings. Each field is a small controlled component; the wizard composes them.
// In Research mode a field also shows its technical name, range, default and what changing it does.
import { RISK_PROFILES, profileForQ } from '../lib/riskProfiles';
import { formatINR, formatINRCompact, isNum } from '../lib/format';
import { LIMITS } from '../state/validate';
import { GlossaryLink } from './Glossary';
import { Btn, FieldError, Hint, NumField, ParamNote, RadioCards, Switch } from './wizard/fields';
import { HOLDINGS_EXAMPLE, type HoldingsParse } from './wizard/holdings';

export const CAPITAL_PRESETS = [100_000, 500_000, 1_000_000, 5_000_000];

/** Investment amount: four presets and a custom box. `draft` is the custom text, or null while a preset is chosen. */
export function CapitalField({ capital, onChange, draft, setDraft, error }: {
  capital: number;
  onChange: (n: number) => void;
  draft: string | null;
  setDraft: (d: string | null) => void;
  error?: string;
}) {
  const custom = draft !== null || !CAPITAL_PRESETS.includes(capital);
  const options = [
    ...CAPITAL_PRESETS.map((v) => ({ value: String(v), label: formatINRCompact(v) })),
    { value: 'custom', label: 'Custom amount' },
  ];
  return (
    <div>
      <RadioCards
        name="capital"
        legend="Investment amount"
        value={custom ? 'custom' : String(capital)}
        options={options}
        columns="sm:grid-cols-5"
        describedBy="capital-hint"
        onChange={(v) => {
          if (v === 'custom') {
            setDraft(isNum(capital) ? String(capital) : '');
          } else {
            setDraft(null);
            onChange(Number(v));
          }
        }}
      />
      <Hint id="capital-hint">
        These are example amounts, not recommendations. Amounts are rounded down to whole shares, so some cash may be left uninvested.
      </Hint>
      {custom && (
        <div className="mt-3">
          <label htmlFor="capital-custom" className="block text-sm text-text">Custom amount in rupees</label>
          <div className="mt-1 flex items-center gap-2">
            <span aria-hidden="true" className="text-base text-muted">₹</span>
            <NumField
              id="capital-custom"
              value={capital}
              inputMode="numeric"
              onCommit={(n) => { setDraft(Number.isFinite(n) ? String(n) : ''); onChange(n); }}
              aria-invalid={!!error}
              aria-describedby="capital-error capital-echo"
              className="w-48"
            />
          </div>
          <p id="capital-echo" className="mt-1 text-sm text-muted">{isNum(capital) && capital > 0 ? `That is ${formatINR(capital)} (${formatINRCompact(capital)}).` : 'Type digits only, for example 250000.'}</p>
        </div>
      )}
      <FieldError id="capital-error">{error}</FieldError>
    </div>
  );
}

/** The sentence the brief requires, verbatim. */
export const K_EXPLANATION =
  'Choose how many companies you want your portfolio to hold. Fewer holdings concentrate your investment, while more holdings can spread it across more companies.';

export function HoldingsCountField({ k, onChange, research, error }: {
  k: number; onChange: (n: number) => void; research: boolean; error?: string;
}) {
  const base = Number.isFinite(k) ? k : LIMITS.k.def;
  return (
    <div data-tour="holdings-count">
      <label htmlFor="k-input" className="block text-base font-medium text-text">
        Number of holdings (<GlossaryLink id="cardinality">K</GlossaryLink>)
      </label>
      <Hint id="k-hint">{K_EXPLANATION}</Hint>
      <div className="mt-2 flex items-center gap-2">
        <Btn aria-label="Fewer holdings" disabled={base <= LIMITS.k.min} onClick={() => onChange(Math.max(LIMITS.k.min, base - 1))} className="w-11 px-0">−</Btn>
        <NumField
          id="k-input"
          value={k}
          inputMode="numeric"
          onCommit={onChange}
          aria-invalid={!!error}
          aria-describedby="k-hint k-error"
          className="w-20 text-center"
        />
        <Btn aria-label="More holdings" disabled={base >= LIMITS.k.max} onClick={() => onChange(Math.min(LIMITS.k.max, base + 1))} className="w-11 px-0">+</Btn>
        <span className="text-sm text-muted">companies ({LIMITS.k.min} to {LIMITS.k.max})</span>
      </div>
      <FieldError id="k-error">{error}</FieldError>
      {research && (
        <ParamNote
          name="k (cardinality, constraint Σxᵢ = K)"
          range={`${LIMITS.k.min} to ${LIMITS.k.max}.`}
          def={LIMITS.k.def}
          effect="Sets exactly how many stocks every candidate portfolio holds, so the optimiser compares a different set of candidate portfolios. It does not change how many stocks are shortlisted."
        />
      )}
    </div>
  );
}

const QUBO_OBJECTIVE = 'F(x) = q·Var − (1−q)·(Return − costs)';

/** Three risk profiles that set the real risk-aversion q. A custom q (set in Research mode) shows as its own card. */
export function RiskProfileField({ q, onChange, research, error }: {
  q: number; onChange: (n: number) => void; research: boolean; error?: string;
}) {
  const current = profileForQ(q);
  const options = RISK_PROFILES.map((p) => ({
    value: p.id as string,
    label: p.label,
    description: p.description,
    detail: research ? `q = ${p.q.toFixed(2)}` : undefined,
  }));
  if (!current) {
    options.push({
      value: 'custom',
      label: 'Custom q',
      description: 'Set in Research mode. Choose a profile above to replace it.',
      detail: Number.isFinite(q) ? `q = ${q}` : 'q is not a number',
    });
  }
  return (
    <div data-tour="risk">
      <RadioCards
        name="risk-profile"
        legend="Risk preference"
        value={current ? current.id : 'custom'}
        options={options}
        columns={options.length > 3 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3'}
        describedBy="risk-hint"
        onChange={(id) => {
          const p = RISK_PROFILES.find((x) => x.id === id);
          if (p) onChange(p.q);
        }}
      />
      <Hint id="risk-hint">
        A profile only changes how the optimiser weighs estimated return against estimated risk. It does not guarantee any outcome.
      </Hint>
      {research && (
        <div className="mt-3">
          <label htmlFor="q-input" className="block text-sm font-medium text-text">
            Risk aversion <GlossaryLink id="risk-aversion">q</GlossaryLink>, a number from {LIMITS.q.min} to {LIMITS.q.max}
          </label>
          <NumField
            id="q-input"
            value={q}
            onCommit={onChange}
            aria-invalid={!!error}
            aria-describedby="q-error"
            className="mt-1 w-28"
          />
          <FieldError id="q-error">{error}</FieldError>
          <ParamNote
            name={`risk_aversion (q), objective ${QUBO_OBJECTIVE}`}
            range={`${LIMITS.q.min} to ${LIMITS.q.max}.`}
            def={`${LIMITS.q.def} (Balanced).`}
            effect="A higher q puts more weight on estimated variance, a lower q more weight on estimated return. It changes what the optimiser minimises; it does not guarantee lower realised risk or higher realised return."
          />
        </div>
      )}
    </div>
  );
}

/** Maximum stocks from one industry, or no limit. */
export function SectorCapField({ cap, onChange, research, error }: {
  cap: number | null; onChange: (n: number | null) => void; research: boolean; error?: string;
}) {
  const values = [1, 2, 3, 4, 5];
  return (
    <div>
      <RadioCards
        name="sector-cap"
        legend={<>Diversification: <GlossaryLink id="sector-cap">most stocks from one industry</GlossaryLink></>}
        value={cap === null ? 'off' : String(cap)}
        options={[{ value: 'off', label: 'No limit' }, ...values.map((v) => ({ value: String(v), label: String(v) }))]}
        columns="sm:grid-cols-6"
        describedBy="sector-hint"
        onChange={(v) => onChange(v === 'off' ? null : Number(v))}
      />
      <Hint id="sector-hint">
        Limit how much your portfolio concentrates in one industry.{' '}
        {cap === null ? 'No industry limit is applied.' : `At most ${cap} stock${cap === 1 ? '' : 's'} from any one industry.`}
      </Hint>
      <FieldError id="sector-error">{error}</FieldError>
      {research && (
        <ParamNote
          name="sector_cap"
          range={`${LIMITS.sectorCap.min} to ${LIMITS.sectorCap.max}, or off.`}
          def={LIMITS.sectorCap.def}
          effect="Each industry with more candidates than the limit adds ⌈log₂(limit + 1)⌉ slack qubits. A different limit changes the qubit count and can change how many stocks are shortlisted."
        />
      )}
    </div>
  );
}

const DEFAULT_TARGET = 0.12;

/** Optional minimum estimated return. Off by default. */
export function TargetReturnField({ target, onChange, research, error }: {
  target: number | null; onChange: (n: number | null) => void; research: boolean; error?: string;
}) {
  const on = target !== null;
  const percent = on && Number.isFinite(target) ? Number((target * 100).toFixed(4)) : NaN;
  return (
    <div>
      <Switch
        id="target-switch"
        checked={on}
        onChange={(v) => onChange(v ? DEFAULT_TARGET : null)}
        label={<>Require a minimum <GlossaryLink id="target-return">estimated return</GlossaryLink></>}
        description="Adds a minimum estimated-return constraint to the problem. Off by default."
      />
      {on && (
        <div className="mt-2">
          <label htmlFor="target-input" className="block text-sm text-text">Minimum estimated annual return after costs (%)</label>
          <div className="mt-1 flex items-center gap-2">
            <NumField
              id="target-input"
              value={percent}
              onCommit={(p) => onChange(p / 100)}
              aria-invalid={!!error}
              aria-describedby="target-hint target-error"
              className="w-28"
            />
            <span aria-hidden="true" className="text-base text-muted">%</span>
          </div>
          <FieldError id="target-error">{error}</FieldError>
          <p id="target-hint" className="mt-2 max-w-prose border border-line-strong p-3 text-sm leading-relaxed text-text">
            <span aria-hidden="true">⚠ </span>
            A higher floor makes the problem more likely to be infeasible. If no portfolio of K stocks can meet it, the run ends with an error and no portfolio is returned. The floor is a constraint on estimates, not a forecast or a promise of return.
          </p>
        </div>
      )}
      {research && (
        <ParamNote
          name="target_return"
          range="above 0 and up to 1 (0.12 means 12% a year), or off."
          def="off (null)."
          effect="Adds 3 slack qubits, so the shortlist shrinks by 3 to fit the qubit cap. A higher floor makes infeasibility more likely."
        />
      )}
    </div>
  );
}

/** Optional existing holdings, one "SYMBOL shares" per line. */
export function HoldingsField({ text, setText, parsed }: {
  text: string; setText: (t: string) => void; parsed: HoldingsParse;
}) {
  const hasErrors = parsed.errors.length > 0;
  return (
    <div>
      <label htmlFor="holdings-input" className="block text-base font-medium text-text">
        Existing holdings <span className="font-normal text-muted">(optional)</span>
      </label>
      <Hint id="holdings-hint">
        If you already own some of these stocks, write one per line: the stock symbol and how many shares you hold. Transaction costs are then charged on what you would buy or sell (buy 0.1187%, sell 0.1037%). Leave it empty to start from cash.
      </Hint>
      <textarea
        id="holdings-input"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={HOLDINGS_EXAMPLE}
        spellCheck={false}
        aria-invalid={hasErrors}
        aria-describedby="holdings-hint holdings-example holdings-errors"
        className={`mt-2 w-full border bg-bg px-3 py-2 font-mono text-sm text-text placeholder:text-faint ${hasErrors ? 'border-loss' : 'border-line-strong'}`}
      />
      <p id="holdings-example" className="mt-1 text-sm text-muted">
        Example: <span className="font-mono text-text">TCS 52</span> and <span className="font-mono text-text">INFY 120</span>, each on its own line.
      </p>
      {text.trim() === '' && (
        <Btn variant="link" onClick={() => setText(HOLDINGS_EXAMPLE)}>Insert the example</Btn>
      )}
      <div id="holdings-errors" aria-live="polite">
        {parsed.errors.map((e) => <p key={e} className="mt-1 text-sm text-text"><span aria-hidden="true">⚠ </span>{e}</p>)}
        {!hasErrors && parsed.ignored.map((m) => <p key={m} className="mt-1 text-sm text-muted">Note: {m}</p>)}
        {!hasErrors && Object.keys(parsed.holdings).length > 0 && (
          <p className="mt-1 text-sm text-muted">{Object.keys(parsed.holdings).length} holding{Object.keys(parsed.holdings).length === 1 ? '' : 's'} read correctly.</p>
        )}
      </div>
    </div>
  );
}
