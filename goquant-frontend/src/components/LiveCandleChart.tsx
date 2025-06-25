import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, UTCTimestamp } from 'lightweight-charts';

type Candle = {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
};

type Props = {
  symbol: string;
};

const LiveCandleChart: React.FC<Props> = ({ symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 🧹 Cleanup old chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
  width: 800,
  height: 300,
  layout: {
    background: { color: '#ffffff' },
    textColor: '#000',
  },
  grid: {
    vertLines: { color: '#eee' },
    horzLines: { color: '#eee' },
  },
  timeScale: {
    borderColor: '#ccc',
    timeVisible: true,         // 👈 makes x-axis show HH:MM:SS
    secondsVisible: true,      // 👈 shows seconds too
  },
  watermark: {
    visible: false,
  },
});


    const series = chart.addCandlestickSeries();
    chartRef.current = chart;
    seriesRef.current = series;

    chart.timeScale().fitContent();

    return () => {
      // Clean chart on unmount
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [symbol]);

  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.close();
    }

    const socket = new WebSocket('ws://localhost:8000/ws/ohlcv');
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const candle: Candle = JSON.parse(event.data);
        if (candle.symbol === symbol && seriesRef.current && chartRef.current) {
          const time = Math.floor(new Date(candle.timestamp).getTime() / 1000) as UTCTimestamp;
          seriesRef.current.update({
            time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          });

          chartRef.current.timeScale().fitContent();
        }
      } catch (e) {
        console.error("Error parsing candle data", e);
      }
    };

    return () => {
      socket.close();
    };
  }, [symbol]);

  return (
    <div>
      <h3>{symbol} Live OHLCV</h3>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default LiveCandleChart;
