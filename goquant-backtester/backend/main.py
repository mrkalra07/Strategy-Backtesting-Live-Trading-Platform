# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.ohlcv import router as ohlcv_router
from backend.api.backtest import router as backtest_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ohlcv_router)
app.include_router(backtest_router)

@app.get("/")
def root():
    return {"message": "GoQuant API running"}
