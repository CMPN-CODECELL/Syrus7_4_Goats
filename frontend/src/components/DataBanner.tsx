import React, { useState } from 'react';

interface DataBannerProps {
  source?: string;
  asOf?: string;
  estWindow?: [string, string];
  testWindow?: [string, string];
  notes?: string[];
}

const DEFAULT_NOTES = ["Survivorship bias: today's NIFTY 50 list is used for past dates."];

export const DataBanner: React.FC<DataBannerProps> = ({ source, asOf, estWindow, testWindow, notes }) => {
  const [showDisclosures, setShowDisclosures] = useState(false);
  const shownNotes = notes && notes.length > 0 ? notes : DEFAULT_NOTES;

  return (
    <div className="bg-surface border border-line text-xs">
      {/* Primary Provenance Bar */}
      <div className="p-3 sm:px-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
          <span className="inline-flex items-center px-2 py-0.5 bg-surface-elevated text-text border border-line-strong font-medium text-[11px]">
            <span className="w-1.5 h-1.5 bg-accent-blue mr-1.5 shrink-0"></span>
            Yahoo Finance (yfinance) · Adjusted Close
          </span>

          <span className="text-muted text-[11px]">
            As of: <strong className="text-text font-mono font-medium">{asOf ?? '2026-10-07'}</strong>
          </span>

          {source && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-bg text-muted border border-line">
              FEED: {source.toUpperCase()}
            </span>
          )}

          <span className="text-line-strong hidden sm:inline">•</span>

          <span className="text-muted text-[11px]">
            Rf: <strong className="text-text font-mono font-medium">5.57%</strong>
          </span>

          <span className="text-line-strong hidden sm:inline">•</span>

          <span className="text-muted text-[11px]">
            Costs: <strong className="text-text font-mono font-medium">Buy 0.1187% / Sell 0.1037%</strong>
          </span>

          {estWindow && (
            <>
              <span className="text-line-strong hidden md:inline">•</span>
              <span className="text-muted text-[11px]">
                Est: <strong className="text-text font-mono font-medium">{estWindow[0]}</strong> to <strong className="text-text font-mono font-medium">{estWindow[1]}</strong>
              </span>
            </>
          )}

          {testWindow && (
            <>
              <span className="text-line-strong hidden md:inline">•</span>
              <span className="text-muted text-[11px]">
                Test: <strong className="text-text font-mono font-medium">{testWindow[0]}</strong> to <strong className="text-text font-mono font-medium">{testWindow[1]}</strong>
              </span>
            </>
          )}
        </div>

        {/* Toggleable Disclosures & Warnings Button */}
        <button
          type="button"
          onClick={() => setShowDisclosures(!showDisclosures)}
          className="text-[11px] text-muted hover:text-text flex items-center space-x-1.5 py-0.5 px-2 bg-bg border border-line hover:border-line-strong transition-colors ml-auto sm:ml-0"
          title="View data assumptions, survivorship bias warning, and window details"
        >
          <span className="text-accent-blue-hover text-[10px]">ℹ</span>
          <span>Assumptions &amp; Disclosures</span>
          <span className="text-[9px] font-mono text-faint ml-0.5">{showDisclosures ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Expandable Disclosure Drawer */}
      {showDisclosures && (
        <div className="p-3 sm:px-4 bg-bg border-t border-line text-[11px] text-muted space-y-1.5 transition-all">
          <div className="flex items-start gap-2 text-text-dim">
            <span className="text-accent-blue-hover shrink-0 font-mono">▸</span>
            <p>
              Annualisation convention: <strong>252 trading days</strong>. Risk-free benchmark rate: <strong>5.57%</strong> annualised.
              Transaction friction modeled on Indian equity delivery tariffs: <strong>Buy 0.1187%</strong>, <strong>Sell 0.1037%</strong>.
            </p>
          </div>
          {shownNotes.map((n, i) => (
            <div key={i} className="flex items-start gap-2 text-muted">
              <span className="text-loss shrink-0 font-mono">⚠</span>
              <p className="italic">{n}</p>
            </div>
          ))}
          {!estWindow && (
            <p className="text-[10px] text-faint pl-4">
              Historical estimation and out-of-sample test date windows will be verified and displayed upon pipeline execution.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
