from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from backend.strategy.ema_strategy import generate_ema_signals
from backend.strategy.rsi_strategy import generate_rsi_signals
from backend.strategy.macd_strategy import generate_macd_signals
from backend.strategy.custom_logic_engine import parse_and_execute_custom_logic
import numpy as np

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

    # New optional params
    sl = payload.get("sl")              # e.g. 0.02 (2%)
    tp = payload.get("tp")              # e.g. 0.05 (5%)
    fees = payload.get("fees", 0.0)     # default 0%
    slippage = payload.get("slippage", 0.0)  # default 0%

    if not data:
        raise HTTPException(status_code=400, detail="No OHLCV data provided.")

    if strategy == "ema":
        signals = generate_ema_signals(data)
    elif strategy == "rsi":
        signals = generate_rsi_signals(data)
    elif strategy == "macd":
        signals = generate_macd_signals(data)
    elif strategy == "custom":
        if not custom_logic:
            raise HTTPException(status_code=400, detail="Missing custom logic.")
        signals = parse_and_execute_custom_logic(data, custom_logic)
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
        # Chart indicator
        indicator_value = row.get("rsi") or row.get("ema_short") or row.get("macd")
        chart_data.append({
            "date": row["timestamp"],
            "price": row["close"],
            "indicator": indicator_value
        })

        # Entry logic
        if row["signal"] == 1 and position is None:
            position = "long"
            entry_price = row["close"] * (1 + slippage)  # Apply slippage on buy
            entry_index = idx
            trades.append({
                "action": "buy",
                "timestamp": row["timestamp"],
                "price": row["close"],
                "entry_price": entry_price,
                "entry_time": row["timestamp"]
            })

        # Exit logic
        elif position == "long":
            exit_raw_price = row["close"]
            exit_price = exit_raw_price * (1 - slippage)  # Apply slippage on sell

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

    # Metrics
    total_profit = sum(t.get("profit", 0) for t in trades if "profit" in t)
    total_trades = len([t for t in trades if t["action"] == "sell"])
    avg_profit = total_profit / total_trades if total_trades > 0 else 0
    win_rate = (len([t for t in trades if t.get("profit", 0) > 0]) / total_trades) * 100 if total_trades else 0
    average_holding_time = sum(t.get("holding_time", 0) for t in trades if "holding_time" in t) / total_trades if total_trades else 0

    # Drawdown
    max_drawdown = 0
    if equity_curve:
        peak = equity_curve[0]
        for val in equity_curve:
            if val > peak:
                peak = val
            drawdown = peak - val
            max_drawdown = max(max_drawdown, drawdown)

    # Advanced metrics
    returns_array = np.array(returns)
    if len(returns_array) > 1:
        sharpe_ratio = np.mean(returns_array) / np.std(returns_array)
        downside_returns = returns_array[returns_array < 0]
        sortino_ratio = np.mean(returns_array) / np.std(downside_returns) if len(downside_returns) > 0 else np.nan
        profit_factor = sum(r for r in returns_array if r > 0) / abs(sum(r for r in returns_array if r < 0)) if any(r < 0 for r in returns_array) else np.nan
    else:
        sharpe_ratio = sortino_ratio = profit_factor = np.nan

    # Consecutive win/loss tracking
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

    # Equity & drawdown curve
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

    result = {
        "trades": trades,
        "total_profit": total_profit,
        "num_trades": total_trades,
        "avg_trade_profit": avg_profit,
        "win_rate": win_rate,
        "max_drawdown": max_drawdown,
        "chart_data": chart_data,
        "equity_curve": equity_data,
        "drawdown_curve": drawdown_curve,
        "sharpe_ratio": sharpe_ratio,
        "sortino_ratio": sortino_ratio,
        "profit_factor": profit_factor,
        "average_holding_time": average_holding_time,
        "max_consecutive_wins": max_consecutive_wins,
        "max_consecutive_losses": max_consecutive_losses
    }

    return JSONResponse(content=clean_json(result))
