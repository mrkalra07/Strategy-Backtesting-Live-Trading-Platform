import React, { useEffect, useState } from 'react';

type LiveCandleProps = {
  symbol: string;
};

type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
};

const LiveCandle: React.FC<LiveCandleProps> = ({ symbol }) => {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/ohlcv');

    socket.onmessage = (event) => {
      try {
        const candle: Candle = JSON.parse(event.data);

        if (candle.symbol === symbol) {
          setPrice(candle.close);
        }
      } catch (err) {
        console.error('Error parsing candle data', err);
      }
    };

    return () => socket.close();
  }, [symbol]);

  return (
    <div>
      <h4>{symbol}</h4>
      <p>
        Live Price:{' '}
        {price !== null ? <strong>${price.toFixed(2)}</strong> : 'Loading...'}
      </p>
    </div>
  );
};

export default LiveCandle;
