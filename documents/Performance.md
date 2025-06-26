# 📈 Performance Considerations

This document outlines the performance design focusing on backend efficiency, frontend responsiveness, and system scalability for large datasets and multi-symbol strategies.

---

## ⚙️ Backend Speed Optimizations

### ✅ Vectorized Indicator Computation
- All indicators (EMA, RSI, MACD) are computed using **pandas** and **ta** libraries with full vectorization.
- No Python `for` loops or row-wise operations are used for indicator calculations.

```python
df['EMA_14'] = EMAIndicator(close=df['close'], window=14).ema_indicator()
```

- Signal evaluation uses `pandas.eval()` with `engine="python"` to allow complex logic safely and quickly.

### ✅ Precomputation of Required Indicators
- Only the indicators referenced in the strategy logic (DSL) are computed.
- For example, if `EMA_14` is used but not `EMA_100`, only `EMA_14` is calculated.

### ✅ Efficient Trade Loop
- Trade logic operates on numpy-backed DataFrames for fast vectorized operations.
- The execution loop reuses previously computed equity and position states to avoid redundant calculations.

---

## 🖥️ Frontend Rendering Performance

### ✅ Chart Optimization
- All charts use **Recharts** (and optionally Lightweight Charts for live candlesticks), which efficiently handle large time series via:
  - SVG virtualization
  - Memoized datasets
  - Limited rendering on zoom

### ✅ Data Downsampling (Planned)
- For very large datasets (e.g., 10k+ rows), data can be downsampled for rendering performance without losing shape (e.g., OHLC aggregates).
- Not implemented yet, but the UI is designed to accept downsampled data in the future.

### ✅ React Performance Practices
- Charts and dashboards use `React.memo` and `useCallback` to prevent unnecessary re-renders.
- Real-time updates (e.g., equity, live PnL) are throttled or debounced for smooth UI.

---

## 📡 WebSocket-Based Real-Time Updates

### ✅ WebSockets for Live Trading (Planned)
- Simulated OHLCV price feeds will use FastAPI WebSocket endpoints.
- This reduces HTTP overhead compared to polling and ensures low-latency trade execution and SL/TP monitoring in real-time.

```python
@app.websocket("/ws/live-feed")
async def websocket_endpoint(websocket: WebSocket):
    ...
```

### ✅ Future WebSocket Expansions
Planned support for:
- Real-time metric updates during backtest
- Strategy builder validation feedback
- Multi-user updates for collaborative strategy development

---

## 🧠 Multi-Symbol Strategy Efficiency

### ✅ Multi-Symbol Handling
- Each uploaded CSV is stored separately per symbol.
- Backend processes each symbol independently (thread-safe logic).
- Portfolio-level analytics are aggregated after per-symbol evaluations.
- This reduces blocking computations and isolates slow symbols.

### ✅ Lazy Loading (Planned)
- The strategy builder may load data per-symbol only on interaction (lazy loading).
- Enables scaling to 10+ assets with minimal memory use.

---

## 🧠 Caching & Parallelism (Planned)
- Caching previously computed indicators (not yet implemented).
- Parallel processing using `concurrent.futures` or `asyncio` (not yet implemented).
- Multi-core batch backtesting across symbols (planned).

---

## ✅ Summary

| Layer        | Optimization                        | Status   |
|--------------|-------------------------------------|----------|
| Backend      | Vectorized TA, Eval DSL Parser      | ✅ Done  |
| Frontend     | Memoized Charts, Lightweight UI     | ✅ Done  |
| WebSocket    | Real-time OHLCV Feed                | 🕒 Planned |
| Multi-Symbol | Isolated Backtests & Aggregates     | ✅ Done  |
| Caching      | Precomputed indicators              | 🕒 Planned |
| Parallelism  | Multi-thread symbol loop            | 🕒 Planned |
