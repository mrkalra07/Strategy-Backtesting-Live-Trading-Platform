import React, { useState } from 'react';
import Layout from './components/Layout';
import UploadCSV from './components/UploadCSV';
import StrategySelector from './components/StrategySelector';
import BacktestTable from './components/BacktestTable';
import BacktestChart from './components/BacktestChart';
import { Typography } from '@mui/material';
import PerformanceMetrics from './components/PerformanceMetrics';


function App() {
  const [uploadedData, setUploadedData] = useState(null);
  const [backtestResult, setBacktestResult] = useState(null);
  const [strategy, setStrategy] = useState(null);


  const handleUploadSuccess = (data) => {
    setUploadedData(data);
    console.log('CSV uploaded successfully');
  };

  const handleRunBacktest = async (strategy) => {
    setStrategy(strategy);
    try {
      const res = await fetch('http://localhost:8000/backtest', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    strategy,
    data: uploadedData,
  }),
});

      if (res.ok) {
        const result = await res.json();
        setBacktestResult(result);
        console.log('Backtest completed');
      } else {
        console.error('Backtest failed with status:', res.status);
      }
    } catch (err) {
      console.error('Error during backtest:', err);
    }
  };

  return (
    <Layout>
      <Typography variant="h5" gutterBottom>
        Upload OHLCV Data
      </Typography>

      <UploadCSV onUploadSuccess={handleUploadSuccess} />

      {uploadedData && (
        <StrategySelector onRunBacktest={handleRunBacktest} />
      )}

      {backtestResult?.chart_data && (
        <BacktestChart data={backtestResult.chart_data} strategy={strategy} />
      )}
      {backtestResult && (
        <PerformanceMetrics result={backtestResult} />
      )}
      {backtestResult?.trades && (
        <BacktestTable trades={backtestResult.trades} />
      )}
    </Layout>
  );
}

export default App;
