
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
  description: string;
}

export function detectPatterns(data: any[]): Pattern[] {
  if (data.length < 20) return [];
  
  const patterns: Pattern[] = [];
  const prices = data.map(d => d.price);
  const lastPrice = prices[prices.length - 1];

  // 1. Doble Suelo
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
      tp: peak.val + (peak.val - Math.min(min1.val, min2.val)) * 1.5,
      action: isConfirmed ? "LONG" : "ESPERAR",
      points: [
        { x: min1.idx, y: min1.val },
        { x: peak.idx, y: peak.val },
        { x: min2.idx, y: min2.val }
      ]
    });
  }

  // 2. Doble Techo
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
      tp: valley.val - (Math.max(max1.val, max2.val) - valley.val) * 1.5,
      action: isConfirmed ? "SHORT" : "ESPERAR",
      points: [
        { x: max1.idx, y: max1.val },
        { x: valley.idx, y: valley.val },
        { x: max2.idx, y: max2.val }
      ]
    });
  }

  // 3. Triángulo Ascendente
  if (prices.length > 30) {
    const recent = prices.slice(-30);
    const highs = recent.filter((p, i, arr) => i > 0 && i < arr.length - 1 && p > arr[i-1] && p > arr[i+1]);
    const lows = recent.filter((p, i, arr) => i > 0 && i < arr.length - 1 && p < arr[i-1] && p < arr[i+1]);

    if (highs.length >= 2 && lows.length >= 2) {
      const isHorizontalResistance = Math.abs(highs[highs.length-1] - highs[0]) / highs[0] < 0.005;
      const isRisingSupport = lows[lows.length-1] > lows[0];

      if (isHorizontalResistance && isRisingSupport) {
        patterns.push({
          name: "Triángulo Ascendente",
          type: "ALCISTA",
          reliability: 78,
          status: lastPrice > highs[highs.length-1] ? "Confirmado" : "En formación",
          entry: highs[highs.length-1],
          sl: lows[lows.length-1],
          tp: highs[highs.length-1] + (highs[highs.length-1] - lows[0]),
          action: lastPrice > highs[highs.length-1] ? "LONG" : "ESPERAR",
          points: [
            { x: prices.length - 30, y: highs[0] },
            { x: prices.length - 1, y: highs[highs.length-1] },
            { x: prices.length - 30, y: lows[0] },
            { x: prices.length - 1, y: lows[lows.length-1] }
          ]
        });
      }
    }
  }

  return patterns;
}

export function detectCandles(data: any[]): CandlePattern[] {
  if (data.length < 10) return [];
  
  const candlePatterns: CandlePattern[] = [];
  
  for (let i = 2; i < data.length; i++) {
    const current = data[i];
    const prev = data[i-1];
    
    // Engulfing Alcista
    if (current.price > prev.price && (current.price - prev.price) > (prev.price * 0.008)) {
      candlePatterns.push({
        name: "Engulfing Alcista",
        type: "ALCISTA",
        index: i,
        price: current.price,
        action: "LONG",
        sl: prev.price * 0.99,
        tp: current.price * 1.03,
        description: "Vela de reversión alcista potente."
      });
    }

    // Engulfing Bajista
    if (current.price < prev.price && (prev.price - current.price) > (prev.price * 0.008)) {
      candlePatterns.push({
        name: "Engulfing Bajista",
        type: "BAJISTA",
        index: i,
        price: current.price,
        action: "SHORT",
        sl: prev.price * 1.01,
        tp: current.price * 0.97,
        description: "Vela de reversión bajista potente."
      });
    }

    // Hammer (Simulado)
    if (i > 0 && current.price > prev.price && (current.price - prev.price) < (prev.price * 0.002)) {
      // Si el precio sube poco después de una caída, simulamos un martillo
      candlePatterns.push({
        name: "Hammer / Martillo",
        type: "ALCISTA",
        index: i,
        price: current.price,
        action: "LONG",
        sl: current.price * 0.985,
        tp: current.price * 1.04,
        description: "Posible agotamiento de ventas."
      });
    }
  }

  return candlePatterns.slice(-10);
}
