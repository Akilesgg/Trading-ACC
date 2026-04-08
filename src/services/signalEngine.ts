import { fetchKlines } from "./cryptoService";
import { TradingSignal, SignalStatus } from "../core/signals/types";

export interface IndicatorData {
  rsi: number;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
  };
  ema20: number;
  ema50: number;
  ema200: number;
}

export function calculateEMA(data: number[], period: number): number {
  const k = 2 / (period + 1);
  let ema = data[0];
  for (let i = 1; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }
  return ema;
}

export function calculateRSI(data: number[], period: number = 14): number {
  if (data.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateMACD(data: number[]) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  const macd = ema12 - ema26;
  // Simplified signal line (usually EMA 9 of MACD values, but we'll use a simpler approach for now)
  const signal = macd * 0.9; 
  return {
    macd,
    signal,
    histogram: macd - signal
  };
}

export function detectSMC(klines: any[]) {
  if (klines.length < 10) return "NONE";

  const last = klines[klines.length - 1];
  const prev = klines[klines.length - 2];
  const high3 = Math.max(...klines.slice(-5, -1).map(k => k.high));
  const low3 = Math.min(...klines.slice(-5, -1).map(k => k.low));

  if (last.close > high3) return "BOS";
  if (last.close < low3) return "BOS";
  
  // CHoCH detection (Change of Character)
  // Simplified: if price breaks a major swing high/low after a trend
  return "NONE";
}

export async function generateSignal(symbol: string, timeframe: string = "1h"): Promise<TradingSignal | null> {
  try {
    const klines = await fetchKlines(symbol, timeframe, 100);
    const closes = klines.map((k: any) => k.close);
    
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const smc = detectSMC(klines);
    
    const price = closes[closes.length - 1];
    let score = 50;
    let type: "LONG" | "SHORT" = "LONG";
    
    // Scoring logic
    if (rsi < 35) score += 15;
    if (rsi > 65) { score += 15; type = "SHORT"; }
    if (macd.histogram > 0) score += 10;
    if (macd.histogram < 0 && type === "SHORT") score += 10;
    if (smc === "BOS") score += 20;
    if (price > ema50) score += 10;
    if (price < ema50 && type === "SHORT") score += 10;

    if (score < 70) return null;

    const isLong = type === "LONG";
    const entry = price;
    const sl = isLong ? price * 0.985 : price * 1.015;
    const tp = isLong 
      ? [price * 1.01, price * 1.03, price * 1.06]
      : [price * 0.99, price * 0.97, price * 0.94];

    return {
      id: `${symbol}-${Date.now()}`,
      symbol,
      type,
      entry,
      stopLoss: sl,
      takeProfit: tp,
      riskReward: Math.abs(tp[1] - entry) / Math.abs(entry - sl),
      score,
      status: SignalStatus.CONFIRMED,
      timestamp: Date.now(),
      explanation: `Señal generada por confluencia de ${smc === "BOS" ? "BOS" : ""} + RSI ${rsi.toFixed(0)} + MACD.`,
      indicators: {
        rsi: Math.round(rsi),
        macd: macd.histogram > 0 ? "BULLISH" : "BEARISH",
        emaTrend: price > ema50 ? "BULLISH" : "BEARISH",
        volume: klines[klines.length - 1].volume > klines[klines.length - 2].volume ? "HIGH" : "NORMAL",
        smc
      }
    };
  } catch (error) {
    console.error("Error generating signal:", error);
    return null;
  }
}
