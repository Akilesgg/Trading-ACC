import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  Activity, 
  Shield,
  Clock,
  Target,
  BarChart3,
  Brain,
  Settings,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  Info,
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Waves,
  Gauge,
  Copy,
  Share2,
  Eye,
  ZapOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchTicker, CryptoData, fetchKlines } from "@/services/cryptoService";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  ReferenceLine
} from "recharts";

const Terminal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const symbolParam = (searchParams.get("symbol") || "BTCUSDT").toUpperCase();
  const [searchSymbol, setSearchSymbol] = useState(symbolParam);
  const [ticker, setTicker] = useState<CryptoData | null>(null);
  const [klines, setKlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [timeframe, setTimeframe] = useState("1h");
  const [strategy, setStrategy] = useState("Standard");
  
  // Analysis State
  const [analysis, setAnalysis] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTicker(symbolParam);
        setTicker(data);
        const chartData = await fetchKlines(symbolParam, timeframe, 100);
        setKlines(chartData);
      } catch (error) {
        console.error("Analyzer data load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [symbolParam, timeframe]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol) {
      navigate(`/terminal?symbol=${searchSymbol.toUpperCase()}`);
    }
  };

  const runAnalysis = () => {
    if (!ticker || cooldown > 0) return;
    
    const price = parseFloat(ticker.price);
    if (isNaN(price)) {
      console.error("Invalid ticker price:", ticker.price);
      return;
    }

    setAnalyzing(true);
    
    // Simulate complex analysis based on strategy and timeframe
    setTimeout(() => {
      const isBullish = Math.random() > 0.5;
      const volatility = price * 0.015;
      const isBTC = symbolParam.includes("BTC");

      // Strategy Logic
      let strategyName = strategy;
      let emaPeriod = isBTC ? 400 : 800;
      
      if (timeframe === "1m") strategyName = "Pupupu Scalping";
      if (timeframe === "5m") strategyName = "Reto Trading";

      const newAnalysis = {
        type: isBullish ? "LONG" : "SHORT",
        entry: price,
        sl: isBullish ? price - volatility : price + volatility,
        tp1: isBullish ? price + volatility * 1.7 : price - volatility * 1.7,
        tp2: isBullish ? price + volatility * 2.5 : price - volatility * 2.5,
        tp3: isBullish ? price + volatility * 4.0 : price - volatility * 4.0,
        ratio: "1:1.7",
        score: Math.floor(Math.random() * 30) + 60, // 60-90
        sentiment: isBullish ? "BULLISH" : "BEARISH",
        strategy: strategyName,
        indicators: {
          rsi: { val: (Math.random() * 40 + 30).toFixed(1), status: isBullish ? "ALCISTA" : "BAJISTA" },
          macd: { val: isBullish ? "0.45" : "-0.45", status: isBullish ? "ALCISTA" : "BAJISTA", color: isBullish ? "text-primary" : "text-secondary" },
          ema: { val: timeframe === "1m" ? `12/${emaPeriod}` : "20/50", status: isBullish ? "ALCISTA" : "BAJISTA", color: isBullish ? "text-primary" : "text-secondary" },
          vwap: { val: (price * 0.999).toFixed(2), status: isBullish ? "POR ENCIMA" : "POR DEBAJO", color: isBullish ? "text-primary" : "text-secondary" },
          vol: { val: "A: 1.2%", status: "MOMENTUM +", color: "text-primary" },
          adx: { val: "28.5", status: "TENDENCIA FUERTE", color: "text-primary" },
          atr: { val: (price * 0.004).toFixed(2), status: "VOLATILIDAD ALTA", color: "text-primary" }
        },
        volumeProfile: [
          { price: price * 1.02, vol: 80 },
          { price: price * 1.01, vol: 45 },
          { price: price * 1.00, vol: 100 },
          { price: price * 0.99, vol: 60 },
          { price: price * 0.98, vol: 30 }
        ],
        fvgs: [
          { price: (price * 0.985).toFixed(2), type: "BULLISH", status: "OPEN" },
          { price: (price * 1.015).toFixed(2), type: "BEARISH", status: "MITIGATED" }
        ],
        correlation: {
          btc: "0.85",
          eth: "0.92",
          sp500: "0.45"
        }
      };
      
      setAnalysis(newAnalysis);
      setAnalyzing(false);
      setCooldown(30); // 30 seconds wait-off
    }, 1500);
  };

  const copySignal = () => {
    if (!analysis) return;
    const text = `SIGNAL: ${symbolParam} ${analysis.type}\nEntry: ${analysis.entry}\nTP1: ${analysis.tp1}\nTP2: ${analysis.tp2}\nTP3: ${analysis.tp3}\nSL: ${analysis.sl}`;
    navigator.clipboard.writeText(text);
  };

  if (loading || !ticker) return (
    <div className="h-screen flex items-center justify-center bg-surface-container-lowest">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label animate-pulse">Sincronizando con Red de Datos...</p>
      </div>
    </div>
  );

  const isPositive = parseFloat(ticker.priceChangePercent) >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-16 pb-24 bg-surface-container-lowest text-on-surface overflow-x-hidden"
    >
      {/* Top Header / Search */}
      <div className="px-4 py-4 border-b border-outline-variant/10 bg-surface-container-low sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate("/")} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input 
                type="text" 
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                placeholder="Buscar activo (ej: BTCUSDT)"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-primary transition-all text-sm font-bold"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
              <button 
                key={tf} 
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  timeframe === tf ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {["Standard", "Scalping", "Swing"].map((strat) => (
              <button 
                key={strat} 
                onClick={() => setStrategy(strat)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  strategy === strat ? "bg-tertiary text-on-tertiary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {strat}
              </button>
            ))}
          </div>

          <button 
            onClick={runAnalysis}
            disabled={analyzing || cooldown > 0}
            className={cn(
              "w-full md:w-auto px-8 py-2.5 rounded-xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl",
              (analyzing || cooldown > 0) ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed" : "bg-primary text-on-primary shadow-primary/20 hover:scale-105 active:scale-95"
            )}
          >
            {analyzing ? (
              <>
                <div className="w-3 h-3 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin"></div>
                Analizando...
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                Wait-off: {cooldown}s
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analizar
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Market Overview Row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Precio Actual</span>
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <p className="text-2xl font-headline font-bold">${parseFloat(ticker.price).toLocaleString()}</p>
            <p className={cn("text-xs font-bold mt-1", isPositive ? "text-primary" : "text-secondary")}>
              {isPositive ? "+" : ""}{ticker.priceChangePercent}% (24h)
            </p>
          </div>
          
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Volumen 24h</span>
              <BarChart3 className="w-4 h-4 text-tertiary" />
            </div>
            <p className="text-2xl font-headline font-bold">${(parseFloat(ticker.volume) / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-on-surface-variant mt-1">USDT</p>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Rango 24h</span>
              <Layers className="w-4 h-4 text-secondary" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-secondary">L: ${parseFloat(ticker.lowPrice).toLocaleString()}</span>
                <span className="text-primary">H: ${parseFloat(ticker.highPrice).toLocaleString()}</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-secondary to-primary" 
                  style={{ width: `${((parseFloat(ticker.price) - parseFloat(ticker.lowPrice)) / (parseFloat(ticker.highPrice) - parseFloat(ticker.lowPrice))) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Sentimiento IA</span>
            <div className="flex items-center gap-2">
              <Gauge className={cn("w-6 h-6", isPositive ? "text-primary" : "text-secondary")} />
              <span className={cn("text-xl font-bold font-headline", isPositive ? "text-primary" : "text-secondary")}>
                {isPositive ? "ALCISTA" : "BAJISTA"}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Server Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Online: Node-04</span>
            </div>
            <p className="text-[8px] text-on-surface-variant mt-1">Latencia: 14ms</p>
          </div>
        </div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Order Blocks & FVG */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center justify-between">
              <div className="flex items-center gap-2"><Shield className="w-3 h-3" /> ESTRUCTURA</div>
              <span className="text-[8px] bg-primary/10 px-1.5 py-0.5 rounded">SMC</span>
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">BOS Bearish:</span>
                <span className="text-xs font-bold text-secondary">${(parseFloat(ticker.price) * 1.05).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">BOS Bullish:</span>
                <span className="text-xs font-bold text-primary">${(parseFloat(ticker.price) * 0.95).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/5">
                <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-2">Fair Value Gaps (FVG)</p>
                <div className="space-y-2">
                  {analysis?.fvgs.map((fvg: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-surface-container p-1.5 rounded-lg">
                      <span className={cn("text-[10px] font-bold", fvg.type === "BULLISH" ? "text-primary" : "text-secondary")}>{fvg.type}</span>
                      <span className="text-[10px] font-bold">${fvg.price}</span>
                      <span className="text-[8px] text-on-surface-variant uppercase">{fvg.status}</span>
                    </div>
                  )) || (
                    <p className="text-[10px] text-on-surface-variant italic">Esperando análisis...</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Wyckoff & Volume Profile */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Waves className="w-3 h-3" /> WYCKOFF & VOL
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">Fase:</span>
                <span className="text-xs font-bold text-secondary">Distribución B</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/5">
                <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-2">Volume Profile (VPVR)</p>
                <div className="space-y-1">
                  {(analysis?.volumeProfile || [
                    { vol: 80 }, { vol: 45 }, { vol: 100 }, { vol: 60 }, { vol: 30 }
                  ]).map((vp: any, i: number) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-2 bg-surface-container-highest flex-1 rounded-full overflow-hidden">
                        <div className="h-full bg-primary/40" style={{ width: `${vp.vol}%` }}></div>
                      </div>
                      <span className="text-[8px] font-bold text-on-surface-variant">{vp.vol}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* OTE Zones & Correlation */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Target className="w-3 h-3" /> OTE & CORR
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">OTE LONG:</span>
                <span className="text-xs font-bold text-primary">${(parseFloat(ticker.price) * 0.96).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/5">
                <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-2">Correlación</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-surface-container p-2 rounded-lg text-center">
                    <p className="text-[8px] text-on-surface-variant uppercase">BTC</p>
                    <p className="text-[10px] font-bold text-primary">{analysis?.correlation.btc || "0.00"}</p>
                  </div>
                  <div className="bg-surface-container p-2 rounded-lg text-center">
                    <p className="text-[8px] text-on-surface-variant uppercase">ETH</p>
                    <p className="text-[10px] font-bold text-primary">{analysis?.correlation.eth || "0.00"}</p>
                  </div>
                  <div className="bg-surface-container p-2 rounded-lg text-center">
                    <p className="text-[8px] text-on-surface-variant uppercase">S&P</p>
                    <p className="text-[10px] font-bold text-on-surface-variant">{analysis?.correlation.sp500 || "0.00"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Liquidez & Tendencia */}
          <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Zap className="w-3 h-3" /> LIQUIDEZ & TREND
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">LIQ ARRIBA:</span>
                <span className="text-xs font-bold text-secondary">${(parseFloat(ticker.price) * 1.06).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-on-surface-variant">LIQ ABAJO:</span>
                <span className="text-xs font-bold text-primary">${(parseFloat(ticker.price) * 0.94).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-outline-variant/5">
                <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-2">Live Order Flow</p>
                <div className="space-y-1 h-12 overflow-hidden">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex justify-between text-[8px] font-mono animate-pulse">
                      <span className={i % 2 === 0 ? "text-primary" : "text-secondary"}>
                        {i % 2 === 0 ? "BUY" : "SELL"}
                      </span>
                      <span className="text-on-surface-variant">{(Math.random() * 2).toFixed(3)} BTC</span>
                      <span className="text-on-surface">${ticker.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Indicators Section */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
            <Activity className="w-3 h-3" /> INDICADORES TÉCNICOS AVANZADOS
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            {[
              { label: "RSI (14)", value: analysis?.indicators.rsi.val || "50.0", status: analysis?.indicators.rsi.status || "NEUTRAL", color: "text-on-surface" },
              { label: "MACD", value: analysis?.indicators.macd.val || "L: -9.53", status: analysis?.indicators.macd.status || "ALCISTA", color: analysis?.indicators.macd.color || "text-primary" },
              { label: "EMA 20/50", value: analysis?.indicators.ema.val || "66671.72", status: analysis?.indicators.ema.status || "BAJISTA", color: analysis?.indicators.ema.color || "text-secondary" },
              { label: "VWAP", value: analysis?.indicators.vwap.val || "66671.72", status: analysis?.indicators.vwap.status || "POR DEBAJO", color: analysis?.indicators.vwap.color || "text-secondary" },
              { label: "VOL Trend", value: analysis?.indicators.vol.val || "A: 0.0%", status: analysis?.indicators.vol.status || "MOMENTUM -", color: analysis?.indicators.vol.color || "text-on-surface-variant" },
              { label: "ADX", value: analysis?.indicators.adx.val || "24.5", status: analysis?.indicators.adx.status || "DÉBIL", color: analysis?.indicators.adx.color || "text-on-surface-variant" },
              { label: "ATR", value: analysis?.indicators.atr.val || "0.00", status: analysis?.indicators.atr.status || "NORMAL", color: analysis?.indicators.atr.color || "text-primary" }
            ].map((ind, i) => (
              <div key={i} className="bg-surface-container p-4 rounded-xl text-center space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{ind.label}</p>
                <p className={cn("text-sm font-bold", ind.color)}>{ind.value}</p>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest", ind.color)}>{ind.status}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-2 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Target className="w-3 h-3" /> NIVELES DE TRADING ({timeframe.toUpperCase()})
                  </h4>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Estrategia: <span className="text-tertiary">{analysis.strategy}</span></p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={copySignal}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-primary"
                    title="Copiar Señal"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <span className={cn("text-xs font-bold px-3 py-1 rounded-full", analysis.type === "LONG" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary")}>
                    {analysis.type === "LONG" ? "COMPRA MODERADA" : "VENTA MODERADA"} ({analysis.score}%)
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-surface-container rounded-xl border-l-4 border-primary">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">ENTRADA:</span>
                    <span className="text-lg font-bold text-primary">${analysis.entry.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-surface-container rounded-xl border-l-4 border-secondary">
                    <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">STOP LOSS:</span>
                    <span className="text-lg font-bold text-secondary">${analysis.sl.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold px-3">
                    <span className="text-on-surface-variant uppercase tracking-widest">RATIO RIESGO/BENEFICIO:</span>
                    <span className="text-tertiary">{analysis.ratio}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "TAKE PROFIT 1", val: analysis.tp1, color: "text-tertiary" },
                    { label: "TAKE PROFIT 2", val: analysis.tp2, color: "text-tertiary" },
                    { label: "TAKE PROFIT 3", val: analysis.tp3, color: "text-tertiary" }
                  ].map((tp, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-surface-container rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{tp.label}:</span>
                      <span className={cn("text-sm font-bold", tp.color)}>${tp.val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/10 space-y-4">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">JUSTIFICACIÓN DE ENTRADA ({analysis.type}):</h5>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>RSI en {analysis.indicators.rsi.val} - Presión {analysis.type === "LONG" ? "compradora" : "vendedora"} sostenida.</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>MACD mostrando {analysis.indicators.macd.status.toLowerCase()}, divergencia {analysis.type === "LONG" ? "positiva" : "negativa"}.</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>EMA20/50 en cruce {analysis.type === "LONG" ? "alcista" : "bajista"}, tendencia confirmada.</span>
                  </li>
                  <li className="flex items-start gap-2 text-xs text-on-surface-variant">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span>Zonas OTE: Entrada óptima detectada en niveles de Fibonacci 0.705-0.79.</span>
                  </li>
                </ul>
                <div className="bg-surface-container p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">PUNTUACIÓN TOTAL: {analysis.score}%</p>
                  <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${analysis.score}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" /> GRÁFICO DE ANÁLISIS
                </h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={klines}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#22262b" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={['auto', 'auto']} hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: "#1c2024", border: "none", borderRadius: "12px" }}
                        itemStyle={{ color: "#b1ffce" }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="close" 
                        stroke="#b1ffce" 
                        fillOpacity={0.1} 
                        fill="#b1ffce" 
                      />
                      {/* Entry Line */}
                      <ReferenceLine y={analysis.entry} stroke="#b1ffce" strokeDasharray="5 5" label={{ position: 'right', value: 'ENTRY', fill: '#b1ffce', fontSize: 10 }} />
                      {/* SL Line */}
                      <ReferenceLine y={analysis.sl} stroke="#ff7162" strokeDasharray="5 5" label={{ position: 'right', value: 'SL', fill: '#ff7162', fontSize: 10 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-gradient-to-br from-surface-container-high to-surface-container-low p-6 rounded-2xl border border-primary/20 relative overflow-hidden group">
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Brain className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-widest">Sugerencia de IA</span>
                  </div>
                  <p className="text-xs text-on-surface-variant leading-relaxed italic">
                    "La estructura de mercado en {timeframe} sugiere una {analysis.type === "LONG" ? "acumulación" : "distribución"} fuerte. Los niveles de liquidez indican un posible movimiento hacia el TP2 en las próximas horas."
                  </p>
                </div>
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              </div>
            </div>
          </motion.div>
        )}

        {!analysis && !analyzing && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-on-surface-variant/20" />
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface-variant">Listo para Analizar</h3>
            <p className="text-on-surface-variant max-w-md mx-auto text-sm">
              Selecciona un activo y un marco de tiempo, luego presiona el botón de analizar para obtener niveles de entrada, TPs y Stop Loss basados en IA.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Terminal;
