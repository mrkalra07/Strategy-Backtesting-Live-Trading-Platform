import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RollingSharpeChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="sharpe" stroke="#1890ff" name="Rolling Sharpe" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RollingSharpeChart;
