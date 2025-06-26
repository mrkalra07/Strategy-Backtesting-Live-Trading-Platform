# 🧪 Testing Coverage

This document outlines the testing strategy for the GoQuant platform, covering current unit test coverage, manual QA workflows, and future plans for automated end-to-end (E2E) testing and CI/CD integration.

---

## ✅ Current Backend Unit Tests

### 🧠 Strategy Engine
- **`evaluate_custom_logic()`**
  - Tested with single and multi-condition strategies
  - Covers EMA, RSI, MACD logic parsing
  - Handles unsupported operators (e.g., `XOR`, invalid syntax)
  - Edge cases: no trades, rapid oscillations, boundary breakouts (e.g., RSI = 30)

### 📊 Analytics Engine
- **`calculate_performance_metrics()`**
  - Validated on normal, single-trade, and flat/no-trade equity curves
  - Sharpe, Sortino, Max Drawdown tested with synthetic data

### 🧪 Trade Loop / Execution Logic
- Synthetic buy/sell signals tested for:
  - Market and limit orders
  - Fee and slippage handling
  - Stop Loss / Take Profit triggering

---

## ✅ Frontend Testing

### 🎯 Unit Tests (In Progress)
- **Strategy Builder**
  - Node creation, deletion, and connection logic
  - DSL string generation and export
- **Charts (Equity/Drawdown)**
  - Snapshot tests for rendering consistency

> ⚠️ Formal test suites are being developed. Core logic is also verified through manual runtime testing.

---

## 🧪 Manual QA Checklist

| Step                | Expected Behavior                                 |
|---------------------|--------------------------------------------------|
| ✅ Upload OHLCV CSV | File uploads, columns auto-detected               |
| ✅ Build Strategy   | Drag, connect, and configure nodes                |
| ✅ Export Strategy  | DSL string generated without error                |
| ✅ Run Backtest     | Backend returns valid trades and metrics          |
| ✅ View Analytics   | Equity/drawdown charts render correctly           |
| ✅ Live Trading     | OHLCV feed simulates price in real time           |
| ✅ Manual Trades    | Simulated trades placed via UI                    |
| ✅ SL/TP Hits       | Positions auto-closed by backend logic            |

---

## 🧪 Future Test Plans

### 🔄 Backend
- Expand `pytest` coverage to:
  - Data loading (multi-symbol, timestamp validation)
  - Risk management (SL/TP edge cases)
  - Portfolio-level metric aggregation

### 🧪 Frontend
- **E2E Tests (Planned)** using [Playwright](https://playwright.dev/) or [Cypress](https://www.cypress.io/):
  - Upload CSV → Build Strategy → Run → Visualize Results
  - Error scenarios (missing connections, invalid config)
  - Live Trading workflow

### 📦 CI/CD Integration
- Set up GitHub Actions (or similar) to run:
  - Backend tests (`pytest`) on every commit
  - Frontend tests (`npm test`) on pull requests

---

## 📌 Coverage Summary

| Layer      | Coverage                | Status      |
|------------|-------------------------|-------------|
| Backend    | Core logic + metrics    | ✅ In Place |
| Frontend   | Builder + Chart logic   | 🕒 WIP      |
| Manual QA  | Full workflow           | ✅ Done     |
| E2E Tests  | Playwright/Cypress plan | 🔜 Upcoming |

---

**Notes:**
- All critical backend logic is covered by unit tests and manual QA.
- Frontend logic is being migrated to formal test suites.
- E2E and CI/CD automation are prioritized for upcoming sprints.
