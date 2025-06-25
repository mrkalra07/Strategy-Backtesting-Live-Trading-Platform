import React, { useEffect, useState } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from '@mui/material';

type Position = {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price_executed: number;
  current_price: number;
  unrealized_pnl: number;
};

const OpenPositions: React.FC = () => {
  const [positions, setPositions] = useState<Position[]>([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/positions');

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPositions(data);
    };

    return () => socket.close();
  }, []);

  return (
    <Paper elevation={3} style={{ padding: 16, marginTop: 24 }}>
      <Typography variant="h6" gutterBottom>📊 Open Positions (Real-Time)</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Symbol</TableCell>
            <TableCell>Side</TableCell>
            <TableCell>Qty</TableCell>
            <TableCell>Entry</TableCell>
            <TableCell>Current</TableCell>
            <TableCell>PnL</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {positions.map((pos) => (
            <TableRow key={pos.id}>
              <TableCell>{pos.symbol}</TableCell>
              <TableCell>
                <Chip
                  label={pos.side.toUpperCase()}
                  color={pos.side === 'buy' ? 'success' : 'error'}
                  size="small"
                />
              </TableCell>
              <TableCell>{pos.quantity}</TableCell>
              <TableCell>${pos.price_executed.toFixed(2)}</TableCell>
              <TableCell>${pos.current_price.toFixed(2)}</TableCell>
              <TableCell
                style={{ color: pos.unrealized_pnl >= 0 ? 'green' : 'red' }}
              >
                ${pos.unrealized_pnl.toFixed(2)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default OpenPositions;
