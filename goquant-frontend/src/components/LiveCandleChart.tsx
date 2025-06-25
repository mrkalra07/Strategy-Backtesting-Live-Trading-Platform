import React, { useEffect, useRef } from 'react';
import { createChart, IChartApi, UTCTimestamp, CandlestickSeriesOptions, Time } from 'lightweight-charts';

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

  useEffect(() => {
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
      },
      // 👇 Disable TradingView watermark
      watermark: {
        visible: false,
      },
    });

    const series = chart.addCandlestickSeries();
    chartRef.current = chart;
    seriesRef.current = series;

    return () => chart.remove();
  }, []);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/ohlcv');

    socket.onmessage = (event) => {
      try {
        const candle: Candle = JSON.parse(event.data);
        if (candle.symbol === symbol && seriesRef.current) {
          const time = Math.floor(new Date(candle.timestamp).getTime() / 1000) as UTCTimestamp;
          seriesRef.current.update({
            time,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          });
        }
      } catch (e) {
        console.error("Error parsing candle data", e);
      }
    };

    return () => socket.close();
  }, [symbol]);

  return (
    <div>
      <h3>{symbol} Live OHLCV</h3>
      <div ref={chartContainerRef} />
    </div>
  );
};

export default LiveCandleChart;
