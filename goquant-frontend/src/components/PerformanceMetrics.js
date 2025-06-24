import React from 'react';
import { Grid, Paper, Typography } from '@mui/material';

const MetricCard = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <Paper style={{ padding: 16, textAlign: 'center' }}>
    <Typography variant="subtitle2">{label}</Typography>
    <Typography variant="h6" color="primary">{value}</Typography>
  </Paper>
);

const formatNumber = (val: number | null | undefined, fallback = 'N/A') =>
  typeof val === 'number' && !isNaN(val) ? val.toFixed(2) : fallback;

const PerformanceMetrics = ({ result }: { result: any }) => {
  const {
    total_profit,
    num_trades,
    avg_trade_profit,
    win_rate,
    max_drawdown,
    sharpe_ratio,
    sortino_ratio,
    profit_factor,
    average_holding_time,
    max_consecutive_wins,
    max_consecutive_losses,
    var_95,
    beta,
    calmar_ratio,
    turnover,
    leverage,
  } = result;

  return (
    <div style={{ marginTop: 32 }}>
      <Typography variant="h6" gutterBottom>
        📊 Performance Metrics
      </Typography>

      <Typography variant="body1" style={{ marginBottom: 16 }}>
        📈 <strong>Cumulative Return:</strong>{' '}
        {result.trades.length > 0 && result.trades[0].entry_price
          ? `${((total_profit / result.trades[0].entry_price) * 100).toFixed(2)}%`
          : 'N/A'}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={6} md={3}><MetricCard label="Total Profit" value={formatNumber(total_profit)} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Avg Trade Profit" value={formatNumber(avg_trade_profit)} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Win Rate (%)" value={formatNumber(win_rate)} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Max Drawdown" value={formatNumber(max_drawdown)} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Sharpe Ratio" value={formatNumber(sharpe_ratio)} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Sortino Ratio" value={formatNumber(sortino_ratio)} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Profit Factor" value={formatNumber(profit_factor)} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Avg Holding Time" value={typeof average_holding_time === 'number' ? `${average_holding_time.toFixed(2)} bars` : '0 bars'} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Max Consecutive Wins" value={max_consecutive_wins ?? 0} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Max Consecutive Losses" value={max_consecutive_losses ?? 0} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Number of Trades" value={num_trades ?? 0} /></Grid>

        {/* New Risk Metrics */}
        <Grid item xs={6} md={3}><MetricCard label="VaR (95%)" value={var_95 !== undefined && var_95 !== null ? `${(var_95 * 100).toFixed(2)}%` : 'N/A'} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Beta" value={beta !== undefined && beta !== null ? beta.toFixed(3) : 'N/A'} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Calmar Ratio" value={formatNumber(calmar_ratio)} /></Grid>

        {/* ✅ New Metrics */}
        <Grid item xs={6} md={3}><MetricCard label="Turnover" value={formatNumber(turnover)} /></Grid>
        <Grid item xs={6} md={3}><MetricCard label="Leverage" value={formatNumber(leverage)} /></Grid>
      </Grid>
    </div>
  );
};

export default PerformanceMetrics;
