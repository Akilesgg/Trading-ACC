export enum SignalStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  INVALIDATED = "INVALIDATED",
  TP_HIT = "TP_HIT",
  SL_HIT = "SL_HIT",
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
  status: SignalStatus;
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
