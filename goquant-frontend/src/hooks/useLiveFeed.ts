import { useEffect, useState } from "react";

interface LiveFeedData {
  price: number | null;
  timestamp: string;
}

export const useLiveFeed = (symbol: string): LiveFeedData => {
  const [price, setPrice] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    const interval = setInterval(() => {
      const simulatedPrice = parseFloat((Math.random() * 1000 + 25000).toFixed(2));
      const now = new Date().toLocaleTimeString();
      setPrice(simulatedPrice);
      setTimestamp(now);
    }, 2000); // update every 2 seconds

    return () => clearInterval(interval);
  }, [symbol]);

  return { price, timestamp };
};
