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
    data = payload.get("data")
    custom_logic = payload.get("logic")

    sl = payload.get("sl")
    tp = payload.get("tp")
    fees = payload.get("fees", 0.0)
    slippage = payload.get("slippage", 0.0)

    if not data:
        raise HTTPException(status_code=400, detail="No OHLCV data provided.")

    # Generate signals per strategy
    if strategy == "ema":
        signals = generate_ema_signals(data)
    elif strategy == "rsi":
        signals = generate_rsi_signals(data)
    elif strategy == "macd":
        signals = generate_macd_signals(data)
    elif strategy == "custom":
        try:
            df = evaluate_custom_logic(data, custom_logic)
            signals = df.to_dict(orient="records")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error in custom strategy: {str(e)}")
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

    # Prepare OHLCV DataFrame for metrics
    df = pd.DataFrame(data)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df.set_index("timestamp", inplace=True)

    # Calculate returns for VaR, Beta, etc
    asset_returns = df["close"].pct_change().dropna()

    # MOCK benchmark returns: Replace this with real benchmark OHLCV and returns
    benchmark_returns = asset_returns.copy()

    var_95 = np.percentile(asset_returns, 5)

    if len(asset_returns) > 1 and len(benchmark_returns) > 1:
        covariance = np.cov(asset_returns, benchmark_returns)[0, 1]
        benchmark_variance = np.var(benchmark_returns)
        beta = covariance / benchmark_variance if benchmark_variance != 0 else np.nan
    else:
        beta = np.nan

    # Max drawdown
    max_drawdown = 0
    if equity_curve:
        peak = equity_curve[0]
        for val in equity_curve:
            if val > peak:
                peak = val
            drawdown = peak - val
            max_drawdown = max(max_drawdown, drawdown)

    # Sharpe, Sortino, Profit factor
    returns_array = np.array(returns)
    if len(returns_array) > 1:
        sharpe_ratio = np.mean(returns_array) / np.std(returns_array)
        downside_returns = returns_array[returns_array < 0]
        sortino_ratio = np.mean(returns_array) / np.std(downside_returns) if len(downside_returns) > 0 else np.nan
        profit_factor = sum(r for r in returns_array if r > 0) / abs(sum(r for r in returns_array if r < 0)) if any(r < 0 for r in returns_array) else np.nan
    else:
        sharpe_ratio = sortino_ratio = profit_factor = np.nan

    # Max consecutive wins/losses
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

    # Equity and drawdown points
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

    # ✅ Turnover and Leverage
    entry_prices_sum = sum(t["entry_price"] for t in trades if t["action"] == "buy")
    num_entries = len([t for t in trades if t["action"] == "buy"])
    avg_capital_deployed = entry_prices_sum / num_entries if num_entries else 1

    turnover = entry_prices_sum / avg_capital_deployed if avg_capital_deployed else 0

    gross_exposure = sum(
        t["entry_price"] for t in trades if t["action"] == "buy"
    ) + sum(
        t.get("exit_price", 0) for t in trades if t["action"] == "sell"
    )

    net_equity = sum(t.get("profit", 0) for t in trades if "profit" in t)
    leverage = gross_exposure / net_equity if net_equity != 0 else 0

    result = {
        "trades": trades,
        "chart_data": chart_data,
        "equity_curve": equity_data,
        "drawdown_curve": drawdown_curve,
        "total_profit": net_equity,
        "num_trades": len([t for t in trades if t["action"] == "sell"]),
        "avg_trade_profit": np.mean([t.get("profit", 0) for t in trades if "profit" in t]) if trades else 0,
        "win_rate": (len([t for t in trades if t.get("profit", 0) > 0]) / len([t for t in trades if t["action"] == "sell"])) * 100 if trades else 0,
        "max_drawdown": max_drawdown,
        "sharpe_ratio": sharpe_ratio,
        "sortino_ratio": sortino_ratio,
        "profit_factor": profit_factor,
        "max_consecutive_wins": max_consecutive_wins,
        "max_consecutive_losses": max_consecutive_losses,
        "var_95": var_95,
        "beta": beta,
        "calmar_over_time": rolling_calmar,
        "turnover": turnover,
        "leverage": leverage,
    }

    return JSONResponse(content=clean_json(result))
