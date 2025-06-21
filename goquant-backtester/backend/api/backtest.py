# backend/api/backtest.py

from fastapi import APIRouter, HTTPException, Request
from backend.strategy.ema_strategy import generate_ema_signals

router = APIRouter()

@router.post("/backtest")
async def run_backtest(request: Request):
    payload = await request.json()
    data = payload.get("data")

    if not data:
        raise HTTPException(status_code=400, detail="No OHLCV data provided.")

    signals = generate_ema_signals(data)

    trades = []
    position = None
    entry_price = 0
    chart_data = []

    for row in signals:
        chart_data.append({
            "date": row["timestamp"],
            "price": row["close"],
            "ema_short": row["ema_short"],
            "ema_long": row["ema_long"]
        })

        if row["signal"] == 1 and position != "long":
            position = "long"
            entry_price = row["close"]
            trades.append({"action": "buy", "timestamp": row["timestamp"], "price": row["close"]})

        elif row["signal"] == -1 and position == "long":
            position = None
            profit = row["close"] - entry_price
            trades.append({"action": "sell", "timestamp": row["timestamp"], "price": row["close"], "profit": profit})

    total_profit = sum(t.get("profit", 0) for t in trades if "profit" in t)

    return {
        "trades": trades,
        "total_profit": total_profit,
        "num_trades": len([t for t in trades if t["action"] == "sell"]),
        "chart_data": chart_data
    }
