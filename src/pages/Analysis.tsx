import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Bell, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Globe,
  MessageSquare,
  Share2,
  Bookmark,
  ChevronRight,
  Filter,
  RefreshCw,
  Star,
  ChevronDown,
  Target,
  Shield,
  Clock,
  BarChart3,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMarketSentiment, analyzeMarket } from "@/services/geminiService";
import { fetchTickers, fetchTicker, CryptoData, fetchCryptoData, fetchEconomicEvents, fetchWhaleMovements } from "@/services/cryptoService";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const Analysis = () => {
  const [sentiment, setSentiment] = useState<string>("Cargando inteligencia de mercado...");
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());
  const [analysis, setAnalysis] = useState<string>("");
  const [tickers, setTickers] = useState<CryptoData[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [selectedMode, setSelectedMode] = useState<"Standard" | "Scalping" | "Swing">("Standard");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ticker, setTicker] = useState<CryptoData | null>(null);
  const [whaleMovements, setWhaleMovements] = useState<any[]>([]);
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [assets, aiSentiment, initialTicker, events, whales] = await Promise.all([
        fetchCryptoData(),
        getMarketSentiment(),
        fetchTicker(selectedSymbol),
        fetchEconomicEvents(),
        fetchWhaleMovements()
      ]);
      
      setAllAssets(assets);
      setSentiment(aiSentiment);
      setTicker(initialTicker);
      setEconomicEvents(events);
      setWhaleMovements(whales);
      
      const initialAnalysis = await analyzeMarket(selectedSymbol, initialTicker.price, initialTicker.priceChangePercent, selectedMode);
      setAnalysis(initialAnalysis);
    } catch (error) {
      console.error("Analysis initial load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(async () => {
      setRefreshing(true);
      try {
        const [aiSentiment, currentTicker, events, whales] = await Promise.all([
          getMarketSentiment(),
          fetchTicker(selectedSymbol),
          fetchEconomicEvents(),
          fetchWhaleMovements()
        ]);
        setSentiment(aiSentiment);
        setTicker(currentTicker);
        setEconomicEvents(events);
        setWhaleMovements(whales);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Auto-refresh error:", error);
      } finally {
        setRefreshing(false);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const currentTicker = await fetchTicker(selectedSymbol);
      setTicker(currentTicker);
      const result = await analyzeMarket(selectedSymbol, currentTicker.price, currentTicker.priceChangePercent, selectedMode);
      setAnalysis(result);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Analysis run error:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getChartData = (price: string) => {
    const basePrice = parseFloat(price);
    return Array.from({ length: 20 }).map((_, i) => ({
      name: i.toString(),
      price: basePrice * (1 + (Math.random() * 0.04 - 0.02))
    }));
  };

  const parseAnalysis = (text: string) => {
    if (!text) return null;
    const sections: Record<string, string> = {};
    const parts = text.split(/\*\*([^*]+)\*\*/);
    
    for (let i = 1; i < parts.length; i += 2) {
      const title = parts[i].trim().replace(':', '');
      const content = parts[i+1]?.trim().replace(/^[:\s-]+/, '') || "";
      sections[title] = content;
    }
    return sections;
  };

  const analysisSections = parseAnalysis(analysis);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-black uppercase tracking-widest text-on-surface-variant animate-pulse">Iniciando Red Neuronal...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      {/* Deep Analysis Tool - NOW AT TOP */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="space-y-1 w-full md:w-64">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Activo</label>
              <div className="relative">
                <select 
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-primary transition-all text-sm font-bold"
                >
                  {allAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name} (USDT)</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1 w-full md:w-32">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Temporalidad</label>
              <div className="relative">
                <select 
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-primary transition-all text-sm font-bold"
                >
                  {["1m", "5m", "15m", "1h", "4h", "1d"].map(tf => (
                    <option key={tf} value={tf}>{tf.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1 w-full md:w-40">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Estrategia</label>
              <div className="relative">
                <select 
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value as any)}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-primary transition-all text-sm font-bold"
                >
                  <option value="Standard">Estándar</option>
                  <option value="Scalping">Scalping</option>
                  <option value="Swing">Swing</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              </div>
            </div>
          </div>

          <button 
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className={cn(
              "w-full md:w-auto px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-2xl",
              analyzing ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed" : "bg-primary text-on-primary shadow-primary/20 hover:scale-105 active:scale-95"
            )}
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Ejecutar Análisis Profundo
              </>
            )}
          </button>
        </div>

        {/* Analysis Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Ticker & Chart */}
          <div className="space-y-6">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                    <img 
                      src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${selectedSymbol.replace("USDT", "").toLowerCase()}.png`} 
                      className="w-8 h-8" 
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-headline font-bold">{selectedSymbol.replace("USDT", "")}</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Binance Spot</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-headline font-bold">${ticker ? parseFloat(ticker.price).toLocaleString() : "---"}</p>
                  <p className={cn("text-sm font-bold", (ticker && parseFloat(ticker.priceChangePercent) >= 0) ? "text-primary" : "text-secondary")}>
                    {ticker && parseFloat(ticker.priceChangePercent) >= 0 ? "+" : ""}{ticker?.priceChangePercent}%
                  </p>
                </div>
              </div>

              <div className="h-48 w-full bg-surface-container-high/20 rounded-xl p-4 border border-outline-variant/10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData(ticker?.price || "0")}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ffa3" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00ffa3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '10px' }}
                      itemStyle={{ color: '#00ffa3' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#00ffa3" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container p-4 rounded-xl space-y-1">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Máximo 24h</p>
                  <p className="text-sm font-bold text-primary">${ticker ? parseFloat(ticker.highPrice).toLocaleString() : "---"}</p>
                </div>
                <div className="bg-surface-container p-4 rounded-xl space-y-1">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Mínimo 24h</p>
                  <p className="text-sm font-bold text-secondary">${ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "---"}</p>
                </div>
              </div>
            </div>

            {/* Quick Indicators */}
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> INDICADORES RECOMENDADOS
              </h4>
              <div className="space-y-3">
                {[
                  { label: "RSI (14)", val: (Math.random() * 40 + 30).toFixed(1), status: "NEUTRAL" },
                  { label: "MACD", val: "0.45", status: "ALCISTA" },
                  { label: "EMA 200", val: ticker ? (parseFloat(ticker.price) * 0.98).toFixed(2) : "---", status: "SOPORTE" },
                  { label: "VWAP", val: ticker ? (parseFloat(ticker.price) * 0.99).toFixed(2) : "---", status: "NEUTRAL" },
                ].map((ind) => (
                  <div key={ind.label} className="flex justify-between items-center p-3 bg-surface-container rounded-xl">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">{ind.label}</span>
                    <div className="text-right">
                      <p className="text-xs font-black text-on-surface">{ind.val}</p>
                      <p className="text-[8px] font-bold text-primary uppercase">{ind.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Detailed Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {analysisSections ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Strategy Banner with Arrows */}
                <div className="bg-surface-container-low border-2 border-outline-variant/10 p-8 rounded-2xl relative overflow-hidden flex flex-col items-center text-center">
                  <div className="mb-4">
                    {analysisSections["ESTRATEGIA"]?.toUpperCase().includes("ALCISTA") ? (
                      <div className="flex flex-col items-center gap-2">
                        <TrendingUp className="w-20 h-20 text-primary animate-bounce" />
                        <span className="text-4xl font-black text-primary uppercase tracking-tighter">ALCISTA</span>
                      </div>
                    ) : analysisSections["ESTRATEGIA"]?.toUpperCase().includes("BAJISTA") ? (
                      <div className="flex flex-col items-center gap-2">
                        <TrendingDown className="w-20 h-20 text-secondary animate-bounce" />
                        <span className="text-4xl font-black text-secondary uppercase tracking-tighter">BAJISTA</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Minus className="w-20 h-20 text-on-surface-variant" />
                        <span className="text-4xl font-black text-on-surface-variant uppercase tracking-tighter">NEUTRAL</span>
                      </div>
                    )}
                  </div>
                  <div className="max-w-xl">
                    <p className="text-sm text-on-surface-variant leading-relaxed italic">
                      {analysisSections["ESTRATEGIA"]}
                    </p>
                  </div>
                </div>

                {/* Levels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-3 h-3" /> NIVELES OPERATIVOS
                    </h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-surface-container rounded-xl border-l-4 border-primary">
                        <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Entrada Sugerida</p>
                        <p className="text-xl font-headline font-black text-on-surface">
                          {analysisSections["NIVELES OPERATIVOS"]?.match(/ENTRADA:\s*(\$?\d+\.?\d*)/i)?.[1] || "---"}
                        </p>
                      </div>
                      <div className="p-4 bg-surface-container rounded-xl border-l-4 border-secondary">
                        <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Stop Loss</p>
                        <p className="text-xl font-headline font-black text-secondary">
                          {analysisSections["NIVELES OPERATIVOS"]?.match(/STOP LOSS:\s*(\$?\d+\.?\d*)/i)?.[1] || "---"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-3 h-3" /> OBJETIVOS (TAKE PROFITS)
                    </h4>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center p-3 bg-surface-container rounded-xl border border-outline-variant/5">
                          <span className="text-[10px] font-bold text-on-surface-variant uppercase">TP {i}</span>
                          <span className="text-sm font-black text-primary">
                            {analysisSections["NIVELES OPERATIVOS"]?.match(new RegExp(`TAKE PROFIT ${i}:\\s*(\\$?\\d+\\.?\\d*)`, 'i'))?.[1] || "---"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Justification */}
                <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <Activity className="w-3 h-3" /> JUSTIFICACIÓN TÉCNICA EXHAUSTIVA
                    </h4>
                    <div className="space-y-6">
                      <div>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase mb-2 tracking-widest">Análisis de Estructura</p>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          {analysisSections["JUSTIFICACIÓN ALCISTA/BAJISTA"]}
                        </p>
                      </div>
                      <div className="pt-6 border-t border-outline-variant/5">
                        <p className="text-[10px] font-black text-on-surface-variant uppercase mb-2 tracking-widest">Lógica de Niveles</p>
                        <p className="text-sm text-on-surface-variant leading-relaxed">
                          {analysisSections["JUSTIFICACIÓN DE ENTRADA"]}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-8 border-t border-outline-variant/10">
                    <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                      <Flame className="w-5 h-5 text-primary animate-pulse" />
                      <div>
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest">Metáfora Técnica</p>
                        <p className="text-[10px] text-on-surface-variant italic leading-tight">
                          {analysisSections["METÁFORA TÉCNICA"]}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-on-surface-variant opacity-20" />
                </div>
                <div>
                  <h4 className="text-lg font-headline font-bold text-on-surface">Esperando Instrucciones</h4>
                  <p className="text-sm text-on-surface-variant max-w-xs mx-auto">Selecciona un activo y temporalidad para que la IA realice un análisis exhaustivo.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI Market Pulse - MOVED DOWN */}
      <section className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 relative overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around p-4 opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none">
          <TrendingUp className="w-6 h-6 text-primary" />
          <TrendingUp className="w-6 h-6 text-primary" />
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around p-4 opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none">
          <TrendingUp className="w-6 h-6 text-primary" />
          <TrendingUp className="w-6 h-6 text-primary" />
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-[0_20px_40px_rgba(0,255,163,0.2)]">
              <Brain className="w-12 h-12 text-on-primary-fixed" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-surface-container-highest p-1.5 rounded-full border border-outline-variant/20">
              <RefreshCw 
                className={cn("w-4 h-4 text-primary cursor-pointer", refreshing && "animate-spin")} 
                onClick={loadInitialData}
              />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-label uppercase tracking-widest text-primary-dim">Inteligencia de Mercado IA</span>
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-high px-3 py-1 rounded-full">
                <Activity className="w-3 h-3" />
                Actualizado: {lastUpdate}
              </div>
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">INFORME DE SENTIMIENTO GLOBAL</h2>
            <div className="p-6 bg-surface-container-high/30 rounded-xl border border-outline-variant/10">
              <p className="text-on-surface-variant leading-relaxed text-lg italic">
                "{sentiment}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Whale Movements & Economic Events - ADDED AT BOTTOM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6">
          <h3 className="font-headline text-xl font-bold uppercase tracking-wide flex items-center gap-2 text-primary">
            <Zap className="w-5 h-5" /> Movimientos de Ballenas
          </h3>
          <div className="space-y-4">
            {whaleMovements.map((whale, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-outline-variant/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                    <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} className="w-6 h-6" alt="" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{whale.symbol}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase">{whale.exchange} • {whale.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-black", whale.type === "COMPRA" ? "text-primary" : "text-secondary")}>{whale.type}</p>
                  <p className="text-xs font-bold">{whale.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6">
          <h3 className="font-headline text-xl font-bold uppercase tracking-wide flex items-center gap-2 text-primary">
            <Globe className="w-5 h-5" /> Eventos Económicos
          </h3>
          <div className="space-y-4">
            {economicEvents.map((event, i) => (
              <div key={i} className="p-4 bg-surface-container rounded-xl border border-outline-variant/5 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-on-surface">{event.event}</h4>
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded uppercase",
                    event.impact === "CRITICAL" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                  )}>
                    {event.impact}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">{event.description}</p>
                <div className="flex justify-between text-[8px] font-bold text-on-surface-variant uppercase">
                  <span>{event.date} • {event.time}</span>
                  <span className="text-primary">{event.effect}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Community Insights */}
      <section className="space-y-6">
        <h3 className="font-headline text-xl font-bold uppercase tracking-wide">Discusiones en Tendencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { tag: "#BTC", title: "¿Ha llegado el ciclo a su fin?", comments: 142, likes: 890, source: "https://twitter.com/search?q=%23BTC", author: "@CryptoWhale" },
            { tag: "#SOL", title: "Ruptura de Solana confirmada", comments: 56, likes: 320, source: "https://twitter.com/search?q=%23SOL", author: "@SolanaDaily" },
            { tag: "#ETH", title: "Análisis de entradas de ETF de Ethereum", comments: 89, likes: 540, source: "https://twitter.com/search?q=%23ETH", author: "@VitalikButerin" },
          ].map((post, i) => (
            <a 
              key={i} 
              href={post.source}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-container-high p-6 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-primary-dim uppercase tracking-widest">{post.tag}</span>
                  <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">{post.author}</span>
                </div>
                <h4 className="font-bold text-sm mb-4 group-hover:text-primary transition-colors leading-tight">{post.title}</h4>
              </div>
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-label uppercase tracking-widest pt-4 border-t border-outline-variant/5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {post.likes}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </div>
            </a>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default Analysis;
