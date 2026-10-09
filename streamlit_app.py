"""Quantum Portfolio Optimiser - Streamlit Web Application
Team 4 GOATS | PS-03 Portfolio Optimisation using Quantum Computing | Qiskit Fall Fest 2026

Deployable to Streamlit Community Cloud (share.streamlit.io) and runnable locally.
"""
from __future__ import annotations

import json
import os
import sys
from dataclasses import asdict
from pathlib import Path
from typing import Any

# Ensure backend directory is in sys.path
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Import core business logic and contracts
from qportfolio.contracts import (
    QaoaSettings,
    RunRequest,
    RunResult,
    SolverId,
)
from qportfolio.data import RF, build_market, load_universe
from qportfolio.pipeline import run as run_pipeline

# Configure Streamlit page
st.set_page_config(
    page_title="Quantum Portfolio Optimiser | QAOA vs Classical",
    page_icon="⚛️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom High-Tech Styling
st.markdown(
    """
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Inter', sans-serif;
    }
    
    .stApp {
        background: radial-gradient(circle at 15% 15%, #0d1527 0%, #060911 100%);
        color: #F3F4F6;
    }
    
    /* Header Gradient & Badges */
    .hero-title {
        background: linear-gradient(135deg, #A78BFA 0%, #60A5FA 50%, #34D399 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-size: 2.3rem;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-bottom: 0.2rem;
    }
    
    .hero-subtitle {
        color: #94A3B8;
        font-size: 1.05rem;
        margin-bottom: 1rem;
    }
    
    .badge-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-bottom: 1.2rem;
    }
    
    .tech-badge {
        background: rgba(30, 41, 59, 0.7);
        border: 1px solid rgba(148, 163, 184, 0.2);
        color: #CBD5E1;
        padding: 0.25rem 0.65rem;
        border-radius: 9999px;
        font-size: 0.78rem;
        font-weight: 500;
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
    }
    
    .tech-badge.purple { border-color: #8B5CF6; color: #DDD6FE; background: rgba(139, 92, 246, 0.15); }
    .tech-badge.cyan { border-color: #06B6D4; color: #CFFAFE; background: rgba(6, 182, 212, 0.15); }
    .tech-badge.emerald { border-color: #10B981; color: #D1FAE5; background: rgba(16, 185, 129, 0.15); }
    
    /* Metric Cards */
    .metric-card {
        background: rgba(19, 27, 46, 0.8);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.1rem;
        margin-bottom: 0.8rem;
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    
    .metric-card:hover {
        border-color: rgba(139, 92, 246, 0.4);
        transform: translateY(-2px);
    }
    
    .metric-label {
        color: #94A3B8;
        font-size: 0.82rem;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.3rem;
    }
    
    .metric-value {
        font-size: 1.55rem;
        font-weight: 700;
        color: #F8FAFC;
    }
    
    .metric-sub {
        font-size: 0.8rem;
        color: #64748B;
        margin-top: 0.2rem;
    }
    
    /* Solver tags */
    .solver-tag {
        font-weight: 600;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        font-size: 0.82rem;
    }
    .solver-qaoa { background: #4C1D95; color: #DDD6FE; }
    .solver-bf { background: #064E3B; color: #A7F3D0; }
    .solver-sa { background: #78350F; color: #FDE68A; }
    .solver-cvx { background: #164E63; color: #A5F3FC; }
    
    /* Code font */
    code, pre {
        font-family: 'JetBrains Mono', monospace !important;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data
def get_cached_universe():
    """Load the full 50-stock NIFTY 50 universe."""
    try:
        return load_universe()
    except Exception as e:
        st.error(f"Failed to load universe: {e}")
        return []


@st.cache_data
def get_precomputed_demo() -> RunResult:
    """Load precomputed demo results for instantaneous viewing."""
    demo_path = ROOT_DIR / "contracts" / "api-examples" / "job_done.json"
    with open(demo_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return RunResult.model_validate(data)


@st.cache_data
def load_all_studies() -> dict[str, dict]:
    """Load empirical precomputed research studies."""
    studies_dir = BACKEND_DIR / "data" / "studies"
    studies = {}
    if studies_dir.exists():
        for p in sorted(studies_dir.glob("*.json")):
            with open(p, "r", encoding="utf-8") as f:
                studies[p.stem] = json.load(f)
    return studies


def render_header():
    """Renders high-tech header banner with metadata badges."""
    st.markdown('<div class="hero-title">⚛️ Quantum Portfolio Optimiser</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="hero-subtitle">Rigorous QAOA on Qiskit 2.5 vs Classical Baselines (Brute Force, CVXPY Relaxation, Simulated Annealing) on NIFTY 50</div>',
        unsafe_allow_html=True,
    )

    st.markdown(
        """
        <div class="badge-container">
            <span class="tech-badge purple">⚡ Qiskit 2.5 Primitives</span>
            <span class="tech-badge cyan">📈 NIFTY 50 (2023–2026)</span>
            <span class="tech-badge emerald">⚖️ Real QUBO Constraints & Costs</span>
            <span class="tech-badge">🛡️ Zero Cheating / Honest Verdict</span>
            <span class="tech-badge">🏆 PS-03 Fall Fest 2026</span>
        </div>
        """,
        unsafe_allow_html=True,
    )


def solver_name_display(solver_id: str) -> str:
    mapping = {
        "brute_force": "Exact Brute Force",
        "relaxation": "CVXPY Relaxation + Rounding",
        "annealing": "Simulated Annealing",
        "qaoa_standard": "QAOA (Standard Mixer)",
        "qaoa_xy": "QAOA (XY Ring + Dicke)",
    }
    return mapping.get(solver_id, solver_id.replace("_", " ").title())


def solver_color(solver_id: str) -> str:
    if "qaoa" in solver_id:
        return "#A855F7"  # purple
    if "brute" in solver_id:
        return "#10B981"  # emerald
    if "anneal" in solver_id:
        return "#F59E0B"  # amber
    if "relax" in solver_id:
        return "#06B6D4"  # cyan
    return "#94A3B8"


def main():
    universe_assets = get_cached_universe()
    all_tickers = [a.ticker for a in universe_assets]
    ticker_to_name = {a.ticker: a.name for a in universe_assets}
    ticker_to_sector = {a.ticker: a.sector for a in universe_assets}

    # Sidebar: Control Panel
    st.sidebar.image("https://upload.wikimedia.org/wikipedia/commons/5/51/Qiskit-Logo.svg", width=60)
    st.sidebar.title("Configuration")

    exec_mode = st.sidebar.radio(
        "Execution Mode",
        options=["⚡ Live Quantum Solver", "🚀 Precomputed Demo (Instant)"],
        index=1,
        help="Run the complete live QAOA circuit and solvers or load pre-calculated results instantly.",
    )

    st.sidebar.markdown("---")
    st.sidebar.subheader("🎯 Portfolio Rules")

    k_val = st.sidebar.slider("Number of Assets (K)", min_value=2, max_value=8, value=5, step=1,
                              help="Cardinality constraint: portfolio must hold exactly K stocks.")

    q_val = st.sidebar.slider("Risk Aversion (q)", min_value=0.0, max_value=1.0, value=0.5, step=0.05,
                              help="q=0 focuses purely on return; q=1 focuses purely on variance minimization.")

    sector_cap = st.sidebar.slider("Max Stocks per Sector", min_value=1, max_value=4, value=2,
                                   help="Sector diversification cap.")

    enable_target_return = st.sidebar.checkbox("Enforce Target Return", value=False)
    target_return_val = None
    if enable_target_return:
        target_return_val = st.sidebar.number_input("Annual Target Return (e.g. 0.15 = 15%)", min_value=0.0, max_value=1.0, value=0.15, step=0.01)

    capital_val = st.sidebar.number_input("Capital (INR ₹)", min_value=50000.0, max_value=100000000.0, value=1000000.0, step=50000.0)

    st.sidebar.markdown("---")
    st.sidebar.subheader("⚛️ QAOA Settings")

    qaoa_reps = st.sidebar.slider("QAOA Depth (p layers)", min_value=1, max_value=4, value=2,
                                  help="Number of alternating cost and mixer layers.")

    qaoa_mixer = st.sidebar.selectbox("Mixer Variant", options=["standard", "xy"], index=0,
                                      help="standard: Pauli-X mixer with penalty terms. xy: XX+YY ring mixer with Dicke state.")

    qaoa_opt = st.sidebar.selectbox("Classical Optimizer", options=["COBYLA", "SPSA", "NELDER_MEAD"], index=0)

    qaoa_init = st.sidebar.selectbox("Parameter Initialization", options=["ramp", "random", "interp"], index=0,
                                     help="ramp: linear ramp; interp: warm start from depth p-1 parameters.")

    qaoa_shots = st.sidebar.select_slider("Measurement Shots", options=[1024, 2048, 4096, 8192], value=4096)

    qaoa_noise = st.sidebar.checkbox("Simulate QPU Noise (FakeGuadalupeV2)", value=False,
                                     help="Evaluates noisy circuit simulation using Aer NoiseModel.")

    qubit_cap = st.sidebar.slider("Qubit Cap (Pre-screening budget)", min_value=8, max_value=14, value=12,
                                  help="Limits candidate universe via pre-screening to keep statevector computation fast.")

    st.sidebar.markdown("---")
    with st.sidebar.expander("Constituent Ticker Selection"):
        selected_tickers = st.multiselect(
            "Select Tickers (Leave empty for full NIFTY 50)",
            options=all_tickers,
            default=[],
            format_func=lambda t: f"{t} ({ticker_to_sector.get(t, '')})",
        )
        if not selected_tickers:
            selected_tickers = None

    # Run button
    run_btn = st.sidebar.button("🚀 Solve Portfolio", type="primary", use_container_width=True)

    render_header()

    # Session state for results
    if "result" not in st.session_state:
        st.session_state.result = get_precomputed_demo()
        st.session_state.is_demo = True

    if run_btn:
        if exec_mode == "🚀 Precomputed Demo (Instant)":
            st.session_state.result = get_precomputed_demo()
            st.session_state.is_demo = True
            st.success("Loaded precomputed demonstration result instantly!")
        else:
            req = RunRequest(
                tickers=selected_tickers,
                k=k_val,
                risk_aversion=q_val,
                sector_cap=sector_cap,
                target_return=target_return_val,
                capital=capital_val,
                qubit_cap=qubit_cap,
                qaoa=QaoaSettings(
                    variant=qaoa_mixer,
                    reps=qaoa_reps,
                    optimizer=qaoa_opt,
                    init=qaoa_init,
                    shots=qaoa_shots,
                    maxiter=60,
                    noise=qaoa_noise,
                    seed=7,
                ),
            )

            progress_bar = st.progress(0.0)
            status_text = st.empty()

            def progress_callback(fraction: float, stage: str, point: dict | None = None):
                progress_bar.progress(min(max(fraction, 0.0), 1.0))
                status_text.markdown(f"**Stage:** `{stage}` ({int(fraction * 100)}%)")

            with st.spinner("Executing Quantum Portfolio Optimization Pipeline..."):
                try:
                    res = run_pipeline(req, on_progress=progress_callback)
                    st.session_state.result = res
                    st.session_state.is_demo = False
                    status_text.empty()
                    progress_bar.empty()
                    st.success("Optimization pipeline finished successfully!")
                except Exception as e:
                    st.error(f"Pipeline error: {str(e)}")

    res: RunResult = st.session_state.result

    # Data Banner
    if res.data:
        banner_cols = st.columns([2, 2, 2, 2])
        with banner_cols[0]:
            st.caption(f"**Source:** {res.data.source.title()} snapshot (as of {res.data.as_of})")
        with banner_cols[1]:
            st.caption(f"**Est. Window:** {res.data.est_window[0]} to {res.data.est_window[1]}")
        with banner_cols[2]:
            st.caption(f"**Test Window:** {res.data.test_window[0]} to {res.data.test_window[1]}")
        with banner_cols[3]:
            excluded_names = list(res.data.excluded.keys()) if res.data.excluded else ["None"]
            st.caption(f"**Excluded:** {', '.join(excluded_names)}")

    # Main Tabs
    tabs = st.tabs([
        "📊 Overview & Comparison",
        "📈 Efficient Frontier",
        "💼 Share Allocation",
        "⚛️ Quantum Diagnostics",
        "🎯 Out-of-Sample Backtest",
        "🔬 Empirical Studies",
        "📜 Methodology & Honesty",
    ])

    # TAB 1: Overview & Comparison
    with tabs[0]:
        st.subheader("Optimization Results & Verdict")

        # Verdict card
        rec_name = solver_name_display(res.recommended)
        st.info(f"🏆 **Recommended Solution:** **{rec_name}** | {res.verdict}")

        # Metrics Row
        rec_solver = next((s for s in res.solvers if s.solver == res.recommended), res.solvers[0])
        nifty = res.benchmarks.get("nifty50")

        m_cols = st.columns(5)
        with m_cols[0]:
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">Recommended Solver</div>
                    <div class="metric-value" style="font-size: 1.15rem; color: #A78BFA;">{rec_name}</div>
                    <div class="metric-sub">Feasible: {'✅ Yes' if rec_solver.feasible else '❌ No'}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with m_cols[1]:
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">Best Objective F(x)</div>
                    <div class="metric-value">{rec_solver.objective:.5f}</div>
                    <div class="metric-sub">QUBO energy minimum</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with m_cols[2]:
            ret_val = f"{rec_solver.oos.ret * 100:.2f}%" if rec_solver.oos else "N/A"
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">Test Window Return</div>
                    <div class="metric-value" style="color: #34D399;">{ret_val}</div>
                    <div class="metric-sub">Out-of-sample annualised</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with m_cols[3]:
            sharpe_val = f"{rec_solver.oos.sharpe:.2f}" if rec_solver.oos else "N/A"
            bench_sharpe = f"{nifty.sharpe:.2f}" if nifty else "N/A"
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">Sharpe Ratio</div>
                    <div class="metric-value">{sharpe_val}</div>
                    <div class="metric-sub">vs NIFTY 50: {bench_sharpe}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )
        with m_cols[4]:
            q_time = f"{res.qaoa.time_seconds:.1f}s" if res.qaoa else "N/A"
            st.markdown(
                f"""
                <div class="metric-card">
                    <div class="metric-label">Qubit Budget</div>
                    <div class="metric-value" style="color: #60A5FA;">{res.qubo.n_vars} Qubits</div>
                    <div class="metric-sub">QAOA Time: {q_time}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

        # Solver Comparison Table
        st.markdown("### Side-by-Side Solver Comparison")
        solver_records = []
        for s in res.solvers:
            picks_str = ", ".join(s.selection) if s.selection else "None"
            oos_ret = f"{s.oos.ret * 100:.2f}%" if s.oos else "N/A"
            oos_vol = f"{s.oos.vol * 100:.2f}%" if s.oos else "N/A"
            oos_sharpe = f"{s.oos.sharpe:.2f}" if s.oos else "N/A"
            solver_records.append({
                "Solver": solver_name_display(s.solver),
                "Feasible": "✅ Feasible" if s.feasible else "❌ Infeasible",
                "Objective F(x)": round(s.objective, 5),
                "Selected Stocks": picks_str,
                "Test Net Return": oos_ret,
                "Test Volatility": oos_vol,
                "Test Sharpe": oos_sharpe,
                "Runtime (s)": round(s.time_seconds, 3),
            })
        df_solvers = pd.DataFrame(solver_records)
        st.dataframe(df_solvers, use_container_width=True, hide_index=True)

        # Pre-screening summary
        if res.screen.applied:
            with st.expander("🔍 Pre-screening Breakdown (Universe Filter)"):
                st.write(f"**Pre-screening Rule:** `{res.screen.rule}`")
                c1, c2 = st.columns(2)
                with c1:
                    st.write(f"**Kept Assets ({len(res.screen.kept)}):** {', '.join(res.screen.kept)}")
                with c2:
                    st.write(f"**Dropped Assets ({len(res.screen.dropped)}):** {', '.join(res.screen.dropped)}")
                st.caption(
                    f"Asset qubits: {res.screen.qubits.assets} | Slack qubits: {res.screen.qubits.slack} | Total: {res.screen.qubits.total}"
                )

    # TAB 2: Efficient Frontier
    with tabs[1]:
        st.subheader("Efficient Frontier & Solver Selections")
        st.write(
            "Feasible portfolio combinations evaluated over the exact problem landscape. Lower risk (x-axis) and higher return (y-axis) are preferred."
        )

        frontier_points = res.frontier.points if res.frontier else []
        if frontier_points:
            f_vol = [p.vol * 100 for p in frontier_points]
            f_ret = [p.ret * 100 for p in frontier_points]
            f_obj = [p.objective for p in frontier_points]
            f_tickers = [", ".join(p.selection) for p in frontier_points]

            fig_ef = go.Figure()

            # Scatter feasible landscape
            fig_ef.add_trace(
                go.Scatter(
                    x=f_vol,
                    y=f_ret,
                    mode="markers",
                    marker=dict(
                        size=7,
                        color=f_obj,
                        colorscale="Viridis",
                        showscale=True,
                        colorbar=dict(title="Objective F(x)"),
                        opacity=0.6,
                    ),
                    text=[f"Tickers: {t}<br>Obj: {o:.4f}" for t, o in zip(f_tickers, f_obj)],
                    name="Feasible Portfolios",
                    hoverinfo="text+x+y",
                )
            )

            # Add markers for each solver
            for s in res.solvers:
                if s.selection and s.feasible:
                    matching = next((p for p in frontier_points if tuple(sorted(p.selection)) == tuple(sorted(s.selection))), None)
                    if matching:
                        color = solver_color(s.solver)
                        symbol = "star" if "qaoa" in s.solver else "diamond"
                        fig_ef.add_trace(
                            go.Scatter(
                                x=[matching.vol * 100],
                                y=[matching.ret * 100],
                                mode="markers+text",
                                marker=dict(size=14, color=color, symbol=symbol, line=dict(color="#FFFFFF", width=1.5)),
                                text=[solver_name_display(s.solver)],
                                textposition="top center",
                                name=solver_name_display(s.solver),
                            )
                        )

            fig_ef.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(19, 27, 46, 0.6)",
                xaxis=dict(title="Annualised Volatility (%)", gridcolor="rgba(255,255,255,0.08)"),
                yaxis=dict(title="Annualised Net Return (%)", gridcolor="rgba(255,255,255,0.08)"),
                legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
                margin=dict(l=40, r=40, t=50, b=40),
                height=520,
            )
            st.plotly_chart(fig_ef, use_container_width=True)
        else:
            st.info("No frontier points available.")

    # TAB 3: Share Allocation
    with tabs[2]:
        st.subheader(f"Portfolio Holdings & Capital Allocation ({rec_name})")
        if rec_solver.portfolio:
            port = rec_solver.portfolio
            st.markdown(
                f"**Total Capital:** ₹{rec_solver.portfolio.capital_allocated + rec_solver.portfolio.cash_remaining:,.2f} | "
                f"**Allocated:** ₹{port.capital_allocated:,.2f} | **Cash Reserve:** ₹{port.cash_remaining:,.2f} | "
                f"**Est. Transaction Costs:** ₹{port.transaction_cost:,.2f}"
            )

            holdings_rows = []
            for h in port.holdings:
                sec = ticker_to_sector.get(h.ticker, "Unknown")
                c_name = ticker_to_name.get(h.ticker, h.ticker)
                holdings_rows.append({
                    "Ticker": h.ticker,
                    "Company": c_name,
                    "Sector": sec,
                    "Target Weight (%)": round(h.weight * 100, 2),
                    "Shares to Buy": h.shares,
                    "Price (₹)": round(h.price, 2),
                    "Capital (₹)": round(h.value, 2),
                })
            df_port = pd.DataFrame(holdings_rows)

            col_table, col_pie = st.columns([3, 2])
            with col_table:
                st.dataframe(df_port, use_container_width=True, hide_index=True)

            with col_pie:
                fig_pie = px.pie(
                    df_port,
                    values="Capital (₹)",
                    names="Sector",
                    title="Sector Allocation",
                    color_discrete_sequence=px.colors.sequential.Purp,
                    hole=0.45,
                )
                fig_pie.update_layout(
                    template="plotly_dark",
                    paper_bgcolor="rgba(0,0,0,0)",
                    margin=dict(l=20, r=20, t=40, b=20),
                    height=360,
                )
                st.plotly_chart(fig_pie, use_container_width=True)

    # TAB 4: Quantum Diagnostics
    with tabs[3]:
        st.subheader("QAOA Circuit & Measurement Diagnostics")

        qaoa_block = res.qaoa
        diag_cols = st.columns(4)
        with diag_cols[0]:
            st.metric("Approximation Ratio (r)", f"{qaoa_block.metrics.approx_ratio:.4f}")
        with diag_cols[1]:
            st.metric("Feasible Probability", f"{qaoa_block.metrics.feasible_prob * 100:.2f}%")
        with diag_cols[2]:
            st.metric("Optimal Probability", f"{qaoa_block.metrics.optimal_prob * 100:.2f}%")
        with diag_cols[3]:
            st.metric("Circuit Depth (p)", f"{res.request.qaoa.reps}")

        c_conv, c_hist = st.columns([1, 1])

        with c_conv:
            st.markdown("#### QAOA Energy Convergence")
            if qaoa_block.convergence:
                steps = [pt.iteration for pt in qaoa_block.convergence]
                energies = [pt.energy for pt in qaoa_block.convergence]
                fig_conv = go.Figure()
                fig_conv.add_trace(
                    go.Scatter(
                        x=steps,
                        y=energies,
                        mode="lines+markers",
                        line=dict(color="#A855F7", width=2.5),
                        marker=dict(size=4),
                        name="Expectation Value ⟨H⟩",
                    )
                )
                fig_conv.update_layout(
                    template="plotly_dark",
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(19, 27, 46, 0.6)",
                    xaxis=dict(title="Optimizer Iteration", gridcolor="rgba(255,255,255,0.08)"),
                    yaxis=dict(title="Energy Expectation ⟨H⟩", gridcolor="rgba(255,255,255,0.08)"),
                    margin=dict(l=30, r=30, t=30, b=30),
                    height=380,
                )
                st.plotly_chart(fig_conv, use_container_width=True)
            else:
                st.caption("No convergence trace available.")

        with c_hist:
            st.markdown("#### Sampled Bitstring Distribution")
            if qaoa_block.samples:
                # Top 12 bitstrings
                top_samples = qaoa_block.samples[:12]
                bitstrings = [s.bitstring for s in top_samples]
                probs = [s.prob * 100 for s in top_samples]
                colors = ["#10B981" if s.optimal else ("#8B5CF6" if s.feasible else "#64748B") for s in top_samples]

                fig_hist = go.Figure(
                    go.Bar(
                        x=bitstrings,
                        y=probs,
                        marker_color=colors,
                        text=[f"{p:.1f}%" for p in probs],
                        textposition="auto",
                    )
                )
                fig_hist.update_layout(
                    template="plotly_dark",
                    paper_bgcolor="rgba(0,0,0,0)",
                    plot_bgcolor="rgba(19, 27, 46, 0.6)",
                    xaxis=dict(title="Bitstring (Asset Qubits)", tickangle=-45, gridcolor="rgba(255,255,255,0.08)"),
                    yaxis=dict(title="Measurement Probability (%)", gridcolor="rgba(255,255,255,0.08)"),
                    margin=dict(l=30, r=30, t=30, b=30),
                    height=380,
                )
                st.plotly_chart(fig_hist, use_container_width=True)
                st.caption("🟢 Green: Optimal | 🟣 Violet: Feasible | ⚪ Gray: Infeasible penalty violated")

    # TAB 5: Out-of-Sample Backtest
    with tabs[4]:
        st.subheader("Out-of-Sample Performance vs NIFTY 50")
        st.write(
            f"Evaluated strictly on the unseen test window (`{res.data.test_window[0]}` to `{res.data.test_window[1]}`). No future data is used in estimation."
        )

        oos_data = []
        for s in res.solvers:
            if s.oos:
                oos_data.append({
                    "Strategy": solver_name_display(s.solver),
                    "Return (%)": round(s.oos.ret * 100, 2),
                    "Volatility (%)": round(s.oos.vol * 100, 2),
                    "Sharpe Ratio": round(s.oos.sharpe, 2),
                    "Max Drawdown (%)": round(s.oos.drawdown * 100, 2),
                })
        if nifty:
            oos_data.append({
                "Strategy": "NIFTY 50 Benchmark",
                "Return (%)": round(nifty.ret * 100, 2),
                "Volatility (%)": round(nifty.vol * 100, 2),
                "Sharpe Ratio": round(nifty.sharpe, 2),
                "Max Drawdown (%)": round(nifty.drawdown * 100, 2),
            })

        df_oos = pd.DataFrame(oos_data)
        st.dataframe(df_oos, use_container_width=True, hide_index=True)

        fig_oos = px.bar(
            df_oos,
            x="Strategy",
            y=["Return (%)", "Sharpe Ratio"],
            barmode="group",
            title="Out-of-Sample Metric Comparison",
            color_discrete_sequence=["#34D399", "#8B5CF6"],
        )
        fig_oos.update_layout(
            template="plotly_dark",
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(19, 27, 46, 0.6)",
            margin=dict(l=30, r=30, t=40, b=30),
            height=380,
        )
        st.plotly_chart(fig_oos, use_container_width=True)

    # TAB 6: Empirical Studies
    with tabs[5]:
        st.subheader("Precomputed Empirical Studies")
        st.write(
            "Rigorous systematic experiments conducted across random NIFTY 50 instances comparing depth, mixers, optimizers, and noise models."
        )

        all_studies = load_all_studies()
        if all_studies:
            study_key = st.selectbox(
                "Select Research Study",
                options=list(all_studies.keys()),
                format_func=lambda k: f"{all_studies[k].get('title', k)} ({k}.json)",
            )
            study = all_studies[study_key]

            st.markdown(f"**Description:** {study.get('description', '')}")

            fig_study = go.Figure()
            for series in study.get("series", []):
                pts = series.get("points", [])
                xs = [p.get("x") for p in pts]
                ys = [p.get("y") for p in pts]
                yerrs = [p.get("yerr") for p in pts]

                fig_study.add_trace(
                    go.Scatter(
                        x=xs,
                        y=ys,
                        error_y=dict(type="data", array=yerrs, visible=True),
                        mode="lines+markers",
                        name=series.get("label", "Series"),
                    )
                )

            fig_study.update_layout(
                template="plotly_dark",
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(19, 27, 46, 0.6)",
                xaxis=dict(title=study.get("x_label", "X"), gridcolor="rgba(255,255,255,0.08)"),
                yaxis=dict(title=study.get("y_label", "Y"), gridcolor="rgba(255,255,255,0.08)"),
                margin=dict(l=40, r=40, t=30, b=30),
                height=450,
            )
            st.plotly_chart(fig_study, use_container_width=True)

            with st.expander("Study Hardware & Instance Configuration"):
                st.json(study.get("instance", {}))

    # TAB 7: Methodology & Honesty Rules
    with tabs[6]:
        st.subheader("Quantum Formulation & Honesty Disclosures")

        st.markdown(
            """
            ### QUBO Formulation
            The Markowitz mean-variance portfolio problem with cardinality $K$ is mapped to a quadratic unconstrained binary optimization (QUBO) problem:

            $$F(x) = q \\frac{x^T \\Sigma x}{K^2} - (1-q)\\left(\\frac{\\mu^T x}{K} - \\text{tc}(x)\\right)$$

            - **Cardinality constraint:** Exactly $K$ assets are selected via the quadratic penalty $A (\\sum_i x_i - K)^2$.
            - **Sector cap constraint:** $\\sum_{i \\in \\text{sector}} x_i \\le \\text{cap}$, enforced with slack bits.
            - **Penalty Weights:** Systematically tuned following Brandhofer et al. (Eq. 11), ensuring the smallest weight where the best infeasible state is penalized above the feasible domain.
            
            ### Strict Scientific Honesty Rules (PS-03 Fall Fest)
            1. **No False Quantum Advantage:** Current NISQ QAOA circuits do not claim quantum speedup over classical solvers on NIFTY 50 data. Both neutral and negative results are presented transparently.
            2. **No Post-Hoc Classical Cheating:** No classical solutions are injected into the quantum circuits as warm starts (except declared INTERP depth $p-1$ parameter interpolation).
            3. **Exact Feasibility Checking:** `Problem.evaluate` is the sole judge of feasibility. Infeasible bitstrings are not heuristically repaired.
            4. **Data Isolation:** Future test window data is strictly isolated and used solely for out-of-sample backtesting.
            """
        )


if __name__ == "__main__":
    main()
