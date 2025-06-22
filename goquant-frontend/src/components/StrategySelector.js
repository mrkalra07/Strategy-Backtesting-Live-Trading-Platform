import React, { useState } from 'react';
import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';

const StrategySelector = ({ onRunBacktest }) => {
  const [strategy, setStrategy] = useState('ema');

  const handleRun = () => {
    onRunBacktest(strategy);
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
          <MenuItem value="custom">Custom Strategy</MenuItem>
        </Select>
      </FormControl>

      <Button variant="contained" color="primary" onClick={handleRun}>
        Run Backtest
      </Button>
    </>
  );
};

export default StrategySelector;
