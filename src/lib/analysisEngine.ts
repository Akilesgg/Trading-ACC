
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
    type: 'HORIZONTAL' | 'MARKER' | 'STRUCTURE' | 'POLYLINE';
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

  // 1. Doji
  if (bodySize < candleRange * 0.1) {
    return {
      pattern: 'Doji',
      type: 'NEUTRAL',
      status: 'CONFIRMED',
      analysis: 'Se ha formado una vela Doji, indicando indecisión extrema en el mercado. El precio de apertura y cierre son casi idénticos.',
      recommendation: 'WAIT',
      visuals: {
        type: 'MARKER',
        points: [{ time: last.time, price: last.high, label: 'Doji' }]
      }
    };
  }

  // 2. Hammer (Bullish)
  if (lowerWick > bodySize * 2 && upperWick < bodySize * 0.5 && !isBullish) {
    return {
      pattern: 'Martillo (Hammer)',
      type: 'BULLISH',
      status: 'CONFIRMED',
      analysis: 'Martillo detectado tras una presión vendedora. La larga mecha inferior indica que los compradores están absorbiendo la oferta.',
      recommendation: 'LONG',
      entryPrice: last.close,
      stopLoss: last.low * 0.995,
      takeProfit: last.close * 1.02,
      visuals: {
        type: 'MARKER',
        points: [{ time: last.time, price: last.low, label: 'Hammer' }]
      }
    };
  }

  // 3. Shooting Star (Bearish)
  if (upperWick > bodySize * 2 && lowerWick < bodySize * 0.5 && isBullish) {
    return {
      pattern: 'Estrella Fugaz (Shooting Star)',
      type: 'BEARISH',
      status: 'CONFIRMED',
      analysis: 'Estrella fugaz detectada. La larga mecha superior indica un fuerte rechazo de los niveles altos por parte de los vendedores.',
      recommendation: 'SHORT',
      entryPrice: last.close,
      stopLoss: last.high * 1.005,
      takeProfit: last.close * 0.98,
      visuals: {
        type: 'MARKER',
        points: [{ time: last.time, price: last.high, label: 'Shooting Star' }]
      }
    };
  }

  // 4. Engulfing
  const prevBodySize = Math.abs(prev.close - prev.open);
  if (!isPrevBullish && isBullish && last.close > prev.open && last.open < prev.close) {
    return {
      pattern: 'Engulfing Alcista',
      type: 'BULLISH',
      status: 'CONFIRMED',
      analysis: `Patrón Envolvente Alcista confirmado en ${last.close.toFixed(2)}. El cuerpo de la vela actual cubre completamente la vela bajista anterior, sugiriendo un cambio de momentum.`,
      recommendation: 'LONG',
      entryPrice: last.close,
      stopLoss: prev.low * 0.995,
      takeProfit: last.close * 1.03,
      visuals: {
        type: 'MARKER',
        points: [{ time: last.time, price: last.low, label: 'Engulfing' }]
      }
    };
  }
  if (isPrevBullish && !isBullish && last.close < prev.open && last.open > prev.close) {
    return {
      pattern: 'Engulfing Bajista',
      type: 'BEARISH',
      status: 'CONFIRMED',
      analysis: `Patrón Envolvente Bajista confirmado en ${last.close.toFixed(2)}. Los vendedores han tomado el control total, superando la fuerza de la vela alcista previa.`,
      recommendation: 'SHORT',
      entryPrice: last.close,
      stopLoss: prev.high * 1.005,
      takeProfit: last.close * 0.97,
      visuals: {
        type: 'MARKER',
        points: [{ time: last.time, price: last.high, label: 'Engulfing' }]
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
      pattern: 'Estrella del Amanecer (Morning Star)',
      type: 'BULLISH',
      status: 'CONFIRMED',
      analysis: 'Patrón Estrella del Amanecer detectado. Una vela bajista fuerte seguida de una vela de indecisión y una fuerte vela alcista indica una reversión de fondo.',
      recommendation: 'LONG'
    };
  }

  // Evening Star
  if (isPrev2Bullish && prevBodySize < prev2BodySize * 0.3 && !isBullish && last.close < (prev2.open + prev2.close) / 2) {
    return {
      pattern: 'Estrella del Atardecer (Evening Star)',
      type: 'BEARISH',
      status: 'CONFIRMED',
      analysis: 'Patrón Estrella del Atardecer detectado. La tendencia alcista ha perdido fuerza y los vendedores están entrando con agresividad.',
      recommendation: 'SHORT'
    };
  }

  // 6. Tweezer Tops / Bottoms
  if (Math.abs(last.high - prev.high) < last.high * 0.0005 && upperWick > bodySize) {
    return {
      pattern: 'Tweezer Top',
      type: 'BEARISH',
      status: 'CONFIRMED',
      analysis: `Tweezer Top detectado en ${last.high.toFixed(2)}. Dos velas consecutivas con el mismo máximo indican una resistencia muy fuerte.`,
      recommendation: 'SHORT'
    };
  }
  if (Math.abs(last.low - prev.low) < last.low * 0.0005 && lowerWick > bodySize) {
    return {
      pattern: 'Tweezer Bottom',
      type: 'BULLISH',
      status: 'CONFIRMED',
      analysis: `Tweezer Bottom detectado en ${last.low.toFixed(2)}. Dos velas consecutivas con el mismo mínimo indican un soporte sólido.`,
      recommendation: 'LONG'
    };
  }

  // 5. Marubozu
  if (bodySize > candleRange * 0.9 && bodySize > (data.slice(-20).reduce((acc, c) => acc + Math.abs(c.close - c.open), 0) / 20) * 1.5) {
    return {
      pattern: isBullish ? 'Marubozu Alcista' : 'Marubozu Bajista',
      type: isBullish ? 'BULLISH' : 'BEARISH',
      status: 'CONFIRMED',
      analysis: `Vela Marubozu detectada. Una vela con cuerpo completo y casi sin mechas indica una dominancia absoluta de los ${isBullish ? 'compradores' : 'vendedores'}.`,
      recommendation: isBullish ? 'LONG' : 'SHORT'
    };
  }

  return null;
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
  if (peaks.length >= 5 && troughs.length >= 4) {
    const p1 = peaks[peaks.length - 5];
    const t1 = troughs[troughs.length - 4];
    const p2 = peaks[peaks.length - 4];
    const t2 = troughs[troughs.length - 3];
    const p3 = peaks[peaks.length - 3]; // Wave 5 peak
    
    const t3 = troughs[troughs.length - 2]; // Wave A trough
    const p4 = peaks[peaks.length - 2]; // Wave B peak
    const t4 = troughs[troughs.length - 1]; // Wave C trough

    // Basic Impulse Wave: 1(p1) -> 2(t1) -> 3(p2) -> 4(t2) -> 5(p3)
    if (p2.value > p1.value && p3.value > p2.value && t2.value > t1.value && t2.value > p1.value) {
      
      // Check for corrective A-B-C after wave 5
      const isCorrective = t3.value < p3.value && p4.value < p3.value && p4.value > t3.value && t4.value < p4.value;

      return {
        pattern: isCorrective ? 'Ondas de Elliott (Ciclo Completo 1-5, A-C)' : 'Ondas de Elliott (1-2-3-4-5)',
        type: isCorrective ? 'BEARISH' : 'BULLISH',
        status: 'CONFIRMED',
        analysis: isCorrective 
          ? 'Ciclo de Elliott completo detectado. Tras las 5 ondas impulsivas, el mercado ha completado la corrección A-B-C. Se espera un nuevo ciclo o consolidación.'
          : 'Estructura de Ondas de Elliott detectada. El mercado está en un ciclo impulsivo alcista. Actualmente finalizando Onda 5.',
        recommendation: isCorrective ? 'SHORT' : 'LONG',
        entryPrice: data[p3.index].close,
        stopLoss: data[t2.index].low,
        takeProfit: data[p3.index].close * 1.05,
        visuals: {
          type: 'POLYLINE',
          points: [
            { time: data[p1.index].time, price: p1.value, label: '1' },
            { time: data[t1.index].time, price: t1.value, label: '2' },
            { time: data[p2.index].time, price: p2.value, label: '3' },
            { time: data[t2.index].time, price: t2.value, label: '4' },
            { time: data[p3.index].time, price: p3.value, label: '5' },
            ...(isCorrective ? [
              { time: data[t3.index].time, price: t3.value, label: 'A' },
              { time: data[p4.index].time, price: p4.value, label: 'B' },
              { time: data[t4.index].time, price: t4.value, label: 'C' }
            ] : [])
          ]
        }
      };
    }
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
 * Full Market Analysis Engine
 */
export function analyzeMarketData(data: Candle[], timeframe: string): { 
  results: Record<string, string>, 
  raw: Record<string, AnalysisResult> 
} {
  console.log(`[DEBUG] Iniciando análisis para temporalidad: ${timeframe}`);
  console.log(`[DEBUG] Datos recibidos: ${data.length} velas`);

  const results: Record<string, string> = {};
  const raw: Record<string, AnalysisResult> = {};

  // 1. Candlestick Analysis
  const candlePattern = detectCandlestickPatterns(data);
  if (candlePattern) {
    console.log(`[DEBUG] Patrón de vela detectado: ${candlePattern.pattern}`);
    results['candles'] = `**ANÁLISIS:** ${candlePattern.analysis}\n\n**RECOMENDACIÓN:** ${candlePattern.recommendation}`;
    raw['candles'] = candlePattern;
  } else {
    results['candles'] = `**ANÁLISIS:** No hay patrones de velas relevantes actualmente en la temporalidad de ${timeframe}.\n\n**RECOMENDACIÓN:** ESPERAR`;
  }

  // 2. Chart Pattern Analysis
  const chartPattern = detectChartPatterns(data);
  if (chartPattern) {
    console.log(`[DEBUG] Patrón de gráfico detectado: ${chartPattern.pattern}`);
    results['patterns'] = `**ANÁLISIS:** ${chartPattern.analysis}\n\n**RECOMENDACIÓN:** ${chartPattern.recommendation}`;
    raw['patterns'] = chartPattern;
    
    // If it's Elliott Waves, also put it in its own slot
    if (chartPattern.pattern.includes('Elliott')) {
      raw['elliott'] = chartPattern;
    }
  } else {
    results['patterns'] = `**ANÁLISIS:** No se detectan patrones estructurales claros en este momento.\n\n**RECOMENDACIÓN:** ESPERAR`;
  }

  // 3. Wyckoff Schematic (ZigZag of major points)
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
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
      analysis: 'Representación esquemática de la acción del precio siguiendo la metodología Wyckoff.',
      recommendation: 'WAIT',
      visuals: {
        type: 'POLYLINE',
        points: majorPoints.slice(-10).map(p => ({ time: p.time, price: p.price }))
      }
    };
  }

  // 4. Timeframe specific context
  const isScalping = ['1m', '3m', '5m'].includes(timeframe);
  const isSwing = ['4h', '1d'].includes(timeframe);

  if (isScalping) {
    results['context'] = "Enfoque de SCALPING: Priorizando volatilidad inmediata y micro-estructuras.";
  } else if (isSwing) {
    results['context'] = "Enfoque de SWING: Priorizando tendencias macro y niveles de liquidez institucional.";
  } else {
    results['context'] = "Enfoque INTRADÍA: Buscando movimientos de rango medio y confirmación de sesión.";
  }

  return { results, raw };
}
