# 🚀  Full-Stack Strategy Backtesting & Live Trading Platform

A professional-grade backtesting and live trading platform with a **visual strategy builder** and full **analytics dashboard**. Designed for quantitative strategy development, it supports **technical indicators**, **portfolio logic**, **multi-symbol data**, and **real-time trade simulation**.

---

## 🧠 Key Features

### 🔧 Visual Strategy Builder

* Drag-and-drop **node-based** interface
* Node types include:

  * 📈 **Indicators**: EMA, RSI, MACD
  * 🔀 **Logic Operators**: AND, OR, NOT, >, <, >=, <=
  * ⚙️ **Execution Settings**: Market/Limit Orders, Quantity, % Portfolio
  * 🛡️ **Risk Controls**: Stop Loss, Take Profit, Fees, Slippage
  * 🧩 **Advanced**: Multi-asset logic, condition chaining
* Strategy graph serializes to a custom **DSL logic string**
* Real-time **validation & debugging**

---

### 📁 Flexible Data Handling

* Upload multiple **OHLCV CSV** files (per symbol)
* Automatic column normalization: `timestamp`, `open`, `high`, `low`, `close`, `volume`
* Multi-symbol, multi-exchange architecture
* Supports **custom user datasets**

---

### 🧪 Backtesting Engine (FastAPI + Python)

* Indicator computation using `ta` library and custom MACD logic
* Strategy DSL parsed into signal logic:

  ```
  IF EMA_14 > EMA_50 AND RSI < 30 THEN BUY  
  IF EMA_14 < EMA_50 OR MACD < 0 THEN SELL
  ```
* Risk and execution controls (fees, slippage, SL/TP)
* Multi-symbol portfolio support
* Complete **trade loop** and **equity curve generation**

---

### 📊 Analytics Dashboard

Live-updated **backtest results** with key metrics:

* ✅ Total PnL (%, \$)
* ✅ Sharpe, Sortino, Calmar ratios
* ✅ Max Drawdown (% / \$)
* ✅ CAGR, Volatility
* ✅ Trade Count, Win Rate
* ✅ Largest Win/Loss, Avg Trade Duration
* ✅ Value at Risk (VaR), Beta, Turnover

**Visualizations:**

* 📈 Equity Curve
* 📉 Drawdown Chart
* 🔥 Risk Heatmap
* 🧪 Calmar Over Time
* ⚠️ Trade Entry/Exit Markers

---

### 📡 Live Trading Simulation

* Simulated live OHLCV feed (WebSocket)
* Manual Trade Buttons: Buy / Sell
* Auto-trade logic based on real-time signals
* Real-time PnL, SL/TP auto-close logic
* Live open positions and trade logs
* Future integration ready for broker API (e.g., Binance, Alpaca)

---

### 🧱 Tech Stack

| Layer       | Tech                                         |
| ----------- | -------------------------------------------- |
| Frontend    | React, TypeScript, React Flow, Recharts      |
| Backend     | FastAPI, Python, Pandas, `ta` indicators     |
| Data Format | CSV (OHLCV), Multi-file upload               |
| Charts      | Recharts, Lightweight Charts (for live view) |
| Real-time   | WebSocket API (backend), PnL updates         |

---

## ⚙️ Setup Instructions

### 📦 Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 💻 Frontend (React)

```bash
cd frontend
npm install
npm start
```

* Open: [http://localhost:3000](http://localhost:3000)
* Backend should run at: [http://localhost:8000](http://localhost:8000)

---

## 🧪 How to Use

### 1. Upload OHLCV CSVs

* Upload one or more CSVs
* Each file must contain: `timestamp`, `open`, `high`, `low`, `close`, `volume`

### 2. Build Strategy

* Use drag-and-drop builder to define indicators, logic, and execution settings

### 3. Run Backtest

* Click "Export & Run Strategy" to backtest on all uploaded symbols

### 4. View Results

* Equity curve, drawdown, and performance stats displayed

### 5. Live Trading Mode

* Click “Live Trading”
* View live candlestick chart
* Manually place trades or enable auto-trading logic
* SL/TP monitored server-side

---
