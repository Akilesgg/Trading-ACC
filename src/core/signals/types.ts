export enum SignalStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  INVALIDATED = "INVALIDATED",
  TP1_HIT = "TP1_HIT",
  TP2_HIT = "TP2_HIT",
  TP3_HIT = "TP3_HIT",
  SL_HIT = "SL_HIT",
  OPEN = "OPEN",
}

export interface TradingSignal {
  id: string;
  symbol: string;
  type: "LONG" | "SHORT";
  entry: number;
  stopLoss: number;
  takeProfit: number[];
  riskReward: number;
  score: number;
  leverage?: number;
  status: SignalStatus;
  profit?: number;
  lastPrice?: number;
  timestamp: number;
  explanation: string;
  indicators: {
    rsi: number;
    macd: string;
    emaTrend: "BULLISH" | "BEARISH" | "NEUTRAL";
    volume: "HIGH" | "LOW" | "NORMAL";
    smc: string;
  };
}
