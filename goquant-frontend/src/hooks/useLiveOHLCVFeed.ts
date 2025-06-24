import { useEffect, useState } from "react";

export interface OHLCV {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const useLiveOHLCVFeed = () => {
  const [ohlcv, setOhlcv] = useState<OHLCV | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/live-ohlcv");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setOhlcv(data);
    };

    return () => {
      socket.close();
    };
  }, []);

  return ohlcv;
};

export default useLiveOHLCVFeed;
