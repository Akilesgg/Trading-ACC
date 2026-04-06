import React from "react";
import { useTerminalStore } from "../../store/useTerminalStore";
import { Activity, Clock, Search, Settings, User, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const TerminalTopbar: React.FC = () => {
  const { activeSymbol, setActiveSymbol, timeframe, setTimeframe } = useTerminalStore();

  return (
    <div className="h-14 bg-surface-container-low border-b border-outline-variant/10 flex items-center justify-between px-6 sticky top-0 z-50 backdrop-blur-xl bg-surface/80">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5 text-on-primary" />
          </div>
          <span className="text-sm font-black uppercase tracking-tighter text-on-surface">KINETIC <span className="text-primary">EDGE</span></span>
        </div>

        <div className="h-6 w-px bg-outline-variant/20" />

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              value={activeSymbol}
              onChange={(e) => setActiveSymbol(e.target.value.toUpperCase())}
              className="bg-surface-container-high border border-outline-variant/10 rounded-lg py-2 pl-10 pr-4 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-primary transition-all w-48"
              placeholder="BUSCAR ACTIVO..."
            />
          </div>

          <div className="flex bg-surface-container-high rounded-lg p-1 border border-outline-variant/10">
            {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all",
                  timeframe === tf ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
          <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="w-3 h-3" />
            <span>BTC: $64,231.42 (+2.4%)</span>
          </div>
          <div className="flex items-center gap-2 text-secondary">
            <TrendingDown className="w-3 h-3" />
            <span>ETH: $3,421.12 (-0.8%)</span>
          </div>
        </div>

        <div className="h-6 w-px bg-outline-variant/20" />

        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-on-surface">
            <Activity className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant hover:text-on-surface">
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center overflow-hidden">
            <User className="w-4 h-4 text-on-surface-variant" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerminalTopbar;
