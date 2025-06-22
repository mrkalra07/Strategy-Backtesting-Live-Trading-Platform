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

    if not data:
        raise HTTPException(status_code=400, detail="No OHLCV data provided.")

    # Generate signals
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

    # Backtest logic
    trades = []
    equity_curve = []
    returns = []
    position = None
    entry_price = 0
    entry_index = 0
    current_equity = 0
    chart_data = []

    for idx, row in enumerate(signals):
        chart_data.append({
            "date": row["timestamp"],
            "price": row["close"],
            "indicator": row.get("rsi") or row.get("ema_short") or row.get("macd")
        })

        if row["signal"] == 1 and position is None:
            position = "long"
            entry_price = row["close"]
            entry_index = idx
            trades.append({"action": "buy", "timestamp": row["timestamp"], "price": row["close"]})

        elif row["signal"] == -1 and position == "long":
            position = None
            exit_price = row["close"]
            holding_time = idx - entry_index
            profit = exit_price - entry_price
            ret = (exit_price - entry_price) / entry_price
            returns.append(ret)
            current_equity += profit
            equity_curve.append(current_equity)
            trades.append({
                "action": "sell",
                "timestamp": row["timestamp"],
                "price": exit_price,
                "profit": profit,
                "return": ret,
                "holding_time": holding_time
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

    # Advanced Metrics
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

    equity_data = []
    cumulative_equity = 0
    for trade in trades:
        if "profit" in trade:
            cumulative_equity += trade["profit"]
        equity_data.append({
            "date": trade["timestamp"],
            "equity": cumulative_equity
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
        "sharpe_ratio": sharpe_ratio,
        "sortino_ratio": sortino_ratio,
        "profit_factor": profit_factor,
        "average_holding_time": average_holding_time,
        "max_consecutive_wins": max_consecutive_wins,
        "max_consecutive_losses": max_consecutive_losses
    }

    return JSONResponse(content=clean_json(result))
