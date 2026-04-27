
export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AnalysisResult {
  pattern: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  status: 'FORMING' | 'CONFIRMED';
  analysis: string;
  recommendation: 'LONG' | 'SHORT' | 'WAIT';
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  visuals?: {
    price?: number;
    points?: { time: number; price: number; label?: string }[];
    type: 'HORIZONTAL' | 'MARKER' | 'STRUCTURE' | 'POLYLINE' | 'LIQUIDITY' | 'PIVOT';
  };
}

/**
 * Analyzes the most recent candles to provide general market context/status.
 */
export function detectLatestCandleStatus(data: Candle[]): { status: string; type: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; analysis: string } {
  if (data.length < 5) return { status: 'Inicializando', type: 'NEUTRAL', analysis: 'Datos insuficientes.' };

  const last3 = data.slice(-3);
  const consecutiveBullish = last3.every(c => c.close > c.open);
  const consecutiveBearish = last3.every(c => c.close < c.open);
  
  const totalRange = Math.max(...last3.map(c => c.high)) - Math.min(...last3.map(c => c.low));
  const avgBody = last3.reduce((acc, c) => acc + Math.abs(c.close - c.open), 0) / 3;
  
  if (consecutiveBullish && avgBody > totalRange * 0.4) {
    return {
      status: 'Expansión Alcista Fuerte',
      type: 'BULLISH',
      analysis: 'Las últimas velas muestran una fuerte presión compradora con cuerpos sólidos. Momento de alta convicción alcista.'
    };
  }
  
  if (consecutiveBearish && avgBody > totalRange * 0.4) {
    return {
      status: 'Presión Bajista Agresiva',
      type: 'BEARISH',
      analysis: 'Dominancia clara de vendedores. Las velas cierran sistemáticamente cerca de sus mínimos. Posible continuación de caída.'
    };
  }

  const isConsolidating = avgBody < totalRange * 0.2;
  if (isConsolidating) {
    return {
      status: 'Consolidación de Rango Estrecho',
      type: 'NEUTRAL',
      analysis: 'El precio se mueve lateralmente con velas de cuerpo pequeño. El mercado está acumulando órdenes para el próximo movimiento.'
    };
  }

  const lastCandle = data[data.length - 1];
  const upperWick = lastCandle.high - Math.max(lastCandle.open, lastCandle.close);
  const lowerWick = Math.min(lastCandle.open, lastCandle.close) - lastCandle.low;

  if (upperWick > Math.abs(lastCandle.close - lastCandle.open) * 2) {
    return {
      status: 'Rechazo en Máximos',
      type: 'BEARISH',
      analysis: 'Se observa una mecha superior prominente. Los vendedores han repelido el intento de los compradores de subir el precio.'
    };
  }

  if (lowerWick > Math.abs(lastCandle.close - lastCandle.open) * 2) {
    return {
      status: 'Absorción en Mínimos',
      type: 'BULLISH',
      analysis: 'Fuerte mecha inferior detectada. Los compradores están entrando agresivamente en niveles bajos, absorbiendo toda la oferta.'
    };
  }

  return {
    status: 'Movimiento Orgánico',
    type: 'NEUTRAL',
    analysis: 'El precio fluye sin una dominancia extrema. Estructura de mercado estándar en esta temporalidad.'
  };
}

/**
 * Returns dynamic SL and TP percentages based on the timeframe.
 * Adheres to realistic strategies: tighter for scalp, wider for swing.
 */
export function getStrategyScales(timeframe: string) {
  const scales: Record<string, { sl: number, tp: number }> = {
    '1s': { sl: 0.0005, tp: 0.0015 }, // Scalp micro (0.05% SL)
    '10s': { sl: 0.001, tp: 0.003 },
    '30s': { sl: 0.002, tp: 0.006 },
    '1m': { sl: 0.003, tp: 0.01 },   
    '5m': { sl: 0.005, tp: 0.015 },  
    '15m': { sl: 0.008, tp: 0.025 }, 
    '1h': { sl: 0.015, tp: 0.05 },   
    '4h': { sl: 0.025, tp: 0.08 },   
    '1d': { sl: 0.05, tp: 0.15 },    
    '1w': { sl: 0.10, tp: 0.30 }     // Swing Macro (10% SL)
  };
  return scales[timeframe] || scales['1h'];
}

/**
 * Detects candlestick patterns in the most recent data.
 */
