// In-text glossary links. A term is a normal link to the Glossary tab (`#glossary/term-{id}`), so it works
// with keyboard, touch and screen readers, with no hover-only tooltip.
import { useEffect, type ReactNode } from 'react';
import { GLOSSARY, findTerm, glossaryHref } from '../lib/glossary';

/** A link that jumps to a term’s definition in the Glossary tab. Unknown ids render the text unchanged. */
export function GlossaryLink({ id, children }: { id: string; children: ReactNode }) {
  if (!findTerm(id)) return <>{children}</>;
  const href = glossaryHref(id);
  return (
    <a
      href={href}
      onClick={() => {
        // Clicking a link to the hash we are already on does not fire `hashchange`; fire it so the page scrolls again.
        if (window.location.hash === href) window.dispatchEvent(new HashChangeEvent('hashchange'));
      }}
      className="text-text underline decoration-dotted decoration-muted underline-offset-4 hover:decoration-text hover:decoration-solid"
    >
      {children}
    </a>
  );
}

// ---- Deprecated compatibility exports --------------------------------------------------------------------------
// `GlossaryTermTooltip` (AdvancedQaoa, ConstraintsForm) and `GlossaryDrawer` (App) predate the Glossary tab.
// They keep those files compiling. Replace them with <GlossaryLink id="…"> and delete these when convenient.

const LEGACY_KEYS: Record<string, string> = {
  qaoa: 'qaoa',
  qubo: 'qubo',
  qubit: 'qubit',
  mixer: 'mixer',
  depth: 'qaoa-depth',
  shots: 'shots',
  approx_ratio: 'approximation-ratio',
  p_opt: 'p-optimum',
  warm_start: 'warm-start',
  noise_model: 'noise-model',
};

/** @deprecated Use `<GlossaryLink id="…">`. Maps the old `termKey` onto the new glossary ids. */
export function GlossaryTermTooltip({ termKey, children }: { termKey: string; children: ReactNode }) {
  return <GlossaryLink id={LEGACY_KEYS[termKey] ?? termKey}>{children}</GlossaryLink>;
}

/** @deprecated The Glossary is now a tab. A plain list of definitions, kept until App.tsx drops the drawer. */
export function GlossaryDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div role="dialog" aria-label="Glossary" className="fixed inset-0 z-50 flex justify-end bg-bg/80">
      <div className="flex w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <h2 className="text-xl">Glossary</h2>
          <button type="button" onClick={onClose} className="min-h-[44px] border border-line-strong px-4 text-sm text-text hover:bg-line">
            Close
          </button>
        </div>
        <dl className="mt-4 space-y-4">
          {GLOSSARY.map((t) => (
            <div key={t.id}>
              <dt className="text-base text-text">{t.term}</dt>
              <dd className="mt-1 text-sm text-muted">{t.plain}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
