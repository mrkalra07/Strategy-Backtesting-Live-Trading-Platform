from pydantic import BaseModel
from datetime import datetime
from typing import List

class OHLCVData(BaseModel):
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
