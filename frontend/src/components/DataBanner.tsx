import React from 'react';

interface DataBannerProps {
  source?: string;
  asOf?: string;
  estWindow?: [string, string];
  testWindow?: [string, string];
  notes?: string[];
}

const DEFAULT_NOTES = ["Survivorship bias: today's NIFTY 50 list is used for past dates."];

/** Where the data comes from, its date, and the assumptions every number rests on. */
export const DataBanner: React.FC<DataBannerProps> = ({ source, asOf, estWindow, testWindow, notes }) => {
  const shownNotes = notes && notes.length > 0 ? notes : DEFAULT_NOTES;

  return (
    <aside aria-label="Data and assumptions" className="border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="font-medium text-text">Data source: Yahoo Finance via yfinance (adjusted close), cached snapshot</span>
        <span className="text-muted">Snapshot date: <strong className="text-text">{asOf ?? 'unknown'}</strong></span>
        {source && <span className="font-mono text-xs uppercase tracking-[0.08em] text-muted">Feed: {source}</span>}
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

      <div className="mt-2 space-y-1 border-t border-line pt-2 text-sm text-muted">
        <p>Returns and volatility are annualised (252 trading days). Risk-free rate 5.57%. Transaction costs: buy 0.1187%, sell 0.1037%.</p>
        {shownNotes.map((n, i) => (
          <p key={i} className="break-words">{n}</p>
        ))}
        {!estWindow && <p>The estimation and test windows appear here after a run.</p>}
      </div>
    </aside>
  );
};
