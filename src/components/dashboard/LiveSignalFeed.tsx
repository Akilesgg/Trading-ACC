import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ArrowRight, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSignalStore } from "../../store/useSignalStore";
import { cn } from "@/lib/utils";

const LiveSignalFeed: React.FC = () => {
  const activeSignals = useSignalStore(state => state.activeSignals);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter only active signals and sort by timestamp
  const displaySignals = activeSignals
    .filter(s => s.estado === 'activa')
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 10);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeSignals]);

  return (
    <div className="trading-card h-full flex flex-col p-0 overflow-hidden border-primary/20">
      <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-5 h-5 text-primary" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Señales Activas</h3>
        </div>
        <Activity className="w-4 h-4 text-on-surface-variant opacity-30" />
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2"
      >
        <AnimatePresence initial={false}>
          {displaySignals.length > 0 ? (
            displaySignals.map((signal) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => navigate(`/signal/${signal.activo}`)}
                className="p-4 bg-surface-container-high/40 hover:bg-surface-container-highest rounded-2xl border border-outline-variant/5 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-6 h-6 rounded-md flex items-center justify-center",
                      signal.tipo === "LONG" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                    )}>
                      {signal.tipo === "LONG" ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-[11px] font-black text-on-surface">{signal.activo}</span>
                  </div>
                  <span className="text-[10px] font-black text-primary">{signal.confidence || 90}%</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="bg-surface-container-low/50 p-1.5 rounded-lg">
                    <p className="text-[7px] font-black text-on-surface-variant uppercase tracking-widest">Precio</p>
                    <p className="text-[10px] font-black text-on-surface">${signal.entry}</p>
                  </div>
                  <div className="bg-surface-container-low/50 p-1.5 rounded-lg">
                    <p className="text-[7px] font-black text-on-surface-variant uppercase tracking-widest">SL</p>
                    <p className="text-[10px] font-black text-secondary">${signal.sl}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50">
                  <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                  <div className="flex items-center gap-1 group-hover:text-primary transition-colors">
                    VER ANÁLISIS
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-20 opacity-30">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-[9px] font-black uppercase tracking-widest">Escaneando mercado...</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default LiveSignalFeed;
