from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from backend.strategy.ema_strategy import generate_ema_signals
from backend.strategy.rsi_strategy import generate_rsi_signals
from backend.strategy.macd_strategy import generate_macd_signals
from backend.strategy.custom_logic import evaluate_custom_logic
import numpy as np
import pandas as pd

router = APIRouter()

def clean_json(obj):
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json(i) for i in obj]
    elif isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj

@router.post("/backtest")
async def run_backtest(request: Request):
    payload = await request.json()
    strategy = payload.get("strategy")
    data = payload.get("data")  # Now expected as {symbol: [ohlcv_rows, ...], ...}
    custom_logic = payload.get("logic")
    sl = payload.get("sl")
    tp = payload.get("tp")
    fees = payload.get("fees", 0.0)
    slippage = payload.get("slippage", 0.0)

    if not data or not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="No OHLCV data provided or data is not a dict.")

    per_symbol_results = {}
    all_trades = []
    all_equity_curves = {}
    all_chart_data = {}
    all_returns = {}
    all_holding_times = {}
    all_drawdown_curves = {}

    # Per-symbol backtest
    for symbol, symbol_data in data.items():
        if not symbol_data:
            continue
        # Generate signals per strategy
        if strategy == "ema":
            signals = generate_ema_signals(symbol_data)
        elif strategy == "rsi":
            signals = generate_rsi_signals(symbol_data)
        elif strategy == "macd":
            signals = generate_macd_signals(symbol_data)
        elif strategy == "custom":
            try:
                df = evaluate_custom_logic(symbol_data, custom_logic)
                signals = df.to_dict(orient="records")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error in custom strategy for {symbol}: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="Unsupported strategy.")

        trades = []
        equity_curve = []
        returns = []
        position = None
        entry_price = 0
        entry_index = 0
        current_equity = 0
        chart_data = []
        holding_times = []

        for idx, row in enumerate(signals):
            indicator_value = row.get("rsi") or row.get("ema_short") or row.get("macd")
            chart_data.append({
                "date": row["timestamp"],
                "price": row["close"],
                "indicator": indicator_value
            })

            if row["signal"] == 1 and position is None:
                position = "long"
                entry_price = row["close"] * (1 + slippage)
                entry_index = idx
                trades.append({
                    "action": "buy",
                    "timestamp": row["timestamp"],
                    "price": row["close"],
                    "entry_price": entry_price,
                    "entry_time": row["timestamp"]
                })

            elif position == "long":
                exit_raw_price = row["close"]
                exit_price = exit_raw_price * (1 - slippage)
                hit_sl = sl and exit_price <= entry_price * (1 - sl)
                hit_tp = tp and exit_price >= entry_price * (1 + tp)
                is_exit_signal = row["signal"] == -1
                should_exit = is_exit_signal or hit_sl or hit_tp

                if should_exit:
                    position = None
                    holding_time = idx - entry_index
                    holding_times.append(holding_time)
                    gross_profit = exit_price - entry_price
                    fee_cost = (entry_price + exit_price) * fees
                    net_profit = gross_profit - fee_cost
                    ret = net_profit / entry_price
                    returns.append(ret)
                    current_equity += net_profit
                    equity_curve.append(current_equity)
                    trades.append({
                        "action": "sell",
                        "timestamp": row["timestamp"],
                        "price": exit_raw_price,
                        "exit_price": exit_price,
                        "entry_price": entry_price,
                        "entry_time": signals[entry_index]["timestamp"],
                        "exit_time": row["timestamp"],
                        "profit": net_profit,
                        "return": ret,
                        "holding_time": holding_time,
                        "sl_hit": hit_sl,
                        "tp_hit": hit_tp,
                        "signal_exit": is_exit_signal,
                        "fee": fee_cost
                    })

        # Prepare OHLCV DataFrame
        df = pd.DataFrame(symbol_data)
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df.set_index("timestamp", inplace=True)

        asset_returns = df["close"].pct_change().dropna()
        benchmark_returns = asset_returns.copy()
        var_95 = np.percentile(asset_returns, 5)

        if len(asset_returns) > 1 and len(benchmark_returns) > 1:
            covariance = np.cov(asset_returns, benchmark_returns)[0, 1]
            benchmark_variance = np.var(benchmark_returns)
            beta = covariance / benchmark_variance if benchmark_variance != 0 else np.nan
        else:
            beta = np.nan

        # Max Drawdown
        max_drawdown = 0
        if equity_curve:
            peak = equity_curve[0]
            for val in equity_curve:
                if val > peak:
                    peak = val
                drawdown = peak - val
                max_drawdown = max(max_drawdown, drawdown)

        # Sharpe, Sortino, Profit Factor
        returns_array = np.array(returns)
        if len(returns_array) > 1:
            sharpe_ratio = np.mean(returns_array) / np.std(returns_array)
            downside_returns = returns_array[returns_array < 0]
            sortino_ratio = np.mean(returns_array) / np.std(downside_returns) if len(downside_returns) > 0 else np.nan
            profit_factor = sum(r for r in returns_array if r > 0) / abs(sum(r for r in returns_array if r < 0)) if any(r < 0 for r in returns_array) else np.nan
        else:
            sharpe_ratio = sortino_ratio = profit_factor = np.nan

        # Calmar Ratio (final)
        calmar_ratio = (equity_curve[-1] / max_drawdown) if max_drawdown else None

        # Max Consecutive Wins/Losses
        max_consecutive_wins = max_consecutive_losses = 0
        current_win = current_loss = 0
        for t in trades:
            if "profit" in t:
                if t["profit"] > 0:
                    current_win += 1
                    current_loss = 0
                else:
                    current_loss += 1
                    current_win = 0
                max_consecutive_wins = max(max_consecutive_wins, current_win)
                max_consecutive_losses = max(max_consecutive_losses, current_loss)

        # Equity and Drawdown Curves
        equity_data = []
        drawdown_curve = []
        cumulative_equity = 0
        peak_equity = 0
        for trade in trades:
            if "profit" in trade:
                cumulative_equity += trade["profit"]
            peak_equity = max(peak_equity, cumulative_equity)
            drawdown = peak_equity - cumulative_equity
            equity_data.append({
                "date": trade["timestamp"],
                "equity": cumulative_equity
            })
            drawdown_curve.append({
                "date": trade["timestamp"],
                "drawdown": drawdown
            })

        # Rolling Calmar
        rolling_calmar = []
        window = 20
        equity_vals = [point['equity'] for point in equity_data]
        for i in range(window, len(equity_vals)):
            window_slice = equity_vals[i - window:i]
            ret = window_slice[-1] - window_slice[0]
            max_dd = max(window_slice) - min(window_slice)
            calmar_val = (ret / max_dd) if max_dd > 0 else 0
            rolling_calmar.append({
                "date": equity_data[i]["date"],
                "calmar": calmar_val
            })

        # Turnover & Leverage
        entry_prices_sum = sum(t["entry_price"] for t in trades if t["action"] == "buy")
        num_entries = len([t for t in trades if t["action"] == "buy"])
        avg_capital_deployed = entry_prices_sum / num_entries if num_entries else 1
        turnover = entry_prices_sum / avg_capital_deployed if avg_capital_deployed else 0
        gross_exposure = entry_prices_sum + sum(t.get("exit_price", 0) for t in trades if t["action"] == "sell")
        net_equity = sum(t.get("profit", 0) for t in trades if "profit" in t)
        leverage = gross_exposure / net_equity if net_equity != 0 else 0

        per_symbol_results[symbol] = {
            "trades": trades,
            "chart_data": chart_data,
            "equity_curve": equity_data,
            "drawdown_curve": drawdown_curve,
            "total_profit": net_equity,
            "num_trades": len([t for t in trades if t["action"] == "sell"]),
            "avg_trade_profit": np.mean([t.get("profit", 0) for t in trades if "profit" in t]) if trades else 0,
            "average_holding_time": np.mean(holding_times) if holding_times else 0,
            "win_rate": (len([t for t in trades if t.get("profit", 0) > 0]) / len([t for t in trades if t["action"] == "sell"])) * 100 if trades else 0,
            "max_drawdown": max_drawdown,
            "sharpe_ratio": sharpe_ratio,
            "sortino_ratio": sortino_ratio,
            "profit_factor": profit_factor,
            "calmar_ratio": calmar_ratio,
            "max_consecutive_wins": max_consecutive_wins,
            "max_consecutive_losses": max_consecutive_losses,
            "var_95": var_95,
            "beta": beta,
            "calmar_over_time": rolling_calmar,
            "turnover": turnover,
            "leverage": leverage,
        }
        all_trades.extend([dict(t, symbol=symbol) for t in trades])
        all_equity_curves[symbol] = equity_data
        all_chart_data[symbol] = chart_data
        all_returns[symbol] = returns
        all_holding_times[symbol] = holding_times
        all_drawdown_curves[symbol] = drawdown_curve

    # --- Portfolio-level aggregation ---
    # Combine all trades chronologically
    all_trades_sorted = sorted(all_trades, key=lambda t: t["timestamp"])

    # Build a combined equity curve by summing per-symbol equity at each unique timestamp
    all_timestamps = sorted(set(ts for eq in all_equity_curves.values() for ts in [e["date"] for e in eq]))
    portfolio_equity_curve = []
    symbol_equity_dict = {symbol: {e["date"]: e["equity"] for e in eq} for symbol, eq in all_equity_curves.items()}
    for ts in all_timestamps:
        total_equity = sum(symbol_equity_dict[s].get(ts, 0) for s in symbol_equity_dict)
        portfolio_equity_curve.append({"date": ts, "equity": total_equity})

    # Portfolio returns
    portfolio_equity_vals = [e["equity"] for e in portfolio_equity_curve]
    portfolio_returns = np.diff(portfolio_equity_vals) / portfolio_equity_vals[:-1] if len(portfolio_equity_vals) > 1 else np.array([])

    # Portfolio metrics
    if len(portfolio_returns) > 1:
        portfolio_sharpe = np.mean(portfolio_returns) / np.std(portfolio_returns)
        downside_returns = portfolio_returns[portfolio_returns < 0]
        portfolio_sortino = np.mean(portfolio_returns) / np.std(downside_returns) if len(downside_returns) > 0 else np.nan
        portfolio_profit_factor = sum(r for r in portfolio_returns if r > 0) / abs(sum(r for r in portfolio_returns if r < 0)) if any(r < 0 for r in portfolio_returns) else np.nan
    else:
        portfolio_sharpe = portfolio_sortino = portfolio_profit_factor = np.nan

    # Portfolio max drawdown
    max_drawdown = 0
    if portfolio_equity_vals:
        peak = portfolio_equity_vals[0]
        for val in portfolio_equity_vals:
            if val > peak:
                peak = val
            drawdown = peak - val
            max_drawdown = max(max_drawdown, drawdown)
    portfolio_calmar = (portfolio_equity_vals[-1] / max_drawdown) if max_drawdown else None

    # Portfolio-level result (add all expected metrics)
    def safe_mean(values):
        arr = [v for v in values if v is not None]
        return float(np.mean(arr)) if arr else None
    def safe_sum(values):
        arr = [v for v in values if v is not None]
        return float(np.sum(arr)) if arr else None
    def safe_max(values):
        arr = [v for v in values if v is not None]
        return float(np.max(arr)) if arr else None

    # Gather per-symbol metrics for aggregation
    per_metrics = list(per_symbol_results.values())
    portfolio_result = {
        "trades": all_trades_sorted,
        "chart_data": [item for sublist in all_chart_data.values() for item in sublist],
        "equity_curve": portfolio_equity_curve,
        "drawdown_curve": [item for sublist in all_drawdown_curves.values() for item in sublist],
        "total_profit": safe_sum([m.get("total_profit") for m in per_metrics]),
        "num_trades": safe_sum([m.get("num_trades") for m in per_metrics]),
        "avg_trade_profit": safe_mean([m.get("avg_trade_profit") for m in per_metrics]),
        "average_holding_time": safe_mean([m.get("average_holding_time") for m in per_metrics]),
        "win_rate": safe_mean([m.get("win_rate") for m in per_metrics]),
        "max_drawdown": safe_max([m.get("max_drawdown") for m in per_metrics]),
        "sharpe_ratio": portfolio_sharpe,
        "sortino_ratio": portfolio_sortino,
        "profit_factor": portfolio_profit_factor,
        "calmar_ratio": portfolio_calmar,
        "max_consecutive_wins": safe_max([m.get("max_consecutive_wins") for m in per_metrics]),
        "max_consecutive_losses": safe_max([m.get("max_consecutive_losses") for m in per_metrics]),
        "var_95": safe_mean([m.get("var_95") for m in per_metrics]),
        "beta": safe_mean([m.get("beta") for m in per_metrics]),
        "calmar_over_time": [],
        "turnover": safe_mean([m.get("turnover") for m in per_metrics]),
        "leverage": safe_mean([m.get("leverage") for m in per_metrics]),
    }

    result = {
        "per_symbol": per_symbol_results,
        "portfolio": portfolio_result
    }

    # If only one symbol, copy all per-symbol fields to portfolio for consistency
    if len(per_symbol_results) == 1:
        only_symbol = next(iter(per_symbol_results))
        result["portfolio"] = per_symbol_results[only_symbol].copy()

    return JSONResponse(content=clean_json(result))
