from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.strategy.ema_strategy import generate_ema_signals
from backend.strategy.rsi_strategy import generate_rsi_signals
from backend.strategy.macd_strategy import generate_macd_signals
import asyncio

router = APIRouter()

@router.websocket("/ws")
async def websocket_backtest(websocket: WebSocket):
    await websocket.accept()
    try:
        message = await websocket.receive_json()
        strategy = message.get("strategy")
        data = message.get("data")

        if not data or not strategy:
            await websocket.send_json({"error": "Missing data or strategy"})
            await websocket.close()
            return

        if strategy == "ema":
            signals = generate_ema_signals(data)
        elif strategy == "rsi":
            signals = generate_rsi_signals(data)
        elif strategy == "macd":
            signals = generate_macd_signals(data)
        else:
            await websocket.send_json({"error": "Unsupported strategy"})
            await websocket.close()
            return

        trades = []
        position = None
        entry_price = 0
        current_equity = 0

        for i, row in enumerate(signals):
            await asyncio.sleep(0.01)

            if row["signal"] == 1 and position != "long":
                position = "long"
                entry_price = row["close"]
                trade = {"action": "buy", "timestamp": row["timestamp"], "price": row["close"]}
                trades.append(trade)
                await websocket.send_json({"progress": (i+1)/len(signals), "event": "buy", "trade": trade})

            elif row["signal"] == -1 and position == "long":
                position = None
                profit = row["close"] - entry_price
                current_equity += profit
                trade = {
                    "action": "sell",
                    "timestamp": row["timestamp"],
                    "price": row["close"],
                    "profit": profit
                }
                trades.append(trade)
                await websocket.send_json({"progress": (i+1)/len(signals), "event": "sell", "trade": trade})

        await websocket.send_json({
            "status": "completed",
            "result": {
                "total_profit": current_equity,
                "trades": trades
            }
        })
        await websocket.close()

    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({"error": str(e)})
        await websocket.close()
