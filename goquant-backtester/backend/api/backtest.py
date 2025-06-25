from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Any, Dict
import numpy as np
import pandas as pd
from backend.strategy.ema_strategy import generate_ema_signals
from backend.strategy.rsi_strategy import generate_rsi_signals
from backend.strategy.macd_strategy import generate_macd_signals
from backend.strategy.custom_logic import evaluate_custom_logic

router = APIRouter()

def clean_json(obj):
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_json(i) for i in obj]
    elif isinstance(obj, float) and (np.isnan(obj) or np.isinf(obj)):
        return None
    return obj

def parse_graph(nodes, edges):
    # Build a mapping from node id to node data
    node_map = {n['id']: n for n in nodes}
    # Build adjacency (children) and reverse adjacency (parents)
    children = {n['id']: [] for n in nodes}
    parents = {n['id']: [] for n in nodes}
    for e in edges:
        source = e['source']
        target = e['target']
        children[source].append(target)
        parents[target].append(source)
    return node_map, children, parents

@router.post("/backtest")
async def run_backtest(request: Request):
    def safe_mean(values):
        arr = [v for v in values if v is not None]
        return float(np.mean(arr)) if arr else None
    def safe_sum(values):
        arr = [v for v in values if v is not None]
        return float(np.sum(arr)) if arr else None
    def safe_max(values):
        arr = [v for v in values if v is not None]
        return float(np.max(arr)) if arr else None

    payload = await request.json()
    strategy = payload.get("strategy")
    data = payload.get("data")  # Now expected as {symbol: [ohlcv_rows, ...], ...}
    custom_logic = payload.get("logic")
    sl = payload.get("sl")
    tp = payload.get("tp")
    fees = payload.get("fees", 0.0)
    slippage = payload.get("slippage", 0.0)

    if not data or not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="No OHLCV data provided or data is not a dict.")

    per_symbol_results = {}
    all_trades = []
    all_equity_curves = {}
    all_chart_data = {}
    all_returns = {}
    all_holding_times = {}
    all_drawdown_curves = {}

    # Per-symbol backtest
    for symbol, symbol_data in data.items():
        if not symbol_data:
            continue
        # Use only the OHLCV data for strategy functions
        ohlcv = symbol_data["ohlcv"] if "ohlcv" in symbol_data else symbol_data
        # Debug: print first row and keys
        print(f"[DEBUG] Symbol: {symbol}")
        print(f"[DEBUG] First ohlcv row: {ohlcv[0] if ohlcv else 'EMPTY'}")
        if ohlcv:
            print(f"[DEBUG] ohlcv keys: {list(ohlcv[0].keys())}")
        # Generate signals per strategy
        if strategy == "ema":
            signals = generate_ema_signals(ohlcv)
        elif strategy == "rsi":
            signals = generate_rsi_signals(ohlcv)
        elif strategy == "macd":
            signals = generate_macd_signals(ohlcv)
        elif strategy == "custom":
            try:
                df = evaluate_custom_logic(ohlcv, custom_logic)
                signals = df.to_dict(orient="records")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error in custom strategy for {symbol}: {str(e)}")
        else:
            raise HTTPException(status_code=400, detail="Unsupported strategy.")

        trades = []
        equity_curve = []
        returns = []
        position = None
        entry_price = 0
        entry_index = 0
        current_equity = 0
        chart_data = []
        holding_times = []

        for idx, row in enumerate(signals):
            indicator_value = row.get("rsi") or row.get("ema_short") or row.get("macd")
            chart_data.append({
                "date": row["timestamp"],
                "price": row["close"],
                "indicator": indicator_value
            })

            if row["signal"] == 1 and position is None:
                position = "long"
                entry_price = row["close"] * (1 + slippage)
                entry_index = idx
                trades.append({
                    "action": "buy",
                    "timestamp": row["timestamp"],
                    "price": row["close"],
                    "entry_price": entry_price,
                    "entry_time": row["timestamp"]
                })

            elif position == "long":
                exit_raw_price = row["close"]
                exit_price = exit_raw_price * (1 - slippage)
                hit_sl = sl and exit_price <= entry_price * (1 - sl)
                hit_tp = tp and exit_price >= entry_price * (1 + tp)
                is_exit_signal = row["signal"] == -1
                should_exit = is_exit_signal or hit_sl or hit_tp

                if should_exit:
                    position = None
                    holding_time = idx - entry_index
                    holding_times.append(holding_time)
                    gross_profit = exit_price - entry_price
                    fee_cost = (entry_price + exit_price) * fees
                    net_profit = gross_profit - fee_cost
                    ret = net_profit / entry_price
                    returns.append(ret)
                    current_equity += net_profit
                    equity_curve.append(current_equity)
                    trades.append({
                        "action": "sell",
                        "timestamp": row["timestamp"],
                        "price": exit_raw_price,
                        "exit_price": exit_price,
                        "entry_price": entry_price,
                        "entry_time": signals[entry_index]["timestamp"],
                        "exit_time": row["timestamp"],
                        "profit": net_profit,
                        "return": ret,
                        "holding_time": holding_time,
                        "sl_hit": hit_sl,
                        "tp_hit": hit_tp,
                        "signal_exit": is_exit_signal,
                        "fee": fee_cost
                    })

        # Prepare OHLCV DataFrame
        df = pd.DataFrame(ohlcv)
        print(f"[DEBUG] DataFrame columns: {df.columns.tolist()}")
        if "timestamp" not in df.columns:
            raise HTTPException(status_code=400, detail=f"Missing 'timestamp' column in uploaded data for {symbol}. Columns: {df.columns.tolist()}")
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df.set_index("timestamp", inplace=True)

        asset_returns = df["close"].pct_change().dropna()
        benchmark_returns = asset_returns.copy()
        var_95 = np.percentile(asset_returns, 5)

        if len(asset_returns) > 1 and len(benchmark_returns) > 1:
            covariance = np.cov(asset_returns, benchmark_returns)[0, 1]
            benchmark_variance = np.var(benchmark_returns)
            beta = covariance / benchmark_variance if benchmark_variance != 0 else np.nan
        else:
            beta = np.nan

        # Max Drawdown
        max_drawdown = 0
        if equity_curve:
            peak = equity_curve[0]
            for val in equity_curve:
                if val > peak:
                    peak = val
                drawdown = peak - val
                max_drawdown = max(max_drawdown, drawdown)
        # Defensive: ensure net_equity, rolling_calmar, turnover, leverage are always defined
        net_equity = sum(t.get("profit", 0) for t in trades if "profit" in t)
        rolling_calmar = []
        turnover = 0
        leverage = 0

        # Sharpe, Sortino, Profit Factor, Alpha, CVaR
        returns_array = np.array(returns)
        risk_free_rate = 0.0  # You can make this configurable
        benchmark_return = np.mean(asset_returns) if len(asset_returns) > 0 else 0
        if len(returns_array) > 1:
            sharpe_ratio = (np.mean(returns_array) - risk_free_rate) / np.std(returns_array)
            downside_returns = returns_array[returns_array < 0]
            sortino_ratio = (np.mean(returns_array) - risk_free_rate) / np.std(downside_returns) if len(downside_returns) > 0 else np.nan
            profit_factor = sum(r for r in returns_array if r > 0) / abs(sum(r for r in returns_array if r < 0)) if any(r < 0 for r in returns_array) else np.nan
            alpha = np.mean(returns_array) - benchmark_return if len(asset_returns) > 0 else np.nan
            cvar_95 = np.mean(returns_array[returns_array <= var_95]) if len(returns_array[returns_array <= var_95]) > 0 else np.nan
        else:
            sharpe_ratio = sortino_ratio = profit_factor = alpha = cvar_95 = np.nan

        # Annualized metrics
        periods_per_year = 252  # Assume daily data; adjust if needed
        ann_return = (1 + np.mean(returns_array)) ** periods_per_year - 1 if len(returns_array) > 1 else np.nan
        ann_volatility = np.std(returns_array) * np.sqrt(periods_per_year) if len(returns_array) > 1 else np.nan

        # Rolling metrics (window=20)
        rolling_window = 20
        rolling_sharpe = []
        rolling_drawdown = []
        for i in range(rolling_window, len(returns_array)):
            window_slice = returns_array[i - rolling_window:i]
            if np.std(window_slice) > 0:
                rolling_sharpe.append({
                    "date": df.index[i],
                    "sharpe": float(np.mean(window_slice) / np.std(window_slice))
                })
            # Rolling drawdown
            window_equity = np.cumprod(1 + window_slice)
            peak = np.maximum.accumulate(window_equity)
            drawdown = (peak - window_equity) / peak
            rolling_drawdown.append({
                "date": df.index[i],
                "drawdown": float(np.max(drawdown))
            })

        # Equity and Drawdown Curves
        equity_data = []
        drawdown_curve = []
        cumulative_equity = 0
        peak_equity = 0
        for trade in trades:
            if "profit" in trade:
                cumulative_equity += trade["profit"]
            peak_equity = max(peak_equity, cumulative_equity)
            drawdown = peak_equity - cumulative_equity
            equity_data.append({
                "date": trade["timestamp"],
                "equity": cumulative_equity
            })
            drawdown_curve.append({
                "date": trade["timestamp"],
                "drawdown": drawdown
            })
        # Ensure equity_data is always defined
        if not equity_data:
            equity_data = []
        if not drawdown_curve:
            drawdown_curve = []

        # --- Max Consecutive Wins/Losses ---
        max_consecutive_wins = 0
        max_consecutive_losses = 0
        current_wins = 0
        current_losses = 0
        for t in trades:
            if t.get("action") == "sell":
                profit = t.get("profit", 0)
                if profit > 0:
                    current_wins += 1
                    current_losses = 0
                elif profit < 0:
                    current_losses += 1
                    current_wins = 0
                else:
                    current_wins = 0
                    current_losses = 0
                max_consecutive_wins = max(max_consecutive_wins, current_wins)
                max_consecutive_losses = max(max_consecutive_losses, current_losses)

        # --- VaR (95%) ---
        var_95 = np.percentile(returns_array, 5) if len(returns_array) > 1 else np.nan

        # --- Turnover ---
        # Turnover = sum of absolute position changes / total trades
        turnover = 0
        if len(trades) > 1:
            positions = [1 if t.get("profit", 0) > 0 else -1 if t.get("profit", 0) < 0 else 0 for t in trades if t.get("action") == "sell"]
            turnover = np.sum(np.abs(np.diff(positions))) / len(positions) if len(positions) > 1 else 0

        # --- Leverage ---
        # Leverage = average (abs(position size) / equity), here assume position size = entry_price, equity = current_equity
        leverage = 0
        leverages = []
        for t in trades:
            if t.get("action") == "sell" and t.get("entry_price") and current_equity != 0:
                leverages.append(abs(t["entry_price"]) / abs(current_equity) if current_equity != 0 else 0)
        if leverages:
            leverage = float(np.mean(leverages))

        per_symbol_results[symbol] = {
            "trades": trades,
            "chart_data": chart_data,
            "equity_curve": equity_data,
            "drawdown_curve": drawdown_curve,
            "total_profit": net_equity,
            "num_trades": len([t for t in trades if t["action"] == "sell"]),
            "avg_trade_profit": np.mean([t.get("profit", 0) for t in trades if "profit" in t]) if trades else 0,
            "average_holding_time": np.mean(holding_times) if holding_times else 0,
            "win_rate": ((len([t for t in trades if t.get("profit", 0) > 0]) / len([t for t in trades if t["action"] == "sell"])) * 100) if trades and len([t for t in trades if t["action"] == "sell"]) > 0 else 0,
            "max_drawdown": max_drawdown,
            "sharpe_ratio": sharpe_ratio,
            "sortino_ratio": sortino_ratio,
            "profit_factor": profit_factor,
            "alpha": alpha,
            "cvar_95": cvar_95,
            "annualized_return": ann_return,
            "annualized_volatility": ann_volatility,
            "rolling_sharpe": rolling_sharpe,
            "rolling_drawdown": rolling_drawdown,
            "beta": beta,
            "calmar_over_time": rolling_calmar,
            "turnover": turnover,
            "leverage": leverage,
            "max_consecutive_wins": max_consecutive_wins,
            "max_consecutive_losses": max_consecutive_losses,
            "var_95": var_95,
        }
        all_trades.extend([dict(t, symbol=symbol) for t in trades])
        all_equity_curves[symbol] = equity_data
        all_chart_data[symbol] = chart_data
        all_returns[symbol] = returns
        all_holding_times[symbol] = holding_times
        all_drawdown_curves[symbol] = drawdown_curve

    # --- Portfolio-level aggregation ---
    # Combine all trades chronologically
    all_trades_sorted = sorted(all_trades, key=lambda t: t["timestamp"])

    # Build a combined equity curve by summing per-symbol equity at each unique timestamp
    all_timestamps = sorted(set(ts for eq in all_equity_curves.values() for ts in [e["date"] for e in eq]))
    portfolio_equity_curve = []
    symbol_equity_dict = {symbol: {e["date"]: e["equity"] for e in eq} for symbol, eq in all_equity_curves.items()}
    for ts in all_timestamps:
        total_equity = sum(symbol_equity_dict[s].get(ts, 0) for s in symbol_equity_dict)
        portfolio_equity_curve.append({"date": ts, "equity": total_equity})

    # Portfolio returns
    portfolio_equity_vals = [e["equity"] for e in portfolio_equity_curve]
    portfolio_returns = np.diff(portfolio_equity_vals) / portfolio_equity_vals[:-1] if len(portfolio_equity_vals) > 1 else np.array([])

    # Portfolio metrics
    if len(portfolio_returns) > 1:
        portfolio_sharpe = (np.mean(portfolio_returns) - risk_free_rate) / np.std(portfolio_returns)
        downside_returns = portfolio_returns[portfolio_returns < 0]
        portfolio_sortino = (np.mean(portfolio_returns) - risk_free_rate) / np.std(downside_returns) if len(downside_returns) > 0 else np.nan
        portfolio_profit_factor = sum(r for r in portfolio_returns if r > 0) / abs(sum(r for r in portfolio_returns if r < 0)) if any(r < 0 for r in portfolio_returns) else np.nan
        portfolio_alpha = np.mean(portfolio_returns) - benchmark_return if len(portfolio_returns) > 0 else np.nan
        portfolio_var_95 = np.percentile(portfolio_returns, 5)
        portfolio_cvar_95 = np.mean(portfolio_returns[portfolio_returns <= portfolio_var_95]) if len(portfolio_returns[portfolio_returns <= portfolio_var_95]) > 0 else np.nan
    else:
        portfolio_sharpe = portfolio_sortino = portfolio_profit_factor = portfolio_alpha = portfolio_cvar_95 = np.nan
        portfolio_var_95 = np.nan
    # Portfolio annualized metrics
    portfolio_ann_return = (1 + np.mean(portfolio_returns)) ** periods_per_year - 1 if len(portfolio_returns) > 1 else np.nan
    portfolio_ann_volatility = np.std(portfolio_returns) * np.sqrt(periods_per_year) if len(portfolio_returns) > 1 else np.nan
    # Portfolio rolling metrics
    portfolio_rolling_sharpe = []
    portfolio_rolling_drawdown = []
    for i in range(rolling_window, len(portfolio_returns)):
        window_slice = portfolio_returns[i - rolling_window:i]
        if np.std(window_slice) > 0:
            portfolio_rolling_sharpe.append({
                "date": all_timestamps[i],
                "sharpe": float(np.mean(window_slice) / np.std(window_slice))
            })
        window_equity = np.cumprod(1 + window_slice)
        peak = np.maximum.accumulate(window_equity)
        drawdown = (peak - window_equity) / peak
        portfolio_rolling_drawdown.append({
            "date": all_timestamps[i],
            "drawdown": float(np.max(drawdown))
        })

    # Gather per-symbol metrics for aggregation
    per_metrics = list(per_symbol_results.values())
    portfolio_result = {
        "trades": all_trades_sorted,
        "chart_data": [item for sublist in all_chart_data.values() for item in sublist],
        "equity_curve": portfolio_equity_curve,
        "drawdown_curve": [item for sublist in all_drawdown_curves.values() for item in sublist],
        "total_profit": safe_sum([m.get("total_profit") for m in per_metrics]),
        "num_trades": safe_sum([m.get("num_trades") for m in per_metrics]),
        "avg_trade_profit": safe_mean([m.get("avg_trade_profit") for m in per_metrics]),
        "average_holding_time": safe_mean([m.get("average_holding_time") for m in per_metrics]),
        "win_rate": safe_mean([m.get("win_rate") for m in per_metrics]),
        "max_drawdown": safe_max([m.get("max_drawdown") for m in per_metrics]),
        "sharpe_ratio": portfolio_sharpe,
        "sortino_ratio": portfolio_sortino,
        "profit_factor": portfolio_profit_factor,
        "alpha": portfolio_alpha,
        "cvar_95": portfolio_cvar_95,
        "annualized_return": portfolio_ann_return,
        "annualized_volatility": portfolio_ann_volatility,
        "rolling_sharpe": portfolio_rolling_sharpe,
        "rolling_drawdown": portfolio_rolling_drawdown,
        "max_consecutive_wins": safe_max([m.get("max_consecutive_wins") for m in per_metrics]),
        "max_consecutive_losses": safe_max([m.get("max_consecutive_losses") for m in per_metrics]),
        "var_95": safe_mean([m.get("var_95") for m in per_metrics]),
        "beta": safe_mean([m.get("beta") for m in per_metrics]),
    }

    # Gather per-symbol metrics for aggregation
    per_metrics = list(per_symbol_results.values())
    result = {
        "per_symbol": per_symbol_results,
        "portfolio": portfolio_result
    }

    # If only one symbol, copy all per-symbol fields to portfolio for consistency
    if len(per_symbol_results) == 1:
        only_symbol = next(iter(per_symbol_results))
        result["portfolio"] = per_symbol_results[only_symbol].copy()

    return JSONResponse(content=clean_json(result))

