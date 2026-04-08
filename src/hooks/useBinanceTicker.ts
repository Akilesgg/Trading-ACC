import { useState, useEffect, useRef } from 'react';

export interface TickerData {
  symbol: string;
  price: string;
  priceChangePercent: string;
  high: string;
  low: string;
  volume: string;
}

export const useBinanceTicker = (symbol: string) => {
  const [ticker, setTicker] = useState<TickerData | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const lowerSymbol = symbol.toLowerCase();
    const url = `wss://stream.binance.com:9443/ws/${lowerSymbol}@ticker`;

    ws.current = new WebSocket(url);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTicker({
        symbol: data.s,
        price: data.c,
        priceChangePercent: data.P,
        high: data.h,
        low: data.l,
        volume: data.v,
      });
    };

    ws.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [symbol]);

  return ticker;
};
