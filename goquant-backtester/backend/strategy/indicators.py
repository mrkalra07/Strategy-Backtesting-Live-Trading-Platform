import pandas as pd
from ta.trend import MACD

def compute_macd(data: pd.DataFrame) -> pd.DataFrame:
    macd_indicator = MACD(
        close=data['close'],
        window_slow=26,
        window_fast=12,
        window_sign=9
    )
    data['macd'] = macd_indicator.macd()
    data['macd_signal'] = macd_indicator.macd_signal()
    data['macd_diff'] = macd_indicator.macd_diff()
    return data
