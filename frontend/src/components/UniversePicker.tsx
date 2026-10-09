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
  const [isListExpanded, setIsListExpanded] = useState<boolean>(selectedTickers !== null);

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
      setIsListExpanded(false);
    } else {
      onChange(availableTickers.slice(0, 10));
      setIsListExpanded(true);
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

  const selectTopN = (n: number) => {
    setMode('custom');
    setIsListExpanded(true);
    onChange(availableTickers.slice(0, n));
  };

  return (
    <div className="bg-surface border border-line p-5 space-y-4">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-medium text-text uppercase tracking-wide">
              Stock Universe Selection
            </h3>
            <span className="text-[13px] font-mono px-2 py-0.5 bg-bg text-text border border-line-strong">
              {activeCount} / {availableTickers.length} Active
            </span>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Choose whether to optimize across the full NIFTY 50 universe or specify custom candidate assets.
          </p>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex bg-bg p-1 border border-line self-start sm:self-auto gap-0.5">
          <button
            type="button"
            onClick={() => handleModeChange('all')}
            className={`px-3 py-1.5 min-h-[36px] text-xs font-medium transition-all flex items-center justify-center border ${
              mode === 'all'
                ? 'bg-surface-elevated text-white border-accent-blue/60'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            Full NIFTY 50 ({availableTickers.length})
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('custom')}
            className={`px-3 py-1.5 min-h-[36px] text-xs font-medium transition-all flex items-center justify-center border ${
              mode === 'custom'
                ? 'bg-surface-elevated text-white border-accent-blue/60'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            Custom Sub-Universe
          </button>
        </div>
      </div>

      {/* Full Universe Status Banner (When list is collapsed in All mode) */}
      {!isListExpanded && mode === 'all' ? (
        <div data-research className="bg-bg border border-line p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5 text-xs text-muted">
            <span className="w-2 h-2 rounded-full bg-gain shrink-0"></span>
            <span>
              All <strong className="text-text font-medium">{availableTickers.length}</strong> non-excluded NIFTY 50 equities active across {sectors.length - 1} sectors.
              <span className="text-faint ml-1.5">(1 excluded: TMPV.NS demerger)</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsListExpanded(true)}
            className="text-xs text-muted hover:text-text bg-surface border border-line hover:border-line-strong px-3 py-1.5 transition-colors whitespace-nowrap self-start sm:self-auto flex items-center space-x-1.5"
          >
            <span>Inspect Asset Catalog</span>
            <span className="font-mono text-[13px]">▾</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Controls: Search, Sector, Quick Select Chips */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="flex flex-1 gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search stock by name, symbol, or ticker..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full min-h-[40px] bg-bg border border-line px-3.5 py-1.5 text-xs text-text placeholder-muted focus:border-text transition-colors"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-text text-xs min-h-[32px] min-w-[32px] flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-bg border border-line px-3 py-1.5 min-h-[40px] text-xs text-text focus:border-text"
              >
                {sectors.map(sec => (
                  <option key={sec} value={sec} className="bg-surface text-text">
                    {sec === 'ALL' ? 'All Sectors' : sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Actions & Collapse Toggle */}
            <div className="flex items-center gap-1.5 shrink-0">
              {mode === 'custom' && (
                <>
                  <button
                    type="button"
                    onClick={() => selectTopN(10)}
                    className="text-[14px] text-muted hover:text-text px-2 py-1 bg-bg border border-line hover:border-line-strong"
                  >
                    Top 10
                  </button>
                  <button
                    type="button"
                    onClick={() => selectTopN(15)}
                    className="text-[14px] text-muted hover:text-text px-2 py-1 bg-bg border border-line hover:border-line-strong"
                  >
                    Top 15
                  </button>
                </>
              )}

              {mode === 'all' && (
                <button
                  type="button"
                  onClick={() => setIsListExpanded(false)}
                  className="text-[14px] text-muted hover:text-text px-2.5 py-1 bg-bg border border-line hover:border-line-strong flex items-center space-x-1"
                >
                  <span>Collapse</span>
                  <span className="font-mono text-[12px]">▲</span>
                </button>
              )}
            </div>
          </div>

          {/* Responsive 2-Column Asset Grid */}
          <div className="max-h-64 overflow-y-auto border border-line bg-bg p-1 grid grid-cols-1 md:grid-cols-2 gap-x-3 divide-y md:divide-y-0 divide-line/40">
            {filteredAssets.map(asset => {
              const disabled = !!asset.excluded_reason;
              const selected = isSelected(asset.ticker);

              return (
                <label
                  key={asset.ticker}
                  title={disabled ? asset.excluded_reason ?? undefined : `${asset.name} · ${asset.sector}`}
                  className={`flex items-center gap-2 h-8 px-2 text-xs border-b border-line/30 transition-colors ${
                    disabled
                      ? 'opacity-40 cursor-not-allowed bg-surface/30'
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
                  <span className={`font-mono font-medium shrink-0 ${selected ? 'text-text' : 'text-muted'}`}>
                    {asset.symbol}
                  </span>
                  <span className="text-muted truncate min-w-0 flex-1 text-[14px]">
                    {asset.name}
                  </span>
                  <span className="text-[13px] text-faint truncate max-w-[36%] shrink-0">
                    {disabled ? `⚠ ${asset.excluded_reason}` : asset.sector}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
