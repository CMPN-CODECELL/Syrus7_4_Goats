"""Fetch daily adjusted close price snapshot for NIFTY 50 constituents and ^NSEI.

Saves the prices as a parquet file in backend/data/snapshot/prices.parquet.
This snapshot enables offline and rate-limit-safe execution.
"""
from __future__ import annotations

import csv
import sys
from pathlib import Path

# Force UTF-8 encoding for console output on Windows
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

import pandas as pd
import yfinance as yf

ROOT_DIR = Path(__file__).resolve().parent.parent
CSV_PATH = ROOT_DIR / "data" / "nifty50.csv"
SNAPSHOT_DIR = ROOT_DIR / "data" / "snapshot"
PARQUET_PATH = SNAPSHOT_DIR / "prices.parquet"


def get_tickers() -> list[str]:
    """Read the 50 constituent tickers from nifty50.csv."""
    tickers: list[str] = []
    with open(CSV_PATH, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            tickers.append(row["yf_ticker"].strip())
    return tickers


def fetch_snapshot(
    start: str = "2023-09-01",
    end: str = "2026-10-08",
) -> pd.DataFrame:
    """Download daily adjusted close prices for 50 NIFTY stocks and ^NSEI."""
    stock_tickers = get_tickers()
    if len(stock_tickers) != 50:
        raise ValueError(f"Expected 50 stock tickers, found {len(stock_tickers)}")

    all_tickers = stock_tickers + ["^NSEI"]
    print(f"Fetching data for {len(all_tickers)} tickers from {start} to {end}...")

    # Single batched download with auto_adjust=True
    raw_df = yf.download(
        tickers=all_tickers,
        start=start,
        end=end,
        auto_adjust=True,
        progress=True,
    )

    if raw_df.empty:
        raise RuntimeError("yfinance returned an empty DataFrame")

    # yfinance returns MultiIndex (Price, Ticker) with tickers alphabetically sorted.
    # Extract "Close" and reorder to match all_tickers input order.
    if isinstance(raw_df.columns, pd.MultiIndex):
        close_df = raw_df["Close"][all_tickers]
    else:
        close_df = raw_df[["Close"]]

    # Ensure index is tz-naive and formatted cleanly
    close_df.index = pd.to_datetime(close_df.index).tz_localize(None)
    close_df.index.name = "date"

    SNAPSHOT_DIR.mkdir(parents=True, exist_ok=True)
    close_df.to_parquet(PARQUET_PATH, engine="pyarrow")
    print(f"Saved snapshot to {PARQUET_PATH}")
    print(f"Shape: {close_df.shape}, Date range: {close_df.index[0].date()} to {close_df.index[-1].date()}")
    return close_df


if __name__ == "__main__":
    fetch_snapshot()
