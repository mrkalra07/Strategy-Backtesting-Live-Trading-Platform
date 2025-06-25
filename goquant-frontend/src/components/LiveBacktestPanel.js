import React, { useState, useEffect } from 'react';
import { LinearProgress, Box, Typography, Paper, List, ListItem, ListItemText, Button, Tabs, Tab } from '@mui/material';
import { useBacktestWebSocket } from '../hooks/useBacktestWebSocket';

export default function LiveBacktestPanel({ payload, onComplete, enabled, onCancel }) {
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [result, setResult] = useState(null); // holds { portfolio, per_symbol }
  const [tab, setTab] = useState('portfolio');
  const [done, setDone] = useState(false);

  useBacktestWebSocket({
    payload,
    enabled,
    onMessage: (msg) => {
      const msgStr = JSON.stringify(msg, null, 2);
      console.log('[LiveBacktestPanel] WebSocket message:', msgStr);
      if (msg.progress) setProgress(Math.round(msg.progress * 100));
      if (msg.event) setLog((prev) => [...prev, msg]);
      if (msg.interim_metrics) setMetrics(msg.interim_metrics);
      // Treat any message with status 'symbol_completed' and result as completion (legacy/simple mode)
      if (msg.status === 'symbol_completed' && msg.result) {
        setResult({ portfolio: msg.result, per_symbol: { [msg.symbol]: msg.result } });
        setDone(true);
        if (onComplete) onComplete({ portfolio: msg.result, per_symbol: { [msg.symbol]: msg.result } });
      }
    }
  });

  // Fallback: if stuck at 100% for 3s, auto-close
  useEffect(() => {
    if (progress === 100 && !done) {
      console.log('[LiveBacktestPanel] Stuck at 100%, result:', result); // Debug log
      const timer = setTimeout(() => {
        if (!done && result) {
          console.log('[LiveBacktestPanel] Fallback onComplete triggered with result:', result); // Debug log
          if (onComplete) onComplete(result);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [progress, done, result, onComplete]);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6">Live Backtest Progress</Typography>
      <Box sx={{ my: 2 }}>
        <LinearProgress variant="determinate" value={progress} />
        <Typography>{progress}%</Typography>
      </Box>
      <Typography variant="subtitle1">Interim Metrics:</Typography>
      <pre style={{ background: '#222', color: '#fff', padding: 8, borderRadius: 4 }}>
        {JSON.stringify(metrics, null, 2)}
      </pre>
      <Typography variant="subtitle1">Trade Log:</Typography>
      <List dense>
        {log.map((item, idx) => (
          <ListItem key={idx}>
            <ListItemText primary={`${item.symbol || ''} ${item.event || ''} ${item.trade ? JSON.stringify(item.trade) : ''}`} />
          </ListItem>
        ))}
      </List>
      {result && (
        <Box sx={{ mt: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)}>
            <Tab label="Portfolio" value="portfolio" />
            {result.per_symbol && Object.keys(result.per_symbol).map(sym => (
              <Tab key={sym} label={sym} value={sym} />
            ))}
          </Tabs>
          <Box sx={{ mt: 2 }}>
            {tab === 'portfolio' && (
              <>
                <Typography color="success.main">Portfolio backtest complete!</Typography>
                <pre style={{ background: '#222', color: '#fff', padding: 8, borderRadius: 4 }}>
                  {JSON.stringify(result.portfolio, null, 2)}
                </pre>
              </>
            )}
            {tab !== 'portfolio' && result.per_symbol && result.per_symbol[tab] && (
              <>
                <Typography color="info.main">{tab} analytics</Typography>
                <pre style={{ background: '#222', color: '#fff', padding: 8, borderRadius: 4 }}>
                  {JSON.stringify(result.per_symbol[tab], null, 2)}
                </pre>
              </>
            )}
          </Box>
        </Box>
      )}
      {onCancel && (
        <Button variant="outlined" color="error" sx={{ mt: 2 }} onClick={onCancel}>
          Cancel
        </Button>
      )}
    </Paper>
  );
}
