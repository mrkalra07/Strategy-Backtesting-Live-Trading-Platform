import React, { useEffect, useState } from 'react';

type LiveCandleProps = {
  symbol: string;
};

const LiveCandle = ({ symbol }: LiveCandleProps) => {
  const [price, setPrice] = useState<number | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/ohlcv");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPrice(data.close);
    };

    return () => socket.close();
  }, []);

  return (
    <div>
      <h4>{symbol}</h4>
      <p>Live Price: {price ? `$${price.toFixed(2)}` : "Loading..."}</p>
    </div>
  );
};

export default LiveCandle;
