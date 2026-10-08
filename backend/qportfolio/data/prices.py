"""Price data loader with 3-tier fallback: Cache -> Snapshot -> Live.

Provides load_prices returning a PriceData structure.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)

SourceType = Literal["cache", "snapshot", "live"]


@dataclass
class PriceData:
    """Loaded price data with origin provenance."""

    close: pd.DataFrame  # date x ticker adjusted close prices
    source: SourceType  # "cache" | "snapshot" | "live"
    as_of: str  # ISO date string of last bar, e.g. "2026-10-07"


_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
_CACHE_DIR = _BACKEND_DIR / "data" / "cache"
_CACHE_FILE = _CACHE_DIR / "prices.parquet"
_SNAPSHOT_FILE = _BACKEND_DIR / "data" / "snapshot" / "prices.parquet"


def _download_live(
    tickers: list[str],
    start: str = "2023-09-01",
    end: str = "2026-10-08",
) -> pd.DataFrame:
    """Download daily adjusted close prices directly from Yahoo Finance."""
    raw = yf.download(
        tickers=tickers,
        start=start,
        end=end,
        auto_adjust=True,
        progress=False,
    )
    if raw.empty:
        raise RuntimeError("yfinance returned empty data")

    if isinstance(raw.columns, pd.MultiIndex):
        avail_tickers = [t for t in tickers if t in raw["Close"].columns]
        close_df = raw["Close"][avail_tickers]
    else:
        close_df = raw[["Close"]]

    close_df.index = pd.to_datetime(close_df.index).tz_localize(None)
    close_df.index.name = "date"
    return close_df


def load_prices(
    tickers: list[str] | None = None,
    start: str | None = None,
    end: str | None = None,
    refresh: bool = False,
) -> PriceData:
    """Load daily adjusted close prices.

    Tier resolution:
    - If refresh=True: Try live download -> write cache -> fall back to snapshot on failure.
    - If refresh=False: Read cache if present -> Snapshot -> Live fallback.

    Args:
        tickers: Specific tickers to return. If None, returns all available.
        start: Optional start date (ISO string YYYY-MM-DD).
        end: Optional end date (ISO string YYYY-MM-DD).
        refresh: Force refreshing from live yfinance.

    Returns:
        PriceData: containing close prices DataFrame, source ("cache"|"snapshot"|"live"), and as_of date.
    """
    df: pd.DataFrame | None = None
    source: SourceType = "snapshot"

    if refresh:
        try:
            # Need constituent tickers for live refresh if none specified
            from qportfolio.data.universe import load_universe

            target_tickers = tickers if tickers else [a.ticker for a in load_universe()] + ["^NSEI"]
            df = _download_live(target_tickers, start=start or "2023-09-01", end=end or "2026-10-08")
            source = "live"
            # Cache the newly fetched data
            _CACHE_DIR.mkdir(parents=True, exist_ok=True)
            df.to_parquet(_CACHE_FILE, engine="pyarrow")
        except Exception as e:
            logger.warning("Live refresh failed (%s); falling back to snapshot", e)
            df = None

    if df is None:
        if not refresh and _CACHE_FILE.exists():
            df = pd.read_parquet(_CACHE_FILE)
            source = "cache"
        elif _SNAPSHOT_FILE.exists():
            df = pd.read_parquet(_SNAPSHOT_FILE)
            source = "snapshot"
        else:
            # Last resort: try live download
            from qportfolio.data.universe import load_universe

            target_tickers = tickers if tickers else [a.ticker for a in load_universe()] + ["^NSEI"]
            df = _download_live(target_tickers, start=start or "2023-09-01", end=end or "2026-10-08")
            source = "live"
            _CACHE_DIR.mkdir(parents=True, exist_ok=True)
            df.to_parquet(_CACHE_FILE, engine="pyarrow")

    # Ensure DatetimeIndex is tz-naive
    if not isinstance(df.index, pd.DatetimeIndex):
        df.index = pd.to_datetime(df.index)
    if df.index.tz is not None:
        df.index = df.index.tz_localize(None)

    # Filter columns
    if tickers is not None:
        cols_to_keep = [col for col in tickers if col in df.columns]
        # Include ^NSEI if it was requested or in columns
        if "^NSEI" in tickers and "^NSEI" in df.columns and "^NSEI" not in cols_to_keep:
            cols_to_keep.append("^NSEI")
        df = df[cols_to_keep]

    # Date range slicing
    if start is not None:
        df = df.loc[df.index >= pd.to_datetime(start)]
    if end is not None:
        df = df.loc[df.index <= pd.to_datetime(end)]

    if df.empty:
        raise ValueError(f"No price data available for specified tickers and dates ({start} to {end})")

    as_of = pd.to_datetime(df.index[-1]).strftime("%Y-%m-%d")

    return PriceData(close=df, source=source, as_of=as_of)
