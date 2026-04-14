
export interface Pattern {
  name: string;
  type: "ALCISTA" | "BAJISTA" | "NEUTRAL";
  reliability: number;
  status: "En formación" | "Confirmado" | "Fallido";
  entry: number;
  sl: number;
  tp: number;
  action: "LONG" | "SHORT" | "ESPERAR";
  points: { x: number; y: number }[];
}

export interface CandlePattern {
  name: string;
  type: "ALCISTA" | "BAJISTA";
  index: number;
  price: number;
  action: string;
  sl: number;
  tp: number;
}

export function detectPatterns(data: any[]): Pattern[] {
  if (data.length < 20) return [];
  
  const patterns: Pattern[] = [];
  const prices = data.map(d => d.price);
  const lastPrice = prices[prices.length - 1];

  // Simple Double Bottom detection logic
  // Look for two local minima at similar levels
  let min1 = { val: Infinity, idx: -1 };
  let min2 = { val: Infinity, idx: -1 };
  let peak = { val: -Infinity, idx: -1 };

  for (let i = 5; i < prices.length - 10; i++) {
    if (prices[i] < prices[i-1] && prices[i] < prices[i+1]) {
      if (min1.idx === -1 || prices[i] < min1.val) {
        min1 = { val: prices[i], idx: i };
      }
    }
  }

  if (min1.idx !== -1) {
    for (let i = min1.idx + 5; i < prices.length - 5; i++) {
      if (prices[i] > peak.val) {
        peak = { val: prices[i], idx: i };
      }
      if (prices[i] < prices[i-1] && prices[i] < prices[i+1]) {
        if (Math.abs(prices[i] - min1.val) / min1.val < 0.01) {
          min2 = { val: prices[i], idx: i };
        }
      }
    }
  }

  if (min1.idx !== -1 && min2.idx !== -1 && peak.idx !== -1 && peak.idx > min1.idx && peak.idx < min2.idx) {
    const isConfirmed = lastPrice > peak.val;
    patterns.push({
      name: "Doble Suelo",
      type: "ALCISTA",
      reliability: 85,
      status: isConfirmed ? "Confirmado" : "En formación",
      entry: peak.val,
      sl: Math.min(min1.val, min2.val) * 0.99,
      tp: peak.val + (peak.val - Math.min(min1.val, min2.val)) * 2,
      action: isConfirmed ? "LONG" : "ESPERAR",
      points: [
        { x: min1.idx, y: min1.val },
        { x: peak.idx, y: peak.val },
        { x: min2.idx, y: min2.val }
      ]
    });
  }

  // Double Top
  let max1 = { val: -Infinity, idx: -1 };
  let max2 = { val: -Infinity, idx: -1 };
  let valley = { val: Infinity, idx: -1 };

  for (let i = 5; i < prices.length - 10; i++) {
    if (prices[i] > prices[i-1] && prices[i] > prices[i+1]) {
      if (max1.idx === -1 || prices[i] > max1.val) {
        max1 = { val: prices[i], idx: i };
      }
    }
  }

  if (max1.idx !== -1) {
    for (let i = max1.idx + 5; i < prices.length - 5; i++) {
      if (prices[i] < valley.val) {
        valley = { val: prices[i], idx: i };
      }
      if (prices[i] > prices[i-1] && prices[i] > prices[i+1]) {
        if (Math.abs(prices[i] - max1.val) / max1.val < 0.01) {
          max2 = { val: prices[i], idx: i };
        }
      }
    }
  }

  if (max1.idx !== -1 && max2.idx !== -1 && valley.idx !== -1 && valley.idx > max1.idx && valley.idx < max2.idx) {
    const isConfirmed = lastPrice < valley.val;
    patterns.push({
      name: "Doble Techo",
      type: "BAJISTA",
      reliability: 82,
      status: isConfirmed ? "Confirmado" : "En formación",
      entry: valley.val,
      sl: Math.max(max1.val, max2.val) * 1.01,
      tp: valley.val - (Math.max(max1.val, max2.val) - valley.val) * 2,
      action: isConfirmed ? "SHORT" : "ESPERAR",
      points: [
        { x: max1.idx, y: max1.val },
        { x: valley.idx, y: valley.val },
        { x: max2.idx, y: max2.val }
      ]
    });
  }

  // Triangle detection (simplified)
  if (prices.length > 20) {
    const startIdx = prices.length - 20;
    const endIdx = prices.length - 1;
    const highs = prices.slice(startIdx).filter((p, i, arr) => i > 0 && i < arr.length - 1 && p > arr[i-1] && p > arr[i+1]);
    const lows = prices.slice(startIdx).filter((p, i, arr) => i > 0 && i < arr.length - 1 && p < arr[i-1] && p < arr[i+1]);

    if (highs.length >= 2 && lows.length >= 2) {
      const highSlope = (highs[highs.length-1] - highs[0]) / (highs.length);
      const lowSlope = (lows[lows.length-1] - lows[0]) / (lows.length);

      if (highSlope < 0 && lowSlope > 0) {
        patterns.push({
          name: "Triángulo Simétrico",
          type: "NEUTRAL",
          reliability: 75,
          status: "En formación",
          entry: lastPrice,
          sl: lastPrice * 0.98,
          tp: lastPrice * 1.05,
          action: "ESPERAR",
          points: [
            { x: startIdx, y: highs[0] },
            { x: endIdx, y: highs[highs.length-1] },
            { x: startIdx, y: lows[0] },
            { x: endIdx, y: lows[lows.length-1] }
          ]
        });
      }
    }
  }

  return patterns;
}

export function detectCandles(data: any[]): CandlePattern[] {
  if (data.length < 5) return [];
  
  const candlePatterns: CandlePattern[] = [];
  
  // We need OHLC data for real candle detection. 
  // If we only have 'price', we'll simulate some based on price movement.
  // In a real app, 'data' would be klines.
  
  for (let i = 2; i < data.length; i++) {
    const current = data[i];
    const prev = data[i-1];
    const prev2 = data[i-2];

    // Engulfing Alcista (Simulated)
    if (current.price > prev.price && (current.price - prev.price) > (prev.price * 0.005)) {
      candlePatterns.push({
        name: "Engulfing Alcista",
        type: "ALCISTA",
        index: i,
        price: current.price,
        action: "LONG",
        sl: prev.price * 0.995,
        tp: current.price * 1.02
      });
    }

    // Engulfing Bajista (Simulated)
    if (current.price < prev.price && (prev.price - current.price) > (prev.price * 0.005)) {
      candlePatterns.push({
        name: "Engulfing Bajista",
        type: "BAJISTA",
        index: i,
        price: current.price,
        action: "SHORT",
        sl: prev.price * 1.005,
        tp: current.price * 0.98
      });
    }

    // Pin Bar (Simulated - would need high/low/open/close)
    // For now, let's just mark some significant reversals
    if (current.price > prev.price && prev.price < prev2.price && (current.price - prev.price) > (prev.price * 0.003)) {
      candlePatterns.push({
        name: "Pin Bar / Hammer",
        type: "ALCISTA",
        index: i,
        price: current.price,
        action: "LONG",
        sl: prev.price * 0.99,
        tp: current.price * 1.03
      });
    }
  }

  return candlePatterns.slice(-5); // Only return recent ones
}
