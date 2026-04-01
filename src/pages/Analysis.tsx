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
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMarketSentiment, analyzeMarket } from "@/services/geminiService";
import { fetchTickers, CryptoData } from "@/services/cryptoService";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

const Analysis = () => {
  const [sentiment, setSentiment] = useState<string>("Cargando inteligencia de mercado...");
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [tickers, setTickers] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<Record<string, "Standard" | "Scalping" | "Swing">>({});

  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];

  const loadData = async () => {
    setRefreshing(true);
    try {
      const data = await fetchTickers(symbols);
      setTickers(data);
      const aiSentiment = await getMarketSentiment();
      setSentiment(aiSentiment);
      setLastUpdate(new Date().toLocaleTimeString());
      
      // Initial analysis for BTC if not already there
      if (!analysis["BTCUSDT"]) {
        const btcAnalysis = await analyzeMarket("BTCUSDT", data[0].price, data[0].priceChangePercent);
        setAnalysis({ "BTCUSDT": btcAnalysis });
        setAnalysisMode({ "BTCUSDT": "Standard" });
      }
    } catch (error) {
      console.error("Analysis data load error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAnalyze = async (symbol: string, mode: "Standard" | "Scalping" | "Swing" = "Standard") => {
    const ticker = tickers.find(t => t.symbol === symbol);
    if (!ticker) return;
    
    setAnalysisMode(prev => ({ ...prev, [symbol]: mode }));
    setAnalysis(prev => ({ ...prev, [symbol]: `Generando análisis ${mode === "Standard" ? "profundo" : mode.toLowerCase()}...` }));
    const result = await analyzeMarket(symbol, ticker.price, ticker.priceChangePercent, mode);
    setAnalysis(prev => ({ ...prev, [symbol]: result }));
  };

  const getChartData = (price: string) => {
    const basePrice = parseFloat(price);
    return [
      { name: '1M', price: basePrice * (1 + (Math.random() * 0.01 - 0.005)) },
      { name: '5M', price: basePrice * (1 + (Math.random() * 0.01 - 0.005)) },
      { name: '15M', price: basePrice * (1 + (Math.random() * 0.01 - 0.005)) },
      { name: '1H', price: basePrice * (1 + (Math.random() * 0.01 - 0.005)) },
      { name: '4H', price: basePrice * (1 + (Math.random() * 0.01 - 0.005)) },
      { name: '1D', price: basePrice * (1 + (Math.random() * 0.01 - 0.005)) },
    ];
  };

  const trendingDiscussions = [
    { tag: "#BTC", title: "¿Ha llegado el ciclo a su fin?", comments: 142, likes: 890, source: "https://twitter.com/search?q=%23BTC", author: "@CryptoWhale" },
    { tag: "#SOL", title: "Ruptura de Solana confirmada", comments: 56, likes: 320, source: "https://twitter.com/search?q=%23SOL", author: "@SolanaDaily" },
    { tag: "#ETH", title: "Análisis de entradas de ETF de Ethereum", comments: 89, likes: 540, source: "https://twitter.com/search?q=%23ETH", author: "@VitalikButerin" },
    { tag: "#BNB", title: "Nuevos proyectos en Launchpool", comments: 45, likes: 210, source: "https://twitter.com/search?q=%23BNB", author: "@Binance" },
    { tag: "#XRP", title: "Actualización legal de Ripple", comments: 230, likes: 1200, source: "https://twitter.com/search?q=%23XRP", author: "@RippleNews" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      {/* AI Market Pulse */}
      <section className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 relative overflow-hidden group">
        {/* Discrete Arrows in the laterals */}
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
                onClick={loadData}
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
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full border border-outline-variant/20">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Fuente: Google Search Grounding</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full border border-outline-variant/20">
                <Zap className="w-4 h-4 text-tertiary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Modelo: Gemini 3 Flash</span>
              </div>
              <button 
                onClick={loadData}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full border border-primary/20 hover:bg-primary/20 transition-all text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3 h-3", refreshing && "animate-spin")} />
                Actualizar Sentimiento
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Analysis Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold uppercase tracking-wide">Análisis Profundo de Activos</h3>
          <button 
            onClick={loadData}
            className="flex items-center gap-2 text-primary hover:text-primary-dim transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
            <span className="text-xs font-bold uppercase tracking-widest">Actualizar Todo</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {tickers.map((ticker) => (
            <div key={ticker.symbol} className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 flex flex-col hover:border-primary/20 transition-all">
              <div className="p-6 bg-surface-container-high/50 flex justify-between items-center border-b border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold">{ticker.symbol.replace("USDT", "")}</h4>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase">Binance Spot</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-headline font-bold">${parseFloat(ticker.price).toLocaleString()}</p>
                  <p className={cn("text-xs font-bold", parseFloat(ticker.priceChangePercent) >= 0 ? "text-primary" : "text-secondary")}>
                    {parseFloat(ticker.priceChangePercent) > 0 ? "+" : ""}{ticker.priceChangePercent}%
                  </p>
                </div>
              </div>
              <div className="p-8 flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary-dim">
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Estado de Ruptura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest italic opacity-60">Analizando ingredientes activos...</span>
                    <div className="wyckoff-label">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-primary/10",
                        parseFloat(ticker.priceChangePercent) > 2 ? "text-primary animate-pulse" : "text-on-surface-variant"
                      )}>
                        {parseFloat(ticker.priceChangePercent) > 2 ? "Ruptura Confirmada" : "En Consolidación"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <div className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-wrap bg-surface-container-high/20 p-6 rounded-xl border border-outline-variant/5">
                    {analysis[ticker.symbol] ? (
                      analysis[ticker.symbol].split('\n').map((line, i) => {
                        if (line.includes(':')) {
                          const [header, ...rest] = line.split(':');
                          return (
                            <p key={i} className="mb-2">
                              <span className="text-primary font-black uppercase tracking-widest text-[10px] block mb-1">{header}:</span>
                              {rest.join(':')}
                            </p>
                          );
                        }
                        return <p key={i} className="mb-2">{line}</p>;
                      })
                    ) : (
                      "Aún no se ha generado ningún análisis. Haz clic en analizar para comenzar."
                    )}
                  </div>
                </div>

                {/* Strategy Chart */}
                <div className="h-48 w-full bg-surface-container-high/20 rounded-xl p-4 border border-outline-variant/10">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">Análisis de Temporalidades</p>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getChartData(ticker.price)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="name" stroke="#666" fontSize={10} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '10px' }}
                        itemStyle={{ color: '#00ffa3' }}
                      />
                      <Line type="monotone" dataKey="price" stroke="#00ffa3" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex flex-wrap items-center justify-between pt-4 border-t border-outline-variant/10 gap-4">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAnalyze(ticker.symbol, "Scalping")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95",
                        analysisMode[ticker.symbol] === "Scalping" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10"
                      )}
                    >
                      Scalping
                    </button>
                    <button 
                      onClick={() => handleAnalyze(ticker.symbol, "Swing")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95",
                        analysisMode[ticker.symbol] === "Swing" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10"
                      )}
                    >
                      Swing
                    </button>
                    <button 
                      onClick={() => handleAnalyze(ticker.symbol, "Standard")}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all active:scale-95",
                        analysisMode[ticker.symbol] === "Standard" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:bg-primary/10"
                      )}
                    >
                      Estándar
                    </button>
                  </div>
                  <button 
                    onClick={() => handleAnalyze(ticker.symbol, "Standard")}
                    className="px-6 py-2 bg-primary text-on-primary rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Brain className="w-3 h-3" />
                    Análisis Profundo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Insights */}
      <section className="space-y-6">
        <h3 className="font-headline text-xl font-bold uppercase tracking-wide">Discusiones en Tendencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trendingDiscussions.map((post, i) => (
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
