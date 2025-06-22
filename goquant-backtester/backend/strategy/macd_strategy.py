import pandas as pd
from backend.strategy.ema_strategy import compute_ema
def compute_macd(df, short_span=12, long_span=26, signal_span=9):
    short_ema = compute_ema(df['close'], span=short_span)
    long_ema = compute_ema(df['close'], span=long_span)
    macd = short_ema - long_ema
    signal_line = macd.ewm(span=signal_span, adjust=False).mean()
    return macd, signal_line

def generate_macd_signals(data, short_span=12, long_span=26, signal_span=9):
    df = pd.DataFrame(data)
    df['close'] = pd.to_numeric(df['close'], errors='coerce')
    df['timestamp'] = df['timestamp']

    df['macd'], df['signal_line'] = compute_macd(df, short_span, long_span, signal_span)

    df['signal'] = 0
    df.loc[df['macd'] > df['signal_line'], 'signal'] = 1
    df.loc[df['macd'] < df['signal_line'], 'signal'] = -1

    df.dropna(subset=['macd', 'signal_line'], inplace=True)

    return df.to_dict(orient='records')
