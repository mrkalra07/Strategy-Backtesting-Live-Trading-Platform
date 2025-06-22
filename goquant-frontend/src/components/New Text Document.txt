// frontend/components/EquityCurveChart.js

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Typography, Paper } from '@mui/material';

const EquityCurveChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <Paper elevation={3} style={{ padding: '1rem', marginTop: '2rem' }}>
      <Typography variant="h6" gutterBottom>Equity Curve</Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="equity" stroke="#4caf50" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default EquityCurveChart;
