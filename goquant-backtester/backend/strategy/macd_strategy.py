import pandas as pd

def generate_macd_signals(data):
    df = pd.DataFrame(data)
    df['close'] = pd.to_numeric(df['close'], errors='coerce')

    short_ema = df['close'].ewm(span=12, adjust=False).mean()
    long_ema = df['close'].ewm(span=26, adjust=False).mean()

    df['macd'] = short_ema - long_ema
    df['signal_line'] = df['macd'].ewm(span=9, adjust=False).mean()

    df['signal'] = 0
    df.loc[df['macd'] > df['signal_line'], 'signal'] = 1
    df.loc[df['macd'] < df['signal_line'], 'signal'] = -1

    df.dropna(inplace=True)

    return df.to_dict(orient="records")
