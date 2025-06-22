import pandas as pd

def compute_ema(series, span):
    return series.ewm(span=span, adjust=False).mean()

def generate_ema_signals(data, short_span=12, long_span=26):
    df = pd.DataFrame(data)
    df['close'] = pd.to_numeric(df['close'], errors='coerce')
    df['timestamp'] = df['timestamp']

    df['ema_short'] = compute_ema(df['close'], span=short_span)
    df['ema_long'] = compute_ema(df['close'], span=long_span)

    df['signal'] = 0
    df.loc[df['ema_short'] > df['ema_long'], 'signal'] = 1
    df.loc[df['ema_short'] < df['ema_long'], 'signal'] = -1

    df.dropna(subset=['ema_short', 'ema_long'], inplace=True)

    return df.to_dict(orient='records')
