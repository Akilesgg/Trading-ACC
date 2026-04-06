import { TradingSignal, SignalStatus } from "./types";

export interface ScoringResult {
  score: number;
  indicators: {
    rsi: number;
    macd: number;
    emaTrend: number;
    volume: number;
    smc: number;
  };
}

export const calculateSignalScore = (data: any): ScoringResult => {
  const rsiScore = data.rsi < 30 ? 20 : data.rsi > 70 ? 20 : 10;
  const macdScore = data.macd === "BULLISH" ? 20 : 0;
  const emaTrendScore = data.emaTrend === "BULLISH" ? 20 : 0;
  const volumeScore = data.volume === "HIGH" ? 20 : 10;
  const smcScore = data.smc === "BOS" ? 20 : 10;

  return {
    score: rsiScore + macdScore + emaTrendScore + volumeScore + smcScore,
    indicators: {
      rsi: rsiScore,
      macd: macdScore,
      emaTrend: emaTrendScore,
      volume: volumeScore,
      smc: smcScore,
    }
  };
};

export const validateSignal = (score: number, confirmations: string[]): boolean => {
  if (score < 60) return false;
  if (!confirmations.includes("TREND") || !confirmations.includes("VOLUME")) return false;
  return true;
};
