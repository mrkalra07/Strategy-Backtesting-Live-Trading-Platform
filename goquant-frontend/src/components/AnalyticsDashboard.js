import React from 'react';
import { Typography, Divider } from '@mui/material';
import BacktestChart from './BacktestChart';
import EquityCurveChart from './EquityCurveChart';
import PerformanceMetrics from './PerformanceMetrics';
import BacktestTable from './BacktestTable';

const AnalyticsDashboard = ({ result, strategy }) => {
  if (!result) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <Typography variant="h5" gutterBottom>📊 Analytics Dashboard</Typography>

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">📌 Strategy Chart</Typography>
      <BacktestChart data={result.chart_data} strategy={strategy} />

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">💹 Equity Curve</Typography>
      <EquityCurveChart data={result.equity_curve} />

      <Divider style={{ margin: '20px 0' }} />
      <PerformanceMetrics result={result} />

      <Divider style={{ margin: '20px 0' }} />
      <Typography variant="h6">📋 Trade History</Typography>
      <BacktestTable trades={result.trades} />
    </div>
  );
};

export default AnalyticsDashboard;
