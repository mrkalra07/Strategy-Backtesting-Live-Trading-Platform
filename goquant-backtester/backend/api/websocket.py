from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.strategy.ema_strategy import generate_ema_signals
from backend.strategy.rsi_strategy import generate_rsi_signals
from backend.strategy.macd_strategy import generate_macd_signals
from backend.strategy.custom_logic import evaluate_custom_logic
import asyncio
import numpy as np
import pandas as pd
from typing import Dict, List

router = APIRouter()

active_connections: List[WebSocket] = []

def register_connection(ws: WebSocket):
    if ws not in active_connections:
        active_connections.append(ws)

def unregister_connection(ws: WebSocket):
    if ws in active_connections:
        active_connections.remove(ws)

async def broadcast_json(message: dict):
    for ws in active_connections:
        try:
            await ws.send_json(message)
        except Exception:
            pass

@router.websocket("/ws")
async def websocket_backtest(websocket: WebSocket):
    await websocket.accept()
    register_connection(websocket)
    try:
        message = await websocket.receive_json()
        strategy = message.get("strategy")
        data = message.get("data")
        custom_logic = message.get("logic")
        sl = message.get("sl")
        tp = message.get("tp")
        fees = message.get("fees", 0.0)
        slippage = message.get("slippage", 0.0)
        user_id = message.get("user_id", None)

        if not data or not strategy:
            await websocket.send_json({"error": "Missing data or strategy"})
            await websocket.close()
            unregister_connection(websocket)
            return

        per_symbol_results = {}
        all_trades = []
        all_equity_curves = {}
        all_chart_data = {}
        all_drawdown_curves = {}
        symbol_count = len(data)
        symbol_idx = 0

        for symbol, symbol_data in data.items():
            symbol_idx += 1
            if not symbol_data:
                continue
            # Extract exchange and market_type if present
            exchange = symbol_data.get("exchange", "unknown")
            market_type = symbol_data.get("market_type", "spot")
            ohlcv = symbol_data["ohlcv"] if "ohlcv" in symbol_data else symbol_data
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
                    await websocket.send_json({"error": f"Error in custom strategy for {symbol}: {str(e)}"})
                    continue
            else:
                await websocket.send_json({"error": "Unsupported strategy"})
                continue

            trades = []
            equity_curve = []
            position = None
            entry_price = 0
            entry_index = 0
            current_equity = 0
            chart_data = []
            drawdown_curve = []
            holding_times = []
            interim_metrics = {
                "current_equity": 0,
                "num_trades": 0,
                "max_drawdown": 0,
                "sharpe_ratio": None,
                "sortino_ratio": None,
                "progress": 0
            }

            for idx, row in enumerate(signals):
                await asyncio.sleep(0.001)  # Simulate work for UI
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
                    trade = {
                        "action": "buy",
                        "timestamp": row["timestamp"],
                        "price": row["close"],
                        "entry_price": entry_price,
                        "entry_time": row["timestamp"]
                    }
                    trades.append(trade)
                    await websocket.send_json({
                        "symbol": symbol,
                        "progress": (idx+1)/len(signals),
                        "event": "buy",
                        "trade": trade,
                        "user_id": user_id
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
                        gross_profit = exit_price - entry_price
                        fee_cost = (entry_price + exit_price) * fees
                        net_profit = gross_profit - fee_cost
                        current_equity += net_profit
                        trade = {
                            "action": "sell",
                            "timestamp": row["timestamp"],
                            "price": exit_raw_price,
                            "exit_price": exit_price,
                            "entry_price": entry_price,
                            "entry_time": signals[entry_index]["timestamp"],
                            "exit_time": row["timestamp"],
                            "profit": net_profit,
                            "holding_time": holding_time,
                            "sl_hit": hit_sl,
                            "tp_hit": hit_tp,
                            "signal_exit": is_exit_signal,
                            "fee": fee_cost
                        }
                        trades.append(trade)
                        await websocket.send_json({
                            "symbol": symbol,
                            "progress": (idx+1)/len(signals),
                            "event": "sell",
                            "trade": trade,
                            "user_id": user_id
                        })

                # Update equity and drawdown curves
                if trades and trades[-1]["action"] == "sell":
                    equity_curve.append(current_equity)
                    peak = max(equity_curve) if equity_curve else 0
                    drawdown = peak - current_equity
                    drawdown_curve.append({
                        "date": row["timestamp"],
                        "drawdown": drawdown
                    })

                # Update interim metrics
                interim_metrics["current_equity"] = current_equity
                interim_metrics["num_trades"] = len(trades)
                interim_metrics["max_drawdown"] = max([d["drawdown"] for d in drawdown_curve], default=0)
                returns = np.array([t["profit"] / t["entry_price"] for t in trades if t["action"] == "sell" and t["entry_price"] != 0])
                if len(returns) > 1:
                    interim_metrics["sharpe_ratio"] = float(np.mean(returns) / np.std(returns))
                    downside_returns = returns[returns < 0]
                    interim_metrics["sortino_ratio"] = float(np.mean(returns) / np.std(downside_returns)) if len(downside_returns) > 0 else None
                interim_metrics["progress"] = (idx+1)/len(signals)

                # Send interim metrics every 10% or on last iteration
                if idx % max(1, len(signals)//10) == 0 or idx == len(signals)-1:
                    await websocket.send_json({
                        "symbol": symbol,
                        "progress": interim_metrics["progress"],
                        "interim_metrics": interim_metrics,
                        "user_id": user_id
                    })

            # Calculate per-symbol metrics
            total_profit = sum([t["profit"] for t in trades if t["action"] == "sell"])
            num_trades = len([t for t in trades if t["action"] == "sell"])
            avg_trade_profit = total_profit / num_trades if num_trades > 0 else None
            win_trades = [t for t in trades if t["action"] == "sell" and t["profit"] > 0]
            win_rate = len(win_trades) / num_trades if num_trades > 0 else None
            max_drawdown = max([d["drawdown"] for d in drawdown_curve], default=0)
            returns = np.array([t["profit"] / t["entry_price"] for t in trades if t["action"] == "sell" and t["entry_price"] != 0])
            sharpe_ratio = float(np.mean(returns) / np.std(returns)) if len(returns) > 1 and np.std(returns) > 0 else None
            downside_returns = returns[returns < 0]
            sortino_ratio = float(np.mean(returns) / np.std(downside_returns)) if len(downside_returns) > 0 else None
            average_holding_time = np.mean([t["holding_time"] for t in trades if t["action"] == "sell"]) if num_trades > 0 else None
            max_consecutive_wins = 0
            max_consecutive_losses = 0
            streak = 0
            last_win = None
            for t in trades:
                if t["action"] == "sell":
                    if t["profit"] > 0:
                        if last_win is True:
                            streak += 1
                        else:
                            streak = 1
                        max_consecutive_wins = max(max_consecutive_wins, streak)
                        last_win = True
                    else:
                        if last_win is False:
                            streak += 1
                        else:
                            streak = 1
                        max_consecutive_losses = max(max_consecutive_losses, streak)
                        last_win = False
            # Add more metrics as needed
            per_symbol_results = {
                "trades": trades,
                "chart_data": chart_data,
                "equity_curve": [
                    {"date": signals[i]["timestamp"], "equity": eq}
                    for i, eq in enumerate(equity_curve)
                ],
                "drawdown_curve": drawdown_curve,
                "total_profit": total_profit,
                "num_trades": num_trades,
                "avg_trade_profit": avg_trade_profit,
                "win_rate": win_rate,
                "max_drawdown": max_drawdown,
                "sharpe_ratio": sharpe_ratio,
                "sortino_ratio": sortino_ratio,
                "average_holding_time": average_holding_time,
            "average_holding_time": safe_mean([m.get("average_holding_time") for m in per_metrics]),
            "win_rate": safe_mean([m.get("win_rate") for m in per_metrics]),
            "max_drawdown": safe_max([m.get("max_drawdown") for m in per_metrics]),
            "sharpe_ratio": None,
            "sortino_ratio": None,
            "profit_factor": None,
            "calmar_ratio": None,
            "max_consecutive_wins": safe_max([m.get("max_consecutive_wins") for m in per_metrics]),
            "max_consecutive_losses": safe_max([m.get("max_consecutive_losses") for m in per_metrics]),
            "var_95": safe_mean([m.get("var_95") for m in per_metrics]),
            "beta": safe_mean([m.get("beta") for m in per_metrics]),
            "calmar_over_time": [],
            "turnover": safe_mean([m.get("turnover") for m in per_metrics]),
            "leverage": safe_mean([m.get("leverage") for m in per_metrics]),
        }
        result = {
            "per_symbol": per_symbol_results,
            "portfolio": portfolio_result
        }
        if len(per_symbol_results) == 1:
            only_symbol = next(iter(per_symbol_results))
            result["portfolio"] = per_symbol_results[only_symbol].copy()
        await websocket.send_json({
            "status": "portfolio_completed",
            "portfolio": portfolio_result,      # aggregate/portfolio-level result
            "per_symbol": per_symbol_results,   # dict of all per-symbol results
            "user_id": user_id
        })
        await websocket.close()
        unregister_connection(websocket)

    except WebSocketDisconnect:
        unregister_connection(websocket)
        print("Client disconnected")
    except Exception as e:
        await websocket.send_json({"error": str(e)})
        await websocket.close()
        unregister_connection(websocket)
