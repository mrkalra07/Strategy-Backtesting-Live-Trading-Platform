from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json
import asyncio
import datetime
import random
from fastapi.responses import JSONResponse

router = APIRouter()

# Initial mock prices
live_prices: Dict[str, float] = {
    "BTC-USDT": 25000.0,
    "ETH-USDT": 1700.0,
    "AAPL": 180.0,
}

# Active trades per symbol
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


@router.get("/live/open-positions")
def get_open_positions():
    open_positions = []
    for symbol, trades in active_trades.items():
        print(f"\n🔍 Checking symbol: {symbol}")  # ✅ Add this

        current_price = live_prices[symbol]
        for trade in trades:
            print("🔁 Trade being evaluated:", trade)  # ✅ Add this

            if trade["status"] == "open":
                entry = trade["price_executed"]
                qty = trade["quantity"]
                side = trade["side"]

                # ✅ Calculate live PnL
                pnl = (current_price - entry) * qty if side == "buy" else (entry - current_price) * qty

                # ✅ Append PnL and current price to each trade
                trade_with_pnl = trade.copy()
                trade_with_pnl["pnl"] = round(pnl, 2)
                trade_with_pnl["current_price"] = round(current_price, 2)

                open_positions.append(trade_with_pnl)

    print("✅ Final open positions returned:", open_positions)  # ✅ Add this

    return JSONResponse(content=open_positions)

@router.get("/live/price/{symbol}")
def get_current_price(symbol: str):
    price = live_prices.get(symbol)
    if price is None:
        return JSONResponse(status_code=404, content={"error": "Symbol not found"})
    return {"symbol": symbol, "price": round(price, 2)}



@router.get("/live/closed-trades")
def get_closed_trades():
    closed = []
    for symbol, trades in active_trades.items():
        current_price = live_prices[symbol]
        for trade in trades:
            if trade["status"] == "closed":
                entry = trade.get("price_executed", 0)
                exit_price = trade.get("exit_price", current_price)
                qty = trade.get("quantity", 1)
                side = trade.get("side", "buy")

                # ✅ Calculate PnL
                pnl = (exit_price - entry) * qty if side == "buy" else (entry - exit_price) * qty

                closed.append({
                    **trade,
                    "exit_price": exit_price,
                    "pnl": round(pnl, 2)
                })
    return JSONResponse(content=closed)




@router.websocket("/ws/ohlcv")
async def websocket_ohlcv(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            all_candles = []
            for symbol in live_prices:
                updated_price = update_live_price(symbol)
                candle = generate_mock_ohlcv(symbol)
                all_candles.append(candle)

                await check_sl_tp(symbol, updated_price)

            for candle in all_candles:
                await websocket.send_text(json.dumps(candle))

            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Client disconnected from OHLCV feed")


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
        "status": "open"
    }

    active_trades[symbol].append(trade)
    return trade


async def check_sl_tp(symbol: str, price: float):
    for trade in active_trades[symbol]:
        if trade["status"] != "open":
            continue

        side = trade["side"]
        sl = trade["sl"]
        tp = trade["tp"]

        if side == "buy":
            if price >= tp:
                trade["status"] = "closed"
                trade["exit_reason"] = "TP hit"
                trade["exit_price"] = price
            elif price <= sl:
                trade["status"] = "closed"
                trade["exit_reason"] = "SL hit"
                trade["exit_price"] = price
        elif side == "sell":
            if price <= tp:
                trade["status"] = "closed"
                trade["exit_reason"] = "TP hit"
                trade["exit_price"] = price
            elif price >= sl:
                trade["status"] = "closed"
                trade["exit_reason"] = "SL hit"
                trade["exit_price"] = price


# ✅ NEW WebSocket: live open positions with real-time PnL
@router.websocket("/ws/positions")
async def stream_open_positions(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            open_positions = []
            for symbol, trades in active_trades.items():
                current_price = live_prices[symbol]
                for trade in trades:
                    if trade["status"] == "open":
                        entry_price = trade["price_executed"]
                        qty = trade["quantity"]
                        side = trade["side"]

                        if side == "buy":
                            pnl = (current_price - entry_price) * qty
                        elif side == "sell":
                            pnl = (entry_price - current_price) * qty
                        else:
                            pnl = 0.0

                        open_positions.append({
                            "id": trade["id"],
                            "symbol": symbol,
                            "side": side,
                            "quantity": qty,
                            "price_executed": entry_price,
                            "current_price": current_price,
                            "unrealized_pnl": round(pnl, 2),
                        })

            await websocket.send_text(json.dumps(open_positions))
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        print("Client disconnected from open positions stream")
