import React, { useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';

const StrategyBuilder = ({ onBuild }) => {
  const [indicator, setIndicator] = useState('');
  const [operator, setOperator] = useState('');
  const [value, setValue] = useState('');

  const buildLogic = () => {
    if (!indicator || !operator || !value) {
      alert("Please fill all fields.");
      return;
    }

    let logicStr = `${indicator} ${operator} ${value}`;
    onBuild(logicStr);  // Triggers App.js to store + run
  };

  return (
    <Box mt={2}>
      <FormControl fullWidth margin="dense">
        <InputLabel>Indicator</InputLabel>
        <Select value={indicator} onChange={(e) => setIndicator(e.target.value)}>
          <MenuItem value="rsi">RSI</MenuItem>
          <MenuItem value="macd">MACD</MenuItem>
          <MenuItem value="ema_short">EMA Short</MenuItem>
          <MenuItem value="ema_long">EMA Long</MenuItem>
          <MenuItem value="signal_line">MACD Signal Line</MenuItem>
        </Select>
      </FormControl>

      <FormControl fullWidth margin="dense">
        <InputLabel>Operator</InputLabel>
        <Select value={operator} onChange={(e) => setOperator(e.target.value)}>
          <MenuItem value="<">Less Than</MenuItem>
          <MenuItem value=">">Greater Than</MenuItem>
          <MenuItem value="==">Equal To</MenuItem>
          <MenuItem value="crosses above">Crosses Above</MenuItem>
          <MenuItem value="crosses below">Crosses Below</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Value or Indicator"
        fullWidth
        margin="dense"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. 30 or ema_long"
      />

      <Button variant="contained" sx={{ mt: 2 }} onClick={buildLogic}>
        Build & Run Strategy
      </Button>
    </Box>
  );
};

export default StrategyBuilder;
