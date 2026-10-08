import {
  Universe,
  RunRequest,
  ScreenInfo,
  JobStatus,
  RunResult,
  Study,
  StudySummary,
  Asset
} from './types';

// Mock 50 NIFTY assets
const MOCK_ASSETS: Asset[] = [
  { ticker: 'TCS.NS', symbol: 'TCS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', excluded_reason: null },
  { ticker: 'RELIANCE.NS', symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', sector: 'Energy', excluded_reason: null },
  { ticker: 'HDFCBANK.NS', symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', sector: 'Financial Services', excluded_reason: null },
  { ticker: 'INFY.NS', symbol: 'INFY', name: 'Infosys Ltd.', sector: 'Information Technology', excluded_reason: null },
  { ticker: 'ICICIBANK.NS', symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', sector: 'Financial Services', excluded_reason: null },
  { ticker: 'HINDUNILVR.NS', symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd.', sector: 'FMCG', excluded_reason: null },
  { ticker: 'ITC.NS', symbol: 'ITC', name: 'ITC Ltd.', sector: 'FMCG', excluded_reason: null },
  { ticker: 'LT.NS', symbol: 'LT', name: 'Larsen & Toubro Ltd.', sector: 'Capital Goods', excluded_reason: null },
  { ticker: 'SBIN.NS', symbol: 'SBIN', name: 'State Bank of India', sector: 'Financial Services', excluded_reason: null },
  { ticker: 'BHARTIARTL.NS', symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', sector: 'Telecommunication', excluded_reason: null },
  { ticker: 'KOTAKBANK.NS', symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Ltd.', sector: 'Financial Services', excluded_reason: null },
  { ticker: 'AXISBANK.NS', symbol: 'AXISBANK', name: 'Axis Bank Ltd.', sector: 'Financial Services', excluded_reason: null },
  { ticker: 'ASIANPAINT.NS', symbol: 'ASIANPAINT', name: 'Asian Paints Ltd.', sector: 'Consumer Durables', excluded_reason: null },
  { ticker: 'HCLTECH.NS', symbol: 'HCLTECH', name: 'HCL Technologies Ltd.', sector: 'Information Technology', excluded_reason: null },
  { ticker: 'MARUTI.NS', symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd.', sector: 'Automobile', excluded_reason: null },
  { ticker: 'SUNPHARMA.NS', symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Healthcare', excluded_reason: null },
  { ticker: 'TITAN.NS', symbol: 'TITAN', name: 'Titan Company Ltd.', sector: 'Consumer Durables', excluded_reason: null },
  { ticker: 'BAJFINANCE.NS', symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd.', sector: 'Financial Services', excluded_reason: null },
  { ticker: 'ULTRACEMCO.NS', symbol: 'ULTRACEMCO', name: 'UltraTech Cement Ltd.', sector: 'Construction Materials', excluded_reason: null },
  { ticker: 'TATASTEEL.NS', symbol: 'TATASTEEL', name: 'Tata Steel Ltd.', sector: 'Metals & Mining', excluded_reason: null },
  { ticker: 'NTPC.NS', symbol: 'NTPC', name: 'NTPC Ltd.', sector: 'Utilities', excluded_reason: null },
  { ticker: 'POWERGRID.NS', symbol: 'POWERGRID', name: 'Power Grid Corporation of India Ltd.', sector: 'Utilities', excluded_reason: null },
  { ticker: 'M&M.NS', symbol: 'M&M', name: 'Mahindra & Mahindra Ltd.', sector: 'Automobile', excluded_reason: null },
  { ticker: 'TATAMOTORS.NS', symbol: 'TATAMOTORS', name: 'Tata Motors Ltd.', sector: 'Automobile', excluded_reason: null },
  { ticker: 'ONGC.NS', symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Ltd.', sector: 'Energy', excluded_reason: null },
  { ticker: 'ADANIENT.NS', symbol: 'ADANIENT', name: 'Adani Enterprises Ltd.', sector: 'Metals & Mining', excluded_reason: null },
  { ticker: 'ADANIPORTS.NS', symbol: 'ADANIPORTS', name: 'Adani Ports & SEZ Ltd.', sector: 'Services', excluded_reason: null },
  { ticker: 'COALINDIA.NS', symbol: 'COALINDIA', name: 'Coal India Ltd.', sector: 'Energy', excluded_reason: null },
  { ticker: 'WIPRO.NS', symbol: 'WIPRO', name: 'Wipro Ltd.', sector: 'Information Technology', excluded_reason: null },
  { ticker: 'NESTLEIND.NS', symbol: 'NESTLEIND', name: 'Nestle India Ltd.', sector: 'FMCG', excluded_reason: null },
  { ticker: 'TECHM.NS', symbol: 'TECHM', name: 'Tech Mahindra Ltd.', sector: 'Information Technology', excluded_reason: null },
  { ticker: 'GRASIM.NS', symbol: 'GRASIM', name: 'Grasim Industries Ltd.', sector: 'Construction Materials', excluded_reason: null },
  { ticker: 'BRITANNIA.NS', symbol: 'BRITANNIA', name: 'Britannia Industries Ltd.', sector: 'FMCG', excluded_reason: null },
  { ticker: 'EICHERMOT.NS', symbol: 'EICHERMOT', name: 'Eicher Motors Ltd.', sector: 'Automobile', excluded_reason: null },
  { ticker: 'CIPLA.NS', symbol: 'CIPLA', name: 'Cipla Ltd.', sector: 'Healthcare', excluded_reason: null },
  { ticker: 'HDFCLIFE.NS', symbol: 'HDFCLIFE', name: 'HDFC Life Insurance Co. Ltd.', sector: 'Financial Services', excluded_reason: null },
  { ticker: 'DRREDDY.NS', symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories Ltd.", sector: 'Healthcare', excluded_reason: null },
  { ticker: 'BPCL.NS', symbol: 'BPCL', name: 'Bharat Petroleum Corporation Ltd.', sector: 'Energy', excluded_reason: null },
  { ticker: 'SBILIFE.NS', symbol: 'SBILIFE', name: 'SBI Life Insurance Co. Ltd.', sector: 'Financial Services', excluded_reason: null },
  { ticker: 'DIVISLAB.NS', symbol: 'DIVISLAB', name: "Divi's Laboratories Ltd.", sector: 'Healthcare', excluded_reason: null },
  { ticker: 'TATACONSUMER.NS', symbol: 'TATACONSUMER', name: 'Tata Consumer Products Ltd.', sector: 'FMCG', excluded_reason: null },
  { ticker: 'APOLLOHOSP.NS', symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Ltd.', sector: 'Healthcare', excluded_reason: null },
  { ticker: 'BAJAJ-AUTO.NS', symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto Ltd.', sector: 'Automobile', excluded_reason: null },
  { ticker: 'HEROMOTOCO.NS', symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Ltd.', sector: 'Automobile', excluded_reason: null },
  { ticker: 'HINDALCO.NS', symbol: 'HINDALCO', name: 'Hindalco Industries Ltd.', sector: 'Metals & Mining', excluded_reason: null },
  { ticker: 'SHREAM.NS', symbol: 'SHREAM', name: 'Shree Cement Ltd.', sector: 'Construction Materials', excluded_reason: null },
  { ticker: 'LTIM.NS', symbol: 'LTIM', name: 'LTIMindtree Ltd.', sector: 'Information Technology', excluded_reason: null },
  { ticker: 'BEL.NS', symbol: 'BEL', name: 'Bharat Electronics Ltd.', sector: 'Capital Goods', excluded_reason: null },
  { ticker: 'TRENT.NS', symbol: 'TRENT', name: 'Trent Ltd.', sector: 'Consumer Services', excluded_reason: null },
  { ticker: 'TMPV.NS', symbol: 'TMPV', name: 'Tata Motors Passenger Vehicles', sector: 'Automobile', excluded_reason: 'Demerger on 2025-10-14 breaks the price series in the test window' }
];

export const MOCK_UNIVERSE: Universe = {
  as_of: '2026-10-07',
  source: 'snapshot',
  assets: MOCK_ASSETS
};

// In-memory active jobs
const activeJobs = new Map<string, { startTime: number; req: RunRequest; cancelled?: boolean }>();

export function mockGetUniverse(): Promise<Universe> {
  return Promise.resolve(MOCK_UNIVERSE);
}

export function mockPostScreen(req: RunRequest): Promise<ScreenInfo> {
  const chosenTickers = req.tickers && req.tickers.length > 0
    ? req.tickers
    : MOCK_ASSETS.filter(a => !a.excluded_reason).map(a => a.ticker);

  const numSelected = chosenTickers.length;
  // Slack calculation: 3 for return, sector cap slack
  const slackBits = req.sector_cap ? 4 : 3;
  const totalNeeded = numSelected + slackBits;

  if (totalNeeded > req.qubit_cap) {
    const assetLimit = req.qubit_cap - slackBits;
    const kept = chosenTickers.slice(0, assetLimit);
    const dropped = chosenTickers.slice(assetLimit);
    return Promise.resolve({
      applied: true,
      rule: `Kept the ${kept.length} stocks with highest Sharpe ratio to fit ${req.qubit_cap} qubits (${kept.length} assets + ${slackBits} slack).`,
      kept,
      dropped,
      qubits: { assets: kept.length, slack: slackBits, total: req.qubit_cap }
    });
  }

  return Promise.resolve({
    applied: false,
    rule: 'No screening necessary. Selected universe fits within qubit budget.',
    kept: chosenTickers,
    dropped: [],
    qubits: { assets: numSelected, slack: slackBits, total: totalNeeded }
  });
}

export function mockStartRun(req: RunRequest): Promise<{ job_id: string }> {
  const jobId = 'job_' + Math.random().toString(36).substring(2, 9);
  activeJobs.set(jobId, { startTime: Date.now(), req });
  return Promise.resolve({ job_id: jobId });
}

export function mockCancelRun(jobId: string): Promise<JobStatus> {
  const job = activeJobs.get(jobId);
  if (job) {
    job.cancelled = true;
  }
  return Promise.resolve({
    job_id: jobId,
    state: 'cancelled',
    progress: 0,
    stage: 'Cancelled by user',
    convergence: null,
    elapsed_s: 1.2,
    result: null,
    error: null
  });
}

export function mockGetRun(jobId: string): Promise<JobStatus> {
  const job = activeJobs.get(jobId);
  const elapsed = job ? (Date.now() - job.startTime) / 1000 : 5.0;

  // Trigger error test if k === 99
  if (job?.req.k === 99) {
    return Promise.resolve({
      job_id: jobId,
      state: 'error',
      progress: 0.15,
      stage: 'Failed during QUBO matrix generation',
      convergence: null,
      elapsed_s: elapsed,
      result: null,
      error: 'Invalid cardinality parameter k=99 exceeds maximum allowed stocks.'
    });
  }

  if (job?.cancelled) {
    return Promise.resolve({
      job_id: jobId,
      state: 'cancelled',
      progress: 0.5,
      stage: 'Cancelled',
      convergence: null,
      elapsed_s: elapsed,
      result: null,
      error: null
    });
  }

  // Simulate ~5s runtime
  const totalDuration = 4.5;
  const progress = Math.min(1.0, elapsed / totalDuration);

  // Generate simulated convergence points up to current progress
  const totalIters = job?.req.qaoa.maxiter || 150;
  const currentIter = Math.floor(progress * totalIters);
  const convergence = Array.from({ length: Math.max(1, Math.min(currentIter, 20)) }, (_, i) => {
    const iter = Math.floor(((i + 1) / 20) * currentIter);
    const noiseVal = (Math.random() - 0.5) * 0.005;
    const energy = -0.01 - (0.06 * (1 - Math.exp(-i / 5))) + noiseVal;
    return { iter, energy };
  });

  if (progress < 1.0) {
    return Promise.resolve({
      job_id: jobId,
      state: 'running',
      progress,
      stage: `Optimising QAOA parameters (iteration ${currentIter} of ${totalIters})`,
      convergence,
      elapsed_s: elapsed,
      result: null,
      error: null
    });
  }

  // Done! Build mock RunResult
  const req = job?.req || {
    tickers: null,
    k: 5,
    risk_aversion: 0.5,
    sector_cap: 2,
    target_return: null,
    capital: 1000000,
    holdings: {},
    qubit_cap: 16,
    qaoa: { variant: 'standard', reps: 2, optimizer: 'COBYLA', init: 'ramp', shots: 4096, maxiter: 150, noise: false, seed: 7 }
  };

  const mockResult: RunResult = {
    run_id: jobId,
    request: req,
    data: {
      source: 'snapshot',
      as_of: '2026-10-07',
      est_window: ['2023-10-01', '2025-09-30'],
      test_window: ['2025-10-01', '2026-09-30'],
      excluded: { 'TMPV.NS': 'Demerger on 2025-10-14 breaks the price series in the test window' },
      filled: { 'INDIGO.NS': 1 },
      notes: ['Survivorship bias: today\'s NIFTY 50 list is used for past dates.']
    },
    screen: {
      applied: true,
      rule: 'Kept the 10 stocks with the highest Sharpe ratio to fit 13 qubits (10 assets + 3 slack).',
      kept: ['TCS.NS', 'RELIANCE.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS', 'LT.NS', 'BHARTIARTL.NS', 'SUNPHARMA.NS', 'TITAN.NS'],
      dropped: ['ITC.NS', 'SBIN.NS', 'KOTAKBANK.NS', 'AXISBANK.NS', 'MARUTI.NS'],
      qubits: { assets: 10, slack: 3, total: 13 }
    },
    qubo: {
      n_vars: 13,
      n_assets: 10,
      n_slack: 3,
      terms: ['objective', 'cardinality', 'sector_cap', 'transaction_cost'],
      penalties: { cardinality: 0.42, sector_cap: 0.42 }
    },
    landscape: {
      n_feasible: 252,
      f_min: -0.071,
      f_max: 0.012,
      f_mean: -0.031
    },
    solvers: [
      {
        solver: 'brute_force',
        label: 'Brute force (exact)',
        kind: 'classical',
        selection: ['TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'BHARTIARTL.NS', 'SUNPHARMA.NS'],
        bitstring: '1101000110',
        objective: -0.071,
        exp_return: 0.214,
        volatility: 0.131,
        variance: 0.01716,
        txn_cost: 0.0012,
        feasible: true,
        violations: [],
        runtime_s: 0.04,
        approx_ratio: 1.0,
        p_opt: null,
        feasible_rate: 1.0,
        portfolio: {
          rows: [
            { ticker: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', weight: 0.2, shares: 52, price: 3810.5, value: 198146.0 },
            { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', sector: 'Energy', weight: 0.2, shares: 72, price: 2750.0, value: 198000.0 },
            { ticker: 'INFY.NS', name: 'Infosys Ltd.', sector: 'Information Technology', weight: 0.2, shares: 118, price: 1680.0, value: 198240.0 },
            { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.', sector: 'Telecommunication', weight: 0.2, shares: 123, price: 1610.0, value: 198030.0 },
            { ticker: 'SUNPHARMA.NS', symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Healthcare', weight: 0.2, shares: 104, price: 1900.0, value: 197600.0 }
          ],
          invested: 990016.0,
          cash_left: 9984.0
        },
        oos: { ann_return: 0.112, ann_vol: 0.142, sharpe: 0.39, max_drawdown: -0.118 },
        details: {}
      },
      {
        solver: 'relaxation',
        label: 'Relaxation + rounding',
        kind: 'classical',
        selection: ['TCS.NS', 'RELIANCE.NS', 'HDFCBANK.NS', 'INFY.NS', 'SUNPHARMA.NS'],
        bitstring: '1111000010',
        objective: -0.068,
        exp_return: 0.201,
        volatility: 0.128,
        variance: 0.01638,
        txn_cost: 0.0012,
        feasible: true,
        violations: [],
        runtime_s: 0.08,
        approx_ratio: 0.957,
        p_opt: null,
        feasible_rate: 1.0,
        portfolio: {
          rows: [
            { ticker: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', weight: 0.2, shares: 52, price: 3810.5, value: 198146.0 },
            { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', sector: 'Energy', weight: 0.2, shares: 72, price: 2750.0, value: 198000.0 },
            { ticker: 'HDFCBANK.NS', name: 'HDFC Bank Ltd.', sector: 'Financial Services', weight: 0.2, shares: 119, price: 1660.0, value: 197540.0 },
            { ticker: 'INFY.NS', name: 'Infosys Ltd.', sector: 'Information Technology', weight: 0.2, shares: 118, price: 1680.0, value: 198240.0 },
            { ticker: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Healthcare', weight: 0.2, shares: 104, price: 1900.0, value: 197600.0 }
          ],
          invested: 989526.0,
          cash_left: 10474.0
        },
        oos: { ann_return: 0.104, ann_vol: 0.138, sharpe: 0.35, max_drawdown: -0.122 },
        details: { relaxed_x: [0.82, 0.79, 0.65, 0.71, 0.44, 0.32, 0.21, 0.58, 0.62, 0.19] }
      },
      {
        solver: 'annealing',
        label: 'Simulated annealing',
        kind: 'classical',
        selection: ['TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'BHARTIARTL.NS', 'SUNPHARMA.NS'],
        bitstring: '1101000110',
        objective: -0.071,
        exp_return: 0.214,
        volatility: 0.131,
        variance: 0.01716,
        txn_cost: 0.0012,
        feasible: true,
        violations: [],
        runtime_s: 0.18,
        approx_ratio: 1.0,
        p_opt: null,
        feasible_rate: 0.88,
        portfolio: {
          rows: [
            { ticker: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', weight: 0.2, shares: 52, price: 3810.5, value: 198146.0 },
            { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', sector: 'Energy', weight: 0.2, shares: 72, price: 2750.0, value: 198000.0 },
            { ticker: 'INFY.NS', name: 'Infosys Ltd.', sector: 'Information Technology', weight: 0.2, shares: 118, price: 1680.0, value: 198240.0 },
            { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.', sector: 'Telecommunication', weight: 0.2, shares: 123, price: 1610.0, value: 198030.0 },
            { ticker: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Healthcare', weight: 0.2, shares: 104, price: 1900.0, value: 197600.0 }
          ],
          invested: 990016.0,
          cash_left: 9984.0
        },
        oos: { ann_return: 0.112, ann_vol: 0.142, sharpe: 0.39, max_drawdown: -0.118 },
        details: { seed: 7, sweeps: 2000 }
      },
      {
        solver: 'qaoa_standard',
        label: `QAOA ${req.qaoa.variant === 'xy' ? 'XY' : 'Standard'} (p=${req.qaoa.reps})`,
        kind: 'quantum',
        selection: ['TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'BHARTIARTL.NS', 'SUNPHARMA.NS'],
        bitstring: '1101000110',
        objective: -0.071,
        exp_return: 0.214,
        volatility: 0.131,
        variance: 0.01716,
        txn_cost: 0.0012,
        feasible: true,
        violations: [],
        runtime_s: 4.32,
        approx_ratio: 0.83,
        p_opt: 0.083,
        feasible_rate: 0.61,
        portfolio: {
          rows: [
            { ticker: 'TCS.NS', name: 'Tata Consultancy Services Ltd.', sector: 'Information Technology', weight: 0.2, shares: 52, price: 3810.5, value: 198146.0 },
            { ticker: 'RELIANCE.NS', name: 'Reliance Industries Ltd.', sector: 'Energy', weight: 0.2, shares: 72, price: 2750.0, value: 198000.0 },
            { ticker: 'INFY.NS', name: 'Infosys Ltd.', sector: 'Information Technology', weight: 0.2, shares: 118, price: 1680.0, value: 198240.0 },
            { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel Ltd.', sector: 'Telecommunication', weight: 0.2, shares: 123, price: 1610.0, value: 198030.0 },
            { ticker: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Ltd.', sector: 'Healthcare', weight: 0.2, shares: 104, price: 1900.0, value: 197600.0 }
          ],
          invested: 990016.0,
          cash_left: 9984.0
        },
        oos: { ann_return: 0.112, ann_vol: 0.142, sharpe: 0.39, max_drawdown: -0.118 },
        details: { most_probable: '1101000110' }
      }
    ],
    qaoa: {
      solver: 'qaoa_standard',
      convergence,
      samples: [
        { bitstring: '1101000110', prob: 0.083, objective: -0.071, feasible: true, optimal: true },
        { bitstring: '1111000010', prob: 0.065, objective: -0.068, feasible: true, optimal: false },
        { bitstring: '1001000111', prob: 0.052, objective: -0.062, feasible: true, optimal: false },
        { bitstring: '1100000111', prob: 0.048, objective: -0.058, feasible: true, optimal: false },
        { bitstring: '1111100000', prob: 0.038, objective: -0.045, feasible: true, optimal: false },
        { bitstring: '1111110000', prob: 0.041, objective: null, feasible: false, optimal: false },
        { bitstring: '0000000000', prob: 0.029, objective: null, feasible: false, optimal: false }
      ],
      metrics: {
        approx_ratio: 0.83,
        p_opt: 0.083,
        p_random: 0.0048,
        feasible_rate: 0.61
      },
      circuit: {
        qubits: 13,
        reps: req.qaoa.reps,
        depth: 96,
        two_qubit_gates: 156,
        optimizer: req.qaoa.optimizer,
        init: req.qaoa.init,
        seed: req.qaoa.seed
      },
      noise: req.qaoa.noise ? {
        backend: 'FakeGuadalupeV2',
        ideal: { approx_ratio: 0.83, p_opt: 0.083, feasible_rate: 0.61 },
        noisy: { approx_ratio: 0.64, p_opt: 0.021, feasible_rate: 0.38 },
        transpiled: { depth: 412, two_qubit_gates: 684 }
      } : null
    },
    frontier: {
      continuous: [
        { risk: 0.10, ret: 0.12 },
        { risk: 0.11, ret: 0.15 },
        { risk: 0.12, ret: 0.18 },
        { risk: 0.13, ret: 0.21 },
        { risk: 0.14, ret: 0.23 },
        { risk: 0.15, ret: 0.25 }
      ],
      discrete: [
        { risk: 0.131, ret: 0.214, selection: ['TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'BHARTIARTL.NS', 'SUNPHARMA.NS'] },
        { risk: 0.128, ret: 0.201, selection: ['TCS.NS', 'RELIANCE.NS', 'HDFCBANK.NS', 'INFY.NS', 'SUNPHARMA.NS'] }
      ]
    },
    benchmarks: {
      nifty50: { ann_return: 0.08, ann_vol: 0.13, sharpe: 0.19, max_drawdown: -0.12 }
    },
    verdict: {
      level: 'near',
      headline: 'QAOA found a portfolio within 0.8% of the exact optimum.',
      details: [
        'It sampled the exact optimum with probability 8.3%, 17x more often than a random guess (0.48%).',
        'Brute force solved this 10-stock instance exactly in 0.04 s; no computational speed benefit is claimed at this size.'
      ]
    },
    recommended: 'brute_force'
  };

  return Promise.resolve({
    job_id: jobId,
    state: 'done',
    progress: 1.0,
    stage: 'Completed',
    convergence,
    elapsed_s: elapsed,
    result: mockResult,
    error: null
  });
}

// Mock Studies
const MOCK_STUDIES_INDEX: StudySummary[] = [
  { id: 'depth', title: 'Effect of Circuit Depth (p)', summary: 'Measures approximation ratio and optimal state probability across depth p=1 to 5.' },
  { id: 'optimizer', title: 'Classical Optimizer Comparison', summary: 'Compares COBYLA, SPSA, and Nelder-Mead optimization convergence speed and parameter stability.' },
  { id: 'init', title: 'Warm-Start & Parameter Initialization', summary: 'Evaluates Random vs Ramp vs Interp (depth p-1 warm start) initialization quality.' },
  { id: 'mixer', title: 'Standard vs XY Ring Mixer', summary: 'Analyses feasibility rate improvement when switching from standard Pauli-X to symmetry-preserving XY mixer.' },
  { id: 'noise', title: 'Hardware Noise Impact (FakeGuadalupeV2)', summary: 'Quantifies degradation of statevector vs 16-qubit noisy backend simulation.' }
];

export function mockListStudies(): Promise<StudySummary[]> {
  return Promise.resolve(MOCK_STUDIES_INDEX);
}

export function mockGetStudy(id: string): Promise<Study> {
  const baseStudy: Study = {
    id,
    title: id === 'depth' ? 'Effect of Circuit Depth (p)' : `Study: ${id}`,
    description: 'Mean over 10 fixed-seed 10-asset, K=5 instances, estimation window 2023-10-01 to 2025-09-30.',
    x_label: id === 'depth' ? 'QAOA depth p' : 'Iterations',
    y_label: '1 - Approximation Ratio',
    series: [
      {
        label: 'Standard mixer',
        points: [
          { x: 1, y: 0.31, yerr: 0.05 },
          { x: 2, y: 0.22, yerr: 0.04 },
          { x: 3, y: 0.17, yerr: 0.03 },
          { x: 4, y: 0.13, yerr: 0.02 },
          { x: 5, y: 0.10, yerr: 0.02 }
        ]
      },
      {
        label: 'XY mixer + Dicke',
        points: [
          { x: 1, y: 0.12, yerr: 0.03 },
          { x: 2, y: 0.08, yerr: 0.02 },
          { x: 3, y: 0.05, yerr: 0.01 },
          { x: 4, y: 0.03, yerr: 0.01 },
          { x: 5, y: 0.02, yerr: 0.008 }
        ]
      }
    ],
    instance: {
      n_assets: 10,
      k: 5,
      q: 0.5,
      seeds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      shots: 4096
    },
    notes: ['Noiseless statevector simulation executed on Aer Qiskit 2.5.'],
    generated_at: '2026-10-08',
    wall_time_s: 812.0
  };

  return Promise.resolve(baseStudy);
}
