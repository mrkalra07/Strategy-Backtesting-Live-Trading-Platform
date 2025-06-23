import pandas as pd

def compute_rsi(series, period=14):
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    avg_gain = gain.ewm(alpha=1/period, min_periods=period).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period).mean()
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def generate_rsi_signals(data, period=14, overbought=65, oversold=35):
    df = pd.DataFrame(data)
    df['close'] = pd.to_numeric(df['close'], errors='coerce')
    df['timestamp'] = df['timestamp']

    df['rsi'] = compute_rsi(df['close'], period=period)
    df['signal'] = 0
    df['prev_rsi'] = df['rsi'].shift(1)

    # More responsive crossover logic
    df.loc[(df['prev_rsi'] > oversold) & (df['rsi'] <= oversold), 'signal'] = 1   # Buy signal
    df.loc[(df['prev_rsi'] < overbought) & (df['rsi'] >= overbought), 'signal'] = -1  # Sell signal

    df.dropna(subset=['rsi'], inplace=True)
    return df.to_dict(orient='records')