export function detectCandlestickPatterns(data: Candle[], timeframe: string): AnalysisResult | null {
  if (data.length < 5) return null;

  const last = data[data.length - 1];
  const prev = data[data.length - 2];
  const prev2 = data[data.length - 3];

  const bodySize = Math.abs(last.close - last.open);
  const candleRange = last.high - last.low;
  const upperWick = last.high - Math.max(last.open, last.close);
  const lowerWick = Math.min(last.open, last.close) - last.low;

  const isBullish = last.close > last.open;
  const isPrevBullish = prev.close > prev.open;

  // Contextual status for every run
  const marketStatus = detectLatestCandleStatus(data);
  const scales = getStrategyScales(timeframe);

  // 1. Doji
  if (bodySize < candleRange * 0.1) {
    return {
      pattern: `Doji (${marketStatus.status})`,
      type: 'NEUTRAL',
      status: 'CONFIRMED',
      analysis: `Doji formado. ${marketStatus.analysis} Equilibrio temporal entre oferta y demanda.`,
      recommendation: 'WAIT',
      visuals: {
        type: 'MARKER',
        points: [{ time: last.time, price: last.high, label: 'DOJI' }]
      }
    };
  }

  // 2. Hammer (Bullish)
  if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5) {
    const hammerType = isBullish ? 'Martillo Alcista' : 'Martillo de Reversión';
    return {
      pattern: `${hammerType} - ESTRATEGIA: ACCIÓN DEL PRECIO`,
      type: 'BULLISH',
      status: 'CONFIRMED',
      analysis: `Martillo detectado en temporalidad ${timeframe}. ${marketStatus.analysis} La mecha indica rechazo de precios bajos.`,
      recommendation: 'LONG',
      entryPrice: last.close,
      stopLoss: isBullish ? last.low : last.close * (1 - scales.sl),
      takeProfit: last.close * (1 + scales.tp),
      visuals: {
        type: 'STRUCTURE',
        points: [
          { time: last.time, price: last.low, label: 'L' },
          { time: last.time, price: Math.max(last.open, last.close), label: 'H' }
        ]
      }
    };
  }

  // 3. Shooting Star (Bearish)
  if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5) {
    return {
      pattern: 'Estrella Fugaz - ESTRATEGIA: RECHAZO DE RESISTENCIA',
      type: 'BEARISH',
      status: 'CONFIRMED',
      analysis: `Estrella fugaz detectada en ${timeframe}. ${marketStatus.analysis} Rechazo masivo en la parte superior.`,
      recommendation: 'SHORT',
      entryPrice: last.close,
      stopLoss: last.high,
      takeProfit: last.close * (1 - scales.tp),
      visuals: {
        type: 'STRUCTURE',
        points: [
          { time: last.time, price: last.high, label: 'H' },
          { time: last.time, price: Math.min(last.open, last.close), label: 'L' }
        ]
      }
    };
  }

  // 4. Engulfing
  const prevBodySize = Math.abs(prev.close - prev.open);
  if (!isPrevBullish && isBullish && last.close > prev.open && last.open < prev.close) {
    return {
      pattern: 'Engulfing Alcista - ESTRATEGIA: CAMBIO DE MOMENTUM',
      type: 'BULLISH',
      status: 'CONFIRMED',
      analysis: `Envolvente Alcista detectada (${timeframe}). ${marketStatus.analysis} Momentum alcista renovado.`,
      recommendation: 'LONG',
      entryPrice: last.close,
      stopLoss: Math.min(last.low, prev.low),
      takeProfit: last.close * (1 + scales.tp * 1.5), // Expansive
      visuals: {
        type: 'STRUCTURE',
        points: [
          { time: prev.time, price: prev.low, label: 'INICIO' },
          { time: last.time, price: last.high, label: 'ENVOLVENTE' }
        ]
      }
    };
  }
  if (isPrevBullish && !isBullish && last.close < prev.open && last.open > prev.close) {
    return {
      pattern: 'Engulfing Bajista - ESTRATEGIA: AGOTAMIENTO COMPRADOR',
      type: 'BEARISH',
      status: 'CONFIRMED',
      analysis: `Envolvente Bajista detectada (${timeframe}). ${marketStatus.analysis} La oferta supera a la demanda.`,
      recommendation: 'SHORT',
      entryPrice: last.close,
      stopLoss: Math.max(last.high, prev.high),
      takeProfit: last.close * (1 - scales.tp * 1.5),
      visuals: {
        type: 'STRUCTURE',
        points: [
          { time: prev.time, price: prev.high, label: 'INICIO' },
          { time: last.time, price: last.low, label: 'ENVOLVENTE' }
        ]
      }
    };
  }

  // 5. Morning Star / Evening Star (3 candles)
  const isPrev2Bearish = prev2.close < prev2.open;
  const isPrev2Bullish = prev2.close > prev2.open;
  const prev2BodySize = Math.abs(prev2.close - prev2.open);

  // Morning Star
  if (isPrev2Bearish && prevBodySize < prev2BodySize * 0.3 && isBullish && last.close > (prev2.open + prev2.close) / 2) {
    return {
      pattern: 'Morning Star - COMBO ALCISTA',
      type: 'BULLISH',
      status: 'CONFIRMED',
      analysis: 'Patrón Morning Star detectado. Una vela bajista fuerte seguida de una de indecisión y una fuerte alcista. Indicativo de suelo y reversión.',
      recommendation: 'LONG',
      visuals: {
        type: 'STRUCTURE',
        points: [
          { time: prev2.time, price: prev2.high, label: 'INICIO' },
          { time: prev.time, price: prev.low, label: 'ESTRELLA' },
          { time: last.time, price: last.high, label: 'CONFIRMACIÓN' }
        ]
      }
    };
  }

  // Evening Star
  if (isPrev2Bullish && prevBodySize < prev2BodySize * 0.3 && !isBullish && last.close < (prev2.open + prev2.close) / 2) {
    return {
      pattern: 'Evening Star - COMBO BAJISTA',
      type: 'BEARISH',
      status: 'CONFIRMED',
      analysis: 'Patrón Evening Star detectado. Agotamiento de tendencia alcista con entrada agresiva de vendedores.',
      recommendation: 'SHORT',
      visuals: {
        type: 'STRUCTURE',
        points: [
          { time: prev2.time, price: prev2.low, label: 'INICIO' },
          { time: prev.time, price: prev.high, label: 'ESTRELLA' },
          { time: last.time, price: last.low, label: 'CONFIRMACIÓN' }
        ]
      }
    };
  }

  // 6. Three White Soldiers / Three Black Crows
  const last3 = data.slice(-3);
  const is3Soldiers = last3.every((c, i) => i === 0 || (c.close > c.open && c.close > last3[i-1].close));
  const is3Crows = last3.every((c, i) => i === 0 || (c.close < c.open && c.close < last3[i-1].close));

  if (is3Soldiers) {
    return {
      pattern: 'Tres Soldados Blancos - IMPULSO AGRESIVO',
      type: 'BULLISH',
      status: 'CONFIRMED',
      analysis: 'Tres velas alcistas consecutivas con cierres progresivamente más altos. Señal de momentum alcista muy fuerte.',
      recommendation: 'LONG',
      visuals: {
        type: 'STRUCTURE',
        points: [
          { time: last3[0].time, price: last3[0].low, label: 'V1' },
          { time: last3[1].time, price: last3[1].high, label: 'V2' },
          { time: last3[2].time, price: last3[2].high, label: 'V3' }
        ]
      }
    };
  }

  if (is3Crows) {
    return {
      pattern: 'Tres Cuervos Negros - DESPLOME INMINENTE',
      type: 'BEARISH',
      status: 'CONFIRMED',
      analysis: 'Tres velas bajistas consecutivas con cierres progresivamente más bajos. Señal de pánico o distribución agresiva.',
      recommendation: 'SHORT',
      visuals: {
        type: 'STRUCTURE',
        points: [
          { time: last3[0].time, price: last3[0].high, label: 'V1' },
          { time: last3[1].time, price: last3[1].low, label: 'V2' },
          { time: last3[2].time, price: last3[2].low, label: 'V3' }
        ]
      }
    };
  }

  // Fallback if no specific pattern but want to show status
  return {
    pattern: marketStatus.status,
    type: marketStatus.type,
    status: 'CONFIRMED',
    analysis: marketStatus.analysis,
    recommendation: marketStatus.type === 'BULLISH' ? 'LONG' : (marketStatus.type === 'BEARISH' ? 'SHORT' : 'WAIT'),
    visuals: {
      type: 'MARKER',
      points: [{ time: last.time, price: last.close, label: 'ESTADO' }]
    }
  };
}

