import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Typography } from '@mui/material';

const BacktestChart = ({ data, strategy }) => {
  return (
    <>
      <Typography variant="h6" gutterBottom>
        Price Chart with {strategy?.toUpperCase()}
      </Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="price" stroke="#007bff" name="Price" />

          {strategy === 'ema' && (
            <>
              <Line type="monotone" dataKey="ema_short" stroke="#f54291" name="EMA Short" />
              <Line type="monotone" dataKey="ema_long" stroke="#9b59b6" name="EMA Long" />
            </>
          )}

          {strategy === 'rsi' && (
            <Line type="monotone" dataKey="rsi" stroke="#00b894" name="RSI" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </>
  );
};

export default BacktestChart;
