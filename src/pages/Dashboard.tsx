import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
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
  Brain,
  Star,
  Target,
  Users,
  Waves,
  ArrowRightLeft,
  Newspaper,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { 
  fetchTickers, 
  CryptoData, 
  fetchWhaleMovements, 
  fetchTopTraders, 
  fetchLargeTransactions, 
  fetchEconomicEvents 
} from "@/services/cryptoService";
import { getMarketSentiment } from "@/services/geminiService";
import { useWatchlist } from "@/hooks/useWatchlist";

const Dashboard = () => {
  const [tickers, setTickers] = useState<CryptoData[]>([]);
  const [sentiment, setSentiment] = useState<string>("Cargando inteligencia de mercado...");
  const [loading, setLoading] = useState(true);
  const { watchlist, toggleWatchlist } = useWatchlist();
  const [filter, setFilter] = useState<"all" | "watchlist" | "bullish" | "bearish" | "neutral">("all");
  
  const [whaleMovements, setWhaleMovements] = useState<any[]>([]);
  const [topTraders, setTopTraders] = useState<any[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<any[]>([]);
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        let symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT"];
        
        if (filter === "watchlist" && watchlist.length > 0) {
          symbols = watchlist;
        }
        
        const data = await fetchTickers(symbols);
        
        let filteredData = data;
        if (filter === "bullish") {
          filteredData = data.filter(t => parseFloat(t.priceChangePercent) > 1);
        } else if (filter === "bearish") {
          filteredData = data.filter(t => parseFloat(t.priceChangePercent) < -1);
        } else if (filter === "neutral") {
          filteredData = data.filter(t => Math.abs(parseFloat(t.priceChangePercent)) <= 1);
        }
        
        setTickers(filteredData);
        const aiSentiment = await getMarketSentiment();
        setSentiment(aiSentiment);

        const [whales, traders, txs, events] = await Promise.all([
          fetchWhaleMovements(),
          fetchTopTraders(),
          fetchLargeTransactions(),
          fetchEconomicEvents()
        ]);
        setWhaleMovements(whales);
        setTopTraders(traders);
        setLargeTransactions(txs);
        setEconomicEvents(events);
      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filter, watchlist]);

  const signals = [
    { id: "bullish", label: "SEÑALES ALCISTAS", count: 14, color: "text-primary" },
    { id: "bearish", label: "SEÑALES BAJISTAS", count: "03", color: "text-secondary" },
    { id: "neutral", label: "NEUTRAL / LATERAL", count: "08", color: "text-tertiary" },
  ];

  const velocityMoves = [
    { id: "01", pair: "AVAX / USDT", desc: "Volatilidad incrementada detectada", type: "COMPRA RÁPIDA", time: "hace 2m", color: "text-primary" },
    { id: "02", pair: "PEPE / USDT", desc: "Alerta de movimiento de ballenas", type: "SALIR AHORA", time: "hace 5m", color: "text-secondary" },
    { id: "03", pair: "LINK / USDT", desc: "Condición de sobreventa RSI", type: "COMPRA FUERTE", time: "hace 12m", color: "text-primary" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      {/* Hero: Market Pulse */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticker Card */}
          <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-xl border-l-4 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold font-label uppercase tracking-widest text-primary-dim">Sentimiento del Mercado Global</span>
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                </div>
                <h2 className="font-headline text-[3.5rem] font-bold tracking-tight leading-none mb-4"><span className="text-primary">CODICIA</span> EXTREMA</h2>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest">Índice de Miedo y Codicia</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-headline font-bold">84</span>
                    <span className="text-primary-dim font-bold">+12% vs ayer</span>
                  </div>
                </div>
                <Link 
                  to="/market"
                  className="bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed px-8 py-4 rounded-full font-bold uppercase tracking-wider shadow-[0_10px_20px_rgba(0,255,163,0.2)] active:scale-95 transition-transform text-center"
                >
                  Ver Mapa de Calor
                </Link>
              </div>
            </div>
          </div>

          {/* Active Signal Summary */}
          <div className="bg-surface-container-high p-6 rounded-xl space-y-6 border border-outline-variant/10">
            <h3 className="font-headline text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-tertiary" />
              SEÑALES ACTIVAS
            </h3>
            <div className="space-y-4">
              {signals.map((s) => (
                <button 
                  key={s.label} 
                  onClick={() => setFilter(s.id as any)}
                  className={cn(
                    "w-full flex justify-between items-center p-3 rounded-lg transition-all active:scale-95",
                    filter === s.id ? "bg-primary/10 border border-primary/30" : "bg-surface-container hover:bg-surface-container-highest"
                  )}
                >
                  <span className="text-sm font-label uppercase tracking-wider text-on-surface-variant">{s.label}</span>
                  <span className={cn("font-headline font-bold text-xl", s.color)}>{s.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Kinetic Matrix */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-2xl font-bold tracking-tight uppercase">MATRIZ KINETIC</h2>
          <div className="flex bg-surface-container-highest rounded-full p-1">
            <button 
              onClick={() => setFilter("all")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                filter === "all" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Todos los Activos
            </button>
            <button 
              onClick={() => setFilter("watchlist")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                filter === "watchlist" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              Lista de Seguimiento
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickers.map((ticker) => {
            const isBullish = parseFloat(ticker.priceChangePercent) > 0;
            return (
              <div 
                key={ticker.symbol} 
                className={cn(
                  "bg-surface-container-low rounded-xl overflow-hidden group border-2 transition-all duration-500",
                  isBullish ? "border-primary/10 hover:border-primary/40 shadow-lg shadow-primary/5" : "border-secondary/10 hover:border-secondary/40 shadow-lg shadow-secondary/5"
                )}
              >
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                        isBullish ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                      )}>
                        {isBullish ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                      </div>
                      <div>
                        <h4 className="font-headline font-bold text-lg">{ticker.symbol.replace("USDT", " / USDT")}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                            isBullish ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                          )}>
                            {isBullish ? "Bullish" : "Bearish"}
                          </span>
                          <Star 
                            className={cn(
                              "w-3 h-3 transition-colors cursor-pointer",
                              watchlist.includes(ticker.symbol) ? "text-primary fill-primary" : "text-on-surface-variant hover:text-primary"
                            )} 
                            onClick={() => toggleWatchlist(ticker.symbol)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-headline font-bold text-lg">${parseFloat(ticker.price).toLocaleString()}</p>
                      <p className={cn("text-xs font-bold", isBullish ? "text-primary" : "text-secondary")}>
                        {isBullish ? "+" : ""}{ticker.priceChangePercent}%
                      </p>
                    </div>
                  </div>
                  {/* Timeframe Matrix */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "1M", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
                      { label: "5M", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
                      { label: "15M", icon: Minus, color: "text-tertiary", bg: "bg-surface-container-highest" },
                      { label: "1H", icon: TrendingDown, color: "text-secondary", bg: "bg-secondary/10" },
                    ].map((tf) => (
                      <div key={tf.label} className={cn("flex flex-col items-center p-2 rounded-lg border border-outline-variant/10", tf.bg)}>
                        <span className="text-[10px] font-label text-on-surface-variant mb-1">{tf.label}</span>
                        <tf.icon className={cn("w-4 h-4", tf.color)} />
                      </div>
                    ))}
                  </div>
                  <Link 
                    to={`/terminal?symbol=${ticker.symbol}`}
                    className={cn(
                      "block w-full py-3 rounded-xl border font-bold uppercase tracking-widest text-xs text-center transition-all duration-300",
                      isBullish ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-on-primary" : "bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary hover:text-on-secondary"
                    )}
                  >
                    ANALIZAR AHORA
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dynamic Trends & Volume */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ... existing velocity moves ... */}
      </section>

      {/* Copy Trading & News Section (Added for visibility) */}
      <section className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Copy Trading Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#0a0c10] border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-4 border-b border-orange-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
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
                {/* Whale Movements */}
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Waves className="w-3 h-3" /> MOVIMIENTOS DE BALLENAS
                  </h4>
                  <div className="space-y-3">
                    {whaleMovements.slice(0, 4).map((whale, i) => (
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
                            <p className="text-[8px] text-on-surface-variant uppercase">{whale.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-[10px] font-black", whale.type === "BUY" ? "text-primary" : "text-secondary")}>{whale.type}</p>
                          <p className="text-[10px] font-bold text-on-surface">{whale.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Traders */}
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Users className="w-3 h-3" /> TOP TRADERS
                  </h4>
                  <div className="space-y-3">
                    {topTraders.slice(0, 4).map((trader, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors">
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
                          <p className={cn("text-[10px] font-black", trader.trade.includes("LONG") ? "text-primary" : "text-secondary")}>{trader.trade}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border border-orange-500/30 flex items-center justify-center text-[8px] font-bold text-orange-500">
                          {trader.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Large Transactions */}
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <ArrowRightLeft className="w-3 h-3" /> GRANDES TX
                  </h4>
                  <div className="space-y-3">
                    {largeTransactions.slice(0, 4).map((tx, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors">
                        <div>
                          <p className="text-[10px] font-bold text-on-surface">{tx.symbol}</p>
                          <p className="text-[8px] text-on-surface-variant font-mono">{tx.address}</p>
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
            </div>
          </div>

          {/* Impact News Panel */}
          <div className="bg-[#0a0c10] border border-outline-variant/10 rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
              <Newspaper className="w-5 h-5 text-on-surface-variant" />
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
                NOTICIAS
              </h3>
            </div>

            <div className="space-y-6">
              {economicEvents.slice(0, 3).map((news, i) => (
                <div key={i} className="space-y-2 group cursor-pointer">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors">
                      {news.event}
                    </h4>
                    <span className="text-[10px] text-on-surface-variant font-mono">
                      {news.time}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase",
                      news.impact === "CRITICAL" ? "text-secondary" : "text-orange-500"
                    )}>
                      {news.impact === "CRITICAL" ? "Alto" : "Medio"}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                      <span className="text-[10px] font-bold text-on-surface-variant ml-1">{news.probability}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Floating Action Button: Insights */}
      <button 
        onClick={() => setFilter(filter === "all" ? "watchlist" : "all")}
        className="fixed right-6 bottom-24 w-14 h-14 bg-gradient-to-br from-primary to-primary-dim rounded-2xl flex items-center justify-center shadow-2xl z-40 active:scale-90 transition-transform"
      >
        <Brain className="w-8 h-8 text-on-primary-fixed" />
      </button>
    </motion.div>
  );
};

export default Dashboard;
