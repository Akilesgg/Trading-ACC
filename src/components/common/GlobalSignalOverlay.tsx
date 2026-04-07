import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  X, 
  Target, 
  ArrowRight,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSignalStore } from "@/store/useSignalStore";
import { Link } from "react-router-dom";

const GlobalSignalOverlay: React.FC = () => {
  const { activeSignals, removeSignal } = useSignalStore();

  if (activeSignals.length === 0) return null;

  return (
    <div className="fixed bottom-8 right-8 z-[200] flex flex-col gap-4 pointer-events-none">
      <AnimatePresence>
        {activeSignals.map((signal, idx) => (
          <motion.div
            key={signal.symbol}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="pointer-events-auto"
          >
            <div className="bg-[#0a0c0e]/95 backdrop-blur-2xl border border-primary/30 rounded-[2rem] p-6 w-80 shadow-[0_20px_50px_rgba(0,255,163,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-primary/10 transition-all duration-1000"></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-lg">
                    <Zap className="w-5 h-5 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">¡SEÑAL CALIENTE!</h4>
                    <p className="text-sm font-black text-on-surface tracking-tighter uppercase">{signal.symbol}</p>
                  </div>
                </div>
                <button 
                  onClick={() => removeSignal(signal.symbol)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-on-surface-variant" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 relative z-10">
                <div className="bg-surface-container-high/50 p-3 rounded-xl border border-outline-variant/5">
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Entrada</p>
                  <p className="text-xs font-black text-on-surface font-mono">${signal.entry?.toFixed(2)}</p>
                </div>
                <div className="bg-surface-container-high/50 p-3 rounded-xl border border-outline-variant/5">
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Stop Loss</p>
                  <p className="text-xs font-black text-secondary font-mono">${signal.stopLoss?.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-2 mb-6 relative z-10">
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                  <span className="text-on-surface-variant opacity-60">Objetivos TP</span>
                  <div className="flex gap-1">
                    {signal.takeProfits?.slice(0, 3).map((tp, i) => (
                      <span key={i} className="text-primary">T{i+1}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  {signal.takeProfits?.slice(0, 3).map((tp, i) => (
                    <div key={i} className="flex-1 bg-primary/5 border border-primary/10 py-2 rounded-lg text-center">
                      <p className="text-[10px] font-black text-on-surface font-mono">${tp.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 relative z-10">
                <Link 
                  to={`/signal/${signal.symbol}`}
                  onClick={() => removeSignal(signal.symbol)}
                  className="flex-1 py-3 bg-primary text-on-primary rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Target className="w-3 h-3" />
                  Ver Análisis
                </Link>
                <div className="px-3 py-3 bg-surface-container-high rounded-xl border border-outline-variant/10 flex items-center gap-2">
                  <Bell className="w-3 h-3 text-primary" />
                  <span className="text-[9px] font-black text-on-surface">{signal.consensus}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSignalOverlay;
