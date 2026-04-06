import React, { useEffect } from "react";
import TerminalLayout from "../ui/layouts/TerminalLayout";
import TerminalChart from "../ui/widgets/TerminalChart";
import TerminalSignals from "../ui/widgets/TerminalSignals";
import TerminalOrderbook from "../ui/widgets/TerminalOrderbook";
import TerminalConsole from "../ui/widgets/TerminalConsole";
import { useTerminalStore } from "../store/useTerminalStore";
import { SignalStatus } from "../core/signals/types";
import { Search, Activity, Shield, History } from "lucide-react";
import { cn } from "@/lib/utils";

const Terminal: React.FC = () => {
  const { 
    addSignal, 
    addLog, 
    activeSymbol, 
    setActiveSymbol, 
    timeframe, 
    setTimeframe 
  } = useTerminalStore();

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
    <div className="flex flex-col bg-surface min-h-screen pt-16 pb-20 overflow-hidden">
      {/* Sub-header for Trading Controls */}
      <div className="h-14 bg-surface-container-low/50 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-6">
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

        <div className="flex items-center gap-4">
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <Activity className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Live: Binance</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary/10 rounded-full border border-secondary/20">
            <Shield className="w-3 h-3 text-secondary" />
            <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Secure: SMC-V4</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar p-4">
        <TerminalLayout>
          {{
            chart: <TerminalChart />,
            signals: <TerminalSignals />,
            orderbook: <TerminalOrderbook />,
            console: <TerminalConsole />,
          }}
        </TerminalLayout>
      </div>
    </div>
  );
};

export default Terminal;
