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
      case SignalStatus.TP_HIT: return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case SignalStatus.SL_HIT: return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-on-surface-variant bg-surface-container-high border-outline-variant/10";
    }
  };

  return (
    <div className="h-full flex flex-col p-4 bg-surface-container-low/50 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <Flame className="w-3 h-3" /> SEÑALES ACTIVAS
        </h4>
        <div className="flex gap-2">
          <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-1 rounded-full uppercase tracking-widest">
            {signals.length} ACTIVAS
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4">
        {signals.length > 0 ? (
          signals.map((signal) => (
            <div 
              key={signal.id} 
              className="bg-surface-container-high/50 border border-outline-variant/10 rounded-xl p-4 hover:border-primary/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                <Brain className="w-4 h-4 text-primary" />
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shadow-lg",
                    signal.type === "LONG" ? "bg-primary/20 text-primary shadow-primary/10" : "bg-secondary/20 text-secondary shadow-secondary/10"
                  )}>
                    {signal.type === "LONG" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-on-surface tracking-tighter">{signal.symbol}</h5>
                    <span className={cn(
                      "text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest",
                      getStatusColor(signal.status)
                    )}>
                      {signal.status}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Score</p>
                  <p className={cn(
                    "text-lg font-headline font-black",
                    signal.score >= 80 ? "text-primary" : signal.score >= 60 ? "text-amber-500" : "text-on-surface-variant"
                  )}>{signal.score}%</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/5">
                  <p className="text-[8px] font-black text-on-surface-variant uppercase mb-1 flex items-center gap-1">
                    <Target className="w-2 h-2" /> Entrada
                  </p>
                  <p className="text-xs font-black text-on-surface">${signal.entry.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-surface-container rounded-lg border border-outline-variant/5">
                  <p className="text-[8px] font-black text-on-surface-variant uppercase mb-1 flex items-center gap-1">
                    <Shield className="w-2 h-2" /> Stop Loss
                  </p>
                  <p className="text-xs font-black text-secondary">${signal.stopLoss.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-primary" />
                  <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">R:R: {signal.riskReward}</span>
                </div>
                <button className="text-[8px] font-black text-primary uppercase tracking-widest hover:underline">
                  Ver Detalles
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-50">
            <Zap className="w-12 h-12 text-on-surface-variant animate-pulse" />
            <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
              Escaneando mercado en busca de oportunidades...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalSignals;
