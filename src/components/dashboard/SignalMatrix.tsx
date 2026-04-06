import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  LayoutGrid, 
  List, 
  ChevronUp, 
  ChevronDown,
  Star,
  Bell,
  Check,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CryptoData } from "@/services/cryptoService";
import { Link } from "react-router-dom";

interface SignalMatrixProps {
  tickers: CryptoData[];
  viewMode: "grid" | "table";
  setViewMode: (mode: "grid" | "table") => void;
  filter: string;
  setFilter: (filter: any) => void;
  watchlist: string[];
  toggleWatchlist: (symbol: string) => void;
  onSort: (key: string) => void;
  sortConfig: { key: string, direction: 'asc' | 'desc' } | null;
  enabledAlerts: Set<string>;
  triggeredAlerts: Set<string>;
  onToggleAlert: (e: React.MouseEvent, symbol: string) => void;
}

const SignalMatrix: React.FC<SignalMatrixProps> = ({
  tickers,
  viewMode,
  setViewMode,
  filter,
  setFilter,
  watchlist,
  toggleWatchlist,
  onSort,
  sortConfig,
  enabledAlerts,
  triggeredAlerts,
  onToggleAlert
}) => {
  const filters = [
    { id: "all", label: "TODOS" },
    { id: "watchlist", label: "FAVORITOS" },
    { id: "bullish", label: "ALCISTAS" },
    { id: "bearish", label: "BAJISTAS" },
    { id: "breakout", label: "RUPTURAS" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                filter === f.id 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                  : "bg-surface-container-highest text-on-surface-variant hover:bg-primary/10 hover:text-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-highest p-1 rounded-xl border border-outline-variant/10">
            <button 
              onClick={() => setViewMode("table")}
              className={cn("p-2 rounded-lg transition-colors", viewMode === "table" ? "bg-background text-primary shadow-sm" : "text-on-surface-variant")}
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode("grid")}
              className={cn("p-2 rounded-lg transition-colors", viewMode === "grid" ? "bg-background text-primary shadow-sm" : "text-on-surface-variant")}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="BUSCAR ACTIVO..." 
              className="bg-surface-container-highest border border-outline-variant/10 rounded-xl pl-10 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-primary/50 w-48 transition-all"
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "table" ? (
          <motion.div 
            key="table"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high border-b border-outline-variant/10">
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Activo</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant cursor-pointer hover:text-primary" onClick={() => onSort('price')}>Precio</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant cursor-pointer hover:text-primary" onClick={() => onSort('priceChangePercent')}>24h %</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Entrada</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Objetivos</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Confianza</th>
                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {tickers.map((ticker) => {
                    const isBullish = parseFloat(ticker.priceChangePercent) > 0;
                    const isWatchlisted = watchlist.includes(ticker.symbol);
                    const isAlertEnabled = enabledAlerts.has(ticker.symbol);
                    const isTriggered = triggeredAlerts.has(ticker.symbol);

                    return (
                      <motion.tr 
                        layout
                        key={ticker.symbol}
                        className={cn(
                          "hover:bg-primary/5 transition-colors group cursor-pointer",
                          isTriggered && "bg-secondary/10 animate-pulse"
                        )}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleWatchlist(ticker.symbol); }}
                              className={cn("transition-colors", isWatchlisted ? "text-yellow-500" : "text-on-surface-variant/30 hover:text-yellow-500")}
                            >
                              <Star className={cn("w-4 h-4", isWatchlisted && "fill-yellow-500")} />
                            </button>
                            <div className="w-8 h-8 bg-surface-container rounded-lg flex items-center justify-center p-1.5">
                              <img src={ticker.image} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{ticker.symbol.replace("USDT", "")}</p>
                              <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-tighter">{ticker.timeframe} | {ticker.market}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-xs font-bold">
                          ${parseFloat(ticker.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </td>
                        <td className="p-4">
                          <div className={cn(
                            "flex items-center gap-1 text-xs font-black",
                            isBullish ? "text-primary" : "text-secondary"
                          )}>
                            {isBullish ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {ticker.priceChangePercent}%
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <p className="text-xs font-mono font-bold">${ticker.entry?.toFixed(2)}</p>
                            <div className="w-24 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all duration-1000", isBullish ? "bg-primary" : "bg-secondary")}
                                style={{ width: `${Math.max(5, 100 - (ticker.proximity || 0) * 20)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {ticker.takeProfits?.slice(0, 3).map((tp, i) => (
                              <div key={i} className="px-1.5 py-0.5 bg-surface-container rounded text-[8px] font-bold border border-outline-variant/10">
                                T{i+1}: ${tp.toFixed(2)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-full border-2 border-primary/20 flex items-center justify-center relative">
                              <svg className="w-full h-full -rotate-90">
                                <circle
                                  cx="20" cy="20" r="18"
                                  fill="none" stroke="currentColor" strokeWidth="2"
                                  className="text-primary/10"
                                />
                                <circle
                                  cx="20" cy="20" r="18"
                                  fill="none" stroke="currentColor" strokeWidth="2"
                                  strokeDasharray={113}
                                  strokeDashoffset={113 - (113 * (ticker.consensus || 0)) / 100}
                                  className="text-primary"
                                />
                              </svg>
                              <span className="absolute text-[8px] font-black">{ticker.consensus}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={(e) => onToggleAlert(e, ticker.symbol)}
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                isAlertEnabled ? "bg-primary/20 text-primary" : "bg-surface-container-highest text-on-surface-variant hover:bg-primary/10"
                              )}
                            >
                              <Bell className={cn("w-4 h-4", isAlertEnabled && "fill-primary")} />
                            </button>
                            <Link 
                              to={`/signal/${ticker.symbol}`}
                              className="p-2 bg-primary text-on-primary rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-90"
                            >
                              <Target className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {tickers.map((ticker) => (
              <SignalCard 
                key={ticker.symbol} 
                ticker={ticker} 
                isWatchlisted={watchlist.includes(ticker.symbol)}
                onToggleWatchlist={() => toggleWatchlist(ticker.symbol)}
                isAlertEnabled={enabledAlerts.has(ticker.symbol)}
                onToggleAlert={(e) => onToggleAlert(e, ticker.symbol)}
                isTriggered={triggeredAlerts.has(ticker.symbol)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SignalCard = ({ ticker, isWatchlisted, onToggleWatchlist, isAlertEnabled, onToggleAlert, isTriggered }: any) => {
  const isBullish = parseFloat(ticker.priceChangePercent) > 0;
  
  return (
    <motion.div 
      layout
      whileHover={{ y: -5 }}
      className={cn(
        "bg-surface-container-low rounded-3xl border border-outline-variant/10 p-6 space-y-4 relative overflow-hidden group",
        isTriggered && "border-secondary shadow-[0_0_30px_rgba(255,107,107,0.2)] animate-pulse"
      )}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-surface-container rounded-2xl flex items-center justify-center p-2 shadow-inner">
            <img src={ticker.image} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h4 className="font-bold text-lg">{ticker.symbol.replace("USDT", "")}</h4>
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{ticker.timeframe} | {ticker.market}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onToggleWatchlist}
            className={cn("p-2 rounded-xl transition-colors", isWatchlisted ? "bg-yellow-500/10 text-yellow-500" : "bg-surface-container-highest text-on-surface-variant")}
          >
            <Star className={cn("w-4 h-4", isWatchlisted && "fill-yellow-500")} />
          </button>
          <button 
            onClick={onToggleAlert}
            className={cn("p-2 rounded-xl transition-colors", isAlertEnabled ? "bg-primary/10 text-primary" : "bg-surface-container-highest text-on-surface-variant")}
          >
            <Bell className={cn("w-4 h-4", isAlertEnabled && "fill-primary")} />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Precio Actual</p>
          <p className="text-2xl font-headline font-bold">${parseFloat(ticker.price).toLocaleString()}</p>
        </div>
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1",
          isBullish ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
        )}>
          {isBullish ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {ticker.priceChangePercent}%
        </div>
      </div>

      <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/5 space-y-3">
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
          <span className="text-on-surface-variant">Entrada Sugerida</span>
          <span className="text-primary">${ticker.entry?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
          <span className="text-on-surface-variant">Stop Loss</span>
          <span className="text-secondary">${ticker.stopLoss?.toFixed(2)}</span>
        </div>
        <div className="pt-2 border-t border-outline-variant/5">
          <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Objetivos de Ganancia</p>
          <div className="flex gap-2">
            {ticker.takeProfits?.slice(0, 3).map((tp: number, i: number) => (
              <div key={i} className="flex-1 bg-surface-container-highest p-2 rounded-lg text-center">
                <p className="text-[8px] font-bold text-on-surface-variant mb-1">TP{i+1}</p>
                <p className="text-[10px] font-bold">${tp.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link 
        to={`/signal/${ticker.symbol}`}
        className="w-full py-3 bg-on-background text-background rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-primary hover:text-on-primary transition-all active:scale-95"
      >
        <Target className="w-4 h-4" />
        Analizar en Profundidad
      </Link>
    </motion.div>
  );
};

export default SignalMatrix;
