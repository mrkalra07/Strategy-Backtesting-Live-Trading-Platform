import React from 'react';
import { Grid, Card, Typography } from '@mui/material';

const MetricCard = ({ label, value }) => (
  <Card sx={{ p: 2, mb: 2 }}>
    <Typography variant="subtitle2" color="text.secondary">{label}</Typography>
    <Typography variant="h6">{value}</Typography>
  </Card>
);

const formatNumber = (val, fallback = 'N/A') =>
  val === null || val === undefined || isNaN(val) ? fallback : Number(val).toLocaleString(undefined, { maximumFractionDigits: 4 });

const PerformanceMetrics = ({ result }) => {
  if (!result) return null;
  const metrics = result;

  return (
    <div style={{ marginTop: 32 }}>
      <Typography variant="h6" gutterBottom>
        📊 Performance Metrics
      </Typography>

      <Typography variant="body1" style={{ marginBottom: 16 }}>
        📈 <strong>Cumulative Return:</strong>{' '}
        {result.trades.length > 0 && result.trades[0].entry_price
          ? `${((metrics.total_profit / result.trades[0].entry_price) * 100).toFixed(2)}%`
          : 'N/A'}
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Total Profit" value={formatNumber(metrics.total_profit)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Avg Trade Profit" value={formatNumber(metrics.avg_trade_profit)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Win Rate (%)" value={formatNumber(metrics.win_rate)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Max Drawdown" value={formatNumber(metrics.max_drawdown)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Sharpe Ratio" value={formatNumber(metrics.sharpe_ratio)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Sortino Ratio" value={formatNumber(metrics.sortino_ratio)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Profit Factor" value={formatNumber(metrics.profit_factor)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Avg Holding Time" value={typeof metrics.average_holding_time === 'number' ? `${metrics.average_holding_time.toFixed(2)} bars` : '0 bars'} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Max Consecutive Wins" value={metrics.max_consecutive_wins ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Max Consecutive Losses" value={metrics.max_consecutive_losses ?? 0} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Number of Trades" value={metrics.num_trades ?? 0} />
        </Grid>

        {/* New Risk Metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="VaR (95%)" value={metrics.var_95 !== undefined && metrics.var_95 !== null ? `${(metrics.var_95 * 100).toFixed(2)}%` : 'N/A'} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Beta" value={metrics.beta !== undefined && metrics.beta !== null ? metrics.beta.toFixed(3) : 'N/A'} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Calmar Ratio" value={formatNumber(metrics.calmar_ratio)} />
        </Grid>

        {/* ✅ New Metrics */}
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Turnover" value={formatNumber(metrics.turnover)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Leverage" value={formatNumber(metrics.leverage)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Alpha" value={formatNumber(metrics.alpha)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="CVaR (95%)" value={formatNumber(metrics.cvar_95)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Annualized Return" value={formatNumber(metrics.annualized_return)} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <MetricCard label="Annualized Volatility" value={formatNumber(metrics.annualized_volatility)} />
        </Grid>
      </Grid>
    </div>
  );
};

export default PerformanceMetrics;
