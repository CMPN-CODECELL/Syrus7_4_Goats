import { useEffect, useMemo, useState } from 'react';
import { Section, Status } from '../components/ui';
import {
  GLOSSARY, GLOSSARY_CATEGORIES, findTerm, glossaryIdFromHash, matchesQuery,
  type GlossaryCategory, type GlossaryTerm,
} from '../lib/glossary';

type CategoryFilter = 'All' | GlossaryCategory;

function TermCard({ t, current }: { t: GlossaryTerm; current: boolean }) {
  const anchor = `term-${t.id}`;
  return (
    <section
      id={anchor}
      aria-labelledby={`${anchor}-title`}
      aria-current={current ? 'location' : undefined}
      tabIndex={-1}
      className={`scroll-mt-24 border bg-surface p-4 sm:p-5 ${current ? 'border-text' : 'border-line'}`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id={`${anchor}-title`} className="text-xl">{t.term}</h3>
        <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">{t.category}</span>
      </div>
      <p className="mt-2 max-w-prose text-base leading-relaxed text-text">{t.plain}</p>
      {t.example && (
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          <span className="text-text">Example: </span>{t.example}
        </p>
      )}
      {t.formal && (
        <details className="mt-3">
          <summary className="cursor-pointer py-3 text-sm text-text">Formal definition</summary>
          <p className="max-w-prose border-l-2 border-line-strong pl-3 text-sm leading-relaxed text-muted">{t.formal}</p>
        </details>
      )}
    </section>
  );
}

export function Glossary() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');
  // The term a link pointed at (from `#glossary/term-{id}`), highlighted until the filters change.
  // Held as an object so a repeat click on the same link is a new value and scrolls again.
  const [jump, setJump] = useState<{ id: string } | null>(() => {
    const id = glossaryIdFromHash(window.location.hash);
    return id && findTerm(id) ? { id } : null;
  });
  const current = jump?.id ?? null;

  // Follow later links. Show everything, so the target cannot be hidden by a filter.
  useEffect(() => {
    const onHash = () => {
      const id = glossaryIdFromHash(window.location.hash);
      if (!id || !findTerm(id)) return;
      setQuery('');
      setCategory('All');
      setJump({ id });
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Scroll to the linked term and move focus there, so keyboard and screen-reader users land on it.
  useEffect(() => {
    if (!jump) return;
    const el = document.getElementById(`term-${jump.id}`);
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    el.focus({ preventScroll: true });
  }, [jump]);

  const matching = useMemo(() => GLOSSARY.filter((t) => matchesQuery(t, query)), [query]);
  const shown = category === 'All' ? matching : matching.filter((t) => t.category === category);
  const countIn = (c: CategoryFilter) => (c === 'All' ? matching.length : matching.filter((t) => t.category === c).length);
  const filtered = query.trim() !== '' || category !== 'All';

  const summary = shown.length === 0
    ? 'No terms match.'
    : `Showing ${shown.length} of ${GLOSSARY.length} terms${query.trim() ? ` matching “${query.trim()}”` : ''}${category !== 'All' ? ` in ${category}` : ''}.`;

  return (
    <div>
      <Section
        id="glossary"
        eyebrow="Glossary"
        title="Plain-language glossary"
        lead="Every term used in the app, explained for a first-time reader. Each entry has an example, and a formal definition you can open."
      >
        <div className="max-w-xl">
          <label htmlFor="glossary-search" className="block text-sm text-text">Search terms and definitions</label>
          <input
            id="glossary-search"
            type="search"
            value={query}
            autoComplete="off"
            placeholder="For example: slack, Sharpe, bitstring"
            onChange={(e) => { setQuery(e.target.value); setJump(null); }}
            className="mt-1 min-h-[44px] w-full border border-line-strong bg-bg px-3 text-base text-text placeholder:text-faint"
          />
        </div>

        <div role="group" aria-label="Filter by category" className="mt-4 flex flex-wrap gap-2">
          {(['All', ...GLOSSARY_CATEGORIES] as CategoryFilter[]).map((c) => {
            const on = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => { setCategory(c); setJump(null); }}
                className={`min-h-[44px] border px-3 text-sm ${on ? 'border-text bg-text text-bg' : 'border-line-strong text-muted hover:text-text'}`}
              >
                {on && <span aria-hidden="true">✓ </span>}{c} <span className="tabular-nums">({countIn(c)})</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Status>{summary}</Status>
          {filtered && (
            <button
              type="button"
              onClick={() => { setQuery(''); setCategory('All'); setJump(null); }}
              className="min-h-[44px] text-sm text-text underline underline-offset-4"
            >
              Clear search and filters
            </button>
          )}
        </div>

        {shown.length > 0 && (
          <ul role="list" className="mt-4 grid gap-3" aria-label="Glossary terms">
            {shown.map((t) => (
              <li key={t.id}><TermCard t={t} current={current === t.id} /></li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}

export default Glossary;
