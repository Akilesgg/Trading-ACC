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

export function calculateEMASeries(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const emaSeries: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    emaSeries.push(data[i] * k + emaSeries[i - 1] * (1 - k));
  }
  return emaSeries;
}

export function calculateMACD(data: number[]) {
  if (data.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 };
  }

  const ema12Series = calculateEMASeries(data, 12);
  const ema26Series = calculateEMASeries(data, 26);
  
  const macdSeries: number[] = [];
  for (let i = 0; i < data.length; i++) {
    macdSeries.push(ema12Series[i] - ema26Series[i]);
  }

  const signalSeries = calculateEMASeries(macdSeries, 9);
  
  const macd = macdSeries[macdSeries.length - 1];
  const signal = signalSeries[signalSeries.length - 1];
  
  return {
    macd,
    signal,
    histogram: macd - signal
  };
}

export function detectSMC(klines: any[]) {
  if (klines.length < 50) return "NONE";

  const last = klines[klines.length - 1];
  
  // Find recent swing highs and lows
  const lookback = 20;
  const recentKlines = klines.slice(-lookback);
  const highest = Math.max(...klines.slice(-50, -1).map(k => k.high));
  const lowest = Math.min(...klines.slice(-50, -1).map(k => k.low));

  // BOS: Break of Structure (Continuation)
  if (last.close > highest) return "BOS_BULLISH";
  if (last.close < lowest) return "BOS_BEARISH";
  
  // CHoCH: Change of Character (Reversal)
  // Simplified: break of the opposite swing after a strong move
  const prevHigh = Math.max(...klines.slice(-40, -20).map(k => k.high));
  const prevLow = Math.min(...klines.slice(-40, -20).map(k => k.low));
  
  if (last.close > prevHigh && klines[klines.length - 10].close < prevLow) return "CHoCH_BULLISH";
  if (last.close < prevLow && klines[klines.length - 10].close > prevHigh) return "CHoCH_BEARISH";

  return "NONE";
}

export function detectMarketRegime(klines: any[]) {
  if (klines.length < 50) return "UNKNOWN";
  
  const closes = klines.map(k => k.close);
  const ema200 = calculateEMA(closes, 200);
  const lastPrice = closes[closes.length - 1];
  
  // ADX-like logic for trending vs ranging
  const high = klines.map(k => k.high);
  const low = klines.map(k => k.low);
  
  let trSum = 0;
  for (let i = 1; i < 14; i++) {
    const tr = Math.max(
      high[high.length - i] - low[low.length - i],
      Math.abs(high[high.length - i] - closes[closes.length - i - 1]),
      Math.abs(low[low.length - i] - closes[closes.length - i - 1])
    );
    trSum += tr;
  }
  const atr = trSum / 14;
  
  const range = Math.max(...closes.slice(-20)) - Math.min(...closes.slice(-20));
  
  if (range < atr * 3) return "RANGING";
  if (lastPrice > ema200) return "TRENDING_UP";
  return "TRENDING_DOWN";
}

export async function generateSignal(symbol: string, timeframe: string = "1h"): Promise<TradingSignal | null> {
  try {
    const klines = await fetchKlines(symbol, timeframe, 100);
    const closes = klines.map((k: any) => k.close);
    
    const rsi = calculateRSI(closes);
    const macd = calculateMACD(closes);
    const ema20 = calculateEMA(closes, 20);
    const ema50 = calculateEMA(closes, 50);
    const ema200 = calculateEMA(closes, 200);
    const smc = detectSMC(klines);
    
    const price = closes[closes.length - 1];
    let score = 50;
    let type: "LONG" | "SHORT" = "LONG";
    
    // Scoring logic (More strict)
    if (rsi < 30) score += 20;
    if (rsi > 70) { score += 20; type = "SHORT"; }
    
    if (macd.histogram > 0) score += 10;
    if (macd.histogram < 0 && type === "SHORT") score += 10;
    
    if (smc.includes("BOS")) score += 25;
    if (smc.includes("CHoCH")) score += 30;
    
    if (price > ema50) score += 10;
    if (price < ema50 && type === "SHORT") score += 10;
    
    // Trend alignment
    if (price > ema200 && type === "LONG") score += 15;
    if (price < ema200 && type === "SHORT") score += 15;

    if (score < 70) return null;

    const isLong = type === "LONG";
    const entry = price;
    
    // Dynamic SL/TP based on ATR (simplified)
    const high = Math.max(...klines.slice(-10).map(k => k.high));
    const low = Math.min(...klines.slice(-10).map(k => k.low));
    const range = high - low;
    
    const sl = isLong ? price - (range * 1.5) : price + (range * 1.5);
    const tp = isLong 
      ? [price + range, price + range * 2, price + range * 4]
      : [price - range, price - range * 2, price - range * 4];

    return {
      id: `${symbol}-${Date.now()}`,
      symbol,
      type,
      entry,
      stopLoss: sl,
      takeProfit: tp,
      riskReward: Math.abs(tp[1] - entry) / Math.abs(entry - sl),
      score: Math.min(score, 99),
      status: SignalStatus.CONFIRMED,
      timestamp: Date.now(),
      explanation: `Señal detectada por confluencia de ${smc} + RSI ${rsi.toFixed(0)} + Alineación EMA.`,
      indicators: {
        rsi: Math.round(rsi),
        macd: macd.histogram > 0 ? "BULLISH" : "BEARISH",
        emaTrend: price > ema200 ? "BULLISH" : "BEARISH",
        volume: klines[klines.length - 1].volume > klines[klines.length - 5].volume ? "HIGH" : "NORMAL",
        smc
      }
    };
  } catch (error) {
    console.error("Error generating signal:", error);
    return null;
  }
}
