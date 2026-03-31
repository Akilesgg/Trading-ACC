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
  Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { fetchTickers, CryptoData } from "@/services/cryptoService";
import { getMarketSentiment } from "@/services/geminiService";
import { useWatchlist } from "@/hooks/useWatchlist";

const Dashboard = () => {
  const [tickers, setTickers] = useState<CryptoData[]>([]);
  const [sentiment, setSentiment] = useState<string>("Cargando inteligencia de mercado...");
  const [loading, setLoading] = useState(true);
  const { watchlist, toggleWatchlist } = useWatchlist();
  const [filter, setFilter] = useState<"all" | "watchlist">("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        const symbols = filter === "watchlist" && watchlist.length > 0 
          ? watchlist 
          : ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
        const data = await fetchTickers(symbols);
        setTickers(data);
        const aiSentiment = await getMarketSentiment();
        setSentiment(aiSentiment);
      } catch (error) {
        console.error("Dashboard data load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filter, watchlist]);

  const signals = [
    { label: "SEÑALES ALCISTAS", count: 14, color: "text-primary" },
    { label: "SEÑALES BAJISTAS", count: "03", color: "text-secondary" },
    { label: "NEUTRAL / LATERAL", count: "08", color: "text-tertiary" },
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
          <Link to="/dashboard" className="bg-surface-container-high p-6 rounded-xl space-y-6 hover:bg-surface-container-highest transition-colors group">
            <h3 className="font-headline text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-tertiary group-hover:scale-110 transition-transform" />
              SEÑALES ACTIVAS
            </h3>
            <div className="space-y-4">
              {signals.map((s) => (
                <div key={s.label} className="flex justify-between items-center p-3 bg-surface-container rounded-lg">
                  <span className="text-sm font-label uppercase tracking-wider text-on-surface-variant">{s.label}</span>
                  <span className={cn("font-headline font-bold text-xl", s.color)}>{s.count}</span>
                </div>
              ))}
            </div>
          </Link>
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
          {tickers.map((ticker) => (
            <div key={ticker.symbol} className="bg-surface-container-low rounded-xl overflow-hidden group border border-outline-variant/10">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center">
                      <Zap className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold text-lg">{ticker.symbol.replace("USDT", " / USDT")}</h4>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-on-surface-variant font-label uppercase">Activo Cripto</p>
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
                    <p className={cn("text-xs font-bold", parseFloat(ticker.priceChangePercent) >= 0 ? "text-primary" : "text-secondary")}>
                      {parseFloat(ticker.priceChangePercent) > 0 ? "+" : ""}{ticker.priceChangePercent}%
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
                  to={`/signal/${ticker.symbol}`}
                  className="block w-full py-3 rounded-xl bg-surface-container-high border border-outline-variant/20 font-bold uppercase tracking-widest text-xs text-center group-hover:bg-primary group-hover:text-on-primary transition-all duration-300"
                >
                  EJECUTAR SEÑAL
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Trends & Volume */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <h3 className="font-headline text-xl font-bold uppercase tracking-wide">Movimientos de Alta Velocidad</h3>
          <div className="space-y-4">
            {velocityMoves.map((move) => (
              <div key={move.id} className="flex items-center justify-between p-4 bg-surface-container rounded-xl border-l-2 border-primary">
                <div className="flex items-center gap-4">
                  <span className="text-on-surface-variant font-label text-xs">{move.id}</span>
                  <div>
                    <h5 className="font-bold text-sm">{move.pair}</h5>
                    <p className="text-xs text-on-surface-variant font-label">{move.desc}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("font-bold text-sm", move.color)}>{move.type}</p>
                  <p className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">{move.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-high rounded-xl p-8 relative overflow-hidden group">
          <div className="relative z-10 space-y-6">
            <h3 className="font-headline text-xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              INFORMACIÓN DE IA
            </h3>
            <p className="text-on-surface-variant leading-relaxed italic">
              "{sentiment}"
            </p>
            <div className="flex gap-4">
              <div className="bg-surface-container rounded-lg p-3 flex-1 text-center">
                <p className="text-[10px] font-label uppercase text-on-surface-variant mb-1">Deslizamiento</p>
                <p className="font-bold text-primary">0.01%</p>
              </div>
              <div className="bg-surface-container rounded-lg p-3 flex-1 text-center">
                <p className="text-[10px] font-label uppercase text-on-surface-variant mb-1">Ejecución</p>
                <p className="font-bold text-tertiary">14ms</p>
              </div>
            </div>
            <button 
              onClick={() => alert("¡Próximamente! La versión PRO estará disponible pronto.")}
              className="w-full py-4 bg-inverse-surface text-inverse-on-surface rounded-full font-extrabold uppercase tracking-widest text-sm active:scale-95 transition-all"
            >
              Mejorar a Pro
            </button>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 border-8 border-primary/10 rounded-full opacity-20 transition-transform duration-700 group-hover:scale-150"></div>
          <div className="absolute -top-10 -left-10 w-24 h-24 bg-primary/10 blur-2xl rounded-full"></div>
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
