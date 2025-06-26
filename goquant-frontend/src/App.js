import React, { useState, useMemo } from 'react';
import { createTheme, ThemeProvider, CssBaseline, Box, Button } from '@mui/material';

import Layout from './components/Layout';
import UploadCSV from './components/UploadCSV';
import StrategySelector from './components/StrategySelector';
import StrategyBuilder from './components/StrategyBuilder/StrategyBuilder';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import LiveTradingDashboard from './components/LiveTradingDashboard';
import LiveBacktestPanel from './components/LiveBacktestPanel';
import VisualStrategyBuilder from './components/StrategyBuilder/VisualStrategyBuilder';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

function App() {
  const [uploadedData, setUploadedData] = useState(null);
  const [strategy, setStrategy] = useState('');
  const [backtestResult, setBacktestResult] = useState(null);
  const [mode, setMode] = useState('dark');
  const [useWebSocket, setUseWebSocket] = useState(false);
  const [wsPayload, setWsPayload] = useState(null);
  const [showLivePanel, setShowLivePanel] = useState(false);
  const [showStrategyBuilder, setShowStrategyBuilder] = useState(false);
  const [showVisualBuilder, setShowVisualBuilder] = useState(false);
  const [showLiveTrading, setShowLiveTrading] = useState(false);

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

  // Helper: ensure uploadedData is always {symbol: [ohlcvRows, ...], ...}
  const handleUploadSuccess = (data) => {
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      setUploadedData(data);
    } else if (Array.isArray(data)) {
      const symbol = window.prompt('Enter symbol for uploaded data:', 'SYMBOL1');
      if (symbol) {
        setUploadedData({ [symbol]: data });
      } else {
        setUploadedData({ 'SYMBOL1': data });
      }
    } else {
      setUploadedData(null);
    }
  };

  const handleRunBacktest = async (config) => {
    const selectedStrategy = config.strategy;
    setStrategy(selectedStrategy);
    const payload = {
      ...config,
      data: uploadedData,
    };
    if (useWebSocket) {
      setWsPayload(payload);
      setShowLivePanel(true);
      setBacktestResult(null);
      return;
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
      <DndProvider backend={HTML5Backend}>
        <Layout
          toggleTheme={toggleTheme}
          isDarkMode={mode === 'dark'}
        >
          {showLiveTrading ? (
            <Box sx={{ my: 2 }}>
              <Button variant="outlined" color="secondary" onClick={() => setShowLiveTrading(false)}>
                Back to Main
              </Button>
              <LiveTradingDashboard />
            </Box>
          ) : showVisualBuilder ? (
            <Box sx={{ my: 2 }}>
              <Button variant="outlined" color="secondary" onClick={() => setShowVisualBuilder(false)}>
                Back to Main
              </Button>
              <VisualStrategyBuilder />
            </Box>
          ) : (
            <>
              <UploadCSV onUploadSuccess={handleUploadSuccess} />
              <Box sx={{ my: 2, display: 'flex', gap: 2 }}>
                <Button variant="contained" color="primary" onClick={() => setShowVisualBuilder(true)}>
                  Open Visual Strategy Builder
                </Button>
                <Button variant="contained" color="success" onClick={() => setShowLiveTrading(true)}>
                  Live Trading
                </Button>
              </Box>
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
              {showLivePanel && wsPayload && (
                <LiveBacktestPanel
                  payload={wsPayload}
                  enabled={showLivePanel}
                  onComplete={(result) => {
                    setBacktestResult(result);
                    setShowLivePanel(false);
                  }}
                  onCancel={() => setShowLivePanel(false)}
                />
              )}
              {backtestResult && (
                <AnalyticsDashboard result={backtestResult} strategy={strategy} />
              )}
            </>
          )}
        </Layout>
      </DndProvider>
    </ThemeProvider>
  );
}

export default App;
