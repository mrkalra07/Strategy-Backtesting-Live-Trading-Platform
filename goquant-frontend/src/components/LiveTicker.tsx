import React from "react";
import { useLiveFeed } from "../hooks/useLiveFeed";

const LiveTicker = ({ symbol }: { symbol: string }) => {
  const { price, timestamp } = useLiveFeed(symbol);

  return (
    <div style={{ padding: "1rem", background: "#101010", color: "lime", borderRadius: 8 }}>
      <strong>{symbol}:</strong> {price !== null ? `$${price.toFixed(2)}` : "Loading..."}
      <div style={{ fontSize: 12, marginTop: 4 }}>{timestamp}</div>
    </div>
  );
};

export default LiveTicker;
