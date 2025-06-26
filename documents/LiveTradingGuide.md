# 📡 Live Trading Guide – GoQuant

This document explains how the **Live Trading Module** works in GoQuant and how you can interact with it effectively.

---

## ⚙️ 1. Overview

The Live Trading module simulates real-time market conditions using a mock OHLCV feed, allowing users to test their strategies or execute manual trades as if in a live environment.

> ✅ Currently simulation only. Future versions will support real broker integration (Binance, Alpaca, etc.).

---

## 🔄 2. Simulated Live Data Feed

- A backend WebSocket simulates candle-by-candle updates.
- You receive new OHLCV data every few seconds (adjustable).
- The frontend live chart updates in real-time (Lightweight Charts).

---

## 📈 3. Candlestick Chart

- Powered by `lightweight-charts`.
- Displays live candles for the selected asset.
- Auto-scrolls as new data arrives.
- Shows real-time price movement.

---

## 🛠 4. Manual Trading

Buttons in the UI allow you to:

- **Buy Market** – open long position at current price.
- **Sell Market** – close existing long or open a short.
- **Close All** – exit all positions immediately.

> ⚠️ These are mock trades; no real money involved.

---

## 🧠 5. Auto-Trading from Strategy

- If a strategy is active during simulation, buy/sell signals are automatically executed.
- Strategy logic runs on every candle update.
- Trades respect your defined SL/TP and execution config.

---

## 🛡️ 6. Risk Management Features

- **Stop Loss / Take Profit** (%-based)
  - Automatically closes positions based on configured thresholds.
  - Backend monitors SL/TP levels during live feed.

- **Fees and Slippage**
  - Set in execution node; affects live PnL calculations.

---

## 📊 7. Live Position Monitoring

- Shows current open position (if any)
  - Entry Price
  - Quantity
  - Unrealized PnL
- Trade log displayed in real time
  - Entry/Exit time
  - Side (Buy/Sell)
  - PnL

---

## 🚀 8. Planned Enhancements

- Broker API support (Binance, Alpaca)
- Multiple symbol feeds
- SL/TP visual markers on chart
- Partial close support
- Advanced order types (trailing SL, OCO)

---

## 🧪 Testing Live Mode

Manual Testing Checklist:

1. Run backend + frontend.
2. Click **Live Trading**.
3. Confirm candles stream on chart.
4. Use **Buy** and **Sell** buttons.
5. Enable auto-strategy trading.
6. Validate SL/TP triggers and trade logs.

---

💡 **Pro Tip**: You can keep both strategy builder and live trading open in separate tabs to quickly iterate between building and testing.

