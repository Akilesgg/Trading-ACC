import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, TrendingUp, TrendingDown, Filter, LayoutGrid, List, ArrowUpRight, ArrowDownRight } from "lucide-react";
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

  const handleRefreshMap = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tighter uppercase">Mercados</h1>
          <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest mt-1">Explora todos los activos disponibles</p>
        </div>
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input 
              type="text" 
              placeholder="BUSCAR ACTIVO..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-container-high border-none rounded-xl pl-10 pr-4 py-3 text-xs font-bold uppercase tracking-widest focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          </div>
          <button className="p-3 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-all">
            <Filter className="w-5 h-5 text-on-surface-variant" />
          </button>
          <div className="flex bg-surface-container-high rounded-xl p-1">
            <button 
              onClick={() => setView("list")}
              className={cn("p-2 rounded-lg transition-all", view === "list" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface")}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setView("grid")}
              className={cn("p-2 rounded-lg transition-all", view === "grid" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className={cn(
          "grid gap-4",
          view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"
        )}>
          {filteredData.map((coin) => (
            <motion.div
              layout
              key={coin.id}
              className={cn(
                "bg-surface-container-low border border-outline-variant/10 rounded-2xl hover:border-primary/30 transition-all group",
                view === "list" ? "flex items-center justify-between p-4 px-6" : "p-6 flex flex-col gap-4"
              )}
            >
              <div className="flex items-center gap-4">
                <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                <div>
                  <p className="font-bold uppercase tracking-tight">{coin.name}</p>
                  <p className="text-xs text-on-surface-variant font-bold uppercase tracking-widest">{coin.symbol}</p>
                </div>
              </div>

              {view === "list" && (
                <div className="hidden md:block flex-1 mx-12">
                  <div className="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div 
                      className={cn("h-full rounded-full", coin.price_change_percentage_24h > 0 ? "bg-primary" : "bg-secondary")}
                      style={{ width: `${Math.min(Math.abs(coin.price_change_percentage_24h) * 5, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className={cn("text-right", view === "grid" && "flex justify-between items-end")}>
                {view === "grid" && (
                  <div className="flex flex-col items-start">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Capitalización</p>
                    <p className="text-xs font-bold">${(coin.market_cap / 1e9).toFixed(2)}B</p>
                  </div>
                )}
                <div>
                  <p className="font-headline font-bold text-lg">${coin.current_price.toLocaleString()}</p>
                  <div className={cn(
                    "flex items-center justify-end gap-1 text-xs font-bold",
                    coin.price_change_percentage_24h > 0 ? "text-primary" : "text-secondary"
                  )}>
                    {coin.price_change_percentage_24h > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {coin.price_change_percentage_24h.toFixed(2)}%
                  </div>
                </div>
              </div>

              <div className={cn("flex gap-2", view === "list" ? "ml-6" : "mt-2")}>
                <button className="flex-1 bg-surface-container-highest hover:bg-primary hover:text-on-primary p-3 rounded-xl transition-all group/btn">
                  <ArrowUpRight className="w-4 h-4 mx-auto group-hover/btn:scale-110 transition-transform" />
                </button>
                <button className="flex-1 bg-surface-container-highest hover:bg-secondary hover:text-on-primary p-3 rounded-xl transition-all group/btn">
                  <ArrowDownRight className="w-4 h-4 mx-auto group-hover/btn:scale-110 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Heatmap Section Placeholder */}
      <div className="bg-surface-container-high p-8 rounded-[2rem] border border-outline-variant/10 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="font-headline text-2xl font-bold uppercase tracking-tighter">Mapa de Calor del Mercado</h2>
          <button 
            onClick={handleRefreshMap}
            disabled={refreshing}
            className={cn(
              "bg-primary text-on-primary px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2",
              refreshing && "opacity-50 cursor-not-allowed"
            )}
          >
            {refreshing ? (
              <>
                <div className="w-3 h-3 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                ACTUALIZANDO...
              </>
            ) : "Actualizar Mapa"}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 h-96">
          {/* Mock Heatmap Blocks */}
          <div className="bg-primary/80 rounded-lg flex flex-col items-center justify-center text-on-primary p-4">
            <span className="text-xl font-bold">BTC</span>
            <span className="text-xs font-bold">+2.4%</span>
          </div>
          <div className="bg-primary/60 rounded-lg flex flex-col items-center justify-center text-on-primary p-4">
            <span className="text-xl font-bold">ETH</span>
            <span className="text-xs font-bold">+1.8%</span>
          </div>
          <div className="bg-secondary/70 rounded-lg flex flex-col items-center justify-center text-on-primary p-4">
            <span className="text-xl font-bold">SOL</span>
            <span className="text-xs font-bold">-3.2%</span>
          </div>
          <div className="bg-primary/40 rounded-lg flex flex-col items-center justify-center text-on-primary p-4">
            <span className="text-xl font-bold">BNB</span>
            <span className="text-xs font-bold">+0.5%</span>
          </div>
          <div className="bg-secondary/40 rounded-lg flex flex-col items-center justify-center text-on-primary p-4 col-span-2">
            <span className="text-xl font-bold">XRP</span>
            <span className="text-xs font-bold">-0.8%</span>
          </div>
          <div className="bg-primary/20 rounded-lg flex flex-col items-center justify-center text-on-surface p-4 col-span-2 row-span-2">
            <span className="text-xl font-bold">ADA</span>
            <span className="text-xs font-bold">+0.1%</span>
          </div>
          <div className="bg-secondary/90 rounded-lg flex flex-col items-center justify-center text-on-primary p-4 col-span-2">
            <span className="text-xl font-bold">DOGE</span>
            <span className="text-xs font-bold">-5.4%</span>
          </div>
          <div className="bg-primary/90 rounded-lg flex flex-col items-center justify-center text-on-primary p-4 col-span-2">
            <span className="text-xl font-bold">AVAX</span>
            <span className="text-xs font-bold">+4.2%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MarketPage;
