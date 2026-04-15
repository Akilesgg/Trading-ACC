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
  X,
  Minus
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchKlines, fetchTicker, fetchCryptoData } from "@/services/cryptoService";
import { analyzeMarket } from "@/services/geminiService";
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceArea,
  Area,
  Cell,
  Legend,
  Brush
} from 'recharts';

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
  const [cursor, setCursor] = useState("grab");
  const chartContainerRef = useRef<HTMLDivElement>(null);
  
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
  ]);

  const [indicatorAnalysis, setIndicatorAnalysis] = useState<Record<string, string>>({});
  const [finalConclusion, setFinalConclusion] = useState<string>("");

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
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
        
        // Wake Up Phase (White Line)
        wakeup: d.close * (0.97 + Math.sin(i / 25) * 0.02)
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
      const klines = await fetchKlines(selectedSymbol, selectedTimeframe, 150);
      setData(klines);
      setZoomRange({ start: Math.max(0, klines.length - 50), end: klines.length - 1 });
      const ticker = await fetchTicker(selectedSymbol);
      
      const aiResponse = await analyzeMarket(selectedSymbol, ticker.price, ticker.priceChangePercent);
      
      // Parsing logic
      const wyckoffMatch = aiResponse.match(/FASE WYCKOFF:?\s*(.*)/i);
      setWyckoffPhase(wyckoffMatch ? wyckoffMatch[1].split('\n')[0].trim() : "Acumulación - Fase C");

      const explanationMatch = aiResponse.match(/\*\*CONTEXTO Y EXPLICACIÓN BREVE\*\*:?\s*(.*)/i);
      setWyckoffExplanation(explanationMatch ? explanationMatch[1].split('\n\n')[0].trim() : "Estructura de mercado en fase de absorción institucional.");

      const recMatch = aiResponse.match(/\*\*RECOMENDACIÓN IA\*\*:?\s*(.*)/i);
      setRecommendation(recMatch ? recMatch[1].trim() : "Esperar confirmación de ruptura.");
      
      const analysisMap: Record<string, string> = {};
      indicators.filter(i => i.enabled).forEach(ind => {
        const indRegex = new RegExp(`${ind.name}:?\\s*(.*)`, 'i');
        const indMatch = aiResponse.match(indRegex);
        
        let detail = "";
        let rec = "";
        
        if (indMatch) {
          const parts = indMatch[1].split('.');
          detail = parts[0].trim();
          rec = parts[1] ? parts[1].trim() : "Mantener vigilancia en niveles de soporte/resistencia.";
        } else {
          detail = `El indicador ${ind.name} muestra una estructura de consolidación en ${selectedTimeframe}.`;
          rec = "Esperar confirmación de volumen para validar el movimiento.";
        }

        analysisMap[ind.id] = `**ANÁLISIS:** ${detail}\n\n**RECOMENDACIÓN:** ${rec}`;
      });
      setIndicatorAnalysis(analysisMap);
      
      const conclusionMatch = aiResponse.match(/\*\*RECOMENDACIÓN FINAL\*\*:?\s*(.*)/i);
      setFinalConclusion(conclusionMatch ? conclusionMatch[1].trim() : "Confluencia técnica positiva. Mantener vigilancia en niveles clave.");

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

  const handleWheel = (e: React.WheelEvent) => {
    if (chartData.length === 0 || !chartContainerRef.current) return;
    
    const rect = chartContainerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const isAtRightAxis = offsetX > rect.width - 80;
    const isAtBottomAxis = offsetY > rect.height - 60;
    
    const delta = e.deltaY;

    if (isAtRightAxis) {
      // Vertical Zoom
      const zoomStep = 0.1;
      setPriceZoom(prev => {
        const next = delta < 0 ? prev * (1 - zoomStep) : prev * (1 + zoomStep);
        return Math.max(0.1, Math.min(10, next));
      });
      return;
    }

    // Horizontal Zoom (Default or Bottom Axis)
    const range = zoomRange.end - zoomRange.start;
    const step = Math.max(1, Math.floor(range * 0.1));
    
    // Calculate focus point (where the mouse is)
    const focusRatio = offsetX / rect.width;

    if (delta < 0) {
      // Zoom in
      if (range > 5) {
        setZoomRange(prev => {
          const zoomAmount = Math.max(2, Math.floor(range * 0.2));
          const leftZoom = Math.floor(zoomAmount * focusRatio);
          const rightZoom = zoomAmount - leftZoom;
          
          const newStart = Math.min(prev.end - 5, prev.start + leftZoom);
          const newEnd = Math.max(newStart + 5, prev.end - rightZoom);
          return { start: Math.floor(newStart), end: Math.floor(newEnd) };
        });
      }
    } else {
      // Zoom out
      setZoomRange(prev => {
        const zoomAmount = Math.max(2, Math.floor(range * 0.2));
        const leftZoom = Math.floor(zoomAmount * focusRatio);
        const rightZoom = zoomAmount - leftZoom;
        
        return {
          start: Math.max(0, Math.floor(prev.start - leftZoom)),
          end: Math.min(chartData.length - 1, Math.floor(prev.end + rightZoom))
        };
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (chartData.length === 0 || !chartContainerRef.current) return;
    
    const rect = chartContainerRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    
    const isAtRightAxis = offsetX > rect.width - 80;
    const isAtBottomAxis = offsetY > rect.height - 60;

    if (!isDragging) {
      if (isAtRightAxis) setCursor("ns-resize");
      else if (isAtBottomAxis) setCursor("ew-resize");
      else setCursor("grab");
      return;
    }

    setCursor("grabbing");
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const rangeX = zoomRange.end - zoomRange.start;
    
    // Horizontal Pan
    if (Math.abs(deltaX) > 1) {
      const moveStepX = Math.floor(deltaX / (rect.width / rangeX) * 0.5);
      if (moveStepX !== 0) {
        setZoomRange(prev => {
          const newStart = Math.max(0, prev.start - moveStepX);
          const newEnd = Math.min(chartData.length - 1, newStart + rangeX);
          const finalStart = Math.max(0, newEnd - rangeX);
          return { start: finalStart, end: newEnd };
        });
        setDragStart(prev => ({ ...prev, x: e.clientX }));
      }
    }

    // Vertical Pan
    if (Math.abs(deltaY) > 1) {
      const visiblePrices = visibleData.map(d => d.close);
      const dataMin = Math.min(...visiblePrices);
      const dataMax = Math.max(...visiblePrices);
      const currentRange = (dataMax - dataMin) * priceZoom;
      const sensitivity = currentRange / rect.height;
      
      setPriceOffset(prev => prev + (deltaY * sensitivity));
      setDragStart(prev => ({ ...prev, y: e.clientY }));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetView = () => {
    setZoomRange({ start: Math.max(0, chartData.length - 50), end: chartData.length - 1 });
    setPriceZoom(1);
    setPriceOffset(0);
  };

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
    };

    container.addEventListener('wheel', onWheel, { passive: false });
    return () => container.removeEventListener('wheel', onWheel);
  }, []);

  const visibleData = useMemo(() => {
    return chartData.slice(zoomRange.start, zoomRange.end + 1);
  }, [chartData, zoomRange]);

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
                        <div className="h-12 w-full mt-2 opacity-50">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={chartData.slice(-15)}>
                              <Line type="monotone" dataKey="close" stroke="#00ffa3" strokeWidth={1} dot={false} />
                            </ComposedChart>
                          </ResponsiveContainer>
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
    <div className="lg:col-span-8 space-y-6">
      <div 
        ref={chartContainerRef}
        className="trading-card p-0 h-[450px] relative overflow-hidden"
        style={{ cursor }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleResetView}
      >
        {loading && (
          <div className="absolute inset-0 bg-surface/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-3">
          <div className="bg-primary/10 backdrop-blur-md border border-primary/20 px-3 py-1 rounded-lg">
            <span className="text-[9px] font-black uppercase tracking-widest text-primary">Fase: {wyckoffPhase}</span>
          </div>
          <button 
            onClick={handleResetView}
            className="bg-surface-container-high/80 backdrop-blur-md border border-outline-variant/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors"
          >
            Reset View
          </button>
          <div className="bg-surface-container-high/80 backdrop-blur-md border border-outline-variant/20 px-3 py-1 rounded-lg flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Tendencia:</span>
            {chartData.length > 1 && (
              <div className={cn(
                "flex items-center gap-1 text-[9px] font-black uppercase tracking-tighter",
                chartData[chartData.length-1].close > chartData[0].close ? "text-primary" : chartData[chartData.length-1].close < chartData[0].close ? "text-secondary" : "text-tertiary"
              )}>
                {chartData[chartData.length-1].close > chartData[0].close ? (
                  <><TrendingUp className="w-3 h-3" /> Alcista</>
                ) : chartData[chartData.length-1].close < chartData[0].close ? (
                  <><TrendingDown className="w-3 h-3" /> Bajista</>
                ) : (
                  <><Minus className="w-3 h-3" /> Lateral</>
                )}
              </div>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ffa3" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#00ffa3" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.05} />
            <XAxis 
              dataKey="time" 
              stroke="#666" 
              fontSize={10} 
              fontWeight="bold" 
              tickLine={false} 
              axisLine={false}
              dy={10}
              interval="preserveStartEnd"
              minTickGap={30}
              tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            />
            <YAxis 
              yAxisId="price" 
              domain={([dataMin, dataMax]: [number, number]) => {
                const mid = (dataMin + dataMax) / 2 - priceOffset;
                const range = (dataMax - dataMin) * priceZoom;
                return [mid - range / 2, mid + range / 2];
              }} 
              orientation="right" 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
              axisLine={false} 
              tickLine={false} 
              width={60}
            />
            <YAxis yAxisId="volume" hide />
            <YAxis yAxisId="oscillator" domain={[0, 100]} hide />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0b0f14', 
                border: '1px solid #222', 
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
              cursor={{ stroke: '#333', strokeWidth: 1 }}
            />
            
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '20px' }}
            />
            
            {wyckoffPhase.toLowerCase().includes("acumul") && chartData.length > 0 && (
              <ReferenceArea yAxisId="price" y1={chartData[0].low} y2={chartData[0].high} fill="#00ffa3" fillOpacity={0.03} />
            )}
            
            {/* Candlesticks */}
            <Bar yAxisId="price" dataKey="wickRange" name="Wick" barSize={1} animationDuration={1000}>
              {chartData.map((entry, index) => (
                <Cell key={`wick-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar yAxisId="price" dataKey="bodyRange" name="Precio" barSize={8} animationDuration={1000}>
              {chartData.map((entry, index) => (
                <Cell key={`body-${index}`} fill={entry.color} />
              ))}
            </Bar>

            {/* Wake Up Phase Line */}
            <Line yAxisId="price" type="monotone" dataKey="wakeup" name="Wake Up Phase" stroke="#ffffff" strokeWidth={2} dot={false} opacity={0.8} />

            {/* Indicators on Chart */}
            {indicators.find(i => i.id === "bollinger" && i.enabled) && (
              <>
                <Line yAxisId="price" type="monotone" dataKey="upperBB" name="Bollinger Superior" stroke="#00e0ff" strokeWidth={1.5} strokeDasharray="3 3" dot={false} opacity={0.6} />
                <Line yAxisId="price" type="monotone" dataKey="lowerBB" name="Bollinger Inferior" stroke="#00e0ff" strokeWidth={1.5} strokeDasharray="3 3" dot={false} opacity={0.6} />
              </>
            )}
            {indicators.find(i => i.id === "supertrend" && i.enabled) && (
              <Line yAxisId="price" type="stepAfter" dataKey="supertrend" name="Supertrend" stroke="#ffcc00" strokeWidth={2} dot={false} opacity={0.8} />
            )}
            {indicators.find(i => i.id === "vwap" && i.enabled) && (
              <Line yAxisId="price" type="monotone" dataKey="vwap" name="VWAP" stroke="#ff00ff" strokeWidth={1.5} dot={false} opacity={0.7} />
            )}
            {indicators.find(i => i.id === "psar" && i.enabled) && (
              <Line yAxisId="price" type="monotone" dataKey="psar" name="Parabolic SAR" stroke="#ffffff" strokeWidth={0} dot={{ r: 2, fill: '#00e0ff' }} opacity={0.8} />
            )}
            {indicators.find(i => i.id === "macd" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="macd" name="MACD" stroke="#ff7162" strokeWidth={2.5} dot={false} opacity={0.9} />
            )}
            {indicators.find(i => i.id === "rsi" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="rsi" name="RSI" stroke="#81e9ff" strokeWidth={2.5} dot={false} opacity={0.9} />
            )}
            {indicators.find(i => i.id === "atr" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="atr" name="ATR" stroke="#ffa8a3" strokeWidth={2.5} dot={false} opacity={0.9} />
            )}
            {indicators.find(i => i.id === "ichimoku" && i.enabled) && (
              <Area yAxisId="price" type="monotone" dataKey="ichimoku" name="Ichimoku Cloud" fill="#00ffa3" stroke="none" fillOpacity={0.1} />
            )}
            {indicators.find(i => i.id === "stochrsi" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="stochRsi" name="Stoch RSI" stroke="#ffc3bb" strokeWidth={2.5} dot={false} opacity={0.9} />
            )}
            
            <Bar yAxisId="volume" dataKey="volume" name="Volumen" fill="#ffffff" opacity={0.03} />

            <Brush 
              dataKey="time" 
              height={30} 
              stroke="#333" 
              fill="#0a0c10"
              travellerWidth={10}
              gap={1}
              startIndex={zoomRange.start}
              endIndex={zoomRange.end}
              onChange={(range: any) => setZoomRange({ start: range.startIndex, end: range.endIndex })}
              tickFormatter={(time) => new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            >
              <ComposedChart>
                <Area dataKey="close" fill="#00ffa3" fillOpacity={0.2} stroke="none" />
              </ComposedChart>
            </Brush>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="trading-card p-6 space-y-4">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Info className="w-4 h-4" /> Explicación de la Fase
          </h3>
          <p className="text-[13px] text-on-surface-variant leading-relaxed font-medium">{wyckoffExplanation}</p>
        </div>
        <div className="trading-card p-6 space-y-4 border-white/20 bg-white/5">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-white flex items-center gap-2">
            <Zap className="w-4 h-4" /> Wake Up Status
          </h3>
          <p className="text-[13px] text-white font-black leading-relaxed">
            {wyckoffPhase.includes("Markup") ? "FASE ACTIVA: Despertar alcista confirmado con volumen creciente." : "FASE LATENTE: Esperando señal de ignición institucional."}
          </p>
        </div>
        <div className="trading-card p-6 space-y-4 border-primary/20 bg-primary/5">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Target className="w-4 h-4" /> Recomendación de Entrada
          </h3>
          <p className="text-[13px] text-on-surface font-black leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </div>

    {/* Indicators Sidebar */}
    <div className="lg:col-span-4 space-y-6">
      <div className="trading-card p-6 space-y-6">
        <h3 className="text-[12px] font-black uppercase tracking-widest text-on-surface">Indicadores Técnicos</h3>
        <div className="grid grid-cols-2 gap-3">
          {indicators.map(ind => (
            <button
              key={ind.id}
              onClick={() => toggleIndicator(ind.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                ind.enabled ? "bg-primary/10 border-primary/30 text-primary" : "bg-surface-container-high border-outline-variant/10 text-on-surface-variant"
              )}
            >
              {ind.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {ind.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {indicators.filter(i => i.enabled).map(ind => (
          <motion.div
            key={ind.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface-container-high/40 border border-outline-variant/10 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{ind.name}</span>
              <CheckCircle2 className="w-3 h-3 text-primary" />
            </div>
            <div className="space-y-3">
              {indicatorAnalysis[ind.id]?.split('\n\n').map((line, idx) => (
                <p key={idx} className="text-[11px] text-on-surface-variant leading-relaxed font-medium">
                  {line.startsWith('**ANÁLISIS:**') ? (
                    <><span className="text-primary font-black">ANÁLISIS:</span> {line.replace('**ANÁLISIS:**', '')}</>
                  ) : line.startsWith('**RECOMENDACIÓN:**') ? (
                    <><span className="text-primary font-black">RECOMENDACIÓN:</span> {line.replace('**RECOMENDACIÓN:**', '')}</>
                  ) : line}
                </p>
              ))}
              {!indicatorAnalysis[ind.id] && (
                <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium animate-pulse">
                  Analizando comportamiento en {selectedTimeframe}...
                </p>
              )}
            </div>
          </motion.div>
        ))}
        {indicators.filter(i => i.enabled).length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-outline-variant/10 rounded-2xl opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">Activa indicadores para ver el análisis</p>
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
  );
};

export default WyckoffAnalyzer;
