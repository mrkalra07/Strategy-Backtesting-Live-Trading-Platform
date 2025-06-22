from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.ohlcv import router as ohlcv_router
from backend.api.backtest import router as backtest_router
from backend.api.websocket import router as websocket_router

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
app.include_router(websocket_router)

@app.get("/")
def root():
    return {"message": "GoQuant API running"}
