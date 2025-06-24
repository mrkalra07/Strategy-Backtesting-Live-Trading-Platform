from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import pandas as pd
import json

router = APIRouter()

# Load once — you can replace this with uploaded CSV too
data = pd.read_csv("data/BTCUSDT_1h.csv")  # your OHLCV file
data = data.to_dict(orient="records")

@router.websocket("/ws/live-candles")
async def live_candle_feed(websocket: WebSocket):
    await websocket.accept()
    try:
        for row in data:
            await websocket.send_text(json.dumps(row))
            await asyncio.sleep(1)  # 1 candle/sec
    except WebSocketDisconnect:
        print("Client disconnected")
