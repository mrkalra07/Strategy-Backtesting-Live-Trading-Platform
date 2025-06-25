import { useEffect, useRef, useState } from 'react';

export function useBacktestWebSocket({ payload, onMessage, onComplete, enabled }) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const ws = new window.WebSocket('ws://localhost:8000/ws');
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (onMessage) onMessage(msg);
      if (msg.status === 'portfolio_completed') {
        if (onComplete) onComplete(msg);
        ws.close();
      }
    };

    ws.onerror = (e) => {
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
    };
    // eslint-disable-next-line
  }, [enabled]);

  return { connected };
}
