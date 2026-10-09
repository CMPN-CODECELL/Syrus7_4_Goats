import React, { useState, useMemo } from 'react';
import { Asset } from '../api/types';
import { Btn } from './wizard/fields';

interface UniversePickerProps {
  assets: Asset[];
  selectedTickers: string[] | null; // null means all available non-excluded assets
  onChange: (tickers: string[] | null) => void;
}

/** Search, industry filter and individual stock picks. The selection lives in the run configuration, so
 *  "all stocks" (null) versus "my own list" is read from `selectedTickers` and cannot drift out of step. */
export const UniversePicker: React.FC<UniversePickerProps> = ({ assets, selectedTickers, onChange }) => {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const mode: 'all' | 'custom' = selectedTickers === null ? 'all' : 'custom';

  const availableTickers = useMemo(() => assets.filter((a) => !a.excluded_reason).map((a) => a.ticker), [assets]);

  const sectors = useMemo(() => ['ALL', ...Array.from(new Set(assets.map((a) => a.sector))).sort()], [assets]);

  const filteredAssets = useMemo(() => {
    const needle = search.toLowerCase();
    return assets.filter((a) => {
      const matchSearch = a.symbol.toLowerCase().includes(needle) || a.name.toLowerCase().includes(needle) || a.ticker.toLowerCase().includes(needle);
      return matchSearch && (selectedSector === 'ALL' || a.sector === selectedSector);
    });
  }, [assets, search, selectedSector]);

  const handleModeChange = (next: 'all' | 'custom') => {
    // Switching to a custom list starts from the first ten available stocks.
    onChange(next === 'all' ? null : availableTickers.slice(0, 10));
  };

  const toggleTicker = (ticker: string) => {
    if (mode === 'all') return;
    const current = selectedTickers ?? availableTickers;
    if (current.includes(ticker)) {
      if (current.length <= 2) return; // keep at least 2 stocks
      onChange(current.filter((t) => t !== ticker));
    } else {
      onChange([...current, ticker]);
    }
  };

  const isSelected = (asset: Asset) => (mode === 'all' ? !asset.excluded_reason : selectedTickers?.includes(asset.ticker) ?? false);
  const activeCount = mode === 'all' ? availableTickers.length : selectedTickers?.length ?? 0;

  return (
    <div className="border border-line bg-surface p-4">
      <div className="flex flex-col justify-between gap-3 border-b border-line pb-4 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-xl">Stock selection</h3>
          <p className="mt-1 text-sm text-muted" role="status" aria-live="polite">
            {activeCount} stock{activeCount === 1 ? '' : 's'} selected. {mode === 'custom' ? 'You need at least 2.' : 'All stocks with data are used.'}
          </p>
        </div>
        <div role="group" aria-label="Which stocks to use" className="flex gap-2">
          <Btn aria-pressed={mode === 'all'} onClick={() => handleModeChange('all')} className={mode === 'all' ? '!border-text !bg-text !text-bg' : ''}>
            {mode === 'all' && <span aria-hidden="true">✓</span>} All NIFTY 50 ({availableTickers.length})
          </Btn>
          <Btn aria-pressed={mode === 'custom'} onClick={() => mode !== 'custom' && handleModeChange('custom')} className={mode === 'custom' ? '!border-text !bg-text !text-bg' : ''}>
            {mode === 'custom' && <span aria-hidden="true">✓</span>} My own list
          </Btn>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="universe-search" className="block text-sm text-text">Search by name or symbol</label>
          <div className="relative mt-1">
            <input
              id="universe-search"
              type="search"
              placeholder="For example: Tata, INFY, bank"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-h-[44px] w-full border border-line-strong bg-bg px-3 text-base text-text placeholder:text-faint"
            />
          </div>
        </div>
        <div>
          <label htmlFor="universe-sector" className="block text-sm text-text">Industry</label>
          <select
            id="universe-sector"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            className="mt-1 min-h-[44px] w-full border border-line-strong bg-bg px-3 text-base text-text sm:w-56"
          >
            {sectors.map((sec) => (
              <option key={sec} value={sec} className="bg-bg text-text">{sec === 'ALL' ? 'All industries' : sec}</option>
            ))}
          </select>
        </div>
      </div>

      {mode === 'all' && (
        <p className="mt-3 text-sm text-muted">
          Choose “My own list” to pick individual stocks. The boxes below are read-only while all NIFTY 50 stocks are used.
        </p>
      )}

      <p className="sr-only" role="status" aria-live="polite">{filteredAssets.length} stocks shown.</p>
      <ul role="list" className="mt-3 max-h-80 overflow-y-auto border-t border-line md:grid md:grid-cols-2 md:gap-x-4">
        {filteredAssets.map((asset) => {
          const disabled = !!asset.excluded_reason;
          const selected = isSelected(asset);
          return (
            <li key={asset.ticker} className="border-b border-line">
              <label className={`flex min-h-[44px] items-center gap-3 px-1 py-1 text-sm md:min-h-[40px] ${disabled || mode === 'all' ? 'cursor-default' : 'cursor-pointer hover:bg-bg'}`}>
                <input
                  type="checkbox"
                  checked={selected}
                  disabled={disabled || mode === 'all'}
                  onChange={() => toggleTicker(asset.ticker)}
                  className="h-5 w-5 shrink-0"
                />
                <span className={`shrink-0 font-medium ${selected ? 'text-text' : 'text-muted'}`}>{asset.symbol}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{asset.name}</span>
                <span className="max-w-[40%] shrink-0 truncate text-xs text-muted">
                  {disabled ? `Not used: ${asset.excluded_reason}` : asset.sector}
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      {filteredAssets.length === 0 && <p className="mt-3 text-sm text-muted">No stocks match your search. Clear the search or choose another industry.</p>}
    </div>
  );
};
