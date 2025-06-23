import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import UploadCSV from './components/UploadCSV';
import StrategySelector from './components/StrategySelector';
import StrategyBuilder from './components/StrategyBuilder';
import BacktestChart from './components/BacktestChart';
import EquityCurveChart from './components/EquityCurveChart';
import PerformanceMetrics from './components/PerformanceMetrics';
import BacktestTable from './components/BacktestTable';
import { Typography } from '@mui/material';
import AnalyticsDashboard from './components/AnalyticsDashboard';

function App() {
  const [uploadedData, setUploadedData] = useState(null);
  const [strategy, setStrategy] = useState(null);
  const [customLogic, setCustomLogic] = useState(null);
  const [backtestResult, setBacktestResult] = useState(null);

  const handleUploadSuccess = (data) => {
    setUploadedData(data);
  };

  const handleCustomStrategy = (logic) => {
    console.log("🛠️ Custom strategy built:", logic);
    setCustomLogic(logic);
    handleRunBacktest({ strategy: 'custom' });
  };

  const handleRunBacktest = async (config) => {
    const selectedStrategy = config.strategy;
    setStrategy(selectedStrategy);

    const payload = {
      ...config,
      data: uploadedData,
    };

    if (selectedStrategy === 'custom') {
      if (!customLogic) {
        console.warn("⚠️ No custom logic provided.");
        return;
      }
      payload.logic = customLogic;
    }

    try {
      const res = await fetch('http://localhost:8000/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setBacktestResult(result);
        console.log('✅ Backtest completed');
      } else {
        console.error('❌ Backtest failed with status:', res.status);
      }
    } catch (err) {
      console.error('❌ Error during backtest:', err);
    }
  };

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>
        Upload OHLCV Data
      </Typography>
      <UploadCSV onUploadSuccess={handleUploadSuccess} />

      {uploadedData && (
        <>
          <StrategySelector onRunBacktest={handleRunBacktest} />
          {strategy === 'custom' && <StrategyBuilder onBuild={handleCustomStrategy} />}
        </>
      )}

      {backtestResult && (
        <AnalyticsDashboard result={backtestResult} strategy={strategy} />
      )}
    </Layout>
  );
}

export default App;
