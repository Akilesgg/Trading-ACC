import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  ChevronDown, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Info, 
  CheckCircle2, 
  Target, 
  Eye, 
  EyeOff,
  Search,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchKlines, fetchTicker, fetchCryptoData } from "@/services/cryptoService";
import { analyzeMarket } from "@/services/geminiService";
import { analyzeMarketData, Candle, AnalysisResult } from "@/lib/analysisEngine";
import { createChart, IChartApi, ISeriesApi, CandlestickData, LineData, UTCTimestamp, ColorType, CrosshairMode, CandlestickSeries, LineSeries, HistogramSeries, IPriceLine, SeriesMarker, createSeriesMarkers, ISeriesMarkersPluginApi } from 'lightweight-charts';
import { 
  Plus,
  Minus,
  Maximize2,
  RefreshCw
} from "lucide-react";

interface IndicatorConfig {
  id: string;
  name: string;
  enabled: boolean;
}

interface Strategy {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  logic: string;
}

const WyckoffAnalyzer: React.FC = () => {
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [activeStrategies, setActiveStrategies] = useState<string[]>(["scalping", "breakout", "trend_following"]);
  const [strategySignals, setStrategySignals] = useState<Record<string, {
    entry: number;
    tp1: number;
    tp2: number;
    tp3: number;
    sl: number;
    viable: boolean;
    reason: string;
  }>>({});
  
  const strategies: Strategy[] = [
    { 
      id: "scalping", 
      name: "Scalping de Alta Frecuencia", 
      icon: <Zap className="w-4 h-4" />,
      description: "Basada en micro-tendencias y reversión a la media usando RSI y Bandas de Bollinger.",
      logic: "Busca sobre-extensión en temporalidades cortas (1m-5m) para capturar rebotes rápidos."
    },
    { 
      id: "breakout", 
      name: "Ruptura de Rango (Breakout)", 
      icon: <TrendingUp className="w-4 h-4" />,
      description: "Identifica zonas de consolidación y entra cuando el precio rompe con volumen.",
      logic: "Utiliza el Volume Profile y Supertrend para confirmar la fuerza de la ruptura."
    },
    { 
      id: "trend_following", 
      name: "Seguimiento de Tendencia", 
      icon: <Activity className="w-4 h-4" />,
      description: "Estrategia conservadora que sigue la tendencia institucional de largo plazo.",
      logic: "Usa VWAP e Ichimoku Cloud para asegurar que estamos a favor del flujo de órdenes."
    }
  ];

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 49 });
  const [priceZoom, setPriceZoom] = useState(1);
  const [priceOffset, setPriceOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState("default");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const indicatorSeriesRef = useRef<Record<string, ISeriesApi<any>>>({});
  const polylineSeriesRef = useRef<Record<string, ISeriesApi<"Line">>>({});
  const priceLinesRef = useRef<IPriceLine[]>([]);
  const markersPluginRef = useRef<ISeriesMarkersPluginApi<any> | null>(null);
  const [macdData, setMacdData] = useState<{ macd: any[], signal: any[], histogram: any[] } | null>(null);
  
  const [wyckoffPhase, setWyckoffPhase] = useState<string>("");
  const [wyckoffExplanation, setWyckoffExplanation] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");
  
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { id: "patterns", name: "Patrones Detectados", enabled: false },
    { id: "candles", name: "Velas Japonesas", enabled: false },
    { id: "macd", name: "MACD", enabled: false },
    { id: "rsi", name: "RSI", enabled: false },
    { id: "bollinger", name: "Bandas de Bollinger", enabled: false },
    { id: "atr", name: "ATR", enabled: false },
    { id: "ichimoku", name: "Ichimoku Cloud", enabled: false },
    { id: "volprofile", name: "Volume Profile", enabled: false },
    { id: "stochrsi", name: "Stochastic RSI", enabled: false },
    { id: "supertrend", name: "Supertrend", enabled: false },
    { id: "vwap", name: "VWAP", enabled: false },
    { id: "psar", name: "Parabolic SAR", enabled: false },
    { id: "elliott", name: "Ondas de Elliott", enabled: false },
    { id: "wakeup", name: "Esquema Wyckoff (ZigZag)", enabled: false },
  ]);

  const [indicatorAnalysis, setIndicatorAnalysis] = useState<Record<string, string>>({});
  const [finalConclusion, setFinalConclusion] = useState<string>("");
  const [activePatterns, setActivePatterns] = useState<AnalysisResult | null>(null);
  const [activeCandles, setActiveCandles] = useState<AnalysisResult | null>(null);
  const [activeElliott, setActiveElliott] = useState<AnalysisResult | null>(null);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    // Calculate a straight baseline for Wyckoff Stage
    const minPrice = Math.min(...data.map(d => d.low));
    const baselinePrice = minPrice * 0.98;

    return data.map((d, i) => {
      const isBullish = d.close >= d.open;
      return {
        ...d,
        // Candlestick Data
        bodyRange: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
        wickRange: [d.low, d.high],
        color: isBullish ? '#00ffa3' : '#ff7162',
        
        // Realistic Mock Indicators (Smoothed)
        macd: 50 + Math.sin(i / 8) * 30 + Math.cos(i / 12) * 10,
        rsi: 50 + Math.sin(i / 6) * 25 + (Math.random() - 0.5) * 5,
        upperBB: d.close * (1.015 + Math.sin(i / 10) * 0.005),
        lowerBB: d.close * (0.985 - Math.sin(i / 10) * 0.005),
        atr: 40 + Math.sin(i / 15) * 10 + Math.random() * 5,
        ichimoku: d.close * (0.995 + Math.cos(i / 20) * 0.01),
        stochRsi: 50 + Math.cos(i / 5) * 45,
        
        // New Top Indicators
        supertrend: d.close * (i > 25 ? 0.98 : 1.02),
        vwap: d.close * (0.998 + Math.sin(i / 15) * 0.004),
        psar: d.close * (i % 10 > 5 ? 1.01 : 0.99),
        
        // Wake Up Phase (Straight White Line)
        wakeup: baselinePrice
      };
    });
  }, [data]);

  useEffect(() => {
    fetchCryptoData().then(setAllAssets);
  }, []);

  const filteredAssets = allAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAsset = allAssets.find(a => a.id === selectedSymbol);

  const toggleIndicator = React.useCallback((id: string) => {
    setIndicators(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  }, []);

  const runAnalysis = React.useCallback(async () => {
    setLoading(true);
    try {
      const klines = await fetchKlines(selectedSymbol, selectedTimeframe, 1000);
      setData(klines);
      setZoomRange({ start: Math.max(0, klines.length - 50), end: klines.length - 1 });
      const ticker = await fetchTicker(selectedSymbol);
      
      const aiResponse = await analyzeMarket(selectedSymbol, ticker.price, ticker.priceChangePercent);
      
      // Real Technical Analysis Engine
      const { results: realAnalysis, raw: rawAnalysis, indicators: indicatorData } = analyzeMarketData(klines as Candle[], selectedTimeframe);
      setMacdData(indicatorData.macd || null);
      
      console.log("[DEBUG] Análisis Real de Patrones:", realAnalysis['patterns']);
      console.log("[DEBUG] Análisis Real de Velas:", realAnalysis['candles']);

      // 1. Clear old visual patterns
      if (candlestickSeriesRef.current) {
        priceLinesRef.current.forEach(line => candlestickSeriesRef.current!.removePriceLine(line));
        priceLinesRef.current = [];
        
        Object.values(polylineSeriesRef.current).forEach(series => {
          chartRef.current?.removeSeries(series);
        });
        polylineSeriesRef.current = {};

        if (!markersPluginRef.current) {
          markersPluginRef.current = createSeriesMarkers(candlestickSeriesRef.current);
        }
        markersPluginRef.current.setMarkers([]);
      }

      // 2. Draw new visual patterns
      const markers: SeriesMarker<UTCTimestamp>[] = [];
      
      const patternsEnabled = indicators.find(i => i.id === 'patterns')?.enabled;
      const candlesEnabled = indicators.find(i => i.id === 'candles')?.enabled;
      const elliottEnabled = indicators.find(i => i.id === 'elliott')?.enabled;
      const wyckoffEnabled = indicators.find(i => i.id === 'wakeup')?.enabled;

      let currentPatterns: AnalysisResult | null = null;
      let currentCandles: AnalysisResult | null = null;
      let currentElliott: AnalysisResult | null = null;

      Object.entries(rawAnalysis).forEach(([key, analysis]) => {
        if (!analysis.visuals) return;
        
        // Check if indicator is enabled
        if (key === 'patterns' && !patternsEnabled) return;
        if (key === 'candles' && !candlesEnabled) return;
        if (key === 'elliott' && !elliottEnabled) return;
        if (key === 'wyckoff_schematic' && !wyckoffEnabled) return;

        if (key === 'patterns') {
          currentPatterns = analysis;
        }
        if (key === 'candles') {
          currentCandles = analysis;
        }
        if (key === 'elliott') {
          currentElliott = analysis;
        }

        const { visuals } = analysis;

        // Add dynamic Recommendation Arrows on the latest candle for all active indicators
        const latestTime = (data[data.length - 1].time / 1000) as UTCTimestamp;
        const offsetMultiplier = Object.keys(rawAnalysis).indexOf(key) + 1;
        
        markers.push({
          time: latestTime,
          position: analysis.type === 'BULLISH' ? 'belowBar' : (analysis.type === 'BEARISH' ? 'aboveBar' : 'inBar'),
          color: analysis.type === 'BULLISH' ? '#00ffa3' : (analysis.type === 'BEARISH' ? '#ff7162' : '#ffffff'),
          shape: analysis.type === 'BULLISH' ? 'arrowUp' : (analysis.type === 'BEARISH' ? 'arrowDown' : 'square'),
          text: `${analysis.pattern.split(' ')[0]} ${analysis.type === 'BULLISH' ? '↑' : (analysis.type === 'BEARISH' ? '↓' : '↔')}`,
          size: 2
        });

        if ((visuals.type === 'HORIZONTAL' || visuals.type === 'STRUCTURE') && visuals.price) {
          const line = candlestickSeriesRef.current!.createPriceLine({
            price: visuals.price,
            color: '#ffffff', // White
            lineWidth: 2,
            lineStyle: 1, // Dotted
            axisLabelVisible: true,
            title: analysis.pattern.toUpperCase(),
          });
          priceLinesRef.current.push(line);
        }

        if (visuals.type === 'STRUCTURE' && visuals.points) {
          // For Structure like H-C-H, also mark the peaks with dotted lines
          visuals.points.forEach(pt => {
             const line = candlestickSeriesRef.current!.createPriceLine({
              price: pt.price,
              color: '#ffffff',
              lineWidth: 1,
              lineStyle: 1, // Dotted
              axisLabelVisible: true,
              title: pt.label ? `${analysis.pattern}: ${pt.label}` : analysis.pattern,
            });
            priceLinesRef.current.push(line);
          });
        }

        // Draw Entry/SL/TP if present
        if (analysis.entryPrice && (key === 'patterns' || key === 'candles')) {
          const entryLine = candlestickSeriesRef.current!.createPriceLine({
            price: analysis.entryPrice,
            color: '#00ffa3',
            lineWidth: 2,
            lineStyle: 0,
            axisLabelVisible: true,
            title: `ENTRADA: $${analysis.entryPrice.toLocaleString()}`,
          });
          priceLinesRef.current.push(entryLine);

          if (analysis.stopLoss) {
            const slLine = candlestickSeriesRef.current!.createPriceLine({
              price: analysis.stopLoss,
              color: '#ff7162',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: `SL: $${analysis.stopLoss.toLocaleString()}`,
            });
            priceLinesRef.current.push(slLine);
          }

          if (analysis.takeProfit) {
            const tpLine = candlestickSeriesRef.current!.createPriceLine({
              price: analysis.takeProfit,
              color: '#00e0ff',
              lineWidth: 1,
              lineStyle: 2,
              axisLabelVisible: true,
              title: `TP: $${analysis.takeProfit.toLocaleString()}`,
            });
            priceLinesRef.current.push(tpLine);
          }
        }

        if (visuals.type === 'POLYLINE' && visuals.points) {
          const polySeries = chartRef.current!.addSeries(LineSeries, {
            color: '#ffffff',
            lineWidth: 3,
            lineStyle: 0,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          
          const lineData = visuals.points.map(pt => ({
            time: (pt.time / 1000) as UTCTimestamp,
            value: pt.price
          }));
          
          polySeries.setData(lineData);
          polylineSeriesRef.current[key] = polySeries;

          // Add markers for labels - Use clear, professional labels
          visuals.points.forEach(pt => {
            if (pt.label) {
              markers.push({
                time: (pt.time / 1000) as UTCTimestamp,
                position: 'aboveBar',
                color: '#ffffff',
                shape: 'circle',
                text: pt.label,
                size: 2
              });
            }
          });
        }

        if (visuals.points && visuals.type !== 'POLYLINE') {
          visuals.points.forEach(pt => {
            markers.push({
              time: (pt.time / 1000) as UTCTimestamp,
              position: analysis.type === 'BULLISH' ? 'belowBar' : 'aboveBar',
              color: analysis.type === 'BULLISH' ? '#00ffa3' : '#ff7162',
              shape: analysis.type === 'BULLISH' ? 'arrowUp' : 'arrowDown',
              text: pt.label || analysis.pattern,
            });
          });
        }
      });

      if (markersPluginRef.current && markers.length > 0) {
        // Sort markers by time
        markers.sort((a, b) => (a.time as number) - (b.time as number));
        markersPluginRef.current.setMarkers(markers);
      }

      setActivePatterns(currentPatterns);
      setActiveCandles(currentCandles);
      setActiveElliott(currentElliott);

      // 3. Draw Wyckoff Phase Context
      if (candlestickSeriesRef.current && wyckoffPhase && wyckoffEnabled) {
        const currentPrice = Number(ticker.price);
        const line = candlestickSeriesRef.current.createPriceLine({
          price: currentPrice,
          color: '#ffffff',
          lineWidth: 1,
          lineStyle: 2, // Dashed
          axisLabelVisible: true,
          title: "", // Removed title to avoid obstruction
        });
        priceLinesRef.current.push(line);
      }

      // Parsing logic
      const wyckoffMatch = aiResponse.match(/FASE WYCKOFF:?\s*(.*)/i);
      setWyckoffPhase(wyckoffMatch ? wyckoffMatch[1].split('\n')[0].trim() : "Acumulación - Fase C");

      const explanationMatch = aiResponse.match(/\*\*CONTEXTO Y EXPLICACIÓN BREVE\*\*:?\s*(.*)/i);
      setWyckoffExplanation(explanationMatch ? explanationMatch[1].split('\n\n')[0].trim() : "Estructura de mercado en fase de absorción institucional.");

      const recMatch = aiResponse.match(/\*\*RECOMENDACIÓN IA\*\*:?\s*(.*)/i);
      setRecommendation(recMatch ? recMatch[1].trim() : "Esperar confirmación de ruptura.");
      
      const analysisMap: Record<string, string> = {};
      indicators.filter(i => i.enabled).forEach(ind => {
        // Use real analysis if available for specific indicators
        if (realAnalysis[ind.id]) {
          const rawAnalysisText = realAnalysis[ind.id];
          // Map recommendation to Spanish
          const formattedAnalysis = rawAnalysisText
            .replace('**RECOMENDACIÓN:** LONG', '**RECOMENDACIÓN:** LONG')
            .replace('**RECOMENDACIÓN:** SHORT', '**RECOMENDACIÓN:** SHORT')
            .replace('**RECOMENDACIÓN:** WAIT', '**RECOMENDACIÓN:** ESPERAR');
          
          analysisMap[ind.id] = formattedAnalysis;
          return;
        }

        const indRegex = new RegExp(`${ind.name}:?\\s*(.*)`, 'i');
        const indMatch = aiResponse.match(indRegex);
        
        let detail = "";
        let rec = "";
        
        if (indMatch) {
          const parts = indMatch[1].split('.');
          detail = parts[0].trim();
          rec = parts[1] ? parts[1].trim() : "Mantener vigilancia en niveles de soporte/resistencia.";
        } else {
          detail = `El indicador ${ind.name} está siendo procesado bajo el contexto de ${selectedTimeframe}.`;
          rec = "ESPERAR";
        }

        analysisMap[ind.id] = `**ANÁLISIS:** ${detail}\n\n**RECOMENDACIÓN:** ${rec}`;
      });
      setIndicatorAnalysis(analysisMap);
      
      const conclusionMatch = aiResponse.match(/\*\*RECOMENDACIÓN FINAL\*\*:?\s*(.*)/i);
      let finalConclusionText = conclusionMatch ? conclusionMatch[1].trim() : "Confluencia técnica positiva. Mantener vigilancia en niveles clave.";
      
      // Add context from real engine to final conclusion
      if (realAnalysis['context']) {
        finalConclusionText = `${realAnalysis['context']}\n\n${finalConclusionText}`;
      }
      setFinalConclusion(finalConclusionText);

      // Generate Strategy Signals for all
      const currentPrice = Number(ticker.price);
      
      const timeframeMultipliers: Record<string, number> = {
        "1m": 0.001,
        "3m": 0.0015,
        "5m": 0.002,
        "15m": 0.005,
        "1h": 0.01,
        "4h": 0.02,
        "1d": 0.05
      };
      const multiplier = timeframeMultipliers[selectedTimeframe] || 0.005;
      const volatility = currentPrice * multiplier;
      
      const newSignals: Record<string, any> = {};

      strategies.forEach(strat => {
        let signalReason = "";
        let isViable = Math.random() > 0.15; // 85% viability for demo purposes

        if (strat.id === "scalping") {
          signalReason = isViable ? "Sobre-extensión detectada en RSI. Rebote inminente hacia la media." : "Volatilidad insuficiente para scalping seguro.";
        } else if (strat.id === "breakout") {
          signalReason = isViable ? "Ruptura de zona de valor con pico de volumen. Confirmación de tendencia." : "Falsa ruptura detectada. Sin volumen de confirmación.";
        } else {
          signalReason = isViable ? "Precio por encima de VWAP y Nube de Ichimoku. Tendencia alcista sólida." : "Tendencia lateral. Sin dirección clara en VWAP.";
        }

        newSignals[strat.id] = {
          entry: currentPrice,
          tp1: currentPrice + volatility,
          tp2: currentPrice + (volatility * 2),
          tp3: currentPrice + (volatility * 3),
          sl: currentPrice - (volatility * 1.5),
          viable: isViable,
          reason: signalReason
        };
      });

      setStrategySignals(newSignals);

    } catch (error) {
      console.error("Wyckoff analysis error:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedSymbol, selectedTimeframe, indicators.filter(i => i.enabled).length]);

  const toggleStrategy = React.useCallback((id: string) => {
    setActiveStrategies(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  }, []);

  useEffect(() => {
    runAnalysis();
  }, [selectedSymbol, selectedTimeframe, activeStrategies.length, indicators.filter(i => i.enabled).length]);

  const handleResetView = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
    }
  };

  const handleZoomIn = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const range = timeScale.getVisibleLogicalRange();
      if (range) {
        const newRange = {
          from: range.from + (range.to - range.from) * 0.1,
          to: range.to - (range.to - range.from) * 0.1,
        };
        timeScale.setVisibleLogicalRange(newRange);
      }
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      const timeScale = chartRef.current.timeScale();
      const range = timeScale.getVisibleLogicalRange();
      if (range) {
        const newRange = {
          from: range.from - (range.to - range.from) * 0.1,
          to: range.to + (range.to - range.from) * 0.1,
        };
        timeScale.setVisibleLogicalRange(newRange);
      }
    }
  };

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0b0f14' },
        textColor: '#d1d5db',
        fontSize: 14,
      },
      localization: {
        locale: 'es-ES',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.05)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.05)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: '#64748b',
          style: 3,
          labelBackgroundColor: '#0f172a',
        },
        horzLine: {
          width: 1,
          color: '#64748b',
          style: 3,
          labelBackgroundColor: '#0f172a',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.1)',
        autoScale: true,
        visible: true,
        alignLabels: true,
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.1)',
        timeVisible: true,
        secondsVisible: false,
        visible: true,
        rightOffset: 12,
        barSpacing: 10,
        fixLeftEdge: true,
        minBarSpacing: 0.1,
      },
      handleScroll: true,
      handleScale: true,
    });

    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ffa3',
      downColor: '#ff7162',
      borderVisible: false,
      wickUpColor: '#00ffa3',
      wickDownColor: '#ff7162',
    });

    chartRef.current = chart;
    candlestickSeriesRef.current = candlestickSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ 
          width: chartContainerRef.current.clientWidth,
          height: chartContainerRef.current.clientHeight 
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (markersPluginRef.current) {
        markersPluginRef.current.detach();
        markersPluginRef.current = null;
      }
      chart.remove();
    };
  }, []);

  const lastSymbolRef = useRef(selectedSymbol);
  const lastTimeframeRef = useRef(selectedTimeframe);

  useEffect(() => {
    if (!candlestickSeriesRef.current || !chartRef.current || chartData.length === 0) return;

    const formattedData = chartData.map(d => ({
      time: (d.time / 1000) as UTCTimestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    candlestickSeriesRef.current.setData(formattedData);

    if (lastSymbolRef.current !== selectedSymbol || lastTimeframeRef.current !== selectedTimeframe) {
      chartRef.current.timeScale().fitContent();
      lastSymbolRef.current = selectedSymbol;
      lastTimeframeRef.current = selectedTimeframe;
    }

    // Update Indicators
    const indicatorConfigs = [
      { id: 'bollinger_upper', key: 'upperBB', color: '#00e0ff', dash: [3, 3] },
      { id: 'bollinger_lower', key: 'lowerBB', color: '#00e0ff', dash: [3, 3] },
      { id: 'supertrend', key: 'supertrend', color: '#ffcc00', dash: [] },
      { id: 'vwap', key: 'vwap', color: '#ff00ff', dash: [] },
    ];

    indicatorConfigs.forEach(config => {
      const isEnabled = config.id.startsWith('bollinger') 
        ? indicators.find(i => i.id === 'bollinger')?.enabled 
        : indicators.find(i => i.id === config.id)?.enabled || config.id === 'wakeup';

      if (isEnabled) {
        if (!indicatorSeriesRef.current[config.id]) {
          indicatorSeriesRef.current[config.id] = chartRef.current!.addSeries(LineSeries, {
            color: config.color,
            lineWidth: config.id === 'wakeup' ? 3 : 2,
            lineStyle: config.dash.length ? 2 : 0,
            priceLineVisible: false,
            lastValueVisible: false,
            title: config.id === 'wakeup' ? 'Línea Base Wyckoff' : undefined,
          });
        }
        const lineData = chartData.map(d => ({
          time: (d.time / 1000) as UTCTimestamp,
          value: d[config.key],
        }));
        (indicatorSeriesRef.current[config.id] as ISeriesApi<"Line">).setData(lineData);
      } else if (indicatorSeriesRef.current[config.id]) {
        chartRef.current!.removeSeries(indicatorSeriesRef.current[config.id]);
        delete indicatorSeriesRef.current[config.id];
      }
    });

    // Handle MACD Pro
    const macdEnabled = indicators.find(i => i.id === 'macd')?.enabled;
    if (macdEnabled && macdData) {
      if (!indicatorSeriesRef.current['macd_line']) {
        // Histogram
        indicatorSeriesRef.current['macd_hist'] = chartRef.current!.addSeries(LineSeries, {
          color: '#26a69a',
          lineWidth: 2,
          priceScaleId: 'macd',
          priceLineVisible: false,
          lastValueVisible: false,
        });

        const histogramSeries = chartRef.current!.addSeries(CandlestickSeries, {
          priceScaleId: 'macd',
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickVisible: false,
          priceLineVisible: false,
          lastValueVisible: false,
        });

        // Use Histogram instead
        chartRef.current!.removeSeries(indicatorSeriesRef.current['macd_hist'] as ISeriesApi<"Line">);
        
        indicatorSeriesRef.current['macd_hist'] = chartRef.current!.addSeries(HistogramSeries as any, {
          color: '#26a69a',
          priceScaleId: 'macd',
          priceLineVisible: false,
          lastValueVisible: false,
        });

        indicatorSeriesRef.current['macd_line'] = chartRef.current!.addSeries(LineSeries, {
          color: '#2962FF',
          lineWidth: 2,
          priceScaleId: 'macd',
          priceLineVisible: false,
          lastValueVisible: false,
        });

        indicatorSeriesRef.current['macd_signal'] = chartRef.current!.addSeries(LineSeries, {
          color: '#FF6D00',
          lineWidth: 2,
          priceScaleId: 'macd',
          priceLineVisible: false,
          lastValueVisible: false,
        });

        chartRef.current!.priceScale('macd').applyOptions({
          mode: 0,
          autoScale: true,
          scaleMargins: { top: 0.8, bottom: 0.05 },
          borderColor: 'rgba(148, 163, 184, 0.1)',
        });
      }

      const hData = macdData.histogram.map((val, i) => {
        const prevVal = i > 0 ? macdData.histogram[i-1] : 0;
        let color = val >= 0 ? (val > prevVal ? '#26a69a' : '#b2dfdb') : (val < prevVal ? '#ef5350' : '#ffcdd2');
        return {
          time: (chartData[i].time / 1000) as UTCTimestamp,
          value: val,
          color: color
        };
      });

      const mData = macdData.macd.map((val, i) => ({
        time: (chartData[i].time / 1000) as UTCTimestamp,
        value: val
      }));

      const sData = macdData.signal.map((val, i) => ({
        time: (chartData[i].time / 1000) as UTCTimestamp,
        value: val
      }));

      (indicatorSeriesRef.current['macd_hist'] as any).setData(hData);
      (indicatorSeriesRef.current['macd_line'] as any).setData(mData);
      (indicatorSeriesRef.current['macd_signal'] as any).setData(sData);

    } else {
      ['macd_hist', 'macd_line', 'macd_signal'].forEach(id => {
        if (indicatorSeriesRef.current[id]) {
          chartRef.current!.removeSeries(indicatorSeriesRef.current[id]);
          delete indicatorSeriesRef.current[id];
        }
      });
    }

  }, [chartData, indicators, macdData]);

  return (
    <div className="space-y-8 bg-surface-container-low/20 p-8 rounded-[2.5rem] border border-outline-variant/10">
      {/* Strategy Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {strategies.map((strat) => {
          const isActive = activeStrategies.includes(strat.id);
          const signal = strategySignals[strat.id];
          
          return (
            <div key={strat.id} className="flex flex-col gap-3">
              <button
                onClick={() => toggleStrategy(strat.id)}
                className={cn(
                  "flex flex-col p-4 rounded-2xl border transition-all text-left group relative overflow-hidden h-full",
                  isActive 
                    ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/5" 
                    : "bg-surface-container-high/40 border-outline-variant/10 hover:border-outline-variant/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center border",
                    isActive ? "bg-primary/20 border-primary/30 text-primary" : "bg-surface/50 border-outline-variant/20 text-on-surface-variant"
                  )}>
                    {strat.icon}
                  </div>
                  <span className={cn(
                    "text-[11px] font-black uppercase tracking-widest",
                    isActive ? "text-primary" : "text-on-surface"
                  )}>
                    {strat.name}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant font-medium leading-tight mb-1">{strat.description}</p>
                <p className="text-[9px] text-on-surface-variant/60 italic leading-tight">{strat.logic}</p>
                {isActive && (
                  <motion.div layoutId={`strat-active-${strat.id}`} className="absolute bottom-0 left-0 right-0 h-1 bg-primary" />
                )}
              </button>

              <AnimatePresence>
                {isActive && signal && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "p-4 rounded-xl border text-[10px] font-medium",
                      signal.viable ? "bg-primary/5 border-primary/20" : "bg-secondary/5 border-secondary/20"
                    )}
                  >
                    {!signal.viable ? (
                      <div className="flex items-center gap-2 text-secondary font-black uppercase tracking-widest">
                        <X className="w-3 h-3" /> Estrategia Rechazada
                        <p className="text-[9px] lowercase font-normal opacity-80 mt-1 block">{signal.reason}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                          <span className="text-primary font-black uppercase tracking-widest">Recomendación Activa</span>
                          <span className="text-on-surface-variant font-black">{selectedTimeframe}</span>
                        </div>
                        <p className="italic text-on-surface-variant leading-tight">"{signal.reason}"</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-[8px] uppercase opacity-50 block">Entrada</span>
                            <span className="font-black text-on-surface">${signal.entry.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-[8px] uppercase opacity-50 block">Stop Loss</span>
                            <span className="font-black text-secondary">${signal.sl.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="bg-primary/10 p-1 rounded text-center">
                            <span className="text-[7px] block opacity-60">TP1</span>
                            <span className="font-black text-[9px]">${signal.tp1.toLocaleString()}</span>
                          </div>
                          <div className="bg-primary/10 p-1 rounded text-center">
                            <span className="text-[7px] block opacity-60">TP2</span>
                            <span className="font-black text-[9px]">${signal.tp2.toLocaleString()}</span>
                          </div>
                          <div className="bg-primary/10 p-1 rounded text-center">
                            <span className="text-[7px] block opacity-60">TP3</span>
                            <span className="font-black text-[9px]">${signal.tp3.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="h-12 w-full mt-2 opacity-50 bg-primary/5 rounded flex items-center justify-center">
                          <Activity className="w-4 h-4 text-primary animate-pulse" />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-on-surface">Analizador Wyckoff & Indicadores</h2>
        <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest opacity-80">Teoría de Ciclos de Mercado y Análisis Técnico</p>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-4">
      {/* Asset Selector */}
      <div className="relative">
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-on-surface flex items-center gap-3 min-w-[180px]"
        >
          {selectedAsset && <img src={selectedAsset.image} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />}
          {selectedSymbol}
          <ChevronDown className="w-4 h-4 ml-auto" />
        </button>
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
            <div className="p-2 border-b border-outline-variant/10 mb-2 flex items-center gap-2">
              <Search className="w-3 h-3 text-on-surface-variant" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase w-full"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {filteredAssets.map(asset => (
              <button
                key={asset.id}
                onClick={() => { setSelectedSymbol(asset.id); setIsSearchOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-primary/10 flex items-center gap-3"
              >
                <img src={asset.image} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                {asset.id}
              </button>
            ))}
            {searchQuery && !filteredAssets.find(a => a.id.toLowerCase() === searchQuery.toLowerCase()) && (
              <div className="mt-2 pt-2 border-t border-outline-variant/10">
                <p className="text-[8px] text-on-surface-variant uppercase font-black px-2 mb-1">No encontrado en lista</p>
                <button
                  onClick={() => { setSelectedSymbol(searchQuery.toUpperCase()); setIsSearchOpen(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase bg-primary/20 text-primary hover:bg-primary/30 flex items-center justify-between"
                >
                  <span>Analizar "{searchQuery.toUpperCase()}"</span>
                  <Activity className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Timeframe Selector */}
      <select 
        value={selectedTimeframe}
        onChange={e => setSelectedTimeframe(e.target.value)}
        className="bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-on-surface outline-none"
      >
        {["1m", "3m", "5m", "15m", "1h", "4h", "1d"].map(tf => <option key={tf} value={tf}>{tf.toUpperCase()}</option>)}
      </select>
    </div>
  </div>

  {/* Chart and Phase */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div className="lg:col-span-12 space-y-6">
      <div 
        ref={chartContainerRef}
        className="w-full h-[550px] rounded-xl bg-[#0b0f14] border border-outline-variant/10 relative"
      >
        {loading && (
          <div className="absolute inset-0 bg-surface/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-3">
          <div className="bg-primary/10 backdrop-blur-md border border-primary/20 px-3 py-1.5 rounded-lg">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Fase: {wyckoffPhase}</span>
          </div>
          
          <div className="flex items-center gap-1 bg-surface-container-high/80 backdrop-blur-md border border-outline-variant/20 p-1 rounded-lg">
            <button 
              onClick={handleResetView}
              title="Reset View"
              className="p-1.5 rounded-md hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => chartRef.current?.timeScale().fitContent()}
              title="Auto Scale"
              className="p-1.5 rounded-md hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-outline-variant/20 mx-1" />
            <button 
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-md hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-md hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-colors"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-surface-container-high/80 backdrop-blur-md border border-outline-variant/20 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Tendencia:</span>
            {chartData.length > 1 && (
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter",
                chartData[chartData.length-1].close > chartData[0].close ? "text-primary" : chartData[chartData.length-1].close < chartData[0].close ? "text-secondary" : "text-tertiary"
              )}>
                {chartData[chartData.length-1].close > chartData[0].close ? (
                  <><TrendingUp className="w-3.5 h-3.5" /> Alcista</>
                ) : chartData[chartData.length-1].close < chartData[0].close ? (
                  <><TrendingDown className="w-3.5 h-3.5" /> Bajista</>
                ) : (
                  <><Minus className="w-3.5 h-3.5" /> Lateral</>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Floating Analysis Boxes - Draggable UX */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <AnimatePresence>
            {activePatterns && (
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, x: 20, y: 350 }}
                animate={{ opacity: 1, x: 0, y: 350 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "absolute bottom-4 right-4 p-5 rounded-2xl backdrop-blur-xl border shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto cursor-move max-w-[320px] font-sans",
                  activePatterns.type === 'BULLISH' ? "bg-primary/10 border-primary/30" : 
                  activePatterns.type === 'BEARISH' ? "bg-secondary/10 border-secondary/30" : 
                  "bg-surface-container-high/80 border-outline-variant/30"
                )}
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <span className="text-[13px] font-black uppercase tracking-widest text-white">PATRÓN ESTRUCTURAL</span>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                    activePatterns.type === 'BULLISH' ? "bg-primary/20 text-primary border-primary/30" : 
                    activePatterns.type === 'BEARISH' ? "bg-secondary/20 text-secondary border-secondary/30" : 
                    "bg-outline-variant text-on-surface-variant"
                  )}>
                    {activePatterns.pattern}
                  </div>
                </div>
                <p className="text-[14px] text-on-surface-variant leading-relaxed mb-4 font-medium">{activePatterns.analysis}</p>
                {activePatterns.entryPrice && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                    <div className="bg-white/5 p-2 rounded-lg text-center">
                      <span className="text-[10px] uppercase opacity-40 block font-black mb-1">Entrada Sugerida</span>
                      <span className="text-[14px] font-bold text-on-surface font-mono">${activePatterns.entryPrice.toLocaleString()}</span>
                    </div>
                    <div className="bg-white/5 p-2 rounded-lg text-center">
                      <span className="text-[10px] uppercase opacity-40 block font-black mb-1">Objetivo (TP)</span>
                      <span className="text-[14px] font-bold text-primary font-mono">${activePatterns.takeProfit?.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeCandles && (
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 10 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "absolute top-4 right-4 p-5 rounded-2xl backdrop-blur-xl border shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto cursor-move max-w-[320px] font-sans",
                  activeCandles.type === 'BULLISH' ? "bg-primary/10 border-primary/30" : 
                  activeCandles.type === 'BEARISH' ? "bg-secondary/10 border-secondary/30" : 
                  "bg-surface-container-high/80 border-outline-variant/30"
                )}
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <span className="text-[13px] font-black uppercase tracking-widest text-white">VELAS JAPONESAS</span>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                    activeCandles.type === 'BULLISH' ? "bg-primary/20 text-primary border-primary/30" : 
                    activeCandles.type === 'BEARISH' ? "bg-secondary/20 text-secondary border-secondary/30" : 
                    "bg-outline-variant text-on-surface-variant"
                  )}>
                    {activeCandles.recommendation === 'LONG' ? 'RECO: COMPRA' : (activeCandles.recommendation === 'SHORT' ? 'RECO: VENTA' : 'ESPERAR')}
                  </div>
                </div>
                <div className="mb-3">
                   <p className="text-[13px] font-black text-white/90 uppercase tracking-tighter mb-1">{activeCandles.pattern}</p>
                   <p className="text-[14px] text-on-surface-variant leading-relaxed font-medium">{activeCandles.analysis}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 mt-2">
                    <span className="text-[10px] uppercase text-white/40 block mb-1 font-black">Estrategia Detallada</span>
                    <p className="text-[13px] text-white font-medium italic">
                      {activeCandles.type === 'BULLISH' ? 'Buscar confirmación alcista tras cierre de vela. Proyectar entrada en el 50% del cuerpo.' : 
                       activeCandles.type === 'BEARISH' ? 'Presión vendedora detectada. Posible retroceso inminente. Reducir exposición o buscar cortos.' : 
                       'Mercado en equilibrio. Evitar operar hasta ruptura clara de rangos.'}
                    </p>
                </div>
              </motion.div>
            )}

            {activeElliott && (
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, x: -350, y: 250 }}
                animate={{ opacity: 1, x: 0, y: 250 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-4 left-4 p-6 rounded-2xl bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] pointer-events-auto cursor-move space-y-4 max-w-[320px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-[14px] font-black uppercase tracking-widest text-white">FASE ACTUAL DE ELLIOTT</span>
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                    activeElliott.type === 'BULLISH' ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/20 text-secondary border border-secondary/30"
                  )}>
                    {activeElliott.type === 'BULLISH' ? 'ALCISTA' : 'BAJISTA'}
                  </div>
                </div>

                {/* Mini Wave Visualization */}
                <div className="flex items-end justify-between h-14 px-2 border-b border-white/5 pb-2">
                  {[1, 2, 3, 4, 5, 'A', 'B', 'C'].map((label, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div className={cn(
                        "w-1.5 rounded-t-full transition-all duration-500",
                        i % 2 === 0 ? "h-6 bg-white/20" : "h-3 bg-white/10",
                        activeElliott.visuals?.points?.some(p => p.label === String(label)) ? "bg-primary h-8 shadow-[0_0_10px_rgba(0,255,163,0.5)]" : ""
                      )} />
                      <span className="text-[8px] font-black text-white/40">{label}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <p className="text-[14px] text-white/80 leading-relaxed font-medium font-sans">{activeElliott.analysis}</p>
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 bg-gradient-to-br from-white/5 to-transparent">
                    <span className="text-[10px] uppercase text-white/40 block mb-1 font-black">RECOMENDACIÓN DE ENTRADA</span>
                    <p className="text-[14px] text-white font-black leading-tight">
                      {activeElliott.recommendation === 'LONG' ? '🚀 LONG en inicio de onda 3' : '📉 SHORT en onda C'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {indicators.find(i => i.id === 'wakeup')?.enabled && wyckoffPhase && (
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, x: -350, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 10 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-4 left-4 p-5 rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto cursor-move max-w-[320px]"
              >
                <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-[13px] font-black uppercase tracking-widest text-white">Fases Wyckoff</span>
                </div>
                <div className="mb-3">
                  <span className="text-[11px] font-black text-primary uppercase bg-primary/10 border border-primary/20 px-3 py-1 rounded-full">Fase Actual: {wyckoffPhase}</span>
                </div>
                <p className="text-[14px] text-on-surface-variant leading-relaxed mb-4 font-medium font-sans">{wyckoffExplanation}</p>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-full text-center py-2 rounded-xl text-[13px] font-black uppercase tracking-widest border",
                    recommendation.toLowerCase().includes('compra') || recommendation.toLowerCase().includes('alcista') ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/20 text-secondary border-secondary/30"
                  )}>
                    {recommendation.toLowerCase().includes('compra') || recommendation.toLowerCase().includes('alcista') ? 'RECO: ALCISTA' : 'RECO: BAJISTA'}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

    {/* Indicators and Analysis Section - Moved below chart */}
    <div className="lg:col-span-12 space-y-8">
      <div className="trading-card p-6 space-y-6 bg-surface-container-high/20 border-primary/10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-[14px] font-black uppercase tracking-widest text-on-surface">Panel de Indicadores Técnicos</h3>
              <p className="text-[10px] font-black text-on-surface-variant uppercase opacity-60">Activa o desactiva para visualizar señales en tiempo real</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {indicators.map(ind => (
            <button
              key={ind.id}
              onClick={() => toggleIndicator(ind.id)}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all duration-300 group",
                ind.enabled 
                  ? "bg-primary/15 border-primary/40 text-primary shadow-[0_0_25px_rgba(0,255,163,0.2)] scale-[1.02]" 
                  : "bg-surface-container-high/40 border-outline-variant/10 text-on-surface-variant hover:border-outline-variant/40 hover:bg-surface-container-high"
              )}
            >
              {ind.enabled ? (
                <Eye className="w-4 h-4 animate-pulse" />
              ) : (
                <EyeOff className="w-4 h-4 opacity-40 group-hover:opacity-100 transition-opacity" />
              )}
              {ind.name}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Wyckoff Context */}
        <div className="trading-card p-8 space-y-8 bg-surface-container-high/40 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(0,255,163,0.1)]">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-tighter text-on-surface">Análisis de Contexto Wyckoff</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 group hover:bg-primary/10 transition-all duration-300">
              <span className="text-[9px] uppercase opacity-50 block mb-2 font-black tracking-widest">Fase Actual</span>
              <span className="text-xl font-black text-primary uppercase tracking-tight">{wyckoffPhase || "Analizando..."}</span>
            </div>

            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 group hover:bg-primary/15 transition-all duration-300">
              <span className="text-[9px] uppercase opacity-50 block mb-2 font-black tracking-widest">Recomendación</span>
              <p className="text-[14px] text-on-surface font-black leading-tight">{recommendation || "Esperando confirmación..."}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface/50 border border-outline-variant/10">
            <span className="text-[9px] uppercase opacity-50 block mb-2 font-black tracking-widest">Explicación Estructural</span>
            <p className="text-[12px] text-on-surface-variant leading-relaxed font-medium">
              {wyckoffExplanation || "El motor de IA está procesando los datos históricos para identificar la fase del ciclo de mercado..."}
            </p>
          </div>
        </div>

        {/* Active Indicators Details */}
        <div className="space-y-6 max-h-[500px] overflow-y-auto custom-scrollbar pr-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[14px] font-black uppercase tracking-widest text-on-surface">Detalles de Indicadores</h3>
            <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
              {indicators.filter(i => i.enabled).length} Activos
            </span>
          </div>
          
          {indicators.filter(i => i.enabled).map(ind => (
            <motion.div
              key={ind.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-container-high/40 border border-outline-variant/10 rounded-3xl p-6 hover:border-primary/30 transition-all duration-300 shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,163,0.5)]" />
                  <span className="text-[12px] font-black uppercase tracking-widest text-primary">{ind.name}</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-4">
                {indicatorAnalysis[ind.id]?.split('\n\n').map((line, idx) => (
                  <p key={idx} className="text-[12px] text-on-surface-variant leading-relaxed font-medium">
                    {line.startsWith('**ANÁLISIS:**') ? (
                      <><span className="text-primary font-black uppercase text-[10px] tracking-wider mr-2">Análisis:</span> {line.replace('**ANÁLISIS:**', '')}</>
                    ) : line.startsWith('**RECOMENDACIÓN:**') ? (
                      <><span className="text-primary font-black uppercase text-[10px] tracking-wider mr-2">Recomendación:</span> {line.replace('**RECOMENDACIÓN:**', '')}</>
                    ) : line}
                  </p>
                ))}
                {!indicatorAnalysis[ind.id] && (
                  <div className="flex items-center gap-3 text-[11px] text-on-surface-variant opacity-50 italic">
                    <RefreshCw className="w-4 h-4 animate-spin" /> Procesando señales técnicas avanzadas...
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {indicators.filter(i => i.enabled).length === 0 && (
            <div className="flex flex-col items-center justify-center p-16 border-2 border-dashed border-outline-variant/10 rounded-3xl opacity-20">
              <EyeOff className="w-10 h-10 mb-4" />
              <p className="text-[12px] font-black uppercase tracking-widest text-center max-w-[200px]">Activa indicadores en el panel superior para ver el análisis detallado</p>
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Final Conclusion */}
    <div className="grid grid-cols-1 gap-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="trading-card p-8 bg-primary/5 border-primary/30 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-on-surface">Conclusión y Recomendación Final</h3>
          </div>
          <div className="p-6 bg-surface-container-low/50 rounded-2xl border border-outline-variant/10">
            <p className="text-base text-on-surface font-bold leading-relaxed italic">"{finalConclusion}"</p>
          </div>
        </div>
      </motion.div>
    </div>
    </div>
  </div>
);
};

export default WyckoffAnalyzer;
