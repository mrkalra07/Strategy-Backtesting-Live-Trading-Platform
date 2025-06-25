import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# API routers
from backend.api.ohlcv import router as ohlcv_router
from backend.api.backtest import router as backtest_router
from backend.api.websocket import router as websocket_router
from api import live_trading
#from backend.api.live_feed import router as live_feed_router

app = FastAPI()
#app.include_router(live_feed_router)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(ohlcv_router)
app.include_router(backtest_router)
app.include_router(websocket_router)
app.include_router(live_trading.router)

@app.get("/")
def root():
    return {"message": "GoQuant API running"}
