import React, { useState } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography, Grid } from '@mui/material';

const StrategySelector = ({ onRunBacktest }) => {
  const [strategy, setStrategy] = useState('ema');
  const [slippage, setSlippage] = useState(0.001);     // 0.1%
  const [fees, setFees] = useState(0.001);             // 0.1%
  const [stopLoss, setStopLoss] = useState(0.02);      // 2%
  const [takeProfit, setTakeProfit] = useState(0.04);  // 4%

  const handleRun = () => {
    console.log("Running backtest with:", {
      strategy, slippage, fees, stopLoss, takeProfit
    });
    onRunBacktest({
      strategy,
      slippage,
      fees,
      stop_loss: stopLoss,
      take_profit: takeProfit
    });
  };

  return (
    <>
      <FormControl fullWidth margin="normal">
        <InputLabel>Strategy</InputLabel>
        <Select
          value={strategy}
          label="Strategy"
          onChange={(e) => setStrategy(e.target.value)}
        >
          <MenuItem value="ema">EMA</MenuItem>
          <MenuItem value="rsi">RSI</MenuItem>
          <MenuItem value="macd">MACD</MenuItem>
          <MenuItem value="custom">Custom</MenuItem>
        </Select>
      </FormControl>

      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <TextField
            label="Stop Loss (%)"
            type="number"
            inputProps={{ step: 0.01 }}
            value={stopLoss}
            onChange={(e) => setStopLoss(parseFloat(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="Take Profit (%)"
            type="number"
            inputProps={{ step: 0.01 }}
            value={takeProfit}
            onChange={(e) => setTakeProfit(parseFloat(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="Fees (%)"
            type="number"
            inputProps={{ step: 0.0001 }}
            value={fees}
            onChange={(e) => setFees(parseFloat(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField
            label="Slippage (%)"
            type="number"
            inputProps={{ step: 0.0001 }}
            value={slippage}
            onChange={(e) => setSlippage(parseFloat(e.target.value))}
            fullWidth
          />
        </Grid>
      </Grid>

      <Button
        variant="contained"
        color="primary"
        onClick={handleRun}
        style={{ marginTop: 16 }}
      >
        Run Backtest
      </Button>
    </>
  );
};

export default StrategySelector;
