def parse_and_execute_custom_logic(data, logic_str):
    import pandas as pd

    df = pd.DataFrame(data)

    # Split logic string: e.g., "rsi < 30"
    parts = logic_str.split()

    if len(parts) != 3:
        raise ValueError("Invalid logic format. Must be: indicator operator value")

    indicator, operator, value = parts

    # Convert to float if value is a number
    try:
        value = float(value)
    except ValueError:
        pass  # Leave as string (could be another column)

    if indicator not in df.columns:
        raise ValueError(f"{indicator} not found in data")

    df["signal"] = 0

    if operator == "<":
        df.loc[df[indicator] < value, "signal"] = 1
    elif operator == ">":
        df.loc[df[indicator] > value, "signal"] = 1
    elif operator == "==":
        df.loc[df[indicator] == value, "signal"] = 1
    elif operator == "crosses above":
        df["prev"] = df[indicator].shift(1)
        df.loc[(df["prev"] < value) & (df[indicator] >= value), "signal"] = 1
    elif operator == "crosses below":
        df["prev"] = df[indicator].shift(1)
        df.loc[(df["prev"] > value) & (df[indicator] <= value), "signal"] = -1
    else:
        raise ValueError("Unsupported operator in custom logic.")

    return df.to_dict(orient="records")
