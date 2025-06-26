// src/components/StrategySelector.js
import React, { useState } from 'react';
import {
  Accordion, AccordionSummary, AccordionDetails,
  Typography, FormControl, InputLabel, Select,
  MenuItem, Grid, TextField, Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function StrategySelector({ onRunBacktest, strategy, setStrategy }) {
  const [slippage, setSlippage] = useState(0.001);
  const [fees, setFees] = useState(0.001);
  const [stopLoss, setStopLoss] = useState(0.02);
  const [takeProfit, setTakeProfit] = useState(0.04);

  const handleRun = () => {
    onRunBacktest({
      strategy,
      slippage,
      fees,
      stop_loss: stopLoss,
      take_profit: takeProfit,
    });
  };

  return (
    <Accordion sx={{ mb: 4 }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>Configure Strategy</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Strategy</InputLabel>
          <Select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
            <MenuItem value="ema">EMA</MenuItem>
            <MenuItem value="rsi">RSI</MenuItem>
            <MenuItem value="macd">MACD</MenuItem>
          </Select>
        </FormControl>
        <Grid container spacing={2}>
          {['Stop Loss', 'Take Profit', 'Fees', 'Slippage'].map((label, i) => (
            <Grid item xs={6} sm={3} key={label}>
              <TextField
                label={label + ' (%)'}
                type="number"
                value={[stopLoss, takeProfit, fees, slippage][i]}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  i === 0 && setStopLoss(val);
                  i === 1 && setTakeProfit(val);
                  i === 2 && setFees(val);
                  i === 3 && setSlippage(val);
                }}
                inputProps={{ step: 0.01 }}
                fullWidth
              />
            </Grid>
          ))}
        </Grid>
        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 2 }}
          onClick={handleRun}
        >
          Run Backtest
        </Button>
      </AccordionDetails>
    </Accordion>
  );
}
