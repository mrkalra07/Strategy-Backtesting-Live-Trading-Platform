from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from backend.strategy.ema_strategy import generate_ema_signals
from backend.strategy.rsi_strategy import generate_rsi_signals
from backend.strategy.macd_strategy import generate_macd_signals
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

    if not data:
        raise HTTPException(status_code=400, detail="No OHLCV data provided.")
    if strategy == "ema":
        signals = generate_ema_signals(data)
    elif strategy == "rsi":
        signals = generate_rsi_signals(data)
    elif strategy == "macd":
        signals = generate_macd_signals(data)
    else:
        raise HTTPException(status_code=400, detail="Unsupported strategy.")



    trades = []
    position = None
    entry_price = 0
    chart_data = []
    equity_curve = []
    current_equity = 0

    for row in signals:
        indicator_value = None

        if "rsi" in row:
            indicator_value = row["rsi"]
        elif "ema_short" in row:
            indicator_value = row["ema_short"]
        elif "macd" in row and "signal_line" in row:
            indicator_value = {
            "macd": row["macd"],
            "signal_line": row["signal_line"]
        }

        chart_data.append({
        "date": row["timestamp"],
        "price": row["close"],
        "indicator": indicator_value
        })


        if row["signal"] == 1 and position != "long":
            position = "long"
            entry_price = row["close"]
            trades.append({"action": "buy", "timestamp": row["timestamp"], "price": row["close"]})

        elif row["signal"] == -1 and position == "long":
            position = None
            profit = row["close"] - entry_price
            current_equity += profit
            equity_curve.append(current_equity)
            trades.append({
                "action": "sell",
                "timestamp": row["timestamp"],
                "price": row["close"],
                "profit": profit
            })

    total_profit = sum(t.get("profit", 0) for t in trades if "profit" in t)
    total_trades = len([t for t in trades if t["action"] == "sell"])
    winning_trades = len([t for t in trades if t.get("profit", 0) > 0])
    avg_profit = total_profit / total_trades if total_trades > 0 else 0
    win_rate = (winning_trades / total_trades) * 100 if total_trades > 0 else 0
    max_drawdown = 0

    if equity_curve:
        peak = equity_curve[0]
        for value in equity_curve:
            if value > peak:
                peak = value
            drawdown = peak - value
            max_drawdown = max(max_drawdown, drawdown)
    equity_data = []
    for i in range(len(signals)):
        equity_data.append({
            "date": signals[i]["timestamp"],
            "equity": equity_curve[i] if i < len(equity_curve) else equity_curve[-1]  # Handle any mismatch
    })


    result = {
        "trades": trades,
        "total_profit": total_profit,
        "num_trades": total_trades,
        "avg_trade_profit": avg_profit,
        "win_rate": win_rate,
        "max_drawdown": max_drawdown,
        "chart_data": chart_data,
        "equity_curve": equity_data
    }

    return JSONResponse(content=clean_json(result))
