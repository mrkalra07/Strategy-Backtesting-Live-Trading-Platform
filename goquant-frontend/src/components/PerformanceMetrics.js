// src/components/PerformanceMetrics.js

import React from 'react';
import { Card, CardContent, Typography, Grid } from '@mui/material';

const PerformanceMetrics = ({ result }) => {
  if (!result) return null;

  const {
    total_profit,
    num_trades,
    avg_trade_profit,
    win_rate,
    max_drawdown
  } = result;

  return (
    <Card sx={{ mt: 4 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>Performance Metrics</Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <Typography>Total Profit: ${total_profit.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography>Number of Trades: {num_trades}</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography>Avg Trade Profit: ${avg_trade_profit.toFixed(2)}</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography>Win Rate: {win_rate.toFixed(2)}%</Typography>
          </Grid>
          <Grid item xs={6} sm={4}>
            <Typography>Max Drawdown: ${max_drawdown.toFixed(2)}</Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default PerformanceMetrics;
