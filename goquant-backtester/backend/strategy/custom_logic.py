#custom_logic
import pandas as pd
import re
from ta.trend import EMAIndicator
from ta.momentum import RSIIndicator
from backend.strategy.indicators import compute_macd


def evaluate_custom_logic(data: pd.DataFrame, logic: str) -> pd.DataFrame:
    df = data.copy()
    df['signal'] = 0

    # Pre-compute all EMA/RSI columns needed
    ema_periods = set(map(int, re.findall(r'EMA_(\d+)', logic)))
    for period in ema_periods:
        df[f'EMA_{period}'] = EMAIndicator(close=df['close'], window=period).ema_indicator()

    if 'RSI' in logic:
        df['RSI'] = RSIIndicator(close=df['close'], window=14).rsi()

    # Split into individual conditions
    for line in logic.strip().split('\n'):
        line = line.strip()
        if not line or not line.startswith("IF"):
            continue

        match = re.match(r"IF (.+) THEN (BUY|SELL)", line)
        if not match:
            continue

        condition_str, action = match.groups()

        # Safe replacements for pandas eval
        condition_str = condition_str.replace("AND", "and").replace("OR", "or")

        # Evaluate the condition using pandas.eval row-wise
        try:
            condition_result = df.eval(condition_str, engine='python')
            # Ensure condition_result is a boolean Series
            if not pd.api.types.is_bool_dtype(condition_result):
                condition_result = condition_result.astype(bool)
        except Exception as e:
            print(f"Error evaluating condition '{condition_str}': {e}")
            continue

        # Apply signal based on action
        if action == "BUY":
            df.loc[condition_result, 'signal'] = 1
        elif action == "SELL":
            df.loc[condition_result, 'signal'] = -1

    # DEBUG: Print signal counts
    print("Signal value counts:", df['signal'].value_counts())
    return df
