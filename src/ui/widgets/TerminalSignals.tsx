import React from "react";
import { useTerminalStore } from "../../store/useTerminalStore";
import { TrendingUp, TrendingDown, Target, Shield, Zap, Flame, Activity, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignalStatus } from "../../core/signals/types";

const TerminalSignals: React.FC = () => {
  const { signals } = useTerminalStore();

  const getStatusColor = (status: SignalStatus) => {
    switch (status) {
      case SignalStatus.CONFIRMED: return "text-primary bg-primary/10 border-primary/20";
      case SignalStatus.INVALIDATED: return "text-secondary bg-secondary/10 border-secondary/20";
      case SignalStatus.TP1_HIT:
      case SignalStatus.TP2_HIT:
      case SignalStatus.TP3_HIT:
        return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case SignalStatus.SL_HIT: return "text-red-500 bg-red-500/10 border-red-500/20";
      case SignalStatus.OPEN: return "text-blue-500 bg-blue-500/10 border-blue-500/20";
      default: return "text-on-surface-variant bg-surface-container-high border-outline-variant/10";
    }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-surface-container-low/30">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <Zap className="w-3 h-3" /> SEÑALES ACTIVAS
        </h4>
        <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
          {signals.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
        {signals.length > 0 ? (
          signals.map((signal) => (
            <div 
              key={signal.id} 
              className="bg-surface-container-high/40 border border-outline-variant/10 rounded-lg p-3 hover:border-primary/20 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    signal.type === "LONG" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  )}>
                    {signal.type === "LONG" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-on-surface tracking-tighter leading-none mb-1">{signal.symbol}</h5>
                    <span className={cn(
                      "text-[7px] font-black px-1.5 py-0.5 rounded-sm border uppercase tracking-widest",
                      getStatusColor(signal.status)
                    )}>
                      {signal.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[7px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-1">Score</p>
                  <p className={cn(
                    "text-sm font-black",
                    signal.score >= 80 ? "text-primary" : signal.score >= 60 ? "text-amber-500" : "text-on-surface-variant"
                  )}>{signal.score}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-surface-container/40 rounded border border-outline-variant/5">
                  <p className="text-[7px] font-black text-on-surface-variant uppercase mb-1">Entrada</p>
                  <p className="text-[10px] font-black text-on-surface">${signal.entry.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-surface-container/40 rounded border border-outline-variant/5">
                  <p className="text-[7px] font-black text-on-surface-variant uppercase mb-1">Stop Loss</p>
                  <p className="text-[10px] font-black text-secondary">${signal.stopLoss.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-30">
            <Activity className="w-8 h-8 mb-2" />
            <p className="text-[8px] font-black uppercase tracking-widest">Escaneando...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalSignals;
