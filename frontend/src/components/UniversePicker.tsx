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
    <div className="bg-surface border border-line p-5 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line mb-4">
        <div>
          <h2 className="text-base font-medium text-text flex items-center gap-2">
            <span>Asset Universe</span>
            <span className="text-xs px-2 py-0.5 bg-surface text-text border border-line-strong">
              {activeCount} selected
            </span>
          </h2>
          <p className="text-xs text-muted mt-0.5">
            Select stocks from the NIFTY 50 universe for portfolio construction.
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex bg-bg p-1 border border-line self-start sm:self-auto">
          <button
            type="button"
            onClick={() => handleModeChange('all')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium transition-all flex items-center justify-center ${
              mode === 'all'
                ? 'bg-text text-bg font-medium'
                : 'text-muted hover:text-text'
            }`}
          >
            Full NIFTY 50 ({availableTickers.length})
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('custom')}
            className={`px-3 py-2 min-h-[44px] text-xs font-medium transition-all flex items-center justify-center ${
              mode === 'custom'
                ? 'bg-text text-bg font-medium'
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
            className="w-full min-h-[44px] bg-bg border border-line px-3.5 py-2 text-xs text-text placeholder-muted focus:border-text transition-colors"
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
          className="bg-bg border border-line px-3 py-2 min-h-[44px] text-xs text-text focus:border-text"
        >
          {sectors.map(sec => (
            <option key={sec} value={sec} className="bg-surface text-text">
              {sec === 'ALL' ? 'All Sectors' : sec}
            </option>
          ))}
        </select>
      </div>

      {/* Stock rows: 32px, two columns on desktop */}
      <div className="max-h-72 overflow-y-auto md:grid md:grid-cols-2 md:gap-x-4 border-t border-line">
        {filteredAssets.map(asset => {
          const disabled = !!asset.excluded_reason;
          const selected = isSelected(asset.ticker);

          return (
            <label
              key={asset.ticker}
              title={disabled ? asset.excluded_reason ?? undefined : `${asset.name} · ${asset.sector}`}
              className={`flex items-center gap-2 h-8 px-1 border-b border-line text-xs ${
                disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:bg-surface'
              }`}
            >
              <input
                type="checkbox"
                checked={selected}
                disabled={disabled || mode === 'all'}
                onChange={() => toggleTicker(asset.ticker)}
                className="accent-white cursor-pointer shrink-0"
              />
              <span className={`font-bold shrink-0 ${selected ? 'text-text' : 'text-muted'}`}>
                {asset.symbol}
              </span>
              <span className="text-muted truncate min-w-0 flex-1">
                {asset.name}
              </span>
              <span className="text-[10px] text-faint truncate max-w-[38%] shrink-0">
                {disabled ? `⚠ ${asset.excluded_reason}` : asset.sector}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};