@router.post('/strategy/run')
async def run_strategy(request: Request):
    payload = await request.json()
    nodes = payload.get('nodes', [])
    edges = payload.get('edges', [])
    data = payload.get('data', {})

    node_map, children, parents = parse_graph(nodes, edges)

    # Find asset node (start node)
    asset_nodes = [n for n in nodes if n['data'].get('nodeType') == 'asset']
    if not asset_nodes:
        raise HTTPException(status_code=400, detail='No asset node found.')
    asset_node = asset_nodes[0]
    symbol = asset_node['data'].get('symbol') or list(data.keys())[0]
    ohlcv = data[symbol]['ohlcv'] if symbol in data else []
    df = pd.DataFrame(ohlcv)

    # Traverse and apply indicators
    indicator_nodes = [n for n in nodes if n['data'].get('nodeType') == 'indicator']
    for ind_node in indicator_nodes:
        ind_type = ind_node['data'].get('indicatorType')
        if ind_type == 'rsi':
            period = ind_node['data'].get('period', 14)
            df['rsi'] = pd.Series([row['rsi'] for row in generate_rsi_signals(ohlcv, period=period)])
        elif ind_type == 'ema':
            period = ind_node['data'].get('period', 14)
            df['ema'] = pd.Series([row['ema_short'] for row in generate_ema_signals(ohlcv, short_span=period, long_span=period+10)])
        elif ind_type == 'macd':
            df['macd'] = pd.Series([row['macd'] for row in generate_macd_signals(ohlcv)])

    # Traverse and apply logic nodes (for demo, just use the first logic node)
    logic_nodes = [n for n in nodes if n['data'].get('nodeType') == 'logic']
    if logic_nodes:
        logic_type = logic_nodes[0]['data'].get('logicType', 'and')
        # For demo: if indicator > threshold, signal = 1 else 0
        if 'rsi' in df.columns:
            if logic_type == 'gt':
                df['signal'] = (df['rsi'] > 50).astype(int)
            elif logic_type == 'lt':
                df['signal'] = (df['rsi'] < 50).astype(int)
            else:
                df['signal'] = (df['rsi'] > 50).astype(int)
        elif 'ema' in df.columns:
            df['signal'] = (df['ema'] > df['ema'].rolling(5).mean()).astype(int)
        elif 'macd' in df.columns:
            df['signal'] = (df['macd'] > 0).astype(int)
        else:
            df['signal'] = 0
    else:
        # Fallback: no logic node, no signals
        df['signal'] = 0

    # For demo: return the first 5 rows
    return JSONResponse({
        'status': 'parsed',
        'symbol': symbol,
        'head': df.head(5).to_dict(orient='records'),
        'columns': list(df.columns),
        'node_count': len(nodes),
        'edge_count': len(edges)
    })
