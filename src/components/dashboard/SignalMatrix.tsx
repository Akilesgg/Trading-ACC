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
  Target,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CryptoData, fetchKlines } from "@/services/cryptoService";
import { Link } from "react-router-dom";
import { AreaChart, Area, ResponsiveContainer } from "recharts";

const SparklineChart = ({ symbol, isBullish }: { symbol: string, isBullish: boolean }) => {
  const [data, setData] = React.useState<any[]>([]);
  React.useEffect(() => {
    fetchKlines(symbol, "1h", 20).then(setData).catch(() => {});
  }, [symbol]);

  if (data.length === 0) return <div className="w-24 h-8 bg-surface-container-high/30 animate-pulse rounded-lg" />;

  return (
    <div className="w-24 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke={isBullish ? "#00ffa3" : "#ff7162"} 
            fill={isBullish ? "#00ffa3" : "#ff7162"} 
            fillOpacity={0.1} 
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

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
  onShowFundamentals?: (symbol: string) => void;
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
  onToggleAlert,
  onShowFundamentals
}) => {
  const filters = [
    { id: "all", label: "TODOS" },
    { id: "watchlist", label: "FAVORITOS" },
    { id: "bullish", label: "ALCISTAS" },
    { id: "bearish", label: "BAJISTAS" },
    { id: "breakout", label: "RUPTURAS" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 trading-card p-6">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border",
                filter === f.id 
                  ? "bg-primary text-on-primary border-primary shadow-xl shadow-primary/20" 
                  : "bg-surface-container-high text-on-surface-variant border-outline-variant/10 hover:border-primary/30 hover:text-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-surface-container-high p-1.5 rounded-2xl border border-outline-variant/10 shadow-inner">
            <button 
              onClick={() => setViewMode("table")}
              className={cn("p-3 rounded-xl transition-all", viewMode === "table" ? "bg-background text-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface")}
            >
              <List className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setViewMode("grid")}
              className={cn("p-3 rounded-xl transition-all", viewMode === "grid" ? "bg-background text-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface")}
            >
              <LayoutGrid className="w-5 h-5" />
            </button>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="BUSCAR ACTIVO..." 
              className="bg-surface-container-high border border-outline-variant/10 rounded-2xl pl-12 pr-6 py-3 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 w-64 transition-all shadow-inner placeholder:text-on-surface-variant/30"
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "table" ? (
          <motion.div 
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="trading-card p-0 overflow-hidden shadow-2xl"
          >
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Activo</th>
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Tendencia</th>
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant cursor-pointer hover:text-primary transition-colors" onClick={() => onSort('price')}>Precio</th>
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant cursor-pointer hover:text-primary transition-colors" onClick={() => onSort('priceChangePercent')}>24h %</th>
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Entrada</th>
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Objetivos</th>
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">RSI / Vol</th>
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Volatilidad</th>
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Confianza</th>
                    <th className="p-6 text-[11px] font-black uppercase tracking-widest text-on-surface-variant">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {tickers.length > 0 ? tickers.map((ticker) => {
                    const isBullish = parseFloat(ticker.priceChangePercent) > 0;
                    const isWatchlisted = watchlist.includes(ticker.symbol);
                    const isAlertEnabled = enabledAlerts.has(ticker.symbol);
                    const isTriggered = triggeredAlerts.has(ticker.symbol);

                    return (
                      <motion.tr 
                        layout
                        key={ticker.symbol}
                        className={cn(
                          "hover:bg-primary/5 transition-all group cursor-pointer",
                          isTriggered && "bg-secondary/10 animate-pulse"
                        )}
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleWatchlist(ticker.symbol); }}
                              className={cn("transition-all hover:scale-125", isWatchlisted ? "text-yellow-500" : "text-on-surface-variant/30 hover:text-yellow-500")}
                            >
                              <Star className={cn("w-5 h-5", isWatchlisted && "fill-yellow-500")} />
                            </button>
                            <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center p-2 border border-outline-variant/10 shadow-inner group-hover:scale-110 transition-transform">
                              <img src={ticker.image} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                            <div>
                              <p className="font-black text-sm tracking-tight uppercase">{ticker.symbol.replace("USDT", "")}</p>
                              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">{ticker.timeframe} | {ticker.market}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <SparklineChart symbol={ticker.symbol} isBullish={isBullish} />
                            <div className={cn(
                              "p-1.5 rounded-lg border",
                              isBullish ? "text-primary border-primary/20 bg-primary/5" : "text-secondary border-secondary/20 bg-secondary/5"
                            )}>
                              {isBullish ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            </div>
                          </div>
                        </td>
                        <td className="p-6 font-mono text-xs font-black tracking-tighter text-on-surface">
                          ${parseFloat(ticker.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                        </td>
                        <td className="p-6">
                          <div className={cn(
                            "flex items-center gap-2 text-[11px] font-black px-3 py-1 rounded-lg w-fit border shadow-sm",
                            isBullish ? "text-primary bg-primary/10 border-primary/20" : "text-secondary bg-secondary/10 border-secondary/20"
                          )}>
                            {isBullish ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {ticker.priceChangePercent}%
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-2">
                            <p className="text-xs font-mono font-black text-on-surface">${ticker.entry?.toFixed(2)}</p>
                            <div className="w-28 h-1.5 bg-surface-container-highest rounded-full overflow-hidden shadow-inner">
                              <div 
                                className={cn("h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,255,163,0.5)]", isBullish ? "bg-primary" : "bg-secondary")}
                                style={{ width: `${Math.max(5, 100 - (ticker.proximity || 0) * 20)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col gap-1.5">
                            {ticker.takeProfits?.slice(0, 3).map((tp, i) => (
                              <div key={i} className="px-2 py-1 bg-surface-container-high rounded-lg text-[9px] font-black border border-outline-variant/10 shadow-sm text-on-surface-variant uppercase flex justify-between gap-2">
                                <span>TP{i+1}:</span>
                                <span className="text-on-surface">${tp.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-on-surface-variant uppercase opacity-50">RSI:</span>
                              <span className={cn(
                                "text-[10px] font-black",
                                (ticker.rsi || 50) > 70 ? "text-secondary" : (ticker.rsi || 50) < 30 ? "text-primary" : "text-on-surface"
                              )}>{ticker.rsi || 50}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black text-on-surface-variant uppercase opacity-50">VOL:</span>
                              <span className="text-[10px] font-black text-on-surface">{ticker.volume ? (parseFloat(ticker.volume) / 1000000).toFixed(1) + "M" : "---"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-on-surface uppercase tracking-tighter">
                              {ticker.riskLevel === "Alto" ? "ALTA" : ticker.riskLevel === "Moderado" ? "MEDIA" : "BAJA"}
                            </p>
                            <div className="w-16 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full transition-all", ticker.riskLevel === "Alto" ? "bg-secondary" : ticker.riskLevel === "Moderado" ? "bg-yellow-500" : "bg-primary")} 
                                style={{ width: ticker.riskLevel === "Alto" ? "100%" : ticker.riskLevel === "Moderado" ? "60%" : "30%" }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full border-2 border-primary/20 flex items-center justify-center relative shadow-lg">
                              <svg className="w-full h-full -rotate-90">
                                <circle
                                  cx="24" cy="24" r="21"
                                  fill="none" stroke="currentColor" strokeWidth="3"
                                  className="text-primary/5"
                                />
                                <circle
                                  cx="24" cy="24" r="21"
                                  fill="none" stroke="currentColor" strokeWidth="3"
                                  strokeDasharray={132}
                                  strokeDashoffset={132 - (132 * (ticker.consensus || 0)) / 100}
                                  className="text-primary drop-shadow-[0_0_5px_rgba(0,255,163,0.5)]"
                                />
                              </svg>
                              <span className="absolute text-[9px] font-black text-on-surface">{ticker.consensus}%</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={(e) => { e.stopPropagation(); onShowFundamentals(ticker.symbol); }}
                              className="p-3 bg-surface-container-high text-on-surface-variant hover:border-primary/30 hover:text-primary rounded-xl transition-all border border-outline-variant/10 shadow-lg"
                              title="Historial Fundamental"
                            >
                              <Info className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => onToggleAlert(e, ticker.symbol)}
                              className={cn(
                                "p-3 rounded-xl transition-all border shadow-lg",
                                isAlertEnabled ? "bg-primary/20 text-primary border-primary/30" : "bg-surface-container-high text-on-surface-variant border-outline-variant/10 hover:border-primary/30 hover:text-primary"
                              )}
                            >
                              <Bell className={cn("w-5 h-5", isAlertEnabled && "fill-primary")} />
                            </button>
                            <Link 
                              to={`/signal/${ticker.symbol}`}
                              className="p-3 bg-primary text-on-primary rounded-xl hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-90 border border-primary/20"
                            >
                              <Target className="w-5 h-5" />
                            </Link>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={9} className="p-20 text-center">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <Search className="w-12 h-12 text-on-surface-variant" />
                          <p className="text-[11px] font-black uppercase tracking-[0.3em]">No se detectaron señales bajo este filtro</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-primary">Escaneando mercado en tiempo real...</p>
                        </div>
                      </td>
                    </tr>
                  )}
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
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {tickers.length > 0 ? tickers.map((ticker) => (
              <SignalCard 
                key={ticker.symbol} 
                ticker={ticker} 
                isWatchlisted={watchlist.includes(ticker.symbol)}
                onToggleWatchlist={() => toggleWatchlist(ticker.symbol)}
                isAlertEnabled={enabledAlerts.has(ticker.symbol)}
                onToggleAlert={(e) => onToggleAlert(e, ticker.symbol)}
                isTriggered={triggeredAlerts.has(ticker.symbol)}
                onShowFundamentals={() => onShowFundamentals(ticker.symbol)}
              />
            )) : (
              <div className="col-span-full p-20 text-center trading-card">
                <div className="flex flex-col items-center gap-4 opacity-30">
                  <Search className="w-12 h-12 text-on-surface-variant" />
                  <p className="text-[11px] font-black uppercase tracking-[0.3em]">No se detectaron señales bajo este filtro</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-primary">Escaneando mercado en tiempo real...</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SignalCard = ({ ticker, isWatchlisted, onToggleWatchlist, isAlertEnabled, onToggleAlert, isTriggered, onShowFundamentals }: any) => {
  const isBullish = parseFloat(ticker.priceChangePercent) > 0;
  
  return (
    <motion.div 
      layout
      whileHover={{ y: -10, scale: 1.02 }}
      className={cn(
        "trading-card p-8 space-y-6 relative overflow-hidden group/card",
        isTriggered && "border-secondary shadow-[0_0_40px_rgba(255,107,107,0.3)] animate-pulse"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500"></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-surface-container-high rounded-2xl flex items-center justify-center p-3 shadow-inner border border-outline-variant/10 group-hover/card:scale-110 transition-transform">
            <img src={ticker.image} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          </div>
          <div>
            <h4 className="font-black text-xl tracking-tighter uppercase text-on-surface">{ticker.symbol.replace("USDT", "")}</h4>
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">{ticker.timeframe} | {ticker.market}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onShowFundamentals}
            className="p-3 rounded-xl bg-surface-container-high text-on-surface-variant hover:border-primary/30 hover:text-primary transition-all border border-outline-variant/10 shadow-lg"
            title="Historial Fundamental"
          >
            <Info className="w-5 h-5" />
          </button>
          <button 
            onClick={onToggleWatchlist}
            className={cn("p-3 rounded-xl transition-all border shadow-lg", isWatchlisted ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30" : "bg-surface-container-high text-on-surface-variant border-outline-variant/10 hover:text-yellow-500")}
          >
            <Star className={cn("w-5 h-5", isWatchlisted && "fill-yellow-500")} />
          </button>
          <button 
            onClick={onToggleAlert}
            className={cn("p-3 rounded-xl transition-all border shadow-lg", isAlertEnabled ? "bg-primary/10 text-primary border-primary/30" : "bg-surface-container-high text-on-surface-variant border-outline-variant/10 hover:text-primary")}
          >
            <Bell className={cn("w-5 h-5", isAlertEnabled && "fill-primary")} />
          </button>
        </div>
      </div>

      <div className="flex justify-between items-end relative z-10">
        <div className="flex-1">
          <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 opacity-50">Precio Actual</p>
          <div className="flex items-center gap-4">
            <p className="text-3xl font-black tracking-tighter text-on-surface">${parseFloat(ticker.price).toLocaleString()}</p>
            <SparklineChart symbol={ticker.symbol} isBullish={isBullish} />
          </div>
        </div>
        <div className={cn(
          "px-4 py-1.5 rounded-xl text-[11px] font-black flex items-center gap-2 border shadow-lg",
          isBullish ? "bg-primary/10 text-primary border-primary/20" : "bg-secondary/10 text-secondary border-secondary/20"
        )}>
          {isBullish ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {ticker.priceChangePercent}%
        </div>
      </div>

      <div className="p-6 bg-surface-container-high rounded-[2rem] border border-outline-variant/10 space-y-4 relative z-10 shadow-inner">
        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
          <span className="text-on-surface-variant opacity-60">Entrada Sugerida</span>
          <span className="text-primary drop-shadow-[0_0_5px_rgba(0,255,163,0.3)]">${ticker.entry?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
          <span className="text-on-surface-variant opacity-60">Stop Loss</span>
          <span className="text-secondary drop-shadow-[0_0_5px_rgba(255,107,107,0.3)]">${ticker.stopLoss?.toFixed(2)}</span>
        </div>
        <div className="pt-4 border-t border-outline-variant/10">
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-3 opacity-50">Objetivos de Ganancia</p>
          <div className="flex gap-3">
            {ticker.takeProfits?.slice(0, 3).map((tp: number, i: number) => (
              <div key={i} className="flex-1 bg-surface-container-highest/50 p-3 rounded-2xl text-center border border-outline-variant/5 group/tp hover:border-primary/30 transition-all">
                <p className="text-[9px] font-black text-on-surface-variant mb-1 uppercase opacity-50 group-hover/tp:text-primary transition-colors">TP{i+1}</p>
                <p className="text-[11px] font-black text-on-surface tracking-tighter">${tp.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link 
        to={`/signal/${ticker.symbol}`}
        className="w-full py-4 bg-on-background text-background rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 hover:bg-primary hover:text-on-primary transition-all active:scale-95 shadow-xl hover:shadow-primary/30 relative z-10"
      >
        <Target className="w-5 h-5" />
        Analizar en Profundidad
      </Link>
    </motion.div>
  );
};

export default SignalMatrix;
