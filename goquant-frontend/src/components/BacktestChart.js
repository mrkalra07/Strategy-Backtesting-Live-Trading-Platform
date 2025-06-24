//BacktestChart.js
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceDot, Label } from 'recharts';

const BacktestChart = ({ data, strategy, trades = [] }) => {
  if (!data || data.length === 0) return null;

  // Parse date strings into Date objects for sorting consistency
  const parsedData = data.map(d => ({
    ...d,
    date: new Date(d.date),
  }));

  const formattedData = parsedData.map(d => ({
    ...d,
    date: d.date.toISOString().split('T')[0], // Format for x-axis
  }));

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={formattedData}>
          <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="price" stroke="#8884d8" name="Price" dot />
          {strategy === 'MACD' && (
            <Line type="monotone" dataKey="macd" stroke="#FFA500" name="MACD" dot />
          )}

          {/* Trade Markers */}
   {trades.map((trade, index) => {
  const {
    entry_time,
    entry_price,
    exit_time,
    exit_price
  } = trade;

  return (
    <React.Fragment key={index}>
      {/* Entry Marker (Green Dot) */}
      {entry_time && entry_price !== undefined && (
        <ReferenceDot
          x={entry_time}
          y={entry_price}
          r={5}
          fill="green"
          stroke="black"
          strokeWidth={1}
        />
      )}

      {/* Exit Marker (Red Dot) */}
      {exit_time && exit_price !== undefined && (
        <ReferenceDot
          x={exit_time}
          y={exit_price}
          r={5}
          fill="red"
          stroke="black"
          strokeWidth={1}
        />
      )}
    </React.Fragment>
  );
})}



        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BacktestChart;
