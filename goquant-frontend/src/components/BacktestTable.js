import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Typography } from '@mui/material';

const BacktestTable = ({ trades }) => {
  if (!trades?.length) return null;

  return (
    <Paper sx={{ mt: 4, p: 2 }}>
      <Typography variant="h6" gutterBottom>Backtest Trades</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Price</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trades.map((trade, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(trade.timestamp).toLocaleDateString()}</TableCell>
              <TableCell>{trade.action}</TableCell>
              <TableCell>{trade.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};

export default BacktestTable;
