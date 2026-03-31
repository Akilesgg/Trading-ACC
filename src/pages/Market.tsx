import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Star, 
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  LayoutGrid,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchTickers, CryptoData } from "@/services/cryptoService";
import { Link } from "react-router-dom";
import { useWatchlist } from "@/hooks/useWatchlist";

const Market = () => {
  const [tickers, setTickers] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");
  const { watchlist, toggleWatchlist } = useWatchlist();

  const symbols = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", 
    "ADAUSDT", "AVAXUSDT", "DOTUSDT", "LINKUSDT", "MATICUSDT",
    "NEARUSDT", "ATOMUSDT", "LTCUSDT", "BCHUSDT", "SHIBUSDT"
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTickers(symbols);
        setTickers(data);
      } catch (error) {
        console.error("Market data load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredTickers = tickers.filter(t => 
    t.symbol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant" />
          <input 
            type="text" 
            placeholder="Buscar activos..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-full py-3 pl-12 pr-6 focus:outline-none focus:border-primary transition-colors font-label text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 bg-surface-container-high rounded-xl hover:bg-surface-container-highest transition-colors">
            <Filter className="w-5 h-5 text-on-surface-variant" />
          </button>
          <div className="flex bg-surface-container-high rounded-xl p-1">
            <button 
              onClick={() => setView("list")}
              className={cn("p-2 rounded-lg transition-all", view === "list" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant")}
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setView("grid")}
              className={cn("p-2 rounded-lg transition-all", view === "grid" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Market Table/Grid */}
      {view === "list" ? (
        <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container-high/50 text-[10px] font-label uppercase tracking-widest text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Activo</th>
                  <th className="px-6 py-4">Precio</th>
                  <th className="px-6 py-4">Cambio 24h</th>
                  <th className="px-6 py-4">Máx / Mín 24h</th>
                  <th className="px-6 py-4">Volumen</th>
                  <th className="px-6 py-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filteredTickers.map((ticker) => {
                  const isPositive = parseFloat(ticker.priceChangePercent) >= 0;
                  return (
                    <tr key={ticker.symbol} className="hover:bg-surface-container-high/30 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <Star 
                            className={cn(
                              "w-4 h-4 transition-colors cursor-pointer",
                              watchlist.includes(ticker.symbol) ? "text-primary fill-primary" : "text-on-surface-variant hover:text-primary"
                            )} 
                            onClick={() => toggleWatchlist(ticker.symbol)}
                          />
                          <div className="flex flex-col">
                            <span className="font-headline font-bold text-sm">{ticker.symbol.replace("USDT", "")}</span>
                            <span className="text-[10px] text-on-surface-variant font-label uppercase">USDT</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 font-headline font-bold text-sm">
                        ${parseFloat(ticker.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-5">
                        <div className={cn("flex items-center gap-1 font-bold text-sm", isPositive ? "text-primary" : "text-secondary")}>
                          {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {ticker.priceChangePercent}%
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-primary-dim font-bold">H: ${parseFloat(ticker.highPrice).toLocaleString()}</span>
                          <span className="text-[10px] text-secondary-dim font-bold">L: ${parseFloat(ticker.lowPrice).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-on-surface-variant font-label">
                        ${(parseFloat(ticker.volume) * parseFloat(ticker.price) / 1000000).toFixed(2)}M
                      </td>
                      <td className="px-6 py-5 text-right">
                        <Link 
                          to={`/terminal?symbol=${ticker.symbol}`}
                          className="px-4 py-2 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all active:scale-95"
                        >
                          Operar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTickers.map((ticker) => {
            const isPositive = parseFloat(ticker.priceChangePercent) >= 0;
            return (
              <div key={ticker.symbol} className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                      <TrendingUp className={cn("w-5 h-5", isPositive ? "text-primary" : "text-secondary")} />
                    </div>
                    <div>
                      <h4 className="font-headline font-bold">{ticker.symbol.replace("USDT", "")}</h4>
                      <p className="text-[10px] text-on-surface-variant font-label uppercase">Binance Spot</p>
                    </div>
                  </div>
                  <Star 
                    className={cn(
                      "w-4 h-4 transition-colors cursor-pointer",
                      watchlist.includes(ticker.symbol) ? "text-primary fill-primary" : "text-on-surface-variant group-hover:text-primary"
                    )} 
                    onClick={() => toggleWatchlist(ticker.symbol)}
                  />
                </div>
                <div className="space-y-1 mb-6">
                  <p className="text-2xl font-headline font-bold">${parseFloat(ticker.price).toLocaleString()}</p>
                  <p className={cn("text-xs font-bold flex items-center gap-1", isPositive ? "text-primary" : "text-secondary")}>
                    {isPositive ? "+" : ""}{ticker.priceChangePercent}%
                    <span className="text-[10px] text-on-surface-variant font-label">(24h)</span>
                  </p>
                </div>
                <div className="h-12 w-full bg-surface-container-high/30 rounded-lg relative overflow-hidden">
                  {/* Mini Sparkline Placeholder */}
                  <div className="absolute inset-0 flex items-end px-2 gap-1">
                    {[40, 60, 45, 70, 55, 80, 65, 90].map((h, i) => (
                      <div key={i} className={cn("flex-1 rounded-t-sm", isPositive ? "bg-primary/20" : "bg-secondary/20")} style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
                <Link 
                  to={`/terminal?symbol=${ticker.symbol}`}
                  className="mt-6 block w-full py-3 bg-surface-container-high rounded-xl text-center text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all"
                >
                  Abrir Terminal
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default Market;