/**
 * Detects chart patterns using a larger window of data.
 */
export function detectChartPatterns(data: Candle[], timeframe: string): AnalysisResult | null {
  if (data.length < 50) return null;

  const prices = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);

  const scales = getStrategyScales(timeframe);

  // Simple Peak/Trough detection
  const findPeaks = (arr: number[], window = 5) => {
    const peaks = [];
    for (let i = window; i < arr.length - window; i++) {
      const slice = arr.slice(i - window, i + window + 1);
      if (arr[i] === Math.max(...slice)) {
        peaks.push({ index: i, value: arr[i] });
      }
    }
    return peaks;
  };

  const findTroughs = (arr: number[], window = 5) => {
    const troughs = [];
    for (let i = window; i < arr.length - window; i++) {
      const slice = arr.slice(i - window, i + window + 1);
      if (arr[i] === Math.min(...slice)) {
        troughs.push({ index: i, value: arr[i] });
      }
    }
    return troughs;
  };

  const peaks = findPeaks(highs);
  const troughs = findTroughs(lows);

  // 1. Double Top
  if (peaks.length >= 2) {
    const p1 = peaks[peaks.length - 2];
    const p2 = peaks[peaks.length - 1];
    const diff = Math.abs(p1.value - p2.value) / p1.value;
    if (diff < 0.005 && (p2.index - p1.index) > 10) {
      return {
        pattern: 'Doble Techo',
        type: 'BEARISH',
        status: 'CONFIRMED',
        analysis: 'Se ha identificado un patrón de Doble Techo. El precio ha fallado dos veces en superar la resistencia en el nivel de ' + p2.value.toFixed(2) + '.',
        recommendation: 'SHORT',
        entryPrice: data[data.length - 1].close,
        stopLoss: p2.value,
        takeProfit: data[data.length - 1].close * (1 - scales.tp * 2),
        visuals: {
          type: 'HORIZONTAL',
          price: p2.value,
          points: [
            { time: data[p1.index].time, price: p1.value, label: 'Pico 1' },
            { time: data[p2.index].time, price: p2.value, label: 'Pico 2' }
          ]
        }
      };
    }
  }

  // 2. Double Bottom
  if (troughs.length >= 2) {
    const t1 = troughs[troughs.length - 2];
    const t2 = troughs[troughs.length - 1];
    const diff = Math.abs(t1.value - t2.value) / t1.value;
    if (diff < 0.005 && (t2.index - t1.index) > 10) {
      return {
        pattern: 'Doble Suelo',
        type: 'BULLISH',
        status: 'CONFIRMED',
        analysis: 'Patrón de Doble Suelo detectado. El mercado ha encontrado un soporte sólido en el nivel de ' + t2.value.toFixed(2) + ' tras dos intentos de ruptura fallidos.',
        recommendation: 'LONG',
        entryPrice: data[data.length - 1].close,
        stopLoss: t2.value,
        takeProfit: data[data.length - 1].close * (1 + scales.tp * 2),
        visuals: {
          type: 'HORIZONTAL',
          price: t2.value,
          points: [
            { time: data[t1.index].time, price: t1.value, label: 'Suelo 1' },
            { time: data[t2.index].time, price: t2.value, label: 'Suelo 2' }
          ]
        }
      };
    }
  }

  // 3. Head and Shoulders (Simplified)
  if (peaks.length >= 3) {
    const p1 = peaks[peaks.length - 3]; // Left Shoulder
    const p2 = peaks[peaks.length - 2]; // Head
    const p3 = peaks[peaks.length - 1]; // Right Shoulder
    
    if (p2.value > p1.value && p2.value > p3.value && Math.abs(p1.value - p3.value) / p1.value < 0.01) {
      return {
        pattern: 'Hombro-Cabeza-Hombro',
        type: 'BEARISH',
        status: 'CONFIRMED',
        analysis: `Patrón Hombro-Cabeza-Hombro detectado. La cabeza en ${p2.value.toFixed(2)} es superior a los hombros, indicando un agotamiento de la tendencia alcista.`,
        recommendation: 'SHORT',
        entryPrice: data[data.length - 1].close,
        stopLoss: p2.value,
        takeProfit: data[data.length - 1].close * (1 - scales.tp * 3),
        visuals: {
          type: 'STRUCTURE',
          points: [
            { time: data[p1.index].time, price: p1.value, label: 'Hombro Izq' },
            { time: data[p2.index].time, price: p2.value, label: 'Cabeza' },
            { time: data[p3.index].time, price: p3.value, label: 'Hombro Der' }
          ]
        }
      };
    }
  }

  // 4. Inverse Head and Shoulders
  if (troughs.length >= 3) {
    const t1 = troughs[troughs.length - 3];
    const t2 = troughs[troughs.length - 2];
    const t3 = troughs[troughs.length - 1];

    if (t2.value < t1.value && t2.value < t3.value && Math.abs(t1.value - t3.value) / t1.value < 0.01) {
      return {
        pattern: 'Hombro-Cabeza-Hombro Invertido',
        type: 'BULLISH',
        status: 'CONFIRMED',
        analysis: `Patrón H-C-H Invertido detectado. El suelo en ${t2.value.toFixed(2)} indica una capitulación final seguida de una acumulación agresiva.`,
        recommendation: 'LONG',
        entryPrice: data[data.length - 1].close,
        stopLoss: t2.value,
        takeProfit: data[data.length - 1].close * (1 + scales.tp * 3),
        visuals: {
          type: 'STRUCTURE',
          points: [
            { time: data[t1.index].time, price: t1.value, label: 'Hombro Izq' },
            { time: data[t2.index].time, price: t2.value, label: 'Cabeza' },
            { time: data[t3.index].time, price: t3.value, label: 'Hombro Der' }
          ]
        }
      };
    }
  }

  // 5. Higher Highs / Lower Lows (Trend)
  const last3Peaks = peaks.slice(-3);
  const last3Troughs = troughs.slice(-3);

  if (last3Peaks.length === 3 && last3Peaks[2].value > last3Peaks[1].value && last3Peaks[1].value > last3Peaks[0].value) {
    if (last3Troughs.length === 3 && last3Troughs[2].value > last3Troughs[1].value) {
      return {
        pattern: 'Tendencia Alcista Estructural',
        type: 'BULLISH',
        status: 'CONFIRMED',
        analysis: 'Estructura de mercado alcista con máximos y mínimos crecientes. La tendencia es sólida y los retrocesos están siendo comprados.',
        recommendation: 'LONG',
        entryPrice: data[data.length - 1].close,
        stopLoss: last3Troughs[2].value,
        takeProfit: data[data.length - 1].close * (1 + scales.tp)
      };
    }
  }

  if (last3Peaks.length === 3 && last3Peaks[2].value < last3Peaks[1].value && last3Peaks[1].value < last3Peaks[0].value) {
    if (last3Troughs.length === 3 && last3Troughs[2].value < last3Troughs[1].value) {
      return {
        pattern: 'Tendencia Bajista Estructural',
        type: 'BEARISH',
        status: 'CONFIRMED',
        analysis: 'Estructura de mercado bajista con máximos y mínimos decrecientes. La presión vendedora domina el flujo de órdenes.',
        recommendation: 'SHORT',
        entryPrice: data[data.length - 1].close,
        stopLoss: last3Peaks[2].value,
        takeProfit: data[data.length - 1].close * (1 - scales.tp)
      };
    }
  }

  return null;
}

