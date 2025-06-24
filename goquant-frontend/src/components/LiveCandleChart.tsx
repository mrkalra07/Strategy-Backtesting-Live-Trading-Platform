import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const LiveCandleChart = () => {
  const [data, setData] = useState<Candle[]>([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/live-ohlcv');

    socket.onmessage = (event) => {
      const candle = JSON.parse(event.data);
      setData(prev => [...prev.slice(-29), candle]); // keep last 30 candles
    };

    return () => socket.close();
  }, []);

  return (
    <div>
      <h3>Live OHLCV Feed</h3>
      <LineChart width={800} height={300} data={data}>
        <CartesianGrid stroke="#ccc" />
        <XAxis dataKey="timestamp" tickFormatter={(v) => new Date(v).toLocaleTimeString()} />
        <YAxis domain={['dataMin', 'dataMax']} />
        <Tooltip />
        <Line type="monotone" dataKey="close" stroke="#82ca9d" />
      </LineChart>
    </div>
  );
};

export default LiveCandleChart;
