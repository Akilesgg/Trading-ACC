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

const Terminal: React.FC = () => {
  const { 
    addSignal, 
    addLog, 
    activeSymbol, 
    setActiveSymbol, 
    timeframe, 
    setTimeframe 
  } = useTerminalStore();

  const [selectedFundamental, setSelectedFundamental] = useState<AssetFundamental | null>(null);

  const showFundamentals = async (symbol: string) => {
    const data = await fetchAssetFundamentals(symbol);
    setSelectedFundamental(data);
  };

  useEffect(() => {
    // Initial mock signal to show functionality
    const initialSignal = {
      id: "1",
      symbol: "BTCUSDT",
      type: "LONG" as const,
      entry: 64231.42,
      stopLoss: 63800.00,
      takeProfit: [65000, 66000, 68000],
      riskReward: 3.5,
      score: 85,
      status: SignalStatus.CONFIRMED,
      timestamp: Date.now(),
      explanation: "BOS alcista detectado en 1h con confirmación de volumen alto y RSI rebotando en 40.",
      indicators: {
        rsi: 42,
        macd: "BULLISH",
        emaTrend: "BULLISH" as const,
        volume: "HIGH" as const,
        smc: "BOS"
      }
    };
    addSignal(initialSignal);
    addLog("SUCCESS: Terminal engine started. Monitoring 100+ pairs.");
    addLog("SIGNAL: New LONG setup detected for BTCUSDT (Score: 85%)");
  }, []);

  return (
    <div className="flex flex-col bg-background min-h-screen pt-16 pb-20 overflow-hidden">
      {/* 4. HEADER DEL ANALIZADOR (Single Line, Clean) */}
      <div className="h-14 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-black uppercase tracking-tighter text-on-surface leading-none">{activeSymbol}</h1>
              <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Binance Spot</span>
            </div>
          </div>

          <div className="h-6 w-px bg-outline-variant/20" />

          <div className="flex bg-surface-container-high rounded-xl p-1 border border-outline-variant/10">
            {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  timeframe === tf ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-12">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1">Precio Actual</span>
              <span className="text-sm font-black text-primary leading-none">$64,231.42</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1">Cambio 24h</span>
              <span className="text-sm font-black text-primary leading-none flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +2.45%
              </span>
            </div>
          </div>

          <div className="h-6 w-px bg-outline-variant/20" />

          <div className="flex items-center gap-2">
            <button 
              onClick={() => showFundamentals(activeSymbol)}
              className="p-2 hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant hover:text-primary active:scale-95 duration-200"
              title="Historial Fundamental"
            >
              <Info className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem("terminal-storage");
                window.location.reload();
              }}
              className="p-2 hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant hover:text-primary active:scale-95 duration-200"
              title="Restablecer Diseño"
            >
              <History className="w-4 h-4" />
            </button>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                value={activeSymbol}
                onChange={(e) => setActiveSymbol(e.target.value.toUpperCase())}
                className="bg-surface-container-high border border-outline-variant/10 rounded-xl py-2 pl-10 pr-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary transition-all w-48"
                placeholder="BUSCAR ACTIVO..."
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
        fundamental={selectedFundamental} 
        onClose={() => setSelectedFundamental(null)} 
      />

      {/* 5. FOOTER DEL ANALIZADOR */}
      <div className="h-10 bg-surface-container-low border-t border-outline-variant/10 px-6 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-on-surface-variant">
        <div className="flex gap-8">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span>SMC ENGINE: BULLISH BOS DETECTED AT $63,500</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <span>LIQUIDITY: SWEEP AT $63,800</span>
          </div>
        </div>
        <div className="flex gap-8 items-center">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>LATENCY: 12ms</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            <span>ENGINE: SMC-V4.2.0</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-primary" />
            <span>STATUS: LIVE MONITORING</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