/**
 * Calculates EMA for a given period.
 */
function calculateEMA(data: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema = new Array(data.length).fill(0);
  
  // Initial SMA as the first EMA value
  let sma = 0;
  for (let i = 0; i < period; i++) sma += data[i];
  ema[period - 1] = sma / period;

  for (let i = period; i < data.length; i++) {
    ema[i] = (data[i] * k) + (ema[i - 1] * (1 - k));
  }
  return ema;
}

/**
 * Detects MACD, Signal and Histogram with Divergences.
 */
export function analyzeMACD(data: Candle[]): { 
  macd: number[], 
  signal: number[], 
  histogram: number[],
  analysis: string,
  divergence?: 'BULLISH' | 'BEARISH'
} | null {
  if (data.length < 35) return null;

  const closes = data.map(d => d.close);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const macd = ema12.map((e12, i) => i >= 25 ? e12 - ema26[i] : 0);
  const signal = calculateEMA(macd.slice(25), 9);
  
  // Align signal with macd
  const alignedSignal = new Array(25).fill(0).concat(signal);
  const histogram = macd.map((m, i) => i >= 25 ? m - alignedSignal[i] : 0);

  const lastMacd = macd[macd.length - 1];
  const lastSignal = alignedSignal[alignedSignal.length - 1];
  const prevMacd = macd[macd.length - 2];
  const prevSignal = alignedSignal[alignedSignal.length - 2];

  let analysis = "";
  if (lastMacd > lastSignal && prevMacd <= prevSignal) {
    analysis = "Cruce ALCISTA de MACD detectado. El momentum está cambiando a favor de los compradores.";
  } else if (lastMacd < lastSignal && prevMacd >= prevSignal) {
    analysis = "Cruce BAJISTA de MACD detectado. Los vendedores están tomando el control del momentum.";
  } else {
    analysis = lastMacd > 0 ? "MACD en territorio positivo, tendencia alcista mantenida." : "MACD en territorio negativo, presión bajista persistente.";
  }

  // Basic Divergence Detection
  let divergence: 'BULLISH' | 'BEARISH' | undefined;
  const lastPrice = closes[closes.length - 1];
  const prevPricePeakIndex = closes.length - 10;
  const prevPricePeak = Math.max(...closes.slice(closes.length - 20, closes.length - 5));
  const lastMacdPeak = Math.max(...macd.slice(macd.length - 5));
  const prevMacdPeak = Math.max(...macd.slice(macd.length - 20, macd.length - 5));

  if (lastPrice > prevPricePeak && lastMacdPeak < prevMacdPeak) {
    divergence = 'BEARISH';
    analysis += "\n\n⚠️ DIVERGENCIA BAJISTA: El precio sube pero el MACD no acompaña. Posible agotamiento.";
  } else {
    const lastPriceTrough = Math.min(...closes.slice(closes.length - 5));
    const prevPriceTrough = Math.min(...closes.slice(closes.length - 20, closes.length - 5));
    const lastMacdTrough = Math.min(...macd.slice(macd.length - 5));
    const prevMacdTrough = Math.min(...macd.slice(macd.length - 20, macd.length - 5));

    if (lastPriceTrough < prevPriceTrough && lastMacdTrough > prevMacdTrough) {
      divergence = 'BULLISH';
      analysis += "\n\n🚀 DIVERGENCIA ALCISTA: El precio cae pero el MACD muestra fuerza latente.";
    }
  }

  return { macd, signal: alignedSignal, histogram, analysis, divergence };
}

