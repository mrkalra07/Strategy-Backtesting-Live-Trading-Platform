import React from 'react';
import { Typography, Divider, Button } from '@mui/material';
import BacktestChart from './BacktestChart';
import EquityCurveChart from './EquityCurveChart';
import PerformanceMetrics from './PerformanceMetrics';
import BacktestTable from './BacktestTable';
import DrawdownChart from './DrawdownChart';
import TradeReturnsChart from './TradeReturnsChart';
import PnLChart from './PnLChart';

const AnalyticsDashboard = ({ result, strategy }) => {
  if (!result) return null;

  const downloadCSV = () => {
    const trades = result?.trades || [];
    if (trades.length === 0) return;

    const headers = Object.keys(trades[0]).join(',');
    const rows = trades.map(trade =>
      Object.values(trade).map(val => `"${val}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'trades_log.csv');
    link.click();
  };

  return (
    <div style={{ marginTop: 32 }}>
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
      <Divider style={{ margin: '20px 0' }} />
    <Typography variant="h6">📉 Trade Return Distribution</Typography>
    <TradeReturnsChart trades={result.trades} />

    <Divider style={{ margin: '20px 0' }} />
    <Typography variant="h6">📈 Profit & Loss Over Time</Typography>
    <PnLChart trades={result.trades} />
      <BacktestTable trades={result.trades} />
    </div>
  );
};

export default AnalyticsDashboard;
