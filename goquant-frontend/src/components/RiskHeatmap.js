import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';

const METRICS = [
  { key: 'max_drawdown', label: 'Max Drawdown' },
  { key: 'annualized_volatility', label: 'Annualized Volatility' },
  { key: 'sharpe_ratio', label: 'Sharpe Ratio' },
  { key: 'cvar_95', label: 'CVaR (95%)' },
];

export default function RiskHeatmap({ perSymbol }) {
  const symbols = Object.keys(perSymbol || {});
  if (!symbols.length) return null;
  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Metric</TableCell>
            {symbols.map((s) => (
              <TableCell key={s} align="center">{s}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {METRICS.map((metric) => (
            <TableRow key={metric.key}>
              <TableCell>{metric.label}</TableCell>
              {symbols.map((s) => {
                const value = perSymbol[s]?.[metric.key];
                return (
                  <TableCell key={s} align="center" style={{ background: value == null ? '#eee' : `rgba(255,0,0,${Math.abs(value) / 10})` }}>
                    {value == null || isNaN(value) ? 'N/A' : value.toFixed(2)}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
