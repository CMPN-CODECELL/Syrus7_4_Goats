import React, { useState, useMemo } from 'react';
import { Asset } from '../api/types';

interface UniversePickerProps {
  assets: Asset[];
  selectedTickers: string[] | null; // null means all available non-excluded assets
  onChange: (tickers: string[] | null) => void;
}

export const UniversePicker: React.FC<UniversePickerProps> = ({
  assets,
  selectedTickers,
  onChange
}) => {
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('ALL');
  const [mode, setMode] = useState<'all' | 'custom'>(selectedTickers === null ? 'all' : 'custom');

  const availableTickers = useMemo(() => {
    return assets.filter(a => !a.excluded_reason).map(a => a.ticker);
  }, [assets]);

  const sectors = useMemo(() => {
    const list = Array.from(new Set(assets.map(a => a.sector))).sort();
    return ['ALL', ...list];
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      const matchSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.ticker.toLowerCase().includes(search.toLowerCase());
      const matchSector = selectedSector === 'ALL' || a.sector === selectedSector;
      return matchSearch && matchSector;
    });
  }, [assets, search, selectedSector]);

  const handleModeChange = (newMode: 'all' | 'custom') => {
    setMode(newMode);
    if (newMode === 'all') {
      onChange(null);
    } else {
      // Default custom selection to top available
      onChange(availableTickers.slice(0, 10));
    }
  };

  const toggleTicker = (ticker: string) => {
    if (mode === 'all') return;
    const current = selectedTickers || availableTickers;
    if (current.includes(ticker)) {
      if (current.length <= 2) return; // Maintain minimum 2 stocks
      onChange(current.filter(t => t !== ticker));
    } else {
      onChange([...current, ticker]);
    }
  };

  const isSelected = (ticker: string) => {
    if (mode === 'all') {
      const asset = assets.find(a => a.ticker === ticker);
      return !asset?.excluded_reason;
    }
    return selectedTickers?.includes(ticker) ?? false;
  };

  const activeCount = mode === 'all'
    ? availableTickers.length
    : (selectedTickers ? selectedTickers.length : availableTickers.length);

  return (
    <div className="bg-panel border border-line rounded-2xl p-5 shadow-panel mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line mb-4">
        <div>
          <h2 className="text-base font-bold text-text flex items-center gap-2">
            <span>Asset Universe</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-peach/20 text-peach border border-peach/30">
              {activeCount} Stocks Active
            </span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Select stocks from the NIFTY 50 universe for portfolio construction.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-ink/60 p-1 rounded-xl border border-line self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleModeChange('all')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all flex items-center justify-center ${
              mode === 'all'
                ? 'bg-peach text-ink font-bold shadow'
                : 'text-muted hover:text-text'
            }`}
          >
            Full NIFTY 50 (50)
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('custom')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium rounded-lg transition-all flex items-center justify-center ${
              mode === 'custom'
                ? 'bg-peach text-ink font-bold shadow'
                : 'text-muted hover:text-text'
            }`}
          >
            Custom Sub-Universe
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search stock by name, symbol, or ticker..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full min-h-[44px] bg-ink/80 border border-line rounded-xl px-3.5 py-2 text-xs text-text placeholder-muted focus:outline-none focus:border-peach focus:ring-1 focus:ring-peach transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text text-xs min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={selectedSector}
          onChange={(e) => setSelectedSector(e.target.value)}
          className="bg-ink/80 border border-line rounded-xl px-3 py-2 min-h-[44px] text-xs text-text focus:outline-none focus:border-peach focus:ring-1 focus:ring-peach"
        >
          {sectors.map(sec => (
            <option key={sec} value={sec} className="bg-panel text-text">
              {sec === 'ALL' ? 'All Sectors' : sec}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Grid */}
      <div className="max-h-56 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
        {filteredAssets.map(asset => {
          const disabled = !!asset.excluded_reason;
          const selected = isSelected(asset.ticker);

          return (
            <div
              key={asset.ticker}
              onClick={() => !disabled && toggleTicker(asset.ticker)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                disabled
                  ? 'bg-ink/30 border-line/40 opacity-50 cursor-not-allowed'
                  : selected
                  ? 'bg-peach/10 border-peach text-text shadow-sm cursor-pointer'
                  : 'bg-ink/60 border-line/70 text-muted hover:border-line hover:text-text cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-text flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={disabled || mode === 'all'}
                    onChange={() => {}}
                    className="accent-peach rounded cursor-pointer"
                  />
                  {asset.symbol}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-line/40 text-muted font-mono">
                  {asset.sector}
                </span>
              </div>
              <div className="text-[11px] text-muted truncate mt-1">
                {asset.name}
              </div>

              {disabled && (
                <div className="mt-1 text-[10px] text-red font-medium flex items-center gap-1">
                  <span>⚠️</span> {asset.excluded_reason}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
