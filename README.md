# GoQuant: Full-Stack Backtesting and Strategy Builder Platform

GoQuant is an advanced backtesting engine with a drag-and-drop visual strategy builder and real-time analytics dashboard. Designed for flexibility and extensibility, it supports technical indicators, custom logic, multi-asset strategies, and risk management.

## 🌟 Features

- 📉 Strategy backtesting with OHLCV data
- 🧩 Visual Strategy Builder with EMA, RSI, MACD
- ⚙️ Execution controls: Market/Limit, Slippage, Fees
- 🧮 Rich performance metrics: Sharpe, Sortino, Calmar, VaR, Beta
- 📊 Visual dashboards: Equity, Drawdown, Heatmaps

---

## 🔧 Setup Instructions

### Backend (FastAPI + Python)
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.main:app --reload



### Frontend (React + TypeScript)
cd frontend
npm install
npm start
