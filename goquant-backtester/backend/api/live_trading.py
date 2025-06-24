from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio
import datetime
import random

router = APIRouter()

connected_clients: List[WebSocket] = []
active_trades = []
live_price = 25000.0  # Shared state

def update_live_price():
    global live_price
    live_price += random.uniform(-50, 50)
    return round(live_price, 2)

def generate_mock_ohlcv():
    base = live_price
    open_price = base + random.uniform(-10, 10)
    high_price = open_price + random.uniform(0, 20)
    low_price = open_price - random.uniform(0, 20)
    close_price = low_price + random.uniform(0, high_price - low_price)
    volume = random.uniform(5, 20)
    return {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "open": round(open_price, 2),
        "high": round(high_price, 2),
        "low": round(low_price, 2),
        "close": round(close_price, 2),
        "volume": round(volume, 2)
    }

@router.websocket("/ws/live-trading")
async def live_trading_socket(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            current_price = update_live_price()
            response = await handle_trade_command(message, current_price)
            await websocket.send_text(json.dumps(response))
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

async def handle_trade_command(command: dict, price: float):
    trade_id = f"TRADE-{len(active_trades) + 1}"
    timestamp = datetime.datetime.now().isoformat()

    trade = {
        "id": trade_id,
        "symbol": command.get("symbol"),
        "side": command.get("side"),
        "type": command.get("type"),
        "quantity": command.get("quantity"),
        "sl": command.get("sl"),
        "tp": command.get("tp"),
        "price_executed": price,
        "timestamp": timestamp,
        "status": "executed"
    }

    active_trades.append(trade)
    return {"status": "success", "message": "Order executed", "trade": trade}

@router.websocket("/ws/ohlcv")
async def websocket_ohlcv(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            update_live_price()
            candle = generate_mock_ohlcv()
            await websocket.send_json(candle)
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        print("Client disconnected from OHLCV feed")
