import pandas as pd

def generate_ema_signals(data, short_window=10, long_window=20):
    df = pd.DataFrame(data)
    print("DEBUG: incoming DataFrame:")
    print(df.head())

    df['ema_short'] = df['close'].ewm(span=short_window, adjust=False).mean()
    df['ema_long'] = df['close'].ewm(span=long_window, adjust=False).mean()

    df['signal'] = 0
    df.loc[df['ema_short'] > df['ema_long'], 'signal'] = 1
    df.loc[df['ema_short'] < df['ema_long'], 'signal'] = -1

    return df.to_dict(orient="records")
