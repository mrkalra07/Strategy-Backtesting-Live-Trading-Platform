import React, { useEffect, useState } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';

type ClosedTrade = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price_executed: number;
  exit_price: number;
  exit_reason: string;
  pnl: number;
  timestamp: string;
};

const ClosedTrades: React.FC = () => {
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);

  useEffect(() => {
    fetch('http://localhost:8000/live/closed-trades')
      .then((res) => res.json())
      .then((data) => setClosedTrades(data));
  }, []);

  return (
    <Paper elevation={3} style={{ padding: 16, marginTop: 24 }}>
      <Typography variant="h6" gutterBottom>📉 Closed Trades (SL/TP)</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Symbol</TableCell>
            <TableCell>Side</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Entry</TableCell>
            <TableCell>Exit</TableCell>
            <TableCell>PnL</TableCell>
            <TableCell>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {closedTrades.map((trade) => (
            <TableRow key={trade.id}>
              <TableCell>{trade.symbol}</TableCell>
              <TableCell>
                <Chip
                  label={trade.side.toUpperCase()}
                  color={trade.side === 'buy' ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
              <TableCell>{trade.quantity}</TableCell>
              <TableCell>${trade.price_executed.toFixed(2)}</TableCell>
              <TableCell>${trade.exit_price.toFixed(2)}</TableCell>
              <TableCell
                style={{ color: trade.pnl >= 0 ? 'green' : 'red' }}
              >
                ${trade.pnl.toFixed(2)}
              </TableCell>
              <TableCell>{trade.exit_reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default ClosedTrades;
