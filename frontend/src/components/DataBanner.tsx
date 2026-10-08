import React from 'react';

interface DataBannerProps {
  source?: string;
  asOf?: string;
  estWindow?: [string, string];
  testWindow?: [string, string];
}

export const DataBanner: React.FC<DataBannerProps> = ({
  source = 'snapshot',
  asOf = '2026-10-07',
  estWindow = ['2023-10-01', '2025-09-30'],
  testWindow = ['2025-10-01', '2026-09-30']
}) => {
  return (
    <div className="bg-panel border border-line rounded-2xl p-4 shadow-panel mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-peach/10 text-peach border border-peach/30 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-peach mr-1.5 animate-pulse"></span>
            Data: {source.toUpperCase()}
          </span>
          <span className="text-muted">As of: <strong className="text-text font-semibold">{asOf}</strong></span>
        </div>

        <div className="flex flex-wrap items-center space-x-4 text-muted">
          <div>
            Estimation Window: <strong className="text-text">{estWindow[0]}</strong> → <strong className="text-text">{estWindow[1]}</strong>
          </div>
          <span className="text-line">|</span>
          <div>
            Test Window: <strong className="text-text">{testWindow[0]}</strong> → <strong className="text-text">{testWindow[1]}</strong>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-line/50 text-[11px] text-muted flex items-center justify-between">
        <span>Note: Returns &amp; Volatility annualised (x252). Risk-free rate RF = 5.57%. Transaction costs included (buy 0.1187%, sell 0.1037%).</span>
        <span className="italic text-slate font-medium">Survivorship bias: today's NIFTY 50 list is used for past dates.</span>
      </div>
    </div>
  );
};
