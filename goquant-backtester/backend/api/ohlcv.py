# backend/api/ohlcv.py

from fastapi import APIRouter, UploadFile, File, HTTPException
import pandas as pd
from io import StringIO

router = APIRouter()

uploaded_ohlcv_data = None  # <-- This is the shared global variable

@router.post("/upload")
async def upload_ohlcv(file: UploadFile = File(...)):
    global uploaded_ohlcv_data

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")

    content = await file.read()
    try:
        df = pd.read_csv(StringIO(content.decode('utf-8')))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV parse error: {str(e)}")

    if not {'open', 'high', 'low', 'close', 'volume'}.issubset(df.columns):
        raise HTTPException(
            status_code=422,
            detail="CSV must contain 'open', 'high', 'low', 'close', 'volume' columns."
        )

    # Save to global memory
    uploaded_ohlcv_data = df

    return {
        "filename": file.filename,
        "rows": df.shape[0],
        "columns": df.columns.tolist(),
        "preview": df.head(5).to_dict(orient="records"),
    }
