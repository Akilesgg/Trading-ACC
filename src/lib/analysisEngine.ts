
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
 * Detects candlestick patterns in the most recent data.
 */
export function detectCandlestickPatterns(data: Candle[]): AnalysisResult | null {
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
      analysis: `Martillo detectado. ${marketStatus.analysis} La mecha indica rechazo de precios bajos. Ideal para buscar entradas en largo tras confirmación de la siguiente vela.`,
      recommendation: 'LONG',
      entryPrice: last.close,
      stopLoss: last.low * 0.998,
      takeProfit: last.close * 1.015,
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
      analysis: `Estrella fugaz detectada. ${marketStatus.analysis} Rechazo masivo en la parte superior. Los vendedores han tomado el control del nivel de precio actual.`,
      recommendation: 'SHORT',
      entryPrice: last.close,
      stopLoss: last.high * 1.002,
      takeProfit: last.close * 0.985,
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
      analysis: `Envolvente Alcista detectada. ${marketStatus.analysis} Los compradores han envuelto completamente la vela previa, demostrando una fuerza impulsora renovada.`,
      recommendation: 'LONG',
      entryPrice: last.close,
      stopLoss: Math.min(last.low, prev.low) * 0.998,
      takeProfit: last.close * 1.025,
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
      analysis: `Envolvente Bajista detectada. ${marketStatus.analysis} Fuerte señal de reversión. La oferta ha superado drásticamente a la demanda.`,
      recommendation: 'SHORT',
      entryPrice: last.close,
      stopLoss: Math.max(last.high, prev.high) * 1.002,
      takeProfit: last.close * 0.975,
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
export function detectChartPatterns(data: Candle[]): AnalysisResult | null {
  if (data.length < 50) return null;

  const prices = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);

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
        stopLoss: p2.value * 1.005,
        takeProfit: data[data.length - 1].close * 0.95,
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
        stopLoss: t2.value * 0.995,
        takeProfit: data[data.length - 1].close * 1.05,
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
        stopLoss: p2.value * 1.005,
        takeProfit: data[data.length - 1].close * 0.95,
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
        stopLoss: t2.value * 0.995,
        takeProfit: data[data.length - 1].close * 1.05,
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

  // 6. Elliott Waves (Impulse 1-2-3-4-5 and Correction A-B-C)
  const allPivotPoints = [...peaks.map(p => ({ ...p, type: 'PEAK' })), ...troughs.map(t => ({ ...t, type: 'TROUGH' }))]
    .sort((a, b) => a.index - b.index);

  if (allPivotPoints.length >= 4) {
    const points = allPivotPoints.slice(-8); // Take last 8 significant points
    const labels = ['1', '2', '3', '4', '5', 'A', 'B', 'C'];
    
    // Always return Elliott structure if we have 4+ points
    const elliottVisuals = {
      type: 'POLYLINE' as const,
      points: points.map((p, idx) => ({
        time: data[p.index].time,
        price: p.value,
        label: labels[idx] || (idx + 1).toString()
      }))
    };

    const lastPoint = points[points.length - 1];
    const isBullish = lastPoint.type === 'PEAK';

    return {
      pattern: 'Ondas de Elliott (HELIUM-3)',
      type: isBullish ? 'BULLISH' : 'BEARISH',
      status: 'CONFIRMED',
      analysis: `Estructura de Elliott detectada en Onda ${labels[points.length - 1]}. El mercado sigue un patrón rítmico de impulsos y correcciones.`,
      recommendation: isBullish ? 'SHORT' : 'LONG', // Counter-trend or continuation logic
      entryPrice: data[data.length - 1].close,
      stopLoss: isBullish ? Math.max(...points.map(p => p.value)) * 1.01 : Math.min(...points.map(p => p.value)) * 0.99,
      takeProfit: isBullish ? data[data.length - 1].close * 0.95 : data[data.length - 1].close * 1.05,
      visuals: elliottVisuals
    };
  }

  if (last3Peaks.length === 3 && last3Peaks[2].value > last3Peaks[1].value && last3Peaks[1].value > last3Peaks[0].value) {
    if (last3Troughs.length === 3 && last3Troughs[2].value > last3Troughs[1].value) {
      return {
        pattern: 'Tendencia Alcista Estructural',
        type: 'BULLISH',
        status: 'CONFIRMED',
        analysis: 'Estructura de mercado alcista con máximos y mínimos crecientes. La tendencia es sólida y los retrocesos están siendo comprados.',
        recommendation: 'LONG',
        entryPrice: data[data.length - 1].close,
        stopLoss: last3Troughs[2].value * 0.995,
        takeProfit: data[data.length - 1].close * 1.04
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
        stopLoss: last3Peaks[2].value * 1.005,
        takeProfit: data[data.length - 1].close * 0.96
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
 * Full Market Analysis Engine
 */
export function analyzeMarketData(data: Candle[], timeframe: string): { 
  results: Record<string, string>, 
  raw: Record<string, AnalysisResult>,
  indicators: {
    macd?: { macd: number[], signal: number[], histogram: number[] }
  }
} {
  const results: Record<string, string> = {};
  const raw: Record<string, AnalysisResult> = {};
  const indicatorData: any = {};

  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);

  // 1. Candlestick Analysis
  const candlePattern = detectCandlestickPatterns(data);
  if (candlePattern) {
    results['candles'] = `**ANÁLISIS:** ${candlePattern.analysis}\n\n**RECOMENDACIÓN:** ${candlePattern.recommendation}`;
    raw['candles'] = candlePattern;
  } else {
    results['candles'] = `**ANÁLISIS:** Sin patrones de velas claros.\n\n**RECOMENDACIÓN:** ESPERAR`;
  }

  // 2. Chart Pattern Analysis
  const chartPattern = detectChartPatterns(data);
  if (chartPattern) {
    results['patterns'] = `**ANÁLISIS:** ${chartPattern.analysis}\n\n**RECOMENDACIÓN:** ${chartPattern.recommendation}`;
    raw['patterns'] = chartPattern;
  } else {
    results['patterns'] = `**ANÁLISIS:** Estructura neutral actualmente.\n\n**RECOMENDACIÓN:** ESPERAR`;
  }

  // --- INDEPENDENT ELLIOTT WAVES BLOCK ---
  const elliottWindow = Math.max(5, Math.floor(data.length / 20));
  const ep = [];
  const et = [];
  for (let i = elliottWindow; i < highs.length - elliottWindow; i++) {
    const sH = highs.slice(i - elliottWindow, i + elliottWindow + 1);
    const sL = lows.slice(i - elliottWindow, i + elliottWindow + 1);
    if (highs[i] === Math.max(...sH)) ep.push({ index: i, time: data[i].time, price: highs[i], type: 'PEAK' });
    if (lows[i] === Math.min(...sL)) et.push({ index: i, time: data[i].time, price: lows[i], type: 'TROUGH' });
  }

  const allPoints = [...ep, ...et].sort((a, b) => a.index - b.index);
  if (allPoints.length >= 4) {
    const waveLabels = ['1', '2', '3', '4', '5', 'A', 'B', 'C'];
    const filteredWaves = [];
    let lastType = null;
    for (const p of allPoints) {
      if (p.type !== lastType) {
        filteredWaves.push(p);
        lastType = p.type;
      }
    }

    const wavesToLabel = filteredWaves.slice(-9); 
    const labels = ['', '1', '2', '3', '4', '5', 'A', 'B', 'C'];
    
    const finalWaves = wavesToLabel.map((p, i) => ({
      ...p,
      label: labels[i]
    })).filter(w => w.label !== '');

    const lastPoint = finalWaves[finalWaves.length - 1];
    const descriptions: Record<string, string> = {
      '1': 'CONFLUENCIA ELLIOTT: Inicio del primer impulso motriz institucional. Se detecta una ruptura estructural de la tendencia previa con un incremento marginal en el volumen de negociación. La psicología del mercado aún es de duda, lo que ofrece un ratio riesgo/beneficio excepcional para entradas anticipadas.',
      '2': 'CONFLUENCIA ELLIOTT: Fase de retroceso correctivo técnico (Pullback). El precio está mitigando el desequilibrio generado por la Onda 1 sin invalidar su origen. Es una zona de "compra de valor" donde las manos fuertes acumulan posiciones antes de la expansión más agresiva del ciclo.',
      '3': 'CONFLUENCIA ELLIOTT: Estamos en la "Onda Maestra", la fase de expansión más potente y extendida del ciclo Helium-3. Se caracteriza por un momentum vertical impulsado por gap institucional. Es imperativo mantener posiciones largas ya que el precio suele alcanzar extensiones de 1.618 Fibonacci.',
      '4': 'CONFLUENCIA ELLIOTT: Consolidación lateral compleja. El mercado está respirando tras el rally de la Onda 3. Se observa una rotación de liquidez y toma de beneficios parcial. Mientras el precio no penetre el territorio de la Onda 1, la estructura impulsiva permanece intacta y lista para el impulso final.',
      '5': 'CONFLUENCIA ELLIOTT: Quinta onda de agotamiento en curso. El precio marca nuevos máximos pero con divergencias bajistas en el oscilador MACD. Se recomienda cautela extrema y ajuste de stop-loss a niveles protectores (Trail SL), ya que el ciclo motriz está llegando a su clímax.',
      'A': 'CONFLUENCIA ELLIOTT: Primera señal de capitulación institucional. La pérdida de la línea de tendencia de la Onda 5 confirma el inicio del ciclo correctivo ABC. El sentimiento alcista está atrapado y se espera que la oferta domine las próximas sesiones.',
      'B': 'CONFLUENCIA ELLIOTT: Rebote técnico de trampa alcista (Dead Cat Bounce). El precio intenta recuperar niveles previos pero sin volumen de respaldo. Es el punto óptimo para cerrar largos remanentes o iniciar coberturas cortas antes de la capitulación final de la Onda C.',
      'C': 'CONFLUENCIA ELLIOTT: Fase final de purga de liquidez. La Onda C suele expandirse con fuerza hasta niveles de soporte macro, eliminando el exceso de apalancamiento del ciclo anterior. Una vez finalizada, se espera el inicio de un nuevo ciclo de acumulación Helium-3.'
    };

    const isBull = finalWaves.filter(w => ['1', '3', '5'].includes(w.label)).length >= finalWaves.filter(w => ['A', 'C'].includes(w.label)).length;

    raw['elliott'] = {
      pattern: 'Ondas de Elliott (Helium-3)',
      type: isBull ? 'BULLISH' : 'BEARISH',
      status: 'CONFIRMED',
      analysis: descriptions[lastPoint.label] || 'Ciclo de Elliott Helium-3 en desarrollo.',
      recommendation: isBull ? 'LONG' : 'SHORT',
      entryPrice: et[et.length - 1]?.price || data[data.length-1].close,
      stopLoss: (et[et.length - 2]?.price || data[data.length-1].low) * 0.995,
      takeProfit: ep[ep.length - 1]?.price || data[data.length-1].high * 1.02,
      visuals: {
        type: 'POLYLINE',
        points: finalWaves.map(w => ({ time: w.time, price: w.price, label: w.label }))
      }
    };
  }

  // 3. MACD Analysis
  const macdResult = analyzeMACD(data);
  if (macdResult) {
    indicatorData.macd = {
      macd: macdResult.macd,
      signal: macdResult.signal,
      histogram: macdResult.histogram
    };
    results['macd'] = `**ANÁLISIS:** ${macdResult.analysis}\n\n**RECOMENDACIÓN:** ${macdResult.macd[macdResult.macd.length-1] > macdResult.signal[macdResult.signal.length-1] ? 'CONTRATAR LARGOS' : 'BUSCAR CORTOS'}`;
    raw['macd'] = {
      pattern: 'MACD Pro',
      type: macdResult.divergence || (macdResult.macd[macdResult.macd.length-1] > macdResult.signal[macdResult.signal.length-1] ? 'BULLISH' : 'BEARISH'),
      status: 'CONFIRMED',
      analysis: macdResult.analysis,
      recommendation: macdResult.macd[macdResult.macd.length-1] > macdResult.signal[macdResult.signal.length-1] ? 'LONG' : 'SHORT'
    };
  }

  // 4. Wyckoff Schematic
  const findMajorPoints = (arrH: number[], arrL: number[], window = 15) => {
    const points = [];
    for (let i = window; i < arrH.length - window; i++) {
      const sliceH = arrH.slice(i - window, i + window + 1);
      const sliceL = arrL.slice(i - window, i + window + 1);
      if (arrH[i] === Math.max(...sliceH)) {
        points.push({ time: data[i].time, price: arrH[i], type: 'PEAK' });
      } else if (arrL[i] === Math.min(...sliceL)) {
        points.push({ time: data[i].time, price: arrL[i], type: 'TROUGH' });
      }
    }
    return points;
  };

  const majorPoints = findMajorPoints(highs, lows);
  if (majorPoints.length >= 2) {
    raw['wyckoff_schematic'] = {
      pattern: 'Esquema Wyckoff',
      type: 'NEUTRAL',
      status: 'CONFIRMED',
      analysis: 'Esquema de acción de precio siguiendo Wyckoff.',
      recommendation: 'WAIT',
      visuals: {
        type: 'POLYLINE',
        points: majorPoints.slice(-10).map(p => ({ time: p.time, price: p.price }))
      }
    };
  }

  // 5. Liquidity Zones
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
    analysis: `Detectadas zonas de alta liquidez en niveles clave. El precio tiende a ser atraído hacia estos bloques de órdenes.`,
    recommendation: 'WAIT',
    visuals: {
      type: 'LIQUIDITY',
      points: zones.map(z => ({ time: data[data.length - 1].time, price: z.price, label: 'LIQUIDEZ' }))
    }
  };

  // 6. Support and Resistance Levels (Techo/Suelo Reales)
  const windowSize = Math.max(5, Math.floor(data.length / 15));
  const detectedPeaks = [];
  const detectedTroughs = [];

  for (let i = windowSize; i < highs.length - windowSize; i++) {
    const sH = highs.slice(i - windowSize, i + windowSize + 1);
    const sL = lows.slice(i - windowSize, i + windowSize + 1);
    if (highs[i] === Math.max(...sH)) detectedPeaks.push(highs[i]);
    if (lows[i] === Math.min(...sL)) detectedTroughs.push(lows[i]);
  }

  const clusterLevels = (levels: number[]) => {
    const clustered: number[] = [];
    levels.sort((a, b) => a - b).forEach(l => {
      const existing = clustered.find(c => Math.abs(c - l) / l < 0.003);
      if (!existing) clustered.push(l);
    });
    return clustered;
  };

  const currentClose = data[data.length - 1].close;
  const finalResistances = clusterLevels(detectedPeaks.filter(p => p > currentClose)).slice(0, 3);
  const finalSupports = clusterLevels(detectedTroughs.filter(t => t < currentClose)).reverse().slice(0, 3);

  // Fallback to basic pivots if empty
  if (finalResistances.length === 0) finalResistances.push(Math.max(...highs.slice(-20)));
  if (finalSupports.length === 0) finalSupports.push(Math.min(...lows.slice(-20)));

  raw['levels'] = {
    pattern: 'Techos/Suelos Reales',
    type: 'NEUTRAL',
    status: 'CONFIRMED',
    analysis: `Niveles estructurales calculados por algoritmo Helium-3. R: ${finalResistances.length}, S: ${finalSupports.length}.`,
    recommendation: 'WAIT',
    visuals: {
      type: 'PIVOT',
      points: [
        ...finalResistances.map((r, i) => ({ time: data[data.length-1].time, price: r, label: `R${i+1}` })),
        ...finalSupports.map((s, i) => ({ time: data[data.length-1].time, price: s, label: `S${i+1}` }))
      ]
    }
  };

  // Timeframe context
  const isScalping = ['1m', '3m', '5m'].includes(timeframe);
  const isSwing = ['4h', '1d'].includes(timeframe);
  results['context'] = isScalping ? "CONTEXTO: Scalping" : (isSwing ? "CONTEXTO: Swing Trading" : "CONTEXTO: Intradía");

  return { results, raw, indicators: indicatorData };
}
