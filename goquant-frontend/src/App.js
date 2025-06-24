import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline, IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';

import Layout from './components/Layout';
import UploadCSV from './components/UploadCSV';
import StrategySelector from './components/StrategySelector';
import StrategyBuilder from './components/StrategyBuilder/StrategyBuilder';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LiveTradingDashboard from './components/LiveTradingDashboard';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  const [uploadedData, setUploadedData] = useState(null);
  const [strategy, setStrategy] = useState('');
  const [backtestResult, setBacktestResult] = useState(null);
  const [mode, setMode] = useState('dark');

  const theme = useMemo(() =>
    createTheme({
      palette: {
        mode: mode,
        ...(mode === 'dark' ? {
          background: { default: '#121212', paper: '#1E1E1E' },
        } : {}),
      }
    }), [mode]);

  const toggleTheme = () => setMode(prev => (prev === 'light' ? 'dark' : 'light'));

  const handleUploadSuccess = (data) => {
    setUploadedData(data);
  };

  const handleRunBacktest = async (config) => {
    const selectedStrategy = config.strategy;
    setStrategy(selectedStrategy);

    const payload = {
      ...config,
      data: uploadedData,
    };

    try {
      const res = await fetch('http://localhost:8000/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setBacktestResult(result);
      } else {
        console.error('Backtest failed with status:', res.status);
      }
    } catch (err) {
      console.error('Error during backtest:', err);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <DndProvider backend={HTML5Backend}>
          <Layout
            toggleTheme={toggleTheme}
            isDarkMode={mode === 'dark'}
          >
            <Routes>
              <Route
                path="/"
                element={
                  <>
                    <UploadCSV onUploadSuccess={handleUploadSuccess} />
                    {uploadedData && (
                      <>
                        <StrategySelector
                          onRunBacktest={handleRunBacktest}
                          setStrategy={setStrategy}
                          strategy={strategy}
                        />
                        {strategy === 'custom' && (
                          <StrategyBuilder
                            uploadedOHLCVData={uploadedData}
                            onResult={(res) => setBacktestResult(res)}
                          />
                        )}
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
        </DndProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
