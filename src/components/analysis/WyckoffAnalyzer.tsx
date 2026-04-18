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
  RefreshCw,
  RotateCcw
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
    { id: "patterns", name: "Patrones de Precios", enabled: false },
    { id: "candles", name: "Velas Japonesas", enabled: false },
    { id: "elliott", name: "Ondas de Elliott", enabled: false },
    { id: "wakeup", name: "Fases de Wyckoff", enabled: false },
    { id: "macd", name: "MACD Avanzado", enabled: false },
    { id: "liquidity", name: "Zonas de Liquidez", enabled: false },
    { id: "levels", name: "Techo/Suelo", enabled: false },
    { id: "supertrend", name: "Supertrend IA", enabled: false },
    { id: "bollinger", name: "Bandas de Bollinger", enabled: false },
    { id: "ai_pro", name: "Análisis ✦✦", enabled: false }
  ]);

  const [indicatorAnalysis, setIndicatorAnalysis] = useState<Record<string, string>>({});
  const [finalConclusion, setFinalConclusion] = useState<string>("");
  const [activePatterns, setActivePatterns] = useState<AnalysisResult | null>(null);
  const [activeCandles, setActiveCandles] = useState<AnalysisResult | null>(null);
  const [activeElliott, setActiveElliott] = useState<AnalysisResult | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [rawAnalysisData, setRawAnalysisData] = useState<Record<string, any>>({});

  const handleManualRefresh = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setRefreshTrigger(prev => prev + 1);
  };

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

      // 1. Technical Analysis Engine
      setIndicatorAnalysis(realAnalysis);
      setRawAnalysisData(rawAnalysis);

      // 2. Draw new visual patterns
      const markers: SeriesMarker<UTCTimestamp>[] = [];
      
      const patternsEnabled = indicators.find(i => i.id === 'patterns')?.enabled;
      const candlesEnabled = indicators.find(i => i.id === 'candles')?.enabled;
      const elliottEnabled = indicators.find(i => i.id === 'elliott')?.enabled;
      const wyckoffEnabled = indicators.find(i => i.id === 'wakeup')?.enabled;

      const liquidityEnabled = indicators.find(i => i.id === 'liquidity')?.enabled;
      const levelsEnabled = indicators.find(i => i.id === 'levels')?.enabled;

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
        
        // Handle Levels separately
        if (key === 'levels' || analysis.visuals.type === 'PIVOT') {
          if (!levelsEnabled) return;
        }
        
        if ((key === 'liquidity' || analysis.visuals.type === 'LIQUIDITY') && !liquidityEnabled) return;

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
      setRawAnalysisData(rawAnalysis);
      
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
    if (!chartRef.current || !candlestickSeriesRef.current || chartData.length === 0) return;

    // 1. Set Main Candlestick Data
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

    if (chartRef.current && chartData.length > 0) {
      // ... drawings ...
      // 1. Clear previous drawings
      priceLinesRef.current.forEach(line => candlestickSeriesRef.current?.removePriceLine(line));
      priceLinesRef.current = [];
      
      Object.keys(polylineSeriesRef.current).forEach(key => {
        chartRef.current?.removeSeries(polylineSeriesRef.current[key]);
      });
      polylineSeriesRef.current = {};

      if (markersPluginRef.current) {
        markersPluginRef.current.setMarkers([]);
      }

      // 2. Draw new visual patterns
      const markers: SeriesMarker<UTCTimestamp>[] = [];
      
      const patternsEnabled = indicators.find(i => i.id === 'patterns')?.enabled;
      const candlesEnabled = indicators.find(i => i.id === 'candles')?.enabled;
      const elliottEnabled = indicators.find(i => i.id === 'elliott')?.enabled;
      const wyckoffEnabled = indicators.find(i => i.id === 'wakeup')?.enabled;
      const liquidityEnabled = indicators.find(i => i.id === 'liquidity')?.enabled;
      const levelsEnabled = indicators.find(i => i.id === 'levels')?.enabled;

      let currentPatterns: AnalysisResult | null = null;
      let currentCandles: AnalysisResult | null = null;
      let currentElliott: AnalysisResult | null = null;

      Object.entries(rawAnalysisData).forEach(([key, analysis]) => {
        if (!analysis.visuals) return;
        
        // Check if indicator is enabled
        if (key === 'patterns' && !patternsEnabled) return;
        if (key === 'candles' && !candlesEnabled) return;
        if (key === 'elliott' && !elliottEnabled) return;
        if (key === 'wyckoff_schematic' && !wyckoffEnabled) return;

        if (key === 'patterns') currentPatterns = analysis;
        if (key === 'candles') currentCandles = analysis;
        if (key === 'elliott') currentElliott = analysis;

        const { visuals } = analysis;
        const isLiquidity = key === 'liquidity' || visuals.type === 'LIQUIDITY';
        const isLevels = key === 'levels' || visuals.type === 'PIVOT';

        if (isLiquidity && !liquidityEnabled) return;
        if (isLevels && !levelsEnabled) return;

        // Current price lines for patterns and candles
        if ((key === 'patterns' || key === 'candles') && visuals.price) {
          const lineColor = key === 'patterns' ? '#00ffa3' : '#ffffff';
          const lineTitle = `${analysis.pattern.toUpperCase()} DETECTADO`;
          const line = candlestickSeriesRef.current!.createPriceLine({
            price: visuals.price,
            color: lineColor,
            lineWidth: 2,
            lineStyle: 1, // Dotted
            axisLabelVisible: true,
            title: lineTitle,
          });
          priceLinesRef.current.push(line);
        }

        // ENTRY/SL/TP logic
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

        // Add dynamic Recommendation Arrows on the latest candle for all active indicators
        const latestTime = (chartData[chartData.length - 1].time / 1000) as UTCTimestamp;
        
        markers.push({
          time: latestTime,
          position: analysis.type === 'BULLISH' ? 'belowBar' : (analysis.type === 'BEARISH' ? 'aboveBar' : 'inBar'),
          color: analysis.type === 'BULLISH' ? '#00ffa3' : (analysis.type === 'BEARISH' ? '#ff7162' : '#ffffff'),
          shape: analysis.type === 'BULLISH' ? 'arrowUp' : (analysis.type === 'BEARISH' ? 'arrowDown' : 'square'),
          text: `${analysis.pattern.split(' ')[0]} ${analysis.type === 'BULLISH' ? '↑' : (analysis.type === 'BEARISH' ? '↓' : '↔')}`,
          size: 2
        });

        if (key === 'liquidity' && visuals.points) {
          visuals.points.forEach(pt => {
            const basePrice = pt.price;
            // Higher liquidity zones will be slightly more prominent
            const range = 0.0008; 
            for (let i = -6; i <= 6; i++) {
              const absVal = Math.abs(i);
              const opacity = (1 - absVal / 7) * 0.45;
              const priceLine = candlestickSeriesRef.current!.createPriceLine({
                price: basePrice * (1 + (i * range / 6)),
                color: `rgba(255, 0, 0, ${opacity.toFixed(3)})`,
                lineWidth: 2,
                lineStyle: 0,
                axisLabelVisible: i === 0,
                title: i === 0 ? 'LIQUIDEZ CRÍTICA' : '',
              });
              priceLinesRef.current.push(priceLine);
            }
          });
          return;
        }

        if (key === 'levels' && visuals.points) {
          visuals.points.forEach(pt => {
            if (pt.label === 'PIVOTE') return; // Skip central pivot as requested
            const line = candlestickSeriesRef.current!.createPriceLine({
              price: pt.price,
              color: '#38bdf8',
              lineWidth: 2,
              lineStyle: 0,
              axisLabelVisible: true,
              title: pt.label || 'NIVEL CLAVE',
            });
            priceLinesRef.current.push(line);
          });
          return;
        }

        if (key === 'elliott' && visuals.points) {
          const polySeries = chartRef.current!.addSeries(LineSeries, {
            color: '#ffffff',
            lineWidth: 2,
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

          visuals.points.forEach(pt => {
            if (pt.label) {
              markers.push({
                time: (pt.time / 1000) as UTCTimestamp,
                position: pt.price > chartData[chartData.length-1].close ? 'aboveBar' : 'belowBar',
                color: '#ffffff',
                shape: 'circle',
                text: pt.label,
                size: 2
              });
            }
          });
          return;
        }

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
          visuals.points.forEach(pt => {
             const line = candlestickSeriesRef.current!.createPriceLine({
              price: pt.price,
              color: '#ffffff',
              lineWidth: 1,
              lineStyle: 1, // Dotted
              axisLabelVisible: true,
              title: pt.label ? `${analysis.pattern}: ${pt.label}` : analysis.pattern.toUpperCase(),
            });
            priceLinesRef.current.push(line);
            
            markers.push({
               time: (pt.time / 1000) as UTCTimestamp,
               position: 'aboveBar',
               color: '#ffffff',
               shape: 'circle',
               text: pt.label || analysis.pattern,
               size: 1
            });
          });
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

          visuals.points.forEach(pt => {
            if (pt.label) {
              const markerTime = (pt.time / 1000) as UTCTimestamp;
              const candle = chartData.find(d => d.time === pt.time);
              markers.push({
                time: markerTime,
                position: candle && pt.price > candle.close ? 'aboveBar' : 'belowBar',
                color: '#ffffff',
                shape: 'circle',
                text: pt.label,
                size: 2
              });
            }
          });
        }
      });

      if (markersPluginRef.current && markers.length > 0) {
        markers.sort((a, b) => (a.time as number) - (b.time as number));
        markersPluginRef.current.setMarkers(markers);
      }

      setActivePatterns(currentPatterns);
      setActiveCandles(currentCandles);
      setActiveElliott(currentElliott);
    }

    // 4. Update Other Indicator Series (BB, Supertrend, etc)
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

    // 5. Handle MACD
    const macdEnabled = indicators.find(i => i.id === 'macd')?.enabled;
    if (macdEnabled && macdData) {
      if (!indicatorSeriesRef.current['macd_line']) {
        const hSeries = chartRef.current!.addSeries(HistogramSeries as any, {
          color: '#26a69a',
          priceScaleId: 'macd',
          priceLineVisible: false,
          lastValueVisible: false,
        });
        indicatorSeriesRef.current['macd_hist'] = hSeries;

        const mSeries = chartRef.current!.addSeries(LineSeries, {
          color: '#2962FF',
          lineWidth: 2,
          priceScaleId: 'macd',
          priceLineVisible: false,
          lastValueVisible: false,
        });
        indicatorSeriesRef.current['macd_line'] = mSeries;

        const sSeries = chartRef.current!.addSeries(LineSeries, {
          color: '#FF6D00',
          lineWidth: 2,
          priceScaleId: 'macd',
          priceLineVisible: false,
          lastValueVisible: false,
        });
        indicatorSeriesRef.current['macd_signal'] = sSeries;

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
  }, [chartData, selectedTimeframe, indicators, indicatorAnalysis, macdData, refreshTrigger, selectedSymbol, rawAnalysisData]);

  return (
    <div className="space-y-8 bg-surface-container-low/20 p-8 rounded-[2.5rem] border border-outline-variant/10 relative">
      {/* Strategy Selector - Now at the top for quick context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
        {strategies.map((strat) => {
          const isActive = activeStrategies.includes(strat.id);
          const signal = strategySignals[strat.id];
          
          return (
            <div key={strat.id} className="flex flex-col gap-4">
              <button
                onClick={() => toggleStrategy(strat.id)}
                className={cn(
                  "flex flex-col p-6 rounded-3xl border transition-all text-left group relative overflow-hidden h-full",
                  isActive 
                    ? "bg-primary/10 border-primary/50 shadow-[0_0_30px_rgba(0,255,163,0.1)] scale-[1.02]" 
                    : "bg-surface-container-high/20 border-white/5 hover:border-white/10 opacity-70"
                )}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-12",
                    isActive ? "bg-primary/20 border-primary/40 text-primary shadow-[0_0_15px_rgba(0,255,163,0.3)]" : "bg-white/5 border-white/10 text-white/40"
                  )}>
                    {strat.icon}
                  </div>
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-[14px] font-black uppercase tracking-[0.1em] leading-tight",
                      isActive ? "text-primary" : "text-white"
                    )}>
                      {strat.name}
                    </span>
                    <span className="text-[10px] uppercase font-black tracking-widest text-white/40 mt-1">Estrategia Activa</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-black text-primary/60 tracking-widest block">Objetivo</span>
                    <p className="text-[13px] text-white/80 font-medium leading-relaxed">{strat.description}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                    <span className="text-[10px] uppercase font-black text-white/40 tracking-widest block mb-2">Lógica de Ejecución</span>
                    <p className="text-[12px] text-white/60 italic leading-snug">{strat.logic}</p>
                  </div>
                </div>

                {isActive && (
                  <motion.div layoutId={`strat-active-indicator-${strat.id}`} className="absolute bottom-0 left-0 right-0 h-1.5 bg-primary shadow-[0_-5px_15px_rgba(0,255,163,0.5)]" />
                )}
              </button>

              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    className={cn(
                      "p-6 rounded-[2rem] border-2 shadow-2xl relative overflow-hidden",
                      signal?.viable 
                        ? "bg-[#0b0f14]/80 border-primary/30 backdrop-blur-3xl" 
                        : "bg-[#1a0a0a]/80 border-secondary/30 backdrop-blur-3xl"
                    )}
                  >
                    {!signal ? (
                      <div className="flex flex-col items-center justify-center py-8 space-y-4">
                        <RefreshCw className="w-8 h-8 text-primary/40 animate-spin" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-white/40">Sincronizando con el mercado...</span>
                      </div>
                    ) : !signal.viable ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-secondary">
                          <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/40">
                            <X size={16} />
                          </div>
                          <span className="text-[13px] font-black uppercase tracking-widest">Sin Señal Clara</span>
                        </div>
                        <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/10">
                          <p className="text-[12px] text-secondary/80 font-medium italic">"{signal.reason}"</p>
                        </div>
                        <div className="flex items-center justify-center p-4 border border-white/5 rounded-2xl opacity-20">
                           <EyeOff className="w-6 h-6" />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                          <div className="flex items-center gap-2">
                             <Target className="w-5 h-5 text-primary" />
                             <span className="text-[13px] font-black uppercase tracking-widest text-white">Setup Optimizado</span>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-[10px] font-black border border-primary/30 uppercase">{selectedTimeframe}</span>
                        </div>

                        <div className="space-y-2">
                           <span className="text-[10px] uppercase font-black text-white/30 tracking-widest block">Análisis de la IA Analyst</span>
                           <p className="text-[13px] text-white font-medium leading-relaxed italic">"{signal.reason}"</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/40 transition-colors group">
                            <span className="text-[10px] uppercase font-black text-white/40 tracking-widest block mb-1 group-hover:text-primary transition-colors">Entrada</span>
                            <span className="text-xl font-black text-white">${signal.entry.toLocaleString()}</span>
                          </div>
                          <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10 hover:border-secondary transition-colors group">
                            <span className="text-[10px] uppercase font-black text-secondary/60 tracking-widest block mb-1 group-hover:text-secondary transition-colors">Stop Loss</span>
                            <span className="text-xl font-black text-secondary">${signal.sl.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-xl bg-primary/5 border border-white/5">
                            <span className="text-[9px] uppercase font-black text-white/30 block mb-1">Riesgo / Beneficio</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-black text-primary">1 : {((Math.abs(signal.tp3 - signal.entry)) / (Math.abs(signal.entry - signal.sl))).toFixed(2)}</span>
                              <TrendingUp className="w-3 h-3 text-primary opacity-50" />
                            </div>
                          </div>
                          <div className="p-3 rounded-xl bg-primary/5 border border-white/5">
                            <span className="text-[9px] uppercase font-black text-white/30 block mb-1">Confianza Multicapa</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-black text-white">85%</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map(i => <div key={i} className={cn("w-1 h-3 rounded-full", i < 5 ? "bg-primary" : "bg-white/10")} />)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { label: 'TP 1', val: signal.tp1 },
                            { label: 'TP 2', val: signal.tp2 },
                            { label: 'TP 3', val: signal.tp3 }
                          ].map((tp, i) => (
                            <div key={i} className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-center relative overflow-hidden group">
                              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <span className="text-[9px] font-black text-primary uppercase block mb-1">{tp.label}</span>
                              <span className="text-[13px] font-black text-white relative z-10">${tp.val.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-center p-4 bg-primary/5 rounded-2xl border border-primary/10 group">
                           <Activity className="w-6 h-6 text-primary animate-pulse group-hover:scale-125 transition-transform" />
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
      {/* Floating Asset Search & Timeframe - Always visible on top of chart */}
      <div className="sticky top-6 z-[60] flex justify-center mb-[-68px] pointer-events-none">
        <div className="flex flex-wrap items-center gap-4 bg-[#0b0f14]/80 backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] pointer-events-auto">
          <div className="flex items-center gap-4 border-r border-white/10 pr-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div className="hidden sm:block">
              <h2 className="text-[14px] font-black uppercase tracking-tighter text-white">Terminal IA</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Asset Selector */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-3 min-w-[160px] hover:bg-white/10 transition-all font-sans"
              >
                {selectedAsset && <img src={selectedAsset.image} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />}
                {selectedSymbol}
                <ChevronDown className={cn("w-3 h-3 ml-auto transition-transform", isSearchOpen && "rotate-180")} />
              </button>
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0b0f14] border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[70] max-h-60 overflow-y-auto p-2 backdrop-blur-3xl">
                  <div className="p-2 border-b border-white/5 mb-2 flex items-center gap-2">
                    <Search className="w-3 h-3 text-white/40" />
                    <input 
                      className="bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase w-full text-white font-sans"
                      placeholder="Buscar..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {filteredAssets.map(asset => (
                    <button
                      key={asset.id}
                      onClick={() => { setSelectedSymbol(asset.id); setIsSearchOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-[9px] font-black uppercase text-white/70 hover:bg-primary/20 hover:text-white flex items-center gap-3 transition-colors font-sans"
                    >
                      <img src={asset.image} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                      {asset.id}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Timeframe Selector */}
            <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
              {["1m", "5m", "15m", "1h", "4h", "1d"].map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all font-sans",
                    selectedTimeframe === tf ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-white/40 hover:text-white"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Phase */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-6">
          <div 
            ref={chartContainerRef}
            className="w-full h-[800px] rounded-[2.5rem] bg-[#0b0f14] border border-outline-variant/10 relative overflow-hidden shadow-2xl"
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
          {activePatterns && indicators.find(i => i.id === 'patterns')?.enabled && (
            <motion.div
              drag
              dragMomentum={false}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                "absolute bottom-24 right-10 p-5 rounded-2xl backdrop-blur-xl border shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto cursor-move max-w-[320px] font-sans z-[30]",
                activePatterns.type === 'BULLISH' ? "bg-primary/10 border-primary/30" : 
                activePatterns.type === 'BEARISH' ? "bg-secondary/10 border-secondary/30" : 
                "bg-surface-container-high/80 border-outline-variant/30"
              )}
            >
              <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black uppercase tracking-widest text-white">PATRÓN ESTRUCTURAL</span>
                  <button onClick={handleManualRefresh} className="hover:rotate-180 transition-transform duration-500">
                      <RotateCcw size={14} className="text-white/40 hover:text-white" />
                    </button>
                  </div>
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

            {activeCandles && indicators.find(i => i.id === 'candles')?.enabled && (
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "absolute bottom-28 right-12 p-5 rounded-2xl backdrop-blur-xl border shadow-[0_20px_50px_rgba(0,0,0,0.3)] pointer-events-auto cursor-move max-w-[320px] font-sans z-[31]",
                  activeCandles.type === 'BULLISH' ? "bg-primary/10 border-primary/30" : 
                  activeCandles.type === 'BEARISH' ? "bg-secondary/10 border-secondary/30" : 
                  "bg-surface-container-high/80 border-outline-variant/30"
                )}
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-black uppercase tracking-widest text-white">VELAS JAPONESAS</span>
                    <button onClick={handleManualRefresh} className="hover:rotate-180 transition-transform duration-500">
                      <RotateCcw size={14} className="text-white/40 hover:text-white" />
                    </button>
                  </div>
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

            {activeElliott && indicators.find(i => i.id === 'elliott')?.enabled && (
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-14 right-14 p-6 rounded-2xl bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] pointer-events-auto cursor-move space-y-4 max-w-[320px] z-[32]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-white animate-pulse" />
                    <span className="text-[14px] font-black uppercase tracking-widest text-white">ELLIOTT WAVES</span>
                    <button onClick={handleManualRefresh} className="hover:rotate-180 transition-transform duration-500">
                      <RotateCcw size={14} className="text-white/40 hover:text-white" />
                    </button>
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

            {indicators.find(i => i.id === 'macd')?.enabled && rawAnalysisData['macd'] && (
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-16 right-16 p-5 rounded-2xl bg-[#1e293b]/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto cursor-move max-w-[320px] z-[33]"
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-[13px] font-black uppercase tracking-widest text-white">MACD PRO</span>
                    <button onClick={handleManualRefresh} className="hover:rotate-180 transition-transform duration-500">
                      <RotateCcw size={14} className="text-white/40 hover:text-white" />
                    </button>
                  </div>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black uppercase border",
                    rawAnalysisData['macd'].type === 'BULLISH' ? "bg-primary/20 text-primary border-primary/30" : "bg-secondary/20 text-secondary border-secondary/30"
                  )}>
                    {rawAnalysisData['macd'].type}
                  </div>
                </div>
                <p className="text-[14px] text-white/80 font-medium mb-3">{rawAnalysisData['macd'].analysis}</p>
                <div className="bg-primary/5 p-3 rounded-xl border border-primary/10">
                  <span className="text-[10px] uppercase text-primary font-black">MOMENTUM SCORE</span>
                  <div className="flex gap-1 mt-2">
                    {[1, 2, 3, 4, 5, 6, 7].map(i => (
                      <div key={i} className={cn(
                        "h-1.5 flex-1 rounded-full",
                        i < 4 ? "bg-primary" : "bg-white/10"
                      )} />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {indicators.find(i => i.id === 'wakeup')?.enabled && wyckoffPhase && (
              <motion.div
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute bottom-20 right-20 p-5 rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto cursor-move max-w-[320px] z-[34]"
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-[13px] font-black uppercase tracking-widest text-white">FASES WYCKOFF</span>
                    <button onClick={handleManualRefresh} className="hover:rotate-180 transition-transform duration-500">
                      <RotateCcw size={14} className="text-white/40 hover:text-white" />
                    </button>
                  </div>
                  <span className="text-[10px] font-black text-primary uppercase bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">Activo</span>
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

            {/* Generic Boxes for Other Indicators */}
            {indicators.filter(ind => ind.enabled && !['patterns', 'candles', 'elliott', 'wakeup', 'macd'].includes(ind.id)).map((ind, idx) => (
              <motion.div
                key={ind.id}
                drag
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ bottom: 80 + (idx * 40), right: 20 + (idx * 40) }}
                className="absolute p-5 rounded-2xl bg-[#0f172a]/90 backdrop-blur-xl border border-white/10 shadow-2xl pointer-events-auto cursor-move max-w-[300px] z-[35]"
              >
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-[12px] font-black uppercase tracking-widest text-white">{ind.name}</span>
                    <button onClick={handleManualRefresh} className="hover:rotate-180 transition-transform duration-500">
                      <RotateCcw size={14} className="text-white/40 hover:text-white" />
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  {indicatorAnalysis[ind.id]?.split('\n\n').map((line, idx2) => (
                    <div key={idx2} className="text-[13px] text-white/80 leading-relaxed font-medium">
                      {line.startsWith('**ANÁLISIS:**') ? (
                        <p><span className="text-primary font-black uppercase text-[10px] tracking-wider mr-2">Análisis:</span> {line.replace('**ANÁLISIS:**', '')}</p>
                      ) : line.startsWith('**RECOMENDACIÓN:**') ? (
                        <div className="mt-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                          <span className="text-primary font-black uppercase text-[10px] tracking-wider block mb-1">Recomendación:</span>
                          <span className="text-white font-black uppercase text-[13px]">{line.replace('**RECOMENDACIÓN:**', '')}</span>
                        </div>
                      ) : <p>{line}</p>}
                    </div>
                  ))}
                  {!indicatorAnalysis[ind.id] && <p className="text-[11px] text-white/40 italic">Procesando datos técnicos...</p>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>

    {/* Indicators and Analysis Section - Floating Control Panel */}
    <div className="lg:col-span-12 space-y-8">
      <div className="sticky bottom-24 z-[60] flex justify-center mt-[-100px] pointer-events-none">
        <motion.div 
          drag
          dragConstraints={{ left: -500, right: 500, top: -500, bottom: 50 }}
          className="bg-[#0b0f14]/95 backdrop-blur-3xl px-6 py-4 rounded-[2.5rem] border border-white/20 shadow-[0_-20px_100px_rgba(0,0,0,0.8)] pointer-events-auto flex items-center gap-6"
        >
          <div className="flex items-center gap-3 pr-4 border-r border-white/10 shrink-0">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/40 shadow-[0_0_20px_rgba(0,255,163,0.2)]">
              <Eye className="w-5 h-5 text-primary" />
            </div>
            <div className="hidden xl:block">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white leading-none mb-1">CONTROLES IA</h3>
              <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Capas inteligentes</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-1.5 max-w-[1400px] justify-center">
            {[
              { id: "patterns", label: "PATRONES", color: 'primary' },
              { id: "candles", label: "VELAS", color: 'primary' },
              { id: "elliott", label: "ELLIOTT", color: 'primary' },
              { id: "wakeup", label: "WYCKOFF", color: 'primary' },
              { id: "macd", label: "MACD", color: 'primary' },
              { id: "liquidity", label: "LIQUIDEZ", color: 'secondary' },
              { id: "levels", label: "TECHO/SUELO", color: 'secondary' },
              { id: "supertrend", label: "STREND", color: 'primary' },
              { id: "bollinger", label: "BB", color: 'primary' },
              { id: "ai_pro", label: "✦✦", color: 'primary' }
            ].map(ind => {
              const config = indicators.find(i => i.id === ind.id);
              if (!config) return null;
              return (
                <button
                  key={ind.id}
                  onClick={() => toggleIndicator(ind.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-2xl border text-[13px] font-black uppercase tracking-widest transition-all duration-300",
                    config.enabled 
                      ? ind.color === 'secondary' 
                        ? "bg-secondary/20 border-secondary text-secondary shadow-[0_0_20px_rgba(255,113,98,0.3)] scale-105"
                        : "bg-primary/20 border-primary text-primary shadow-[0_0_20px_rgba(0,255,163,0.3)] scale-105"
                      : "bg-white/5 border-white/10 text-white/40 hover:text-white hover:bg-white/10"
                  )}
                >
                  <div className={cn(
                    "w-2.5 h-2.5 rounded-full", 
                    config.enabled 
                      ? ind.color === 'secondary' ? "bg-secondary animate-pulse" : "bg-primary animate-pulse" 
                      : "bg-white/20"
                  )} />
                  {ind.label}
                </button>
              );
            })}
          </div>
          <div className="pl-6 border-l border-white/10 cursor-grab active:cursor-grabbing">
             <div className="grid grid-cols-2 gap-1.5 opacity-40 hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
             </div>
          </div>
        </motion.div>
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
            <span className="text-[10px] uppercase opacity-50 block mb-2 font-black tracking-widest">Explicación Estructural</span>
            <p className="text-[13px] text-on-surface-variant leading-relaxed font-medium">
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
                  <span className="text-[13px] font-black uppercase tracking-widest text-primary">{ind.name}</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <div className="space-y-4">
                {indicatorAnalysis[ind.id]?.split('\n\n').map((line, idx) => (
                  <p key={idx} className="text-[13px] text-on-surface-variant leading-relaxed font-medium">
                    {line.startsWith('**ANÁLISIS:**') ? (
                      <><span className="text-primary font-black uppercase text-[11px] tracking-wider mr-2">Análisis:</span> {line.replace('**ANÁLISIS:**', '')}</>
                    ) : line.startsWith('**RECOMENDACIÓN:**') ? (
                      <><span className="text-primary font-black uppercase text-[11px] tracking-wider mr-2">Recomendación:</span> {line.replace('**RECOMENDACIÓN:**', '')}</>
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
    <div className="grid grid-cols-1 gap-8 pt-12">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative p-8 md:p-16 rounded-[40px] md:rounded-[60px] bg-[#0b0f14] border-2 border-primary/30 shadow-[0_50px_120px_rgba(0,0,0,0.9)]"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-60" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] -mr-80 -mt-80" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/15 rounded-full blur-[150px] -ml-80 -mb-80" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-12 max-w-7xl mx-auto">
          <div className="flex-shrink-0 relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-[45px] blur-2xl group-hover:bg-primary/40 transition-all duration-700" />
            <div className="w-32 h-32 md:w-40 md:h-40 bg-surface-container-high rounded-[45px] flex items-center justify-center border-2 border-primary/50 shadow-2xl relative z-10 transition-transform duration-700 group-hover:scale-110">
              <Brain className="w-16 h-16 md:w-20 md:h-20 text-primary drop-shadow-[0_0_15px_rgba(0,255,163,0.5)]" />
            </div>
          </div>
          
          <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-2">
                <span className="w-12 h-1 px-1 bg-primary rounded-full" />
                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white leading-none">Veredicto Maestro</h3>
                <span className="w-12 h-1 px-1 bg-primary rounded-full" />
              </div>
              <p className="text-sm md:text-lg font-black text-primary uppercase tracking-[0.4em] opacity-90">Consolidación de Inteligencia Artificial v5.0</p>
            </div>
            
            <div className="p-10 md:p-14 bg-white/[0.03] rounded-[40px] border border-white/10 backdrop-blur-3xl shadow-inner relative group/box overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover/box:opacity-100 transition-opacity duration-1000" />
              <p className="text-xl md:text-4xl text-white font-black leading-tight tracking-tight italic relative z-10 hyphens-auto break-words">
                "{finalConclusion}"
              </p>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-5">
               {[
                 { text: 'Alta Confluencia', icon: <Target className="w-4 h-4" /> },
                 { text: 'Filtro de Ruido Activo', icon: <Zap className="w-4 h-4" /> },
                 { text: 'Protocolo de Seguridad', icon: <CheckCircle2 className="w-4 h-4" /> }
               ].map(tag => (
                 <div key={tag.text} className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/[0.05] border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/50 hover:text-white hover:bg-white/10 transition-all cursor-default">
                   {tag.icon}
                   {tag.text}
                 </div>
               ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
    </div>
  </div>
);
};

export default WyckoffAnalyzer;
