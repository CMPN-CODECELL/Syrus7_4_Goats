# 🚀 Deploying to Streamlit Community Cloud

This project is fully configured for **1-click deployment on Streamlit Community Cloud** ([share.streamlit.io](https://share.streamlit.io)) and local execution.

---

## 🌐 Deploy to Streamlit Cloud (Free & Easy)

Streamlit Community Cloud hosts Streamlit apps for free directly from your GitHub repository.

### Step 1: Push your code to GitHub
Make sure your latest changes (including `streamlit_app.py`, `app.py`, `requirements.txt`, and `.streamlit/config.toml`) are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Add Streamlit application and deployment configuration"
git push origin main
```

### Step 2: Open Streamlit Community Cloud
1. Sign in to **[share.streamlit.io](https://share.streamlit.io)** (or [streamlit.io/cloud](https://streamlit.io/cloud)) using your GitHub account.
2. Click the **"New app"** button.

### Step 3: Configure Deployment
Fill in the deployment form:
- **Repository**: `your-username/Quantum-Portfolio`
- **Branch**: `main` (or whichever branch you pushed to)
- **Main file path**: `streamlit_app.py` *(or `app.py`)*
- **App URL** (optional): Choose a custom subdomain if desired.

### Step 4: Click "Deploy!"
Streamlit Cloud will automatically:
1. Detect `requirements.txt` at the root of the repository.
2. Install Qiskit, Qiskit Aer, CVXPY, Plotly, Pandas, and dependencies.
3. Apply the dark theme from `.streamlit/config.toml`.
4. Launch your app live on the web at your public URL!

---

## 💻 Running Streamlit Locally

You can test and run the Streamlit app on your local machine:

### Using Python / Streamlit CLI:
```bash
streamlit run streamlit_app.py
```

### Using `uv` (recommended):
From the project root:
```powershell
uv run streamlit run streamlit_app.py
```
Or from the backend virtual environment:
```powershell
backend\.venv\Scripts\streamlit.exe run streamlit_app.py
```

The app will open automatically in your browser at `http://localhost:8501`.

---

## ⚙️ Configuration Files Added

| File | Purpose |
|---|---|
| [`streamlit_app.py`](streamlit_app.py) | Full-featured interactive Quantum Portfolio Optimiser application with Plotly visualizations, live solver execution, and precomputed demo modes. |
| [`app.py`](app.py) | Entrypoint alias pointing directly to `streamlit_app.py` for standard Streamlit Cloud auto-detection. |
| [`requirements.txt`](requirements.txt) | Root requirements file containing all dependencies needed for Streamlit Community Cloud. |
| [`.streamlit/config.toml`](.streamlit/config.toml) | Dark mode theme (Violet / Slate) matching the quantum design system. |

---

## ⚛️ Features in the Streamlit App

1. **Dual Execution Modes**:
   - **🚀 Precomputed Demo (Instant)**: Instantaneous loading of complete multi-solver results, perfect for quick cloud demonstrations without waiting for quantum sampling.
   - **⚡ Live Quantum Solver**: Full live execution of QAOA on Qiskit 2.5 with live progress updates, brute force, simulated annealing, and CVXPY relaxation.
2. **Interactive Efficient Frontier**: Plotly scatter plot showing the feasible portfolio cloud and exact solver positions.
3. **Share & Capital Allocation**: Complete table and pie charts showing recommended stock picks, share counts, capital allocation, and transaction costs.
4. **Quantum Diagnostics**: Live energy convergence plot, sampled bitstrings histogram, and qubit budget breakdown.
5. **Out-of-Sample Backtesting**: Unseen test window performance metrics compared against the NIFTY 50 index benchmark.
6. **Empirical Studies Explorer**: Interactive viewer for research studies (Depth $p$, Classical Optimizers, Parameter Initialization, Aer Noise Simulation).
7. **Scientific Honesty & Methodology**: Transparent explanations of the QUBO Hamiltonian, Brandhofer penalty tuning, and strict compliance with "No false quantum advantage" rules.
