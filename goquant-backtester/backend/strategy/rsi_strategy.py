import pandas as pd

def generate_rsi_signals(data, period=14, overbought=70, oversold=30):
    df = pd.DataFrame(data)

    df['close'] = pd.to_numeric(df['close'], errors='coerce')
    df['timestamp'] = df['timestamp']  # ensure timestamp remains in the output

    delta = df['close'].diff()

    gain = delta.where(delta > 0, 0.0)
    loss = -delta.where(delta < 0, 0.0)

    avg_gain = gain.ewm(alpha=1/period, min_periods=period).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period).mean()

    rs = avg_gain / avg_loss
    df['rsi'] = 100 - (100 / (1 + rs))

    df['signal'] = 0
    df['prev_rsi'] = df['rsi'].shift(1)

    df.loc[(df['prev_rsi'] >= oversold) & (df['rsi'] < oversold), 'signal'] = 1   # Buy signal
    df.loc[(df['prev_rsi'] <= overbought) & (df['rsi'] > overbought), 'signal'] = -1  # Sell signal

    df.dropna(subset=['rsi'], inplace=True)

    return df.to_dict(orient='records')
