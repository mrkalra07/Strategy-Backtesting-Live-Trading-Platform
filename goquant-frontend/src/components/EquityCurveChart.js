import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceDot } from 'recharts';

const EquityCurveChart = ({ data, trades = [] }) => {
  if (!data || data.length === 0) return null;

  // Build a map of timestamps to equity
  const equityMap = new Map(data.map(d => [d.date, d.equity]));

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
          <XAxis dataKey="date" />
          <YAxis domain={['auto', 'auto']} />
          <Tooltip />
          <Line type="monotone" dataKey="equity" stroke="#28a745" dot={false} />

          {/* Entry and Exit Points on Equity Curve */}
          {trades.map((trade, index) => {
            const entryEquity = equityMap.get(trade.entry_time);
            const exitEquity = equityMap.get(trade.exit_time);

            return (
              <React.Fragment key={index}>
                {entryEquity !== undefined && (
                  <ReferenceDot
                    x={trade.entry_time}
                    y={entryEquity}
                    r={5}
                    fill="green"
                    stroke="#000"
                    strokeWidth={1}
                    label={{ value: '', position: 'top' }}
                  />
                )}
                {exitEquity !== undefined && (
                  <ReferenceDot
                    x={trade.exit_time}
                    y={exitEquity}
                    r={5}
                    fill="red"
                    stroke="#000"
                    strokeWidth={1}
                    label={{ value: '', position: 'bottom' }}
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

export default EquityCurveChart;
