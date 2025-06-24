import React, { useEffect, useState } from 'react';
import {
  Typography,
  Divider,
  Button,
  Paper,
  Box,
  Grid,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import BacktestChart from './BacktestChart';
import EquityCurveChart from './EquityCurveChart';
import PerformanceMetrics from './PerformanceMetrics';
import BacktestTable from './BacktestTable';
import DrawdownChart from './DrawdownChart';
import TradeReturnsChart from './TradeReturnsChart';
import PnLChart from './PnLChart';
import LiveCandleChart from './LiveCandleChart';
import LiveCandle from './LiveCandle';
import { useNavigate } from 'react-router-dom';

const AnalyticsDashboard = ({ result, strategy }) => {
  const navigate = useNavigate();
  const [liveTrades, setLiveTrades] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/live-trading');
    setSocket(ws);

    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
      if (response?.trade) {
        setLiveTrades((prev) => [response.trade, ...prev.slice(0, 9)]);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  if (!result) return null;

  const downloadCSV = () => {
    const trades = result?.trades || [];
    if (trades.length === 0) return;

    const headers = Object.keys(trades[0]).join(',');
    const rows = trades.map((trade) =>
      Object.values(trade).map((val) => `"${val}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'trades_log.csv');
    link.click();
  };

  const sendTrade = (side) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    const order = {
      symbol: 'BTC-USDT',
      side,
      type: 'market',
      quantity: 1,
      sl: 24000,
      tp: 26000,
    };
    socket.send(JSON.stringify(order));
  };

  return (
    <div style={{ marginTop: 32 }}>
      {/* 🔁 Go to Live Trading Button */}
      <Box mb={3} textAlign="right">
        <Button
          variant="outlined"
          color="primary"
          onClick={() => navigate('/live-trading')}
        >
          🚀 Go to Live Trading
        </Button>
      </Box>

      {/* 🔴 Live Price & Trade Controls */}
      <Paper elevation={4} style={{ padding: 16, backgroundColor: '#121212', color: '#eee', marginBottom: 32 }}>
        <Typography variant="h6" gutterBottom>🟢 Live Price & Trade Controls</Typography>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <LiveCandle symbol="BTC-USDT" />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                color="success"
                fullWidth
                onClick={() => sendTrade("buy")}
              >
                Buy Market Order
              </Button>
              <Button
                variant="contained"
                color="error"
                fullWidth
                onClick={() => sendTrade("sell")}
              >
                Sell Market Order
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Live Trades List */}
        <Box mt={4}>
          <Typography variant="subtitle1" gutterBottom>📜 Recent Executed Trades</Typography>
          <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
            {liveTrades.map((trade) => (
              <ListItem key={trade.id} sx={{ color: '#ccc' }}>
                <ListItemText
                  primary={
                    <>
                      <Chip
                        label={trade.side.toUpperCase()}
                        color={trade.side === 'buy' ? 'success' : 'error'}
                        size="small"
                        sx={{ marginRight: 1 }}
                      />
                      ${trade.price_executed} | Qty: {trade.quantity}
                    </>
                  }
                  secondary={new Date(trade.timestamp).toLocaleString()}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Paper>

      {/* Charts and Metrics */}
      <Typography variant="h5" gutterBottom>📊 Analytics Dashboard</Typography>

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">📌 Strategy Chart</Typography>
      <BacktestChart data={result.chart_data} strategy={strategy} trades={result.trades} />

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">💹 Equity Curve</Typography>
      <EquityCurveChart data={result.equity_curve} trades={result.trades} />

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">📉 Drawdown Over Time</Typography>
      <DrawdownChart data={result.drawdown_curve} />

      <Divider style={{ margin: '20px 0' }} />
      <PerformanceMetrics result={result} />

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">📋 Trade History</Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={downloadCSV}
        style={{ marginBottom: '12px' }}
      >
        Download Trade Log CSV
      </Button>
      <BacktestTable trades={result.trades} />

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">📉 Trade Return Distribution</Typography>
      <TradeReturnsChart trades={result.trades} />

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">📈 Profit & Loss Over Time</Typography>
      <PnLChart trades={result.trades} />

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">🕯️ Live OHLCV Feed</Typography>
      <LiveCandleChart />
    </div>
  );
};

export default AnalyticsDashboard;
