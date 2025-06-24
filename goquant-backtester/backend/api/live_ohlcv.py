from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio
import datetime
import random
import json
import pytz  # Add this

router = APIRouter()

connected_ohlcv_clients: List[WebSocket] = []

@router.websocket("/ws/live-ohlcv")
async def live_ohlcv_socket(websocket: WebSocket):
    await websocket.accept()
    connected_ohlcv_clients.append(websocket)

    try:
        while True:
            candle = generate_mock_ohlcv()
            data = json.dumps(candle)
            await websocket.send_text(data)
            await asyncio.sleep(2)  # emits every 2 seconds
    except WebSocketDisconnect:
        connected_ohlcv_clients.remove(websocket)

def get_ist_timestamp():
    ist = pytz.timezone('Asia/Kolkata')
    return datetime.datetime.now(ist).isoformat()

def generate_mock_ohlcv():
    base_price = 25000 + random.uniform(-200, 200)
    open_price = round(base_price, 2)
    high_price = round(open_price + random.uniform(0, 100), 2)
    low_price = round(open_price - random.uniform(0, 100), 2)
    close_price = round(random.uniform(low_price, high_price), 2)
    volume = round(random.uniform(5, 50), 2)

    return {
        "timestamp": get_ist_timestamp(),  # use IST here
        "open": open_price,
        "high": high_price,
        "low": low_price,
        "close": close_price,
        "volume": volume
    }
