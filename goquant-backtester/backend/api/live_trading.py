from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio
import datetime
import random

router = APIRouter()

# Initial prices for multiple symbols
live_prices: Dict[str, float] = {
    "BTC-USDT": 25000.0,
    "ETH-USDT": 1700.0,
    "AAPL": 180.0,
}

# Store active trades by symbol
active_trades: Dict[str, List[dict]] = {
    symbol: [] for symbol in live_prices
}

def update_live_price(symbol: str) -> float:
    change = random.uniform(-15, 15)
    live_prices[symbol] += change
    return round(live_prices[symbol], 2)

def generate_mock_ohlcv(symbol: str) -> dict:
    base = live_prices[symbol]
    open_price = base + random.uniform(-10, 10)
    high_price = open_price + random.uniform(0, 20)
    low_price = open_price - random.uniform(0, 20)
    close_price = low_price + random.uniform(0, high_price - low_price)
    volume = random.uniform(5, 20)
    return {
        "symbol": symbol,
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
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            symbol = message.get("symbol", "BTC-USDT")
            current_price = update_live_price(symbol)

            trade = await handle_trade_command(symbol, message, current_price)
            await websocket.send_text(json.dumps({"status": "success", "trade": trade}))
    except WebSocketDisconnect:
        print("Client disconnected from trade endpoint")

@router.websocket("/ws/ohlcv")
async def websocket_ohlcv(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            for symbol in live_prices:
                update_live_price(symbol)
                candle = generate_mock_ohlcv(symbol)
                await websocket.send_text(json.dumps(candle))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Client disconnected from OHLCV feed")

@router.websocket("/ws/positions")
async def websocket_positions(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            open_positions = []
            for symbol, trades in active_trades.items():
                for trade in trades:
                    if trade["status"] == "executed":
                        current_price = live_prices[symbol]
                        entry_price = trade["price_executed"]
                        quantity = trade["quantity"]
                        side = trade["side"]
                        pnl = (current_price - entry_price) * quantity if side == "buy" else (entry_price - current_price) * quantity

                        open_positions.append({
                            **trade,
                            "current_price": round(current_price, 2),
                            "unrealized_pnl": round(pnl, 2)
                        })

            await websocket.send_text(json.dumps(open_positions))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Client disconnected from positions feed")

async def handle_trade_command(symbol: str, command: dict, price: float) -> dict:
    trade_id = f"TRADE-{len(active_trades[symbol]) + 1}"
    timestamp = datetime.datetime.utcnow().isoformat()

    trade = {
        "id": trade_id,
        "symbol": symbol,
        "side": command.get("side"),
        "type": command.get("type"),
        "quantity": command.get("quantity"),
        "sl": command.get("sl"),
        "tp": command.get("tp"),
        "price_executed": price,
        "timestamp": timestamp,
        "status": "executed"
    }

    active_trades[symbol].append(trade)
    return trade
