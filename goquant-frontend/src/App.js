import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Layout from './components/Layout';
import UploadCSV from './components/UploadCSV';
import StrategySelector from './components/StrategySelector';
import StrategyBuilder from './components/StrategyBuilder/StrategyBuilder';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LiveTradingDashboard from './components/LiveTradingDashboard';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import { Typography } from '@mui/material';

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
      console.log("📤 Sending payload to backend:", payload);
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
    <DndProvider backend={HTML5Backend}>
      <Router>
        <Layout>
          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Typography variant="h5" gutterBottom>
                    Upload OHLCV Data
                  </Typography>
                  <UploadCSV onUploadSuccess={handleUploadSuccess} />

                  {uploadedData && (
                    <>
                      <StrategySelector onRunBacktest={handleRunBacktest} />
                      <StrategyBuilder onBuild={handleCustomStrategy} />
                    </>
                  )}

                  {backtestResult && (
                    <AnalyticsDashboard result={backtestResult} strategy={strategy} />
                  )}
                </>
              }
            />
            <Route path="/live-trading" element={<LiveTradingDashboard />} />
          </Routes>
        </Layout>
      </Router>
    </DndProvider>
  );
}

export default App;
