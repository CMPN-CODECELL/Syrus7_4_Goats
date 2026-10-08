"""Universe loader for NIFTY 50 constituents.

Reads the official 50 NIFTY 50 constituents from backend/data/nifty50.csv.
"""
from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Asset:
    """An asset in the NIFTY 50 universe."""

    ticker: str  # yfinance ticker, e.g. "TCS.NS"
    symbol: str  # NSE symbol, e.g. "TCS"
    name: str  # Company name, e.g. "Tata Consultancy Services Ltd."
    sector: str  # Official NSE sector, e.g. "Information Technology"


# Resolve CSV path relative to this file
_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
_CSV_PATH = _DATA_DIR / "nifty50.csv"


def load_universe(csv_path: Path | str | None = None) -> list[Asset]:
    """Load the 50 NIFTY 50 constituents from nifty50.csv.

    Returns:
        list[Asset]: 50 Asset items with official sectors.
    """
    path = Path(csv_path) if csv_path else _CSV_PATH
    if not path.exists():
        raise FileNotFoundError(f"Universe CSV not found at {path}")

    assets: list[Asset] = []
    with open(path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ticker = row["yf_ticker"].strip()
            symbol = row["symbol"].strip()
            name = row["name"].strip()
            sector = row["sector"].strip()
            if not sector:
                raise ValueError(f"Asset {ticker} has empty sector")
            assets.append(Asset(ticker=ticker, symbol=symbol, name=name, sector=sector))

    if len(assets) != 50:
        raise ValueError(f"Expected 50 assets in NIFTY 50 universe, found {len(assets)}")

    return assets