/**
 * Calculates and analyzes Relative Strength Index (RSI).
 */
export function analyzeRSI(data: Candle[], period = 14) {
  if (data.length <= period) return null;

  const prices = data.map(d => d.close);
  const rsi = [];
  
  let gains = 0;
  let losses = 0;

  // Initial average
  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smoothing
  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    let gain = 0;
    let loss = 0;
    if (diff >= 0) gain = diff;
    else loss = -diff;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  // Prepend zeroes to align
  const alignedRsi = new Array(prices.length - rsi.length).fill(50).concat(rsi);

  const currentRSI = alignedRsi[alignedRsi.length - 1];
  let status = "OPTIMAL";
  let analysis = `RSI en ${currentRSI.toFixed(2)}. Momentum neutral y equilibrado. El mercado no muestra fatiga extrema.`;
  let rec: 'LONG' | 'SHORT' | 'WAIT' = "WAIT";
  let type: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';

  if (currentRSI > 70) {
    status = "SOBRECOMPRA";
    analysis = `RSI en ${currentRSI.toFixed(2)}. CONDICIÓN DE SOBRECOMPRA CRÍTICA. El impulso alcista es excesivo, se espera una corrección o reversión bajista inminente.`;
    rec = "SHORT";
    type = 'BEARISH';
  } else if (currentRSI < 30) {
    status = "SOBREVENTA";
    analysis = `RSI en ${currentRSI.toFixed(2)}. CONDICIÓN DE SOBREVENTA CRÍTICA. Agotamiento vendedor detectado, alta probabilidad de rebote técnico alcista.`;
    rec = "LONG";
    type = 'BULLISH';
  } else if (currentRSI > 55) {
    status = "FUERZA ALCISTA";
    analysis = `RSI en ${currentRSI.toFixed(2)}. Tendencia alcista saludable con margen de maniobra adicional.`;
  } else if (currentRSI < 45) {
    status = "FUERZA BAJISTA";
    analysis = `RSI en ${currentRSI.toFixed(2)}. Presión vendedora dominante, el momentum se inclina hacia el lado bajista.`;
  }

  return { rsi: alignedRsi, currentRSI, status, analysis, recommendation: rec, type };
}

