// src/components/LiveTradingDashboard.tsx
import React, { useState } from 'react';
import {
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import LiveCandle from './LiveCandle';
import LiveCandleChart from './LiveCandleChart';

type LiveTrade = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: string;
  quantity: number;
  sl: number;
  tp: number;
  price_executed: number;
  timestamp: string;
  status: string;
};

const LiveTradingDashboard: React.FC = () => {
  const [liveTrades, setLiveTrades] = useState<LiveTrade[]>([]);

  const sendTrade = async (side: 'buy' | 'sell') => {
    const socket = new WebSocket("ws://localhost:8000/ws/live-trading");

    socket.onopen = () => {
      const order = {
        symbol: "BTC-USDT",
        side,
        type: "market",
        quantity: 1,
        sl: 24000,
        tp: 26000,
      };
      socket.send(JSON.stringify(order));
    };

    socket.onmessage = (event) => {
      const response = JSON.parse(event.data);
      alert(`✅ ${side.toUpperCase()} executed at $${response.trade.price_executed}`);
      setLiveTrades(prev => [response.trade, ...prev.slice(0, 9)]);
      socket.close();
    };
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography variant="h4" gutterBottom>📡 Live Trading Dashboard</Typography>
      <Divider style={{ margin: '20px 0' }} />

      <Paper elevation={3} style={{ padding: 16, marginBottom: 24 }}>
        <Typography variant="h6" gutterBottom>Live Price & Controls</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <LiveCandle symbol="BTC-USDT" />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box display="flex" gap={2}>
              <Button variant="contained" color="success" fullWidth onClick={() => sendTrade("buy")}>
                Buy Market Order
              </Button>
              <Button variant="contained" color="error" fullWidth onClick={() => sendTrade("sell")}>
                Sell Market Order
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} style={{ padding: 16, marginBottom: 24 }}>
        <Typography variant="h6" gutterBottom>Live OHLCV Candle Chart</Typography>
        <LiveCandleChart />
      </Paper>

      <Paper elevation={3} style={{ padding: 16 }}>
        <Typography variant="h6" gutterBottom>Recent Executed Trades</Typography>
        <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
          {liveTrades.map((trade) => (
            <ListItem key={trade.id}>
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
                secondary={new Date(trade.timestamp).toLocaleTimeString()}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    </div>
  );
};

export default LiveTradingDashboard;
