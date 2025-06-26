# 🚀 Future Improvements

This document outlines planned enhancements and potential features for future development of the GoQuant platform.

---

## 🔗 1. Real Broker API Integration

- Support for connecting to live broker APIs.
- Enables true live trading (not just simulation).
- Will require secure key management and order throttling logic.

---

## 🧬 2. Strategy Optimization Engine

- Grid search and/or genetic algorithms to auto-optimize strategy parameters:
- EMA/RSI period tuning
- Execution logic testing across datasets
- Results displayed as heatmaps or leaderboards.

---

## 📊 3. Portfolio Rebalancing Logic

- Define rebalance frequency (daily/weekly/monthly).
- Target weight allocations (e.g., 50% BTC, 30% ETH, 20% LINK).
- Implement rebalance triggers based on drift thresholds.

---

## 🔁 4. Arbitrage & Multi-Exchange Logic

- Detect price inefficiencies across exchanges.
- Real-time signal generation for spread trades.
- Support for:
  - Cross-exchange arbitrage
  - Triangular arbitrage (future)
  - Synthetic pairs (e.g., ETH/BTC via ETH/USDT and BTC/USDT)

---

## 📡 5. WebSocket Performance Optimization

- Batching updates for equity, PnL, open positions.
- Optional throttling of real-time data (to reduce UI lag).
- Use of delta snapshots instead of full updates.

---

## 🎨 6. UI/UX Enhancements

- Multi-pane layout (Builder | Chart | Metrics).
- Real-time node validation (highlight invalid links or logic).
- Improved connection UX between nodes (drag helper overlays).
- Keyboard shortcuts and undo/redo stack.

---

## 🧪 7. Automated End-to-End Testing (Planned)

- Playwright or Cypress for full UI test coverage.
- Auto-run full workflow:
  - Upload → Build → Backtest → Visualize → Trade
- Snapshots and performance assertions.

---