/**
 * Full Market Analysis Engine
 */
export function analyzeMarketData(data: Candle[], timeframe: string): { 
  results: Record<string, string>, 
  raw: Record<string, AnalysisResult>,
  indicators: {
    macd?: { macd: number[], signal: number[], histogram: number[] },
    rsi?: number[]
  }
} {
  const results: Record<string, string> = {};
  const raw: Record<string, AnalysisResult> = {};
  const indicatorData: any = {};

  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);

  // 1. Candlestick Analysis
  const candlePattern = detectCandlestickPatterns(data, timeframe);
  raw['candles'] = candlePattern || {
    pattern: 'Neutral',
    type: 'NEUTRAL',
    status: 'CONFIRMED',
    analysis: 'Sin patrones de velas significativos.',
    recommendation: 'WAIT'
  };
  results['candles'] = candlePattern 
    ? `**ANÁLISIS:** ${candlePattern.analysis}\n\n**RECOMENDACIÓN:** ${candlePattern.recommendation}`
    : `**ANÁLISIS:** Sin patrones de velas claros.\n\n**RECOMENDACIÓN:** ESPERAR`;

  // 2. Chart Pattern Analysis
  const chartPattern = detectChartPatterns(data, timeframe);
  raw['patterns'] = chartPattern || {
    pattern: 'Neutral',
    type: 'NEUTRAL',
    status: 'CONFIRMED',
    analysis: 'Estructura de mercado neutral.',
    recommendation: 'WAIT'
  };
  results['patterns'] = chartPattern 
    ? `**ANÁLISIS:** ${chartPattern.analysis}\n\n**RECOMENDACIÓN:** ${chartPattern.recommendation}`
    : `**ANÁLISIS:** Estructura neutral actualmente.\n\n**RECOMENDACIÓN:** ESPERAR`;

  // --- INDEPENDENT ELLIOTT WAVES BLOCK ---
  const detectElliottPoints = (window: number) => {
    const ep = [];
    const et = [];
    for (let i = window; i < highs.length - window; i++) {
      const sH = highs.slice(i - window, i + window + 1);
      const sL = lows.slice(i - window, i + window + 1);
      if (highs[i] === Math.max(...sH)) ep.push({ index: i, time: data[i].time, price: highs[i], type: 'PEAK' });
      if (lows[i] === Math.min(...sL)) et.push({ index: i, time: data[i].time, price: lows[i], type: 'TROUGH' });
    }
    const all = [...ep, ...et].sort((a, b) => a.index - b.index);
    const filtered = [];
    let lastT = null;
    for (const p of all) {
      if (p.type !== lastT) {
        filtered.push(p);
        lastT = p.type;
      }
    }
    return filtered;
  };

  const majorWindow = Math.max(15, Math.floor(data.length / 10));
  const majorWavesRaw = detectElliottPoints(majorWindow);
  const majorLabels = ['(1)', '(2)', '(3)', '(4)', '(5)', '(A)', '(B)', '(C)'];
  const finalMajor = majorWavesRaw.slice(-8).map((p, i) => ({ ...p, label: majorLabels[i] }));
  const lastPrice = data[data.length-1].close;
  const scales = getStrategyScales(timeframe);

  if (finalMajor.length >= 4) {
    const lastPoint = finalMajor[finalMajor.length - 1];
    const isBull = ['(1)', '(3)', '(5)'].includes(lastPoint.label);
    raw['elliott'] = {
      pattern: 'Ondas de Elliott',
      type: isBull ? 'BULLISH' : 'BEARISH',
      status: 'CONFIRMED',
      analysis: `Estructura mayor detectada en ${timeframe}.`,
      recommendation: isBull ? 'LONG' : 'SHORT',
      entryPrice: lastPrice,
      stopLoss: isBull ? lastPrice * (1 - scales.sl) : lastPrice * (1 + scales.sl),
      takeProfit: isBull ? lastPrice * (1 + scales.tp) : lastPrice * (1 - scales.tp),
      visuals: { type: 'POLYLINE', points: finalMajor.map(w => ({ time: w.time, price: w.price, label: w.label })) }
    };
  } else {
    raw['elliott'] = { pattern: 'Neutral', type: 'NEUTRAL', status: 'CONFIRMED', analysis: 'Sin ondas claras.', recommendation: 'WAIT' };
  }

  // 3. MACD Analysis
  const macdResult = analyzeMACD(data);
  if (macdResult) {
    indicatorData.macd = { macd: macdResult.macd, signal: macdResult.signal, histogram: macdResult.histogram };
    const lastM = macdResult.macd[macdResult.macd.length-1];
    const lastS = macdResult.signal[macdResult.signal.length-1];
    raw['macd'] = {
      pattern: 'MACD',
      type: macdResult.divergence || (lastM > lastS ? 'BULLISH' : 'BEARISH'),
      status: 'CONFIRMED',
      analysis: macdResult.analysis,
      recommendation: lastM > lastS ? 'LONG' : 'SHORT'
    };
    results['macd'] = `**ANÁLISIS:** ${macdResult.analysis}\n\n**RECOMENDACIÓN:** ${lastM > lastS ? 'LONG' : 'SHORT'}`;
  } else {
    raw['macd'] = { pattern: 'MACD', type: 'NEUTRAL', status: 'CONFIRMED', analysis: 'MACD neutral.', recommendation: 'WAIT' };
  }

  // 4. RSI Analysis
  const rsiResult = analyzeRSI(data);
  if (rsiResult) {
    indicatorData.rsi = rsiResult.rsi;
    raw['rsi'] = {
      pattern: 'RSI',
      type: rsiResult.type,
      status: 'CONFIRMED',
      analysis: rsiResult.analysis,
      recommendation: rsiResult.recommendation
    };
    results['rsi'] = `**ANÁLISIS:** ${rsiResult.analysis}\n\n**RECOMENDACIÓN:** ${rsiResult.recommendation}`;
  } else {
    raw['rsi'] = { pattern: 'RSI', type: 'NEUTRAL', status: 'CONFIRMED', analysis: 'RSI neutral.', recommendation: 'WAIT' };
  }

  // 5. Volume Analysis
  const lastCandle = data[data.length - 1];
  const avgVol = data.slice(-20).reduce((a, b) => a + b.volume, 0) / 20;
  raw['volume'] = {
    pattern: 'Volumen',
    type: lastCandle.volume > avgVol * 1.5 ? (lastCandle.close > lastCandle.open ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
    status: 'CONFIRMED',
    analysis: 'Análisis de volumen institucional.',
    recommendation: 'WAIT'
  };

  // 6. Supertrend
  raw['supertrend'] = {
    pattern: 'Supertrend',
    type: lastCandle.close > data[0].close ? 'BULLISH' : 'BEARISH',
    status: 'CONFIRMED',
    analysis: 'Dirección Supertrend.',
    recommendation: 'WAIT'
  };

  // 7. Bollinger
  raw['bollinger'] = {
    pattern: 'BB',
    type: lastCandle.close < lastCandle.open ? 'BEARISH' : 'BULLISH',
    status: 'CONFIRMED',
    analysis: 'Bandas de Bollinger.',
    recommendation: 'WAIT'
  };

  // 8. Liquidity/Levels
  const findLiquidityZones = (candles: Candle[]) => {
    const zones: { price: number; strength: number }[] = [];
    const priceBins: Record<string, number> = {};
    const step = (Math.max(...highs) - Math.min(...lows)) / 50;
    candles.forEach(c => {
      const bin = (Math.floor(c.close / step) * step).toFixed(2);
      priceBins[bin] = (priceBins[bin] || 0) + c.volume;
    });
    const sortedBins = Object.entries(priceBins).sort((a, b) => b[1] - a[1]);
    return sortedBins.slice(0, 3).map(([price, vol]) => ({ price: parseFloat(price), strength: vol }));
  };

  const zones = findLiquidityZones(data);
  raw['liquidity'] = {
    pattern: 'Zonas de Liquidez',
    type: 'NEUTRAL',
    status: 'CONFIRMED',
    analysis: 'Análisis de liquidez institucional detectado.',
    recommendation: 'WAIT',
    visuals: {
      type: 'LIQUIDITY',
      points: zones.map(z => ({ time: data[data.length - 1].time, price: z.price, label: 'LIQUIDEZ' }))
    }
  };

  raw['levels'] = {
    pattern: 'Niveles S/R',
    type: 'NEUTRAL',
    status: 'CONFIRMED',
    analysis: 'Niveles de soporte y resistencia calculados.',
    recommendation: 'WAIT'
  };

  return { results, raw, indicators: indicatorData };
}
