import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const PnLChart = ({ trades }) => {
  const pnlData = [];
  let cumulative = 0;
  trades.forEach((trade, i) => {
    if (trade.profit !== undefined) {
      cumulative += trade.profit;
      pnlData.push({ index: i + 1, pnl: cumulative });
    }
  });

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={pnlData}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="index" label={{ value: 'Trade #', position: 'insideBottomRight', offset: -10 }} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="pnl" stroke="#4caf50" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PnLChart;
