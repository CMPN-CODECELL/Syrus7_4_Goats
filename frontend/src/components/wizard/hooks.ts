// Data hooks for the wizard: the stock list, and the debounced shortlist preview.
import { useCallback, useEffect, useState } from 'react';
import { getUniverse, postScreen } from '../../api/client';
import type { RunRequest, ScreenInfo, Universe } from '../../api/types';
import { DEFAULT_CONFIG } from '../../state/run';
import { LIMITS } from '../../state/validate';

export function useUniverse() {
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUniverse(await getUniverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to connect to the backend API.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  return { universe, error, loading, reload: load };
}

export interface ScreenState {
  info: ScreenInfo | null;
  error: string | null;
  loading: boolean;
}

/** The shortlist preview for the current settings. Only the settings the screen reads decide when it refreshes,
 *  a reply for older settings is dropped, and nothing is sent while those settings are unreadable. */
export function useScreen(config: RunRequest, enabled: boolean): ScreenState {
  const { tickers, k, sector_cap: sectorCap, target_return: target, qubit_cap: qubitCap } = config;
  const readable =
    Number.isInteger(k) && k >= LIMITS.k.min && k <= LIMITS.k.max &&
    (sectorCap === null || (Number.isInteger(sectorCap) && sectorCap >= LIMITS.sectorCap.min && sectorCap <= LIMITS.sectorCap.max)) &&
    (target === null || (Number.isFinite(target) && target > 0 && target <= 1)) &&
    Number.isInteger(qubitCap) && qubitCap >= LIMITS.qubitCap.min && qubitCap <= LIMITS.qubitCap.max &&
    (tickers === null || tickers.length >= 2);
  const key = JSON.stringify([tickers, k, sectorCap, target, qubitCap]);
  const [done, setDone] = useState<{ key: string; info: ScreenInfo | null; error: string | null } | null>(null);

  useEffect(() => {
    if (!enabled || !readable) return;
    let stale = false;
    const timer = window.setTimeout(() => {
      // The screen reads only these fields; the rest are neutral defaults so an unrelated edit cannot break the request.
      const req: RunRequest = { ...DEFAULT_CONFIG, tickers, k, sector_cap: sectorCap, target_return: target, qubit_cap: qubitCap };
      postScreen(req)
        .then((info) => { if (!stale) setDone({ key, info, error: null }); })
        .catch((err) => { if (!stale) setDone({ key, info: null, error: err instanceof Error ? err.message : 'The preview failed.' }); });
    }, 300);
    return () => { stale = true; clearTimeout(timer); };
  }, [key, enabled, readable]);

  const current = done && done.key === key ? done : null;
  return {
    info: readable ? current?.info ?? null : null,
    error: readable ? current?.error ?? null : null,
    loading: enabled && readable && current === null,
  };
}
