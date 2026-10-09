// Small form building blocks shared by the wizard and the input components. Monochrome, square, 44px touch targets.
import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';

type BtnVariant = 'primary' | 'secondary' | 'link';

/** Primary is white on black. Secondary is outlined. Both are at least 44px tall. */
export function Btn({ variant = 'secondary', className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  const base = 'inline-flex min-h-[44px] items-center justify-center gap-2 px-4 text-sm font-medium';
  const look = variant === 'primary'
    ? 'border border-text bg-text text-bg hover:bg-muted hover:border-muted disabled:border-line disabled:bg-line disabled:text-faint'
    : variant === 'secondary'
      ? 'border border-line-strong bg-bg text-text hover:border-text disabled:text-faint disabled:hover:border-line-strong'
      : 'text-text underline underline-offset-4 hover:text-muted px-1';
  return <button type="button" className={`${base} ${look} ${className}`} {...rest} />;
}

/** An inline problem next to a field. Polite, so it does not interrupt typing. */
export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  return (
    <div id={id} aria-live="polite">
      {children ? <p className="mt-1 text-sm text-text"><span aria-hidden="true">⚠ </span>{children}</p> : null}
    </div>
  );
}

export function Hint({ id, children }: { id?: string; children: ReactNode }) {
  return <p id={id} className="mt-1 max-w-prose text-sm leading-relaxed text-muted">{children}</p>;
}

/** A form group title: a visible label above the controls. */
export function Legend({ children }: { children: ReactNode }) {
  return <legend className="mb-1 block p-0 text-base font-medium text-text">{children}</legend>;
}

interface RadioOption<T extends string | number> {
  value: T;
  label: ReactNode;
  description?: ReactNode;
  detail?: ReactNode;
}

/** Native radio buttons drawn as cards: arrow keys and screen-reader semantics come from the browser.
 *  The selected card has a thicker, brighter border and a filled marker, so colour is not the only cue. */
export function RadioCards<T extends string | number>({ name, legend, value, options, onChange, columns = 'sm:grid-cols-3', describedBy }: {
  name: string;
  legend: ReactNode;
  value: T | null;
  options: RadioOption<T>[];
  onChange: (v: T) => void;
  columns?: string;
  describedBy?: string;
}) {
  return (
    <fieldset aria-describedby={describedBy}>
      <Legend>{legend}</Legend>
      <div className={`mt-2 grid grid-cols-1 gap-2 ${columns}`}>
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <label key={String(o.value)} className="relative block cursor-pointer">
              <input
                type="radio"
                name={name}
                value={String(o.value)}
                checked={checked}
                onChange={() => onChange(o.value)}
                className="peer sr-only"
              />
              <span className={`flex h-full min-h-[44px] flex-col gap-1 border p-3 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white ${
                checked ? 'border-text bg-surface shadow-[inset_0_0_0_1px_#fff]' : 'border-line-strong bg-bg hover:border-muted'
              }`}>
                <span className="flex items-start gap-2 text-sm font-medium text-text">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 font-mono">{checked ? '◉' : '○'}</span>
                  <span>{o.label}</span>
                </span>
                {o.description && <span className="text-sm leading-snug text-muted">{o.description}</span>}
                {o.detail && <span className="font-mono text-xs text-muted">{o.detail}</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/** A switch with a visible On/Off word, so state is never shown by position or colour alone. */
export function Switch({ id, checked, onChange, label, description }: {
  id: string; checked: boolean; onChange: (v: boolean) => void; label: ReactNode; description?: ReactNode;
}) {
  return (
    <label htmlFor={id} className="flex min-h-[44px] cursor-pointer items-start gap-3">
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className={`relative mt-0.5 h-6 w-11 shrink-0 border border-line-strong peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-white ${checked ? 'bg-text' : 'bg-bg'}`}>
        <span className={`absolute top-[3px] h-4 w-4 ${checked ? 'left-[23px] bg-bg' : 'left-[3px] bg-faint'}`} />
      </span>
      <span className="text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className="ml-2 font-mono text-xs uppercase text-muted">{checked ? 'On' : 'Off'}</span>
        {description && <span className="mt-0.5 block text-muted">{description}</span>}
      </span>
    </label>
  );
}

const fmtDraft = (n: number) => (Number.isFinite(n) ? String(n) : '');

/** A text box that edits a number. It keeps what the user typed, and reports NaN for anything unreadable,
 *  so the configuration never silently keeps an old value while the box shows an error. */
export function NumField({ id, value, onCommit, inputMode = 'decimal', className = '', ...aria }: {
  id: string;
  value: number;
  onCommit: (n: number) => void;
  inputMode?: 'decimal' | 'numeric';
  className?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-label'?: string;
}) {
  const [text, setText] = useState(fmtDraft(value));
  const last = useRef(value);
  // Follow outside changes (a preset, the stepper, a reset) without fighting what the user is typing.
  useEffect(() => {
    if (!Object.is(value, last.current)) {
      last.current = value;
      setText(fmtDraft(value));
    }
  }, [value]);
  return (
    <input
      id={id}
      type="text"
      inputMode={inputMode}
      autoComplete="off"
      value={text}
      onChange={(e) => {
        const t = e.target.value;
        setText(t);
        const n = t.trim() === '' ? NaN : Number(t.replace(/[,\s₹]/g, ''));
        last.current = n;
        onCommit(n);
      }}
      className={`min-h-[44px] border bg-bg px-3 text-base text-text placeholder:text-faint ${aria['aria-invalid'] ? 'border-loss' : 'border-line-strong'} ${className}`}
      {...aria}
    />
  );
}

/** Research-mode facts for a control: its technical name, range and default, and what changing it does. */
export function ParamNote({ name, range, def, effect }: { name: ReactNode; range: ReactNode; def: ReactNode; effect: ReactNode }) {
  return (
    <dl className="mt-2 grid max-w-prose grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-l-2 border-line-strong pl-3 text-xs leading-relaxed text-muted">
      <dt className="font-mono uppercase text-text">Parameter</dt>
      <dd className="font-mono">{name}</dd>
      <dt className="font-mono uppercase text-text">Range</dt>
      <dd>{range} <span className="font-mono uppercase text-text">Default</span> {def}</dd>
      <dt className="font-mono uppercase text-text">Effect</dt>
      <dd className="font-sans text-sm">{effect}</dd>
    </dl>
  );
}
