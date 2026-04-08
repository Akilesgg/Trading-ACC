import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import TerminalLayout from "../ui/layouts/TerminalLayout";
import TerminalChart from "../ui/widgets/TerminalChart";
import TerminalSignals from "../ui/widgets/TerminalSignals";
import TerminalOrderbook from "../ui/widgets/TerminalOrderbook";
import TerminalConsole from "../ui/widgets/TerminalConsole";
import TerminalTradePanel from "../ui/widgets/TerminalTradePanel";
import { useTerminalStore } from "../store/useTerminalStore";
import { SignalStatus } from "../core/signals/types";
import { Search, Activity, Shield, History, Zap, TrendingUp, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAssetFundamentals, AssetFundamental } from "@/services/cryptoService";
import FundamentalModal from "@/components/common/FundamentalModal";
import { generateSignal } from "../services/signalEngine";
import { useBinanceTicker } from "../hooks/useBinanceTicker";

const Terminal: React.FC = () => {
  const { 
    addSignal, 
    addLog, 
    activeSymbol, 
    setActiveSymbol, 
    timeframe, 
    setTimeframe 
  } = useTerminalStore();

  const ticker = useBinanceTicker(activeSymbol);
  const [selectedFundamental, setSelectedFundamental] = useState<AssetFundamental | null>(null);

  useEffect(() => {
    const checkSignals = async () => {
      const signal = await generateSignal(activeSymbol, timeframe);
      if (signal) {
        addSignal(signal);
        addLog(`SIGNAL: New ${signal.type} setup detected for ${activeSymbol} (Score: ${signal.score}%)`);
      }
    };

    const interval = setInterval(checkSignals, 30000); // Check every 30s
    checkSignals(); // Initial check

    return () => clearInterval(interval);
  }, [activeSymbol, timeframe]);

  const showFundamentals = async (symbol: string) => {
    const data = await fetchAssetFundamentals(symbol);
    setSelectedFundamental(data);
  };

  useEffect(() => {
    addLog("SUCCESS: Terminal engine started. Monitoring 100+ pairs.");
  }, []);

  return (
    <div className="flex flex-col bg-background min-h-screen pt-20 pb-24 overflow-hidden">
      {/* 4. HEADER DEL ANALIZADOR (Single Line, Clean) */}
      <div className="h-20 bg-surface-container-low/50 backdrop-blur-2xl border-b border-outline-variant/10 flex items-center justify-between px-10 z-40 shadow-2xl">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-xl shadow-primary/5 group hover:scale-110 transition-transform cursor-pointer">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black uppercase tracking-tighter text-on-surface leading-none">{activeSymbol}</h1>
                <span className="px-3 py-1 bg-primary/10 text-[9px] font-black text-primary rounded-lg border border-primary/20 uppercase tracking-[0.2em] shadow-lg shadow-primary/5">SPOT</span>
              </div>
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] mt-2 opacity-50">Binance Engine v4.2</span>
            </div>
          </div>

          <div className="h-10 w-px bg-outline-variant/20" />

          <div className="flex bg-surface-container-high/50 rounded-2xl p-1.5 border border-outline-variant/10 shadow-inner">
            {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all",
                  timeframe === tf ? "bg-primary text-on-primary shadow-xl shadow-primary/20 scale-105" : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex items-center gap-10">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-2 opacity-50">Precio Actual</span>
              <span className="text-2xl font-black text-primary leading-none tracking-tighter shadow-primary/10 drop-shadow-lg">
                ${ticker ? parseFloat(ticker.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-2 opacity-50">Cambio 24h</span>
              <span className={cn(
                "text-2xl font-black leading-none flex items-center gap-2 tracking-tighter drop-shadow-lg",
                ticker && parseFloat(ticker.priceChangePercent) >= 0 ? "text-primary" : "text-secondary"
              )}>
                {ticker && parseFloat(ticker.priceChangePercent) >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                {ticker ? `${ticker.priceChangePercent}%` : "---"}
              </span>
            </div>
          </div>

          <div className="h-10 w-px bg-outline-variant/20" />

          <div className="flex items-center gap-4">
            <button 
              onClick={() => showFundamentals(activeSymbol)}
              className="p-3.5 bg-surface-container-high/50 border border-outline-variant/10 rounded-2xl transition-all text-on-surface-variant hover:text-primary hover:border-primary/30 active:scale-90 shadow-lg group"
              title="Análisis Fundamental"
            >
              <Info className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem("terminal-storage");
                window.location.reload();
              }}
              className="p-3.5 bg-surface-container-high/50 border border-outline-variant/10 rounded-2xl transition-all text-on-surface-variant hover:text-primary hover:border-primary/30 active:scale-90 shadow-lg group"
              title="Resetear Layout"
            >
              <History className="w-5 h-5 group-hover:rotate-[-45deg] transition-transform" />
            </button>
            <div className="relative group/search">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within/search:text-primary transition-colors" />
              <input 
                type="text" 
                value={activeSymbol}
                onChange={(e) => setActiveSymbol(e.target.value.toUpperCase())}
                className="bg-surface-container-high/50 border border-outline-variant/10 rounded-2xl py-3.5 pl-12 pr-6 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all w-64 shadow-inner placeholder:text-on-surface-variant/30"
                placeholder="BUSCAR PAR..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* 1. CONTENEDOR PRINCIPAL (GRID) */}
      <div className="flex-1 overflow-hidden p-4">
        <TerminalLayout>
          {{
            chart: <TerminalChart />,
            signals: <TerminalSignals />,
            trade: <TerminalTradePanel />,
            orderbook: <TerminalOrderbook />,
            console: <TerminalConsole />,
          }}
        </TerminalLayout>
      </div>

      {/* Fundamental Modal */}
      <FundamentalModal 
        data={selectedFundamental} 
        onClose={() => setSelectedFundamental(null)} 
      />

      {/* 5. FOOTER DEL ANALIZADOR */}
      <div className="h-14 bg-surface-container-low/80 backdrop-blur-2xl border-t border-outline-variant/10 px-10 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
        <div className="flex gap-12">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_12px_rgba(0,255,163,0.8)]" />
            <span className="text-on-surface group-hover:text-primary transition-colors">SMC ENGINE: <span className="text-primary font-black">BULLISH BOS</span> DETECTED AT $63,500</span>
          </div>
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_12px_rgba(255,113,98,0.8)] animate-pulse" />
            <span className="text-on-surface group-hover:text-secondary transition-colors">LIQUIDITY: <span className="text-secondary font-black">SWEEP</span> AT $63,800</span>
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
  );
};

export default Terminal;
