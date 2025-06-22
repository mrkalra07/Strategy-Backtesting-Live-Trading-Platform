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

  const handleCustomLogic = (logic) => {
    setCustomLogic(logic);
  };
  const handleCustomStrategy = (logic) => {
  console.log("🛠️ Custom strategy built:", logic);
  setCustomLogic(logic);
  handleRunBacktest('custom'); // Run backtest immediately!
};

  const handleRunBacktest = async (selectedStrategy) => {
    setStrategy(selectedStrategy);

    const payload = {
      strategy: selectedStrategy,
      data: uploadedData,
    };
    if (selectedStrategy === 'custom') {
      if (!customLogic) {
        alert('Please build your custom strategy first.');
        return;
      }
      payload.logic = customLogic;
    }

    const res = await fetch('http://localhost:8000/backtest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const json = await res.json();
      setBacktestResult(json);
    } else {
      console.error('Backtest error:', await res.text());
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
          {strategy === 'custom' && <StrategyBuilder onBuild={handleCustomLogic} />}
        </>
      )}

      {backtestResult && (
        <AnalyticsDashboard result={backtestResult} strategy={strategy} />
        )}

    </Layout>
  );
}

export default App;
