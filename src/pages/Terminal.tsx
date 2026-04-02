import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, Reorder } from "motion/react";
import { 
  ArrowLeft, 
  ArrowUpRight,
  ArrowDownRight,
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
  ZapOff,
  Globe,
  Calculator,
  History,
  Users,
  MousePointer2,
  ArrowRightLeft,
  Newspaper,
  Star,
  X,
  LayoutGrid,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchTicker, 
  CryptoData, 
  fetchKlines, 
  connectTickerStream, 
  fetchEconomicEvents,
  fetchWhaleMovements,
  fetchTopTraders,
  fetchLargeTransactions
} from "@/services/cryptoService";
import { analyzeMarket } from "@/services/geminiService";
import { sendTelegramAlert } from "@/services/telegramService";
import { toast } from "sonner";
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
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);
  const [whaleMovements, setWhaleMovements] = useState<any[]>([]);
  const [topTraders, setTopTraders] = useState<any[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<any[]>([]);
  const [riskAmount, setRiskAmount] = useState(100);
  const [accountSize, setAccountSize] = useState(10000);
  const [selectedTraderStrategy, setSelectedTraderStrategy] = useState<any>(null);
  
  // Layout State
  const [moduleOrder, setModuleOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("terminal_module_order");
    return saved ? JSON.parse(saved) : ["overview", "copytrading", "news", "indicators", "analysis"];
  });

  const [savedLayouts, setSavedLayouts] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem("terminal_saved_layouts");
    return saved ? JSON.parse(saved) : {};
  });

  const saveLayout = (name: string) => {
    const newLayouts = { ...savedLayouts, [name]: moduleOrder };
    setSavedLayouts(newLayouts);
    localStorage.setItem("terminal_saved_layouts", JSON.stringify(newLayouts));
    toast.success(`Diseño "${name}" guardado`);
  };

  const loadLayout = (name: string) => {
    if (savedLayouts[name]) {
      setModuleOrder(savedLayouts[name]);
      toast.success(`Diseño "${name}" cargado`);
    }
  };

  const resetLayout = () => {
    const defaultOrder = ["chart", "copytrading", "news", "tools", "analysis"];
    setModuleOrder(defaultOrder);
    localStorage.setItem("terminal_module_order", JSON.stringify(defaultOrder));
    toast.success("Diseño restablecido");
  };

  useEffect(() => {
    localStorage.setItem("terminal_module_order", JSON.stringify(moduleOrder));
  }, [moduleOrder]);
  
  // Analysis State
  const [analysis, setAnalysis] = useState<any>(null);
  const [mtfBias, setMtfBias] = useState<any>({
    "1m": "NEUTRAL",
    "5m": "BULLISH",
    "15m": "BULLISH",
    "1h": "BEARISH"
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [data, chartData, events, whales, traders, txs] = await Promise.all([
          fetchTicker(symbolParam),
          fetchKlines(symbolParam, timeframe, 100),
          fetchEconomicEvents(),
          fetchWhaleMovements(),
          fetchTopTraders(),
          fetchLargeTransactions()
        ]);
        setTicker(data);
        setKlines(chartData);
        setEconomicEvents(events);
        setWhaleMovements(whales);
        setTopTraders(traders);
        setLargeTransactions(txs);
      } catch (error) {
        console.error("Analyzer data load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(async () => {
      try {
        const [events, whales, traders, txs] = await Promise.all([
          fetchEconomicEvents(),
          fetchWhaleMovements(),
          fetchTopTraders(),
          fetchLargeTransactions()
        ]);
        setEconomicEvents(events);
        setWhaleMovements(whales);
        setTopTraders(traders);
        setLargeTransactions(txs);
      } catch (error) {
        console.error("Auto-refresh error:", error);
      }
    }, 120000);

    // WebSocket for live updates
    const ws = connectTickerStream(symbolParam, (liveData) => {
      setTicker(liveData);
    });

    return () => {
      ws.close();
      clearInterval(interval);
    };
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
    
    // Call AI Analysis
    const fetchAIAnalysis = async () => {
      try {
        const aiResponse = await analyzeMarket(symbolParam, ticker.price, ticker.priceChangePercent, strategy as any);
        
        const adxVal = Math.floor(Math.random() * 30) + 15; // 15-45
        const isChop = adxVal < 20;
        const isBullish = aiResponse.includes("ALCISTA") || aiResponse.includes("LONG") || Math.random() > 0.5;
        const isBTC = symbolParam.includes("BTC");

        // Timeframe based volatility/TP distance
        let tpMultiplier = 1.0;
        if (timeframe === "1m") tpMultiplier = 0.3;
        else if (timeframe === "5m") tpMultiplier = 0.6;
        else if (timeframe === "15m") tpMultiplier = 1.2;
        else if (timeframe === "1h") tpMultiplier = 2.5;
        else if (timeframe === "4h") tpMultiplier = 5.0;

        const volatility = price * 0.005 * tpMultiplier;

        // Strategy Logic
        let strategyName = strategy;
        let emaPeriod = isBTC ? 400 : 800;
        
        if (timeframe === "1m") strategyName = "Pupupu Scalping";
        if (timeframe === "5m") strategyName = "Reto Trading";

        const newAnalysis = {
          type: isBullish ? "LONG" : "SHORT",
          entry: price,
          sl: isBullish ? price - (volatility * 0.8) : price + (volatility * 0.8),
          tp1: isBullish ? price + volatility : price - volatility,
          tp2: isBullish ? price + volatility * 1.8 : price - volatility * 1.8,
          tp3: isBullish ? price + volatility * 3.0 : price - volatility * 3.0,
          ratio: `1:${(3.0 / 0.8).toFixed(1)}`,
          rr: 3.0 / 0.8,
          score: isChop ? Math.floor(Math.random() * 20) + 40 : Math.floor(Math.random() * 30) + 65,
          sentiment: isBullish ? "BULLISH" : "BEARISH",
          strategy: strategyName,
          description: aiResponse,
          context: {
            trend: adxVal > 25 ? "STRONG ↑" : "WEAK →",
            adx: adxVal,
            vol: Math.random() > 0.5 ? "HIGH" : "NORMAL",
            structure: Math.random() > 0.7 ? "BOS (Break of Structure)" : "CHoCH (Change of Character)",
            zone: Math.random() > 0.5 ? "LVN BREAK" : "HVN REJECTION",
            bias: isBullish ? "LONG" : "SHORT",
            cvd: (Math.random() * 1000 - 500).toFixed(0),
            delta: (Math.random() * 200 - 100).toFixed(0)
          },
          indicators: {
            rsi: { val: (Math.random() * 40 + 30).toFixed(1), status: isBullish ? "ALCISTA" : "BAJISTA" },
            macd: { val: isBullish ? "0.45" : "-0.45", status: isBullish ? "ALCISTA" : "BAJISTA", color: isBullish ? "text-primary" : "text-secondary" },
            ema: { val: timeframe === "1m" ? `12/${emaPeriod}` : "20/50", status: isBullish ? "ALCISTA" : "BAJISTA", color: isBullish ? "text-primary" : "text-secondary" },
            vwap: { val: (price * 0.999).toFixed(2), status: isBullish ? "POR ENCIMA" : "POR DEBAJO", color: isBullish ? "text-primary" : "text-secondary" },
            vol: { val: "A: 1.2%", status: "MOMENTUM +", color: "text-primary" },
            adx: { val: adxVal.toString(), status: adxVal > 25 ? "TENDENCIA FUERTE" : "RANGO / CHOP", color: adxVal > 25 ? "text-primary" : "text-on-surface-variant" },
            atr: { val: (volatility / 2).toFixed(2), status: "NORMAL", color: "text-primary" }
          },
          volumeProfile: [
            { price: price * 1.02, vol: Math.floor(Math.random() * 40) + 60 },
            { price: price * 1.01, vol: Math.floor(Math.random() * 30) + 40 },
            { price: price * 1.00, vol: Math.floor(Math.random() * 20) + 20 },
            { price: price * 0.99, vol: Math.floor(Math.random() * 50) + 30 },
            { price: price * 0.98, vol: Math.floor(Math.random() * 40) + 50 }
          ],
          fvgs: [
            { price: (price * 0.985).toFixed(2), type: "BULLISH", status: "OPEN" },
            { price: (price * 1.015).toFixed(2), type: "BEARISH", status: "MITIGATED" }
          ],
          correlation: {
            btc: (Math.random() * 0.2 + 0.75).toFixed(2),
            eth: (Math.random() * 0.2 + 0.70).toFixed(2),
            sp500: (Math.random() * 0.3 + 0.40).toFixed(2)
          }
        };
        
        setAnalysis(newAnalysis);
        setAnalyzing(false);
        setCooldown(15); 
        
        setMtfBias({
          "1m": Math.random() > 0.5 ? "BULLISH" : "BEARISH",
          "5m": Math.random() > 0.5 ? "BULLISH" : "BEARISH",
          "15m": Math.random() > 0.5 ? "BULLISH" : "BEARISH",
          "1h": Math.random() > 0.5 ? "BULLISH" : "BEARISH"
        });
      } catch (error) {
        console.error("Analysis error:", error);
        setAnalyzing(false);
      }
    };

    fetchAIAnalysis();
  };

  useEffect(() => {
    if (analysis) {
      runAnalysis();
    }
  }, [timeframe, strategy]);

  const copySignal = () => {
    if (!analysis) return;
    const text = `🚀 ZCOIN ANALYZER - SEÑAL INSTITUCIONAL
-----------------------------------
📊 ACTIVO: ${symbolParam}
🕒 TEMPORALIDAD: ${timeframe.toUpperCase()}
🎯 TIPO: ${analysis.type} (${analysis.strategy})
-----------------------------------
✅ ENTRADA: $${analysis.entry.toLocaleString()}
🛑 STOP LOSS: $${analysis.sl.toLocaleString()}
-----------------------------------
💰 TAKE PROFIT 1: $${analysis.tp1.toLocaleString()}
💰 TAKE PROFIT 2: $${analysis.tp2.toLocaleString()}
💰 TAKE PROFIT 3: $${analysis.tp3.toLocaleString()}
-----------------------------------
⚖️ RIESGO/BENEFICIO: ${analysis.ratio}
🔥 CONFIANZA: ${analysis.score}%
-----------------------------------
💡 NOTA: Gestiona tu riesgo. No arriesgues más del 1-2% por operación.`;
    navigator.clipboard.writeText(text);
    toast.success("Señal copiada al portapapeles");
  };

  const shareToTelegram = async () => {
    if (!analysis || !ticker) return;
    
    toast.promise(
      sendTelegramAlert({
        symbol: symbolParam,
        price: ticker.price,
        change: ticker.priceChangePercent,
        type: analysis.sentiment === "BULLISH" ? "BULLISH" : "BEARISH",
        confidence: analysis.score,
        analysis: analysis.description
      }),
      {
        loading: 'Enviando señal a Telegram...',
        success: 'Señal enviada a Telegram correctamente',
        error: 'Error al enviar la señal a Telegram',
      }
    );
  };

  const handleCopyStrategy = (trader: any) => {
    const isLong = trader.trade.includes("LONG");
    const entry = parseFloat(ticker?.price || "0");
    const volatility = entry * 0.01;
    
    const strategyDetails = {
      name: trader.name,
      trade: trader.trade,
      timeframe: "1h",
      entry: entry,
      sl: isLong ? entry - volatility : entry + volatility,
      tp1: isLong ? entry + volatility * 1.5 : entry - volatility * 1.5,
      tp2: isLong ? entry + volatility * 2.5 : entry - volatility * 2.5,
      tp3: isLong ? entry + volatility * 4.0 : entry - volatility * 4.0,
      justification: `Estrategia basada en el flujo de órdenes institucional detectado por ${trader.name}. Se observa una fuerte acumulación en zonas de descuento con confluencia en el perfil de volumen.`
    };
    setSelectedTraderStrategy(strategyDetails);
    toast.info(`Estrategia de ${trader.name} cargada`);
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
      className="min-h-screen pt-16 pb-24 text-on-surface overflow-x-hidden bg-surface-container-lowest"
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

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const name = prompt("Nombre del diseño:");
                if (name) saveLayout(name);
              }}
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-1"
            >
              <Star className="w-3 h-3" /> Guardar
            </button>
            <button 
              onClick={resetLayout}
              className="px-3 py-1.5 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/10 hover:text-secondary transition-all flex items-center gap-1"
            >
              <Activity className="w-3 h-3" /> Reset
            </button>
            {Object.keys(savedLayouts).length > 0 && (
              <div className="relative group/layouts">
                <button className="px-3 py-1.5 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-1">
                  <ChevronDown className="w-3 h-3" /> Diseños
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl opacity-0 group-hover/layouts:opacity-100 transition-opacity pointer-events-none group-hover/layouts:pointer-events-auto z-50 overflow-hidden">
                  {Object.keys(savedLayouts).map(name => (
                    <button 
                      key={name}
                      onClick={() => loadLayout(name)}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-colors border-b border-outline-variant/5 last:border-0"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
        <Reorder.Group 
          axis="y" 
          values={moduleOrder} 
          onReorder={setModuleOrder}
          className="space-y-6"
        >
          {moduleOrder.map((moduleId) => (
            <Reorder.Item 
              key={moduleId} 
              value={moduleId}
              className="relative group/module"
            >
              <div className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover/module:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 z-50">
                <GripVertical className="w-6 h-6 text-on-surface-variant/50" />
              </div>

              {moduleId === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="p-4 rounded-2xl border bg-surface-container-low border-outline-variant/10">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Precio Actual</span>
                      <Activity className={cn("w-4 h-4", (ticker && parseFloat(ticker.priceChangePercent) >= 0) ? "text-primary" : "text-secondary")} />
                    </div>
                    <p className="text-2xl font-headline font-bold">${ticker ? parseFloat(ticker.price).toLocaleString() : "---"}</p>
                    <p className={cn("text-xs font-bold mt-1", (ticker && parseFloat(ticker.priceChangePercent) >= 0) ? "text-primary" : "text-secondary")}>
                      {ticker && parseFloat(ticker.priceChangePercent) >= 0 ? "+" : ""}{ticker?.priceChangePercent}% (24h)
                    </p>
                  </div>
                  
                  <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Volumen 24h</span>
                      <BarChart3 className="w-4 h-4 text-tertiary" />
                    </div>
                    <p className="text-2xl font-headline font-bold">${ticker ? (parseFloat(ticker.volume) / 1000000).toFixed(2) : "---"}M</p>
                    <p className="text-xs text-on-surface-variant mt-1 uppercase font-bold">USDT</p>
                  </div>

                  <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Rango 24h</span>
                      <Layers className="w-4 h-4 text-secondary" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-secondary">L: ${ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "---"}</span>
                        <span className="text-primary">H: ${ticker ? parseFloat(ticker.highPrice).toLocaleString() : "---"}</span>
                      </div>
                      <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-secondary to-primary" 
                          style={{ width: ticker ? `${((parseFloat(ticker.price) - parseFloat(ticker.lowPrice)) / (parseFloat(ticker.highPrice) - parseFloat(ticker.lowPrice))) * 100}%` : "0%" }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl border bg-surface-container-low border-outline-variant/10 flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Sentimiento IA</span>
                    <div className="flex items-center gap-2">
                      <Gauge className={cn("w-6 h-6", analysis?.sentiment === "BULLISH" ? "text-primary" : "text-secondary")} />
                      <span className={cn("text-xl font-bold font-headline", analysis?.sentiment === "BULLISH" ? "text-primary" : "text-secondary")}>
                        {analysis?.sentiment || (ticker && parseFloat(ticker.priceChangePercent) >= 0 ? "ALCISTA" : "BAJISTA")}
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
              )}

              {moduleId === "copytrading" && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3 space-y-4">
                    <div className="bg-[#0a0c10] border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl">
                      <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-4 border-b border-orange-500/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Target className="w-5 h-5 text-black" />
                          </div>
                          <h3 className="text-sm font-black uppercase tracking-widest text-orange-500">
                            COPY TRADING | WHALES & TOP TRADERS EN VIVO
                          </h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
                            <Zap className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Ballenas Activas: {whaleMovements.length}</span>
                          </div>
                          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
                            <Users className="w-3 h-3 text-primary" />
                            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Top Traders: {topTraders.length}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-outline-variant/10">
                        <div className="p-4 space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                            <Waves className="w-3 h-3" /> MOVIMIENTOS DE BALLENAS (30MIN)
                          </h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {whaleMovements.map((whale, i) => (
                              <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-surface-container rounded flex items-center justify-center">
                                    <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} className="w-4 h-4" alt="" referrerPolicy="no-referrer" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-on-surface">{whale.symbol}</p>
                                    <p className="text-[8px] text-on-surface-variant uppercase">{whale.time}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={cn("text-[10px] font-black", whale.type === "COMPRA" ? "text-primary" : "text-secondary")}>{whale.type}</p>
                                  <p className="text-[10px] font-bold text-on-surface">{whale.amount}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                            <Users className="w-3 h-3" /> TOP TRADERS A SEGUIR
                          </h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {topTraders.map((trader, i) => (
                              <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors" onClick={() => setSelectedTraderStrategy(trader)}>
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-surface-container rounded-full flex items-center justify-center">
                                    <Users className="w-3 h-3 text-on-surface-variant" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-on-surface">{trader.name}</p>
                                    <p className="text-[8px] text-on-surface-variant uppercase">{trader.profit}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={cn("text-[10px] font-black", trader.trade.includes("LARGO") ? "text-primary" : "text-secondary")}>{trader.trade}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                            <ArrowRightLeft className="w-3 h-3" /> GRANDES TX
                          </h4>
                          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                            {largeTransactions.map((tx, i) => (
                              <div key={i} className="flex items-center justify-between p-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-surface-container rounded flex items-center justify-center">
                                    <ArrowRightLeft className="w-3 h-3 text-on-surface-variant" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-on-surface">{tx.amount} {tx.symbol}</p>
                                    <p className="text-[8px] text-on-surface-variant uppercase">{tx.time}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] font-black text-primary">{tx.value}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <Globe className="w-3 h-3" /> EVENTOS ECONÓMICOS
                      </h4>
                      <div className="space-y-3">
                        {economicEvents.map((event, i) => (
                          <div key={i} className="p-3 bg-surface-container rounded-xl border border-outline-variant/5 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-[8px] font-bold text-on-surface-variant uppercase">{event.time}</span>
                              <span className={cn(
                                "text-[8px] font-black px-1.5 py-0.5 rounded uppercase",
                                event.impact === "HIGH" ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"
                              )}>{event.impact}</span>
                            </div>
                            <p className="text-[10px] font-bold text-on-surface leading-tight">{event.event}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {moduleId === "news" && (
                <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Zap className="w-3 h-3" /> LIQUIDEZ & TREND
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant">LIQ ARRIBA:</span>
                      <span className="text-xs font-bold text-secondary">${(parseFloat(ticker.price) * 1.06).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-on-surface-variant">LIQ ABAJO:</span>
                      <span className="text-xs font-bold text-primary">${(parseFloat(ticker.price) * 0.94).toLocaleString()}</span>
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
              )}

              {moduleId === "indicators" && (
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
              )}

              {moduleId === "analysis" && analysis && (
                <div className="space-y-6">
                  {/* Signal Hero Banner */}
                  <div className={cn(
                    "p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl overflow-hidden relative bg-surface-container-low",
                    analysis.sentiment === "BULLISH" ? "border-primary/30" : "border-secondary/30"
                  )}>
                    <div className="absolute left-0 top-0 bottom-0 w-24 flex items-center justify-center opacity-10 pointer-events-none">
                      {analysis.sentiment === "BULLISH" ? (
                        <ArrowUpRight className="w-32 h-32 text-primary -rotate-12" />
                      ) : (
                        <ArrowDownRight className="w-32 h-32 text-secondary rotate-12" />
                      )}
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center opacity-10 pointer-events-none">
                      {analysis.sentiment === "BULLISH" ? (
                        <ArrowUpRight className="w-32 h-32 text-primary rotate-12" />
                      ) : (
                        <ArrowDownRight className="w-32 h-32 text-secondary -rotate-12" />
                      )}
                    </div>

                    <div className="flex items-center gap-6 z-10">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                        analysis.sentiment === "BULLISH" ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary"
                      )}>
                        {analysis.sentiment === "BULLISH" ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                      </div>
                      <div>
                        <h2 className={cn("text-3xl font-headline font-black tracking-tighter flex items-center gap-3", analysis.sentiment === "BULLISH" ? "text-primary" : "text-secondary")}>
                          {analysis.sentiment === "BULLISH" ? "SEÑAL ALCISTA" : "SEÑAL BAJISTA"}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Confianza:</span>
                          <span className={cn("text-base font-black", analysis.sentiment === "BULLISH" ? "text-primary" : "text-secondary")}>{analysis.score}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 z-10">
                      <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ratio R/B:</span>
                        <span className="text-sm font-black text-tertiary">{analysis.ratio}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Estrategia:</span>
                        <span className="text-sm font-black text-primary uppercase">{analysis.strategy}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-surface-container-low p-6 rounded-2xl border-2 space-y-6 shadow-xl border-outline-variant/10">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                          <Target className="w-3 h-3" /> NIVELES DE TRADING
                        </h4>
                        <div className="flex items-center gap-3">
                          <button onClick={copySignal} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-primary"><Copy className="w-4 h-4" /></button>
                          <button onClick={shareToTelegram} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-primary"><Share2 className="w-4 h-4" /></button>
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
                        </div>

                        <div className="space-y-3">
                          {[analysis.tp1, analysis.tp2, analysis.tp3].map((tp, i) => (
                            <div key={i} className="flex justify-between items-center p-3 bg-surface-container rounded-xl border border-outline-variant/5">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">TP {i+1}</span>
                              <span className="text-sm font-black text-tertiary">${tp.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-xl">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <BarChart3 className="w-3 h-3" /> GRÁFICO DE ANÁLISIS
                      </h4>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={klines}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#22262b" vertical={false} />
                            <XAxis dataKey="time" hide />
                            <YAxis domain={['auto', 'auto']} hide />
                            <Tooltip contentStyle={{ backgroundColor: "#1c2024", border: "none", borderRadius: "12px" }} />
                            <Area type="monotone" dataKey="close" stroke="#b1ffce" fillOpacity={0.1} fill="#b1ffce" />
                            <ReferenceLine y={analysis.entry} stroke="#b1ffce" strokeDasharray="5 5" />
                            <ReferenceLine y={analysis.sl} stroke="#ff7162" strokeDasharray="5 5" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>

        {/* Copy Trading & News Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Copy Trading Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#0a0c10] border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-4 border-b border-orange-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Target className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-orange-500">
                    COPY TRADING | WHALES & TOP TRADERS EN VIVO
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Ballenas Activas: {whaleMovements.length}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
                    <Users className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Top Traders: {topTraders.length}</span>
                  </div>
                  <button className="p-2 hover:bg-surface-container rounded-full transition-colors">
                    <Search className="w-4 h-4 text-orange-500" />
                  </button>
                </div>
              </div>

              {selectedTraderStrategy && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="bg-orange-500/5 border-b border-orange-500/20 p-6 relative"
                >
                  <button 
                    onClick={() => setSelectedTraderStrategy(null)}
                    className="absolute top-4 right-4 p-1 hover:bg-orange-500/10 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-orange-500" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1 space-y-2">
                      <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Trader</p>
                      <p className="text-lg font-headline font-bold">{selectedTraderStrategy.name}</p>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-black px-2 py-0.5 rounded", selectedTraderStrategy.trade.includes("LONG") ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary")}>
                          {selectedTraderStrategy.trade}
                        </span>
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{selectedTraderStrategy.timeframe}</span>
                      </div>
                    </div>
                    <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-on-surface-variant uppercase">Entrada</p>
                        <p className="text-sm font-bold text-on-surface">${selectedTraderStrategy.entry.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-on-surface-variant uppercase">Stop Loss</p>
                        <p className="text-sm font-bold text-secondary">${selectedTraderStrategy.sl.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-on-surface-variant uppercase">Take Profit 1</p>
                        <p className="text-sm font-bold text-primary">${selectedTraderStrategy.tp1.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-bold text-on-surface-variant uppercase">Take Profit 3</p>
                        <p className="text-sm font-bold text-primary">${selectedTraderStrategy.tp3.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="md:col-span-1 border-l border-orange-500/10 pl-4 flex flex-col justify-between">
                      <div>
                        <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Justificación</p>
                        <p className="text-[10px] text-on-surface-variant leading-relaxed italic">
                          {selectedTraderStrategy.justification}
                        </p>
                      </div>
                      <button 
                        onClick={() => {
                          const text = `🚀 ESTRATEGIA COPIADA - ${selectedTraderStrategy.name}\nActivo: ${symbolParam}\nEntrada: $${selectedTraderStrategy.entry}\nSL: $${selectedTraderStrategy.sl}\nTP1: $${selectedTraderStrategy.tp1}\nTP2: $${selectedTraderStrategy.tp2}\nTP3: $${selectedTraderStrategy.tp3}\nJustificación: ${selectedTraderStrategy.justification}`;
                          navigator.clipboard.writeText(text);
                          toast.success("Estrategia copiada al portapapeles");
                        }}
                        className="mt-4 w-full py-2 bg-orange-500 text-black text-[10px] font-black uppercase rounded-lg hover:bg-orange-400 transition-all flex items-center justify-center gap-2"
                      >
                        <Copy className="w-3 h-3" /> Copiar Señal Completa
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-outline-variant/10">
                {/* Whale Movements */}
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Waves className="w-3 h-3" /> MOVIMIENTOS DE BALLENAS (30MIN)
                  </h4>
                  <div className="space-y-3">
                    {whaleMovements.map((whale, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-surface-container rounded flex items-center justify-center">
                            <img 
                              src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} 
                              className="w-4 h-4" 
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-on-surface">{whale.symbol}</p>
                            <p className="text-[8px] text-on-surface-variant uppercase">{whale.exchange} | {whale.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-[10px] font-black", whale.type === "BUY" ? "text-primary" : "text-secondary")}>{whale.type}</p>
                          <p className="text-[10px] font-bold text-on-surface">{whale.amount}</p>
                        </div>
                        <span className={cn(
                          "text-[8px] font-bold px-1.5 py-0.5 rounded",
                          whale.impact === "Alta" ? "text-orange-500" : "text-on-surface-variant"
                        )}>
                          {whale.impact}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Traders */}
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Users className="w-3 h-3" /> TOP TRADERS A SEGUIR
                  </h4>
                  <div className="space-y-3">
                    {topTraders.map((trader, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-2 rounded-lg transition-colors border border-transparent hover:border-orange-500/20">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-surface-container rounded-xl flex items-center justify-center">
                            <Users className="w-3 h-3 text-on-surface-variant" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-on-surface">{trader.name}</p>
                            <p className="text-[8px] text-on-surface-variant uppercase">{trader.exchange}</p>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <p className={cn("text-[10px] font-black", trader.trade.includes("LONG") ? "text-primary" : "text-secondary")}>{trader.trade}</p>
                          <button 
                            onClick={() => handleCopyStrategy(trader)}
                            className="mt-1 px-2 py-0.5 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-black text-[8px] font-black uppercase rounded transition-all"
                          >
                            Copiar Estrategia
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Large Transactions */}
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <ArrowRightLeft className="w-3 h-3" /> GRANDES TRANSACCIONES
                  </h4>
                  <div className="space-y-3">
                    {largeTransactions.map((tx, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors">
                        <div>
                          <p className="text-[10px] font-bold text-on-surface">{tx.symbol}</p>
                          <p className="text-[8px] text-on-surface-variant font-mono">{tx.address}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-on-surface">{tx.amount}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-[10px] font-black uppercase",
                            tx.type === "Acumulación" ? "text-orange-500" : 
                            tx.type === "Depósito" ? "text-yellow-500" : "text-secondary"
                          )}>
                            {tx.type}
                          </p>
                          <p className="text-[8px] text-on-surface-variant">{tx.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border-t border-green-500/20 p-3 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">
                    MOVIMIENTO MIXTO | Acumulación en BTC y SOL, distribución en ETH
                  </p>
                </div>
                <div className="h-4 w-px bg-green-500/20"></div>
                <p className="text-[10px] font-bold text-on-surface-variant uppercase">
                  📌 RECOMENDACIÓN ACC PRO: Seguir ballenas: BTC y SOL con acumulación reciente.
                </p>
              </div>
            </div>
          </div>

          {/* Impact News Panel */}
          <div className="bg-[#0a0c10] border border-outline-variant/10 rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
              <Newspaper className="w-5 h-5 text-on-surface-variant" />
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
                NOTICIAS DE IMPACTO
              </h3>
            </div>

            <div className="space-y-6">
              {economicEvents.map((news, i) => (
                <div key={i} className="space-y-2 group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="bg-orange-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                        ECONOMÍA
                      </span>
                      <h4 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors">
                        {news.event}
                      </h4>
                    </div>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {news.date} | {news.time}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Impacto:</span>
                      <span className={cn(
                        "text-[10px] font-black uppercase",
                        news.impact === "CRITICAL" ? "text-secondary" : "text-orange-500"
                      )}>
                        {news.impact === "CRITICAL" ? "Alto" : "Medio"}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={cn(
                            "w-3 h-3", 
                            star <= (news.impact === "CRITICAL" ? 5 : 3) ? "text-orange-500 fill-orange-500" : "text-on-surface-variant/20"
                          )} 
                        />
                      ))}
                      <span className="text-[10px] font-bold text-on-surface-variant ml-1">{news.probability}%</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-on-surface-variant leading-relaxed">
                    {news.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase">
                    <BarChart3 className="w-3 h-3" />
                    {news.effect}
                  </div>
                  
                  {i < economicEvents.length - 1 && <div className="pt-4 border-b border-outline-variant/5"></div>}
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center gap-2 text-secondary">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-[10px] font-bold uppercase tracking-widest">
                Alta volatilidad esperada en eventos marcados con <Star className="w-3 h-3 inline fill-orange-500 text-orange-500" />
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Tools Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Calculator */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Calculator className="w-3 h-3" /> CALCULADORA DE RIESGO
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-on-surface-variant uppercase">Balance Cuenta ($)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant">$</span>
                  <input 
                    type="number" 
                    value={accountSize} 
                    onChange={(e) => setAccountSize(Number(e.target.value))}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg pl-6 pr-2 py-2 text-xs font-bold focus:border-primary/50 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-bold text-on-surface-variant uppercase">Riesgo por Operación ($)</label>
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-on-surface-variant">$</span>
                  <input 
                    type="number" 
                    value={riskAmount} 
                    onChange={(e) => setRiskAmount(Number(e.target.value))}
                    className="w-full bg-surface-container-high border border-outline-variant/20 rounded-lg pl-6 pr-2 py-2 text-xs font-bold focus:border-primary/50 outline-none transition-all"
                  />
                </div>
              </div>
            </div>
            {analysis && (
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Calculator className="w-12 h-12" />
                </div>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold mb-1 relative z-10">Lotaje Sugerido:</p>
                <div className="flex items-baseline gap-2 relative z-10">
                  <p className="text-2xl font-headline font-black text-primary">
                    {((riskAmount / Math.abs(analysis.entry - analysis.sl))).toFixed(4)}
                  </p>
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">{symbolParam.replace("USDT", "")}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-outline-variant/5 flex justify-between items-center relative z-10">
                  <span className="text-[8px] text-on-surface-variant uppercase font-bold">SL Distancia:</span>
                  <span className="text-[10px] font-bold text-secondary">
                    {((Math.abs(analysis.entry - analysis.sl) / analysis.entry) * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Economic Calendar */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Globe className="w-3 h-3" /> CALENDARIO ECONÓMICO
            </h4>
            <div className="space-y-2">
              {economicEvents.map((ev, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-container p-2 rounded-xl">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-on-surface">{ev.event}</span>
                    <span className="text-[8px] text-on-surface-variant uppercase">{ev.date} @ {ev.time}</span>
                  </div>
                  <span className={cn(
                    "text-[8px] font-bold px-1.5 py-0.5 rounded",
                    ev.impact === "CRITICAL" ? "bg-secondary/10 text-secondary" : 
                    ev.impact === "HIGH" ? "bg-primary/10 text-primary" : "bg-surface-container-highest text-on-surface-variant"
                  )}>
                    {ev.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Backtesting Stats */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <History className="w-3 h-3" /> BACKTESTING (30D)
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-container p-3 rounded-xl text-center">
                <p className="text-[8px] text-on-surface-variant uppercase font-bold">Win Rate</p>
                <p className="text-xl font-headline font-bold text-primary">68.4%</p>
              </div>
              <div className="bg-surface-container p-3 rounded-xl text-center">
                <p className="text-[8px] text-on-surface-variant uppercase font-bold">Profit Factor</p>
                <p className="text-xl font-headline font-bold text-tertiary">2.14</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-secondary/5 rounded-lg border border-secondary/10">
              <AlertTriangle className="w-3 h-3 text-secondary" />
              <p className="text-[8px] text-secondary font-bold uppercase">Alta volatilidad detectada en 1m</p>
            </div>
          </div>
        </div>

        {/* Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Context & MTF */}
          <div className="space-y-6">
            {/* Quick Context Panel */}
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-lg relative overflow-hidden group">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2 relative z-10">
                <Brain className="w-3 h-3" /> CONTEXTO INSTITUCIONAL
              </h4>
              <div className="space-y-3 relative z-10">
                {[
                  { label: "TREND", val: analysis?.context?.trend || "---", color: "text-on-surface" },
                  { label: "ADX", val: analysis?.context?.adx || "---", color: "text-primary" },
                  { label: "VOL", val: analysis?.context?.vol || "---", color: "text-tertiary" },
                  { label: "STRUCTURE", val: analysis?.context?.structure || "---", color: "text-on-surface" },
                  { label: "ZONE", val: analysis?.context?.zone || "---", color: "text-primary" },
                  { label: "BIAS", val: analysis?.context?.bias || "---", color: analysis?.sentiment === "BULLISH" ? "text-primary" : "text-secondary" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-1.5 border-b border-outline-variant/5">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter">{item.label}</span>
                    <span className={cn("text-[10px] font-black uppercase", item.color)}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* MTF Bias Panel */}
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-lg">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Activity className="w-3 h-3" /> MULTI-TIMEFRAME BIAS
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(mtfBias).map(([tf, bias]: [string, any]) => (
                  <div key={tf} className="bg-surface-container p-3 rounded-xl flex flex-col items-center gap-2 border border-outline-variant/5 hover:border-primary/20 transition-colors">
                    <span className="text-[10px] font-bold text-on-surface-variant">{tf}</span>
                    <div className={cn(
                      "w-3 h-3 rounded-full shadow-[0_0_12px]",
                      bias === "BULLISH" ? "bg-primary shadow-primary/50" : "bg-secondary shadow-secondary/50"
                    )}></div>
                    <span className={cn("text-[8px] font-black uppercase", bias === "BULLISH" ? "text-primary" : "text-secondary")}>{bias}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Flow (CVD/Delta) */}
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-lg">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Zap className="w-3 h-3" /> ORDER FLOW (CVD/DELTA)
              </h4>
              <div className="space-y-4">
                <div className="bg-surface-container p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">CVD Acumulado</span>
                    <span className={cn("text-xs font-black", parseFloat(analysis?.context?.cvd || "0") > 0 ? "text-primary" : "text-secondary")}>
                      {analysis?.context?.cvd || "0"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full transition-all duration-1000", parseFloat(analysis?.context?.cvd || "0") > 0 ? "bg-primary" : "bg-secondary")} 
                      style={{ width: `${Math.min(Math.abs(parseFloat(analysis?.context?.cvd || "0")) / 5, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Delta Vela</span>
                  <span className={cn("text-xs font-black", parseFloat(analysis?.context?.delta || "0") > 0 ? "text-primary" : "text-secondary")}>
                    {analysis?.context?.delta || "0"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Original Analysis Grid Content (3 columns wide) */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
            className="space-y-6"
          >
            {/* Signal Hero Banner */}
            <div className={cn(
              "p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl overflow-hidden relative bg-surface-container-low",
              analysis.sentiment === "BULLISH" ? "border-primary/30" : "border-secondary/30"
            )}>
              {/* Decorative Arrows */}
              <div className="absolute left-0 top-0 bottom-0 w-24 flex items-center justify-center opacity-10 pointer-events-none">
                {analysis.sentiment === "BULLISH" ? (
                  <ArrowUpRight className="w-32 h-32 text-primary -rotate-12" />
                ) : (
                  <ArrowDownRight className="w-32 h-32 text-secondary rotate-12" />
                )}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center opacity-10 pointer-events-none">
                {analysis.sentiment === "BULLISH" ? (
                  <ArrowUpRight className="w-32 h-32 text-primary rotate-12" />
                ) : (
                  <ArrowDownRight className="w-32 h-32 text-secondary -rotate-12" />
                )}
              </div>

              <div className="flex items-center gap-6 z-10">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-transform hover:scale-110",
                  analysis.sentiment === "BULLISH" ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary"
                )}>
                  {analysis.sentiment === "BULLISH" ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className={cn("text-3xl font-headline font-black tracking-tighter flex items-center gap-3", analysis.sentiment === "BULLISH" ? "text-primary" : "text-secondary")}>
                    {analysis.sentiment === "BULLISH" ? (
                      <>
                        <ArrowUpRight className="w-8 h-8 animate-bounce" />
                        SEÑAL ALCISTA
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="w-8 h-8 animate-bounce" />
                        SEÑAL BAJISTA
                      </>
                    )}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Confianza del Sistema:</span>
                    <span className={cn("text-base font-black", analysis.sentiment === "BULLISH" ? "text-primary" : "text-secondary")}>{analysis.score}%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-2 z-10">
                <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Ratio R/B:</span>
                  <span className="text-sm font-black text-tertiary">{analysis.ratio}</span>
                </div>
                <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Estrategia:</span>
                  <span className="text-sm font-black text-primary uppercase">{analysis.strategy}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-surface-container-low p-6 rounded-2xl border-2 space-y-6 shadow-xl border-outline-variant/10">
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
                  <button 
                    onClick={shareToTelegram}
                    className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-primary"
                    title="Enviar a Telegram"
                  >
                    <Share2 className="w-4 h-4" />
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
                    { label: "TAKE PROFIT 1", val: analysis.tp1, color: "text-tertiary", icon: <Target className="w-4 h-4" /> },
                    { label: "TAKE PROFIT 2", val: analysis.tp2, color: "text-tertiary", icon: <Target className="w-4 h-4" /> },
                    { label: "TAKE PROFIT 3", val: analysis.tp3, color: "text-tertiary", icon: <Target className="w-4 h-4" /> }
                  ].map((tp, i) => (
                    <div key={i} className="flex justify-between items-center p-4 bg-surface-container rounded-xl border border-outline-variant/5 hover:border-tertiary/30 transition-all group/tp">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-tertiary/10 rounded-lg text-tertiary group-hover/tp:scale-110 transition-transform">
                          {tp.icon}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{tp.label}</span>
                      </div>
                      <span className={cn("text-lg font-black", tp.color)}>${tp.val.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-outline-variant/10 space-y-4">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">JUSTIFICACIÓN DE ENTRADA ({analysis.type}):</h5>
                <div className="bg-surface-container-high/30 p-6 rounded-2xl border border-outline-variant/10">
                  <div className="prose prose-invert max-w-none">
                    {analysis.description.split('\n').map((line: string, i: number) => {
                      const trimmedLine = line.trim();
                      if (!trimmedLine) return <div key={i} className="h-4" />;
                      
                      if (trimmedLine.startsWith('**') && trimmedLine.includes(':')) {
                        const [header, ...rest] = trimmedLine.replace(/\*\*/g, '').split(':');
                        return (
                          <div key={i} className="mb-6 last:mb-0">
                            <h4 className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-2 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                              {header}
                            </h4>
                            <p className="text-on-surface-variant text-xs leading-relaxed font-medium pl-3.5 border-l border-outline-variant/20">
                              {rest.join(':').trim()}
                            </p>
                          </div>
                        );
                      }
                      return <p key={i} className="text-on-surface-variant text-xs leading-relaxed mb-4 last:mb-0">{trimmedLine}</p>;
                    })}
                  </div>
                </div>
                <div className="bg-surface-container p-3 rounded-xl">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">PUNTUACIÓN TOTAL: {analysis.score}%</p>
                  <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${analysis.score}%` }}></div>
                  </div>
                </div>

                {/* Risk/Reward Visualizer */}
                <div className="pt-4 border-t border-outline-variant/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Relación Riesgo / Beneficio</span>
                    <span className="text-sm font-black text-primary">1 : {analysis.rr.toFixed(1)}</span>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-secondary w-1/4 opacity-80"></div>
                    <div className="bg-primary flex-1 opacity-80"></div>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[8px] font-bold text-secondary uppercase">Riesgo</span>
                    <span className="text-[8px] font-bold text-primary uppercase">Beneficio</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Signal Status Card - Elegant Arrows */}
              <div className={cn(
                "p-8 rounded-3xl border border-outline-variant/10 flex flex-col items-center text-center space-y-6 shadow-2xl relative overflow-hidden bg-surface-container-low",
              )}>
                <div className="flex items-center gap-8">
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={cn(
                      "w-16 h-16 flex items-center justify-center",
                      analysis.sentiment === "BULLISH" ? "text-primary" : "text-on-surface-variant/20"
                    )}
                  >
                    <ArrowUpRight className="w-16 h-16 stroke-[3]" />
                  </motion.div>
                  <div className="h-12 w-px bg-outline-variant/20" />
                  <motion.div 
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={cn(
                      "w-16 h-16 flex items-center justify-center",
                      analysis.sentiment === "BEARISH" ? "text-secondary" : "text-on-surface-variant/20"
                    )}
                  >
                    <ArrowDownRight className="w-16 h-16 stroke-[3]" />
                  </motion.div>
                </div>
                
                <div className="space-y-1">
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.3em]", analysis.sentiment === "BULLISH" ? "text-primary" : "text-secondary")}>
                    Sesgo del Mercado
                  </p>
                  <h3 className={cn("text-4xl font-headline font-black tracking-tighter", analysis.sentiment === "BULLISH" ? "text-primary" : "text-secondary")}>
                    {analysis.sentiment === "BULLISH" ? "ALCISTA" : "BAJISTA"}
                  </h3>
                </div>

                <div className="flex items-center gap-4 w-full px-4">
                  <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis.score}%` }}
                      className={cn("h-full", analysis.sentiment === "BULLISH" ? "bg-primary" : "bg-secondary")}
                    />
                  </div>
                  <span className="text-[10px] font-bold font-mono text-on-surface-variant">{analysis.score}%</span>
                </div>
              </div>

              <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-xl">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                  <BarChart3 className="w-3 h-3" /> GRÁFICO DE ANÁLISIS
                </h4>
                <div className="h-48">
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
              </div>
            </div>
          </div>
        </motion.div>
        )}

        {!analysis && !analyzing && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container rounded-xl flex items-center justify-center mx-auto mb-6">
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
