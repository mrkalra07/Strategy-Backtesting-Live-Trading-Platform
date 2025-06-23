import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const TradeReturnsChart = ({ trades }) => {
  const histogramData = Array(20).fill(0);
  trades.forEach(trade => {
    if (trade.return !== undefined) {
      const bin = Math.floor((trade.return + 1) * 10); // range -1 to +1 -> bins 0–20
      if (bin >= 0 && bin < histogramData.length) {
        histogramData[bin]++;
      }
    }
  });

  const formatted = histogramData.map((count, i) => ({
    range: `${(i / 10 - 1).toFixed(1)} to ${(i / 10 - 0.9).toFixed(1)}`,
    count
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="range" angle={-45} textAnchor="end" height={60} />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TradeReturnsChart;
