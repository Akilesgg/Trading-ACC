import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import TerminalLayout from "../ui/layouts/TerminalLayout";
import TerminalChart from "../ui/widgets/TerminalChart";
import TerminalAnalyzer from "../ui/widgets/TerminalAnalyzer";
import TerminalSignals from "../ui/widgets/TerminalSignals";
import TerminalOrderbook from "../ui/widgets/TerminalOrderbook";
import TerminalConsole from "../ui/widgets/TerminalConsole";
import TerminalTradePanel from "../ui/widgets/TerminalTradePanel";
import TerminalBacktest from "../ui/widgets/TerminalBacktest";
import TerminalAlerts from "../ui/widgets/TerminalAlerts";
import { useTerminalStore } from "../store/useTerminalStore";
import { SignalStatus } from "../core/signals/types";
import { Search, Activity, Shield, History, Zap, TrendingUp, TrendingDown, Info, X, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAssetFundamentals, AssetFundamental } from "@/services/cryptoService";
import FundamentalModal from "@/components/common/FundamentalModal";
import { useBinanceTicker } from "../hooks/useBinanceTicker";

import { useSearchParams, useNavigate } from "react-router-dom";

import { useSignalStore } from "@/store/useSignalStore";

const Terminal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { 
    addLog, 
    activeSymbol, 
    setActiveSymbol, 
    timeframe, 
    setTimeframe 
  } = useTerminalStore();
  
  const { activeSignals, addSignal } = useSignalStore();
  const lastSignal = activeSignals[0];

  useEffect(() => {
    const symbolParam = searchParams.get("symbol");
    if (symbolParam && symbolParam !== activeSymbol) {
      setActiveSymbol(symbolParam.toUpperCase());
    }
  }, [searchParams, setActiveSymbol, activeSymbol]);

  const ticker = useBinanceTicker(activeSymbol);
  const [selectedFundamental, setSelectedFundamental] = useState<AssetFundamental | null>(null);

  useEffect(() => {
    // We no longer generate local signals here to unify the system.
    // The MarketScanner and manual buttons handle signal creation via useSignalStore.
    addLog("SUCCESS: Terminal engine started. Monitoring 100+ pairs.");
  }, []);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const showFundamentals = async (symbol: string) => {
    const data = await fetchAssetFundamentals(symbol);
    setSelectedFundamental(data);
  };

  return (
    <div className="flex flex-col bg-background min-h-screen pt-20 pb-24 overflow-hidden relative">
      {/* Page Specific Background */}
      <div className="fixed inset-0 opacity-[0.06] grayscale contrast-150 pointer-events-none z-0">
        <img 
          src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=2070&auto=format&fit=crop" 
          alt="Terminal Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="relative z-10 flex flex-col flex-1">
        {/* 4. HEADER DEL ANALIZADOR (Single Line, Clean) */}
      <div className="h-auto md:h-20 bg-surface-container-low/50 backdrop-blur-2xl border-b border-outline-variant/10 flex flex-col md:flex-row items-center justify-between px-4 md:px-10 py-4 md:py-0 z-40 shadow-2xl gap-4 md:gap-0">
        <div className="flex items-center gap-4 md:gap-10 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3 md:gap-5">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 md:p-3 bg-surface-container-high/50 border border-outline-variant/10 rounded-2xl transition-all text-on-surface-variant hover:text-primary hover:border-primary/30 active:scale-90 shadow-lg group focus:outline-none"
              title="Volver"
            >
              <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5 group hover:scale-110 transition-transform cursor-pointer">
              <Zap className="w-6 h-6 md:w-7 md:h-7 text-primary" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2 md:gap-3">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter text-on-surface leading-none">{activeSymbol}</h1>
                <span className="px-2 py-0.5 bg-primary/10 text-[8px] md:text-[9px] font-black text-primary rounded-lg border border-primary/20 uppercase tracking-[0.2em] shadow-lg shadow-primary/5">SPOT</span>
              </div>
              <span className="text-[8px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mt-1 md:mt-2 opacity-50">Binance Engine v4.2</span>
            </div>
          </div>

          <div className="hidden md:block h-10 w-px bg-outline-variant/20" />

          <div className="flex bg-surface-container-high/50 rounded-2xl p-1 border border-outline-variant/10 shadow-inner overflow-x-auto max-w-[200px] md:max-w-none">
            {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3 md:px-5 py-1.5 md:py-2 rounded-xl text-[9px] md:text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap focus:outline-none",
                  timeframe === tf ? "bg-primary text-on-primary shadow-xl shadow-primary/20 scale-105" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-12 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-6 md:gap-10">
            <div className="flex flex-col items-end">
              <span className="text-[8px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1 md:mb-2 opacity-50">Precio</span>
              <span className="text-lg md:text-2xl font-black text-primary leading-none tracking-tighter shadow-primary/10 drop-shadow-lg">
                ${ticker ? parseFloat(ticker.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] md:text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1 md:mb-2 opacity-50">Cambio</span>
              <span className={cn(
                "text-lg md:text-2xl font-black leading-none flex items-center gap-1 md:gap-2 tracking-tighter drop-shadow-lg",
                ticker && parseFloat(ticker.priceChangePercent) >= 0 ? "text-primary" : "text-secondary"
              )}>
                {ticker && parseFloat(ticker.priceChangePercent) >= 0 ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : <TrendingDown className="w-4 h-4 md:w-5 md:h-5" />}
                {ticker ? `${ticker.priceChangePercent}%` : "---"}
              </span>
            </div>
          </div>

          <div className="hidden md:block h-10 w-px bg-outline-variant/20" />

          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={() => showFundamentals(activeSymbol)}
              className="p-2 md:p-3.5 bg-surface-container-high/50 border border-outline-variant/10 rounded-2xl transition-all text-on-surface-variant hover:text-primary hover:border-primary/30 active:scale-90 shadow-lg group focus:outline-none"
              title="Análisis Fundamental"
            >
              <Info className="w-4 h-4 md:w-5 md:h-5 group-hover:scale-110 transition-transform" />
            </button>
            <div className="relative group/search">
              <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-on-surface-variant group-focus-within/search:text-primary transition-colors" />
              <input 
                type="text" 
                value={activeSymbol}
                onChange={(e) => setActiveSymbol(e.target.value.toUpperCase())}
                className="bg-surface-container-high/50 border border-outline-variant/10 rounded-2xl py-2 md:py-3.5 pl-10 md:pl-12 pr-4 md:pr-6 text-[9px] md:text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all w-32 md:w-64 shadow-inner placeholder:text-on-surface-variant/30"
                placeholder="BUSCAR..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1. CONTENEDOR PRINCIPAL (GRID) */}
      <div className="flex-1 overflow-hidden p-2 md:p-4">
        {isMobile ? (
          <div className="h-full flex flex-col gap-4">
            <div className="flex-1 trading-card p-0 overflow-hidden">
              <TerminalChart />
            </div>
            <div className="h-[300px] trading-card p-0 overflow-hidden">
              <TerminalSignals />
            </div>
          </div>
        ) : (
          <TerminalLayout>
            {{
              chart: <TerminalChart />,
              analyzer: <TerminalAnalyzer />,
              signals: <TerminalSignals />,
              trade: <TerminalTradePanel />,
              orderbook: <TerminalOrderbook />,
              console: <TerminalConsole />,
              backtest: <TerminalBacktest />,
              alerts: <TerminalAlerts />,
            }}
          </TerminalLayout>
        )}
      </div>

      {/* Fundamental Modal */}
      <FundamentalModal 
        data={selectedFundamental} 
        onClose={() => setSelectedFundamental(null)} 
      />

      {/* 5. FOOTER DEL ANALIZADOR */}
      <div className="h-14 bg-surface-container-low/80 backdrop-blur-2xl border-t border-outline-variant/10 px-10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
        <div className="flex gap-12">
          {lastSignal ? (
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full animate-pulse shadow-lg",
                lastSignal.tipo === "LONG" ? "bg-primary shadow-primary/80" : "bg-secondary shadow-secondary/80"
              )} />
              <span className="text-on-surface group-hover:text-primary transition-colors">
                IA ANALYSIS: <span className={cn("font-black", lastSignal.tipo === "LONG" ? "text-primary" : "text-secondary")}>
                  {lastSignal.tipo} DETECTED AT ${lastSignal.entry.toLocaleString()}
                </span>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="w-2.5 h-2.5 rounded-full bg-on-surface-variant/20 animate-pulse" />
              <span className="text-on-surface-variant">ESPERANDO SEÑAL...</span>
            </div>
          )}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-2.5 h-2.5 rounded-full bg-tertiary shadow-[0_0_12px_rgba(0,255,163,0.3)] animate-pulse" />
            <span className="text-on-surface group-hover:text-tertiary transition-colors">LIQUIDITY: <span className="text-tertiary font-black">STABLE</span> MONITORING</span>
          </div>
        </div>
        <div className="flex gap-12 items-center">
          <div className="flex items-center gap-3 hover:text-primary transition-all cursor-help group" title="Latencia de red en tiempo real">
            <Activity className="w-4 h-4 group-hover:scale-110" />
            <span>LATENCY: <span className="text-primary">12ms</span></span>
          </div>
          <div className="flex items-center gap-3 hover:text-primary transition-all cursor-help group" title="Versión del motor de análisis">
            <Shield className="w-4 h-4 group-hover:scale-110" />
            <span>ENGINE: <span className="text-primary">SMC-V4.2.0</span></span>
          </div>
          <div className="flex items-center gap-3 px-5 py-2 bg-primary/10 rounded-xl border border-primary/20 shadow-lg shadow-primary/5">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-primary font-black tracking-[0.3em]">LIVE MONITORING</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Terminal;
