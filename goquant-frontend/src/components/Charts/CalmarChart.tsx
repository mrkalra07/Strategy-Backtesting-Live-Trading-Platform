// src/components/Charts/CalmarChart.tsx
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const CalmarChart = ({ data = [] }) => {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey="calmar" stroke="#4caf50" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default CalmarChart;
