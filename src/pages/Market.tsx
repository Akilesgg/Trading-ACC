import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { Search, TrendingUp, TrendingDown, Filter, LayoutGrid, List, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchCryptoData } from "@/services/cryptoService";

const MarketPage = () => {
  const [marketData, setMarketData] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchCryptoData();
        setMarketData(data);
      } catch (error) {
        console.error("Error loading market data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = marketData.filter(coin => 
    coin.name.toLowerCase().includes(search.toLowerCase()) || 
    coin.symbol.toLowerCase().includes(search.toLowerCase())
  );

  const [refreshing, setRefreshing] = useState(false);

  const marketSummary = useMemo(() => {
    const avgChange = marketData.reduce((acc, coin) => acc + coin.price_change_percentage_24h, 0) / (marketData.length || 1);
    const bullishCount = marketData.filter(c => c.price_change_percentage_24h > 0).length;
    const dominance = bullishCount / (marketData.length || 1);
    
    return {
      trend: avgChange > 1 ? "BULLISH" : avgChange < -1 ? "BEARISH" : "NEUTRAL",
      avgChange,
      dominance: (dominance * 100).toFixed(1),
      conclusion: avgChange > 1 
        ? "Mercado dominado por presión compradora. Alta probabilidad de continuidad alcista en altcoins." 
        : avgChange < -1 
          ? "Mercado dominado por presión bajista en futuros. Alta probabilidad de continuidad bajista a corto plazo." 
          : "Mercado en fase de consolidación lateral. Se recomienda esperar confirmación de ruptura."
    };
  }, [marketData]);

  const handleRefreshMap = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-24 pb-32 px-8 max-w-[1600px] mx-auto space-y-10"
    >
      {/* Market Summary & Spot vs Futures */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 trading-card p-10 flex flex-col md:flex-row items-center gap-10 bg-primary/5 border-primary/20">
          <div className="w-32 h-32 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10 flex-shrink-0">
            <TrendingUp className={cn("w-16 h-16", marketSummary.trend === "BEARISH" ? "text-secondary rotate-180" : "text-primary")} />
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-4">
              <span className={cn(
                "px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
                marketSummary.trend === "BULLISH" ? "bg-primary/20 text-primary shadow-primary/10" : 
                marketSummary.trend === "BEARISH" ? "bg-secondary/20 text-secondary shadow-secondary/10" : "bg-on-surface/10 text-on-surface"
              )}>
                TENDENCIA: {marketSummary.trend}
              </span>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Dominancia Alcista: {marketSummary.dominance}%</span>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter text-on-surface leading-tight">
              {marketSummary.conclusion}
            </h2>
            <div className="flex items-center gap-6 pt-4 border-t border-outline-variant/5">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Cambio Promedio</span>
                <span className={cn("text-lg font-black", marketSummary.avgChange > 0 ? "text-primary" : "text-secondary")}>
                  {marketSummary.avgChange > 0 ? "+" : ""}{marketSummary.avgChange.toFixed(2)}%
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Flujo de Dinero</span>
                <span className="text-lg font-black text-on-surface">INSTITUCIONAL</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 trading-card p-8 space-y-6">
          <h3 className="section-title flex items-center gap-2 mb-0">
            <Activity className="w-4 h-4 text-primary" /> SPOT VS FUTURES
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Funding Rate</span>
                <span className="text-[10px] font-black text-primary">0.0100%</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "65%" }}></div>
              </div>
            </div>
            <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Open Interest</span>
                <span className="text-[10px] font-black text-on-surface">$12.4B</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "45%" }}></div>
              </div>
            </div>
            <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Long/Short Ratio</span>
                <span className="text-[10px] font-black text-secondary">0.85</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden flex">
                <div className="h-full bg-primary" style={{ width: "45%" }}></div>
                <div className="h-full bg-secondary" style={{ width: "55%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 trading-card p-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-on-surface mb-2">Mercados Spot</h1>
          <p className="text-primary font-black text-[11px] uppercase tracking-[0.3em] opacity-70">Explora activos en tiempo real con inteligencia algorítmica</p>
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="BUSCAR ACTIVO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant/10 rounded-2xl pl-12 pr-6 py-4 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all shadow-inner placeholder:text-on-surface-variant/30"
            />
          </div>
          <button className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 hover:border-primary/30 text-on-surface-variant hover:text-primary transition-all shadow-lg">
            <Filter className="w-6 h-6" />
          </button>
          <div className="flex bg-surface-container-high rounded-2xl p-1.5 border border-outline-variant/10 shadow-inner">
            <button 
              onClick={() => setView("list")}
              className={cn("p-3 rounded-xl transition-all", view === "list" ? "bg-background text-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface")}
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView("grid")}
              className={cn("p-3 rounded-xl transition-all", view === "grid" ? "bg-background text-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center h-96 gap-6">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_40px_rgba(0,255,163,0.2)]"></div>
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-on-surface-variant animate-pulse">Sincronizando Datos de Mercado...</p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-8",
          view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"
        )}>
          {filteredData.map((coin) => (
            <motion.div
              layout
              key={coin.id}
              whileHover={{ y: -10, scale: 1.02 }}
              className={cn(
                "trading-card group/card relative overflow-hidden",
                view === "list" ? "flex items-center justify-between p-6 px-10" : "p-8 flex flex-col gap-6"
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
              
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center p-3 border border-outline-variant/10 group-hover/card:scale-110 transition-transform shadow-inner">
                  <img src={coin.image} alt={coin.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <p className="text-lg font-black uppercase tracking-tighter text-on-surface mb-1">{coin.name}</p>
                  <p className="text-[10px] text-on-surface-variant font-black uppercase tracking-widest opacity-50">{coin.symbol}</p>
                </div>
              </div>

              {view === "list" && (
                <div className="hidden lg:block flex-1 mx-20 relative z-10">
                  <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={cn("h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,255,163,0.5)]", coin.price_change_percentage_24h > 0 ? "bg-primary" : "bg-secondary")}
                      style={{ width: `${Math.min(Math.abs(coin.price_change_percentage_24h) * 5, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className={cn("relative z-10", view === "list" ? "text-right flex items-center gap-12" : "flex justify-between items-end")}>
                {view === "grid" && (
                  <div className="flex flex-col items-start">
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant mb-2 opacity-50">Market Cap</p>
                    <p className="text-sm font-black text-on-surface tracking-tighter">${(coin.market_cap / 1e9).toFixed(2)}B</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-2xl font-black text-on-surface tracking-tighter mb-2">${coin.current_price.toLocaleString()}</p>
                  <div className={cn(
                    "flex items-center justify-end gap-2 text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border shadow-lg",
                    coin.price_change_percentage_24h > 0 ? "text-primary bg-primary/10 border-primary/20" : "text-secondary bg-secondary/10 border-secondary/20"
                  )}>
                    {coin.price_change_percentage_24h > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {coin.price_change_percentage_24h.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className={cn("flex gap-3 relative z-10", view === "list" ? "ml-10" : "mt-2")}>
                <button className="flex-1 bg-surface-container-high hover:bg-primary hover:text-on-primary p-4 rounded-2xl border border-outline-variant/10 transition-all group/btn shadow-lg">
                  <ArrowUpRight className="w-5 h-5 mx-auto group-hover/btn:scale-125 transition-transform" />
                </button>
                <button className="flex-1 bg-surface-container-high hover:bg-secondary hover:text-on-primary p-4 rounded-2xl border border-outline-variant/10 transition-all group/btn shadow-lg">
                  <ArrowDownRight className="w-5 h-5 mx-auto group-hover/btn:scale-125 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Heatmap Section */}
      <div className="trading-card p-10 space-y-10 rounded-[3rem] shadow-[0_0_100px_rgba(0,255,163,0.05)]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-lg">
              <LayoutGrid className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-on-surface">Mapa de Calor del Mercado</h2>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Visualización de dominancia y volatilidad</p>
            </div>
          </div>
          <button 
            onClick={handleRefreshMap}
            disabled={refreshing}
            className={cn(
              "btn-primary px-10 py-4 text-[11px]",
              refreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            {refreshing ? (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                ACTUALIZANDO...
              </div>
            ) : "Actualizar Mapa"}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 h-[500px]">
          {/* Mock Heatmap Blocks with enhanced styling */}
          <motion.div whileHover={{ scale: 1.05 }} className="bg-primary/80 rounded-3xl flex flex-col items-center justify-center text-on-primary p-6 border border-primary/20 shadow-2xl shadow-primary/20 cursor-pointer group">
            <span className="text-3xl font-black tracking-tighter group-hover:scale-110 transition-transform">BTC</span>
            <span className="text-[11px] font-black uppercase tracking-widest mt-2 opacity-80">+2.4%</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-primary/60 rounded-3xl flex flex-col items-center justify-center text-on-primary p-6 border border-primary/20 shadow-2xl shadow-primary/10 cursor-pointer group">
            <span className="text-3xl font-black tracking-tighter group-hover:scale-110 transition-transform">ETH</span>
            <span className="text-[11px] font-black uppercase tracking-widest mt-2 opacity-80">+1.8%</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-secondary/70 rounded-3xl flex flex-col items-center justify-center text-on-primary p-6 border border-secondary/20 shadow-2xl shadow-secondary/20 cursor-pointer group">
            <span className="text-3xl font-black tracking-tighter group-hover:scale-110 transition-transform">SOL</span>
            <span className="text-[11px] font-black uppercase tracking-widest mt-2 opacity-80">-3.2%</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-primary/40 rounded-3xl flex flex-col items-center justify-center text-on-primary p-6 border border-primary/20 cursor-pointer group">
            <span className="text-3xl font-black tracking-tighter group-hover:scale-110 transition-transform">BNB</span>
            <span className="text-[11px] font-black uppercase tracking-widest mt-2 opacity-80">+0.5%</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-secondary/40 rounded-3xl flex flex-col items-center justify-center text-on-primary p-6 border border-secondary/20 col-span-2 cursor-pointer group">
            <span className="text-4xl font-black tracking-tighter group-hover:scale-110 transition-transform">XRP</span>
            <span className="text-[11px] font-black uppercase tracking-widest mt-2 opacity-80">-0.8%</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-primary/20 rounded-3xl flex flex-col items-center justify-center text-on-surface p-6 border border-primary/20 col-span-2 row-span-2 cursor-pointer group">
            <span className="text-5xl font-black tracking-tighter group-hover:scale-110 transition-transform">ADA</span>
            <span className="text-[11px] font-black uppercase tracking-widest mt-2 opacity-50">+0.1%</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-secondary/90 rounded-3xl flex flex-col items-center justify-center text-on-primary p-6 border border-secondary/20 shadow-2xl shadow-secondary/30 col-span-2 cursor-pointer group">
            <span className="text-4xl font-black tracking-tighter group-hover:scale-110 transition-transform">DOGE</span>
            <span className="text-[11px] font-black uppercase tracking-widest mt-2 opacity-80">-5.4%</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-primary/90 rounded-3xl flex flex-col items-center justify-center text-on-primary p-6 border border-primary/20 shadow-2xl shadow-primary/30 col-span-2 cursor-pointer group">
            <span className="text-4xl font-black tracking-tighter group-hover:scale-110 transition-transform">AVAX</span>
            <span className="text-[11px] font-black uppercase tracking-widest mt-2 opacity-80">+4.2%</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketPage;
