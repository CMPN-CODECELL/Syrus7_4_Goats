import React from 'react';

interface DataBannerProps {
  source?: string;
  asOf?: string;
  estWindow?: [string, string];
  testWindow?: [string, string];
  notes?: string[];
}

const DEFAULT_NOTES = ["Survivorship bias: today's NIFTY 50 list is used for past dates."];

export const DataBanner: React.FC<DataBannerProps> = ({ source, asOf, estWindow, testWindow, notes }) => {
  const shownNotes = notes && notes.length > 0 ? notes : DEFAULT_NOTES;

  return (
    <div className="bg-surface border border-line p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <span className="inline-flex items-center px-2.5 py-1 bg-surface-elevated text-text border border-line-strong font-medium">
          <span className="w-1.5 h-1.5 bg-accent-blue mr-1.5 shrink-0"></span>
          Data source: Yahoo Finance via yfinance (adjusted close), cached snapshot
        </span>
        <span className="text-muted">As of: <strong className="text-text font-medium">{asOf ?? 'unknown'}</strong></span>
        {source && <span className="label">Feed: {source}</span>}
        {estWindow && (
          <span className="text-muted">
            Estimation window: <strong className="text-text">{estWindow[0]}</strong> to <strong className="text-text">{estWindow[1]}</strong>
          </span>
        )}
        {testWindow && (
          <span className="text-muted">
            Test window: <strong className="text-text">{testWindow[0]}</strong> to <strong className="text-text">{testWindow[1]}</strong>
          </span>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-line/50 text-[11px] text-muted space-y-1">
        <p>Returns and volatility are annualised (252 trading days). Risk-free rate 5.57%. Transaction costs: buy 0.1187%, sell 0.1037%.</p>
        {shownNotes.map((n, i) => (
          <p key={i} className="italic text-muted font-medium break-words">{n}</p>
        ))}
        {!estWindow && <p>The estimation and test windows appear here after a run.</p>}
      </div>
    </div>
  );
};
