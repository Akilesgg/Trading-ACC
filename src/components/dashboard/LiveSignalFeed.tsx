import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ArrowRight, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTerminalStore } from "../../store/useTerminalStore";
import { cn } from "@/lib/utils";

const LiveSignalFeed: React.FC = () => {
  const { signals } = useTerminalStore();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastSignals = signals.slice(0, 10);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [signals]);

  return (
    <div className="trading-card h-full flex flex-col p-0 overflow-hidden border-primary/20">
      <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Zap className="w-5 h-5 text-primary" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
          </div>
          <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Señales en Vivo</h3>
        </div>
        <Activity className="w-4 h-4 text-on-surface-variant opacity-30" />
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2"
      >
        <AnimatePresence initial={false}>
          {lastSignals.length > 0 ? (
            lastSignals.map((signal) => (
              <motion.div
                key={signal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => navigate(`/analysis?symbol=${signal.symbol}`)}
                className="p-4 bg-surface-container-high/40 hover:bg-surface-container-highest rounded-2xl border border-outline-variant/5 hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                      signal.type === "LONG" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                    )}>
                      {signal.type}
                    </span>
                    <span className="text-[11px] font-black text-on-surface">{signal.symbol}</span>
                  </div>
                  <span className="text-[10px] font-black text-primary">{signal.score}%</span>
                </div>
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-on-surface-variant opacity-50">
                  <span>{new Date(signal.timestamp).toLocaleTimeString()}</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
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
