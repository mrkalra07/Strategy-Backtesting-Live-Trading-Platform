import React, { useState } from 'react';
import {
  Typography,
  Divider,
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  Card,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import BacktestChart from './BacktestChart';
import EquityCurveChart from './EquityCurveChart';
import PerformanceMetrics from './PerformanceMetrics';
import BacktestTable from './BacktestTable';
import DrawdownChart from './DrawdownChart';
import TradeReturnsChart from './TradeReturnsChart';
import PnLChart from './PnLChart';
import RollingSharpeChart from './RollingSharpeChart';
import RiskHeatmap from './RiskHeatmap';

const AnalyticsDashboard = ({ result, strategy }) => {
  const [view, setView] = useState('portfolio');
  const navigate = useNavigate();
  if (!result || !result.portfolio) return null;
  const portfolio = result.portfolio;

  // Fallbacks for missing chart_data/drawdown_curve in portfolio
  const firstSymbol = Object.values(result.per_symbol || {})[0] || {};
  const portfolioChartData = portfolio.chart_data || firstSymbol.chart_data || [];
  const portfolioDrawdownCurve = portfolio.drawdown_curve || firstSymbol.drawdown_curve || [];

  const downloadCSV = () => {
    const trades = portfolio?.trades || [];
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

  const handleTabChange = (e, newValue) => setView(newValue);

  const currentData =
    view === 'portfolio' ? result.portfolio : result.per_symbol[view] || {};

  return (
    <div style={{ marginTop: 32 }}>
      <Typography variant="h4" gutterBottom align="center" color="primary">
        📊 Analytics Dashboard (Portfolio)
      </Typography>
      <Divider style={{ margin: '24px 0' }} />
      <Tabs
        value={view}
        onChange={handleTabChange}
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="Portfolio" value="portfolio" />
        {Object.keys(result.per_symbol || {}).map((s) => (
          <Tab key={s} label={s} value={s} />
        ))}
      </Tabs>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">📌 Strategy Chart</Typography>
        <BacktestChart data={portfolioChartData} strategy={strategy} trades={portfolio.trades} />
      </Box>
      <Divider style={{ margin: '20px 0' }} />
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">💹 Equity Curve</Typography>
        <EquityCurveChart data={portfolio.equity_curve} trades={portfolio.trades} />
      </Box>
      <Divider style={{ margin: '20px 0' }} />
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">📉 Drawdown Over Time</Typography>
        <DrawdownChart data={portfolioDrawdownCurve} />
      </Box>
      <Divider style={{ margin: '20px 0' }} />
      <Box sx={{ mb: 3 }}>
        <PerformanceMetrics result={portfolio} />
      </Box>
      <Divider style={{ margin: '20px 0' }} />
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">📋 Trade History</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={downloadCSV}
          style={{ marginBottom: '12px' }}
        >
          Download Trade Log CSV
        </Button>
        <BacktestTable trades={portfolio.trades} />
      </Box>
      <Divider style={{ margin: '20px 0' }} />
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">📉 Trade Return Distribution</Typography>
        <TradeReturnsChart trades={portfolio.trades} />
      </Box>
      <Divider style={{ margin: '20px 0' }} />
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6">📈 Profit & Loss Over Time</Typography>
        <PnLChart trades={portfolio.trades} />
      </Box>
      <Card sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Rolling Sharpe Ratio</Typography>
        <RollingSharpeChart data={currentData.rolling_sharpe || []} />
      </Card>
      <Card sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Risk Heatmap</Typography>
        <RiskHeatmap perSymbol={result.per_symbol || {}} />
      </Card>
      {/* Per-symbol breakdown */}
      {result.per_symbol && (
        <>
          <Divider style={{ margin: '32px 0' }} />
          <Typography variant="h4" gutterBottom align="center" color="secondary">
            🪙 Per-Symbol Breakdown
          </Typography>
          {Object.entries(result.per_symbol).map(([symbol, symResult]) => (
            <Accordion key={symbol} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{symbol}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="subtitle1" gutterBottom>📊 Performance Metrics</Typography>
                <PerformanceMetrics result={symResult} />
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>📋 Trade History</Typography>
                <BacktestTable trades={symResult.trades} />
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>📉 Trade Return Distribution</Typography>
                <TradeReturnsChart trades={symResult.trades} />
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>📈 Profit & Loss Over Time</Typography>
                <PnLChart trades={symResult.trades} />
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>📉 Drawdown Over Time</Typography>
                <DrawdownChart data={symResult.drawdown_curve} />
              </AccordionDetails>
            </Accordion>
          ))}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
