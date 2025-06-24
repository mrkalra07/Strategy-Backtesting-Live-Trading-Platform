def evaluate_custom_logic(data, logic):
    # Dummy logic: mark buy signal on every 5th candle
    signals = []
    for i, row in enumerate(data):
        signals.append({
            "timestamp": row["timestamp"],
            "open": row["open"],
            "high": row["high"],
            "low": row["low"],
            "close": row["close"],
            "volume": row["volume"],
            "signal": 1 if i % 5 == 0 else 0
        })
    return signals
