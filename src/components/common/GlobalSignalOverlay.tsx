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
  const activeSignals = useSignalStore(state => state.activeSignals);
  const [closedSignals, setClosedSignals] = React.useState<Set<string>>(new Set());

  const visibleSignals = activeSignals.filter(s => s.id && !closedSignals.has(s.id) && s.estado === 'activa');

  if (visibleSignals.length === 0) return null;

  const handleClose = (id: string) => {
    setClosedSignals(prev => new Set(prev).add(id));
  };

  return (
    <div className="fixed bottom-32 right-8 z-[200] flex flex-col-reverse gap-4 pointer-events-none max-h-[calc(100vh-160px)] overflow-y-auto no-scrollbar pr-2 pt-4">
      <AnimatePresence>
        {visibleSignals.map((signal) => (
          <motion.div
            key={signal.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="pointer-events-auto"
          >
            <div className="bg-[#0a0c0e]/95 backdrop-blur-2xl border border-primary/30 rounded-[1.5rem] p-4 w-64 shadow-[0_20px_50px_rgba(0,255,163,0.15)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[30px] -mr-12 -mt-12 group-hover:bg-primary/10 transition-all duration-1000"></div>
              
              <button 
                onClick={() => signal.id && handleClose(signal.id)}
                className="absolute top-3 right-3 z-20 p-1.5 bg-surface-container-high/50 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-secondary/10 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center justify-between mb-3 relative z-10 pr-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center border border-primary/30 shadow-lg">
                    <Zap className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-[8px] font-black text-primary uppercase tracking-[0.2em] leading-none mb-1">¡SEÑAL CALIENTE!</h4>
                    <p className="text-xs font-black text-on-surface tracking-tighter uppercase">{signal.activo}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3 relative z-10">
                <div className="bg-surface-container-high/50 p-2 rounded-lg border border-outline-variant/5">
                  <p className="text-[7px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Entrada</p>
                  <p className="text-[10px] font-black text-on-surface font-mono">${signal.entry?.toFixed(2)}</p>
                </div>
                <div className="bg-surface-container-high/50 p-2 rounded-lg border border-outline-variant/5">
                  <p className="text-[7px] font-black text-on-surface-variant uppercase tracking-widest mb-0.5">Stop Loss</p>
                  <p className="text-[10px] font-black text-secondary font-mono">${signal.sl?.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-1.5 mb-4 relative z-10">
                <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                  <span className="text-on-surface-variant opacity-60">Objetivos TP</span>
                  <div className="flex gap-1">
                    <span className="text-primary">T1</span>
                    {signal.tp2 && <span className="text-primary">T2</span>}
                    {signal.tp3 && <span className="text-primary">T3</span>}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <div className="flex-1 bg-primary/5 border border-primary/10 py-1.5 rounded-md text-center">
                    <p className="text-[9px] font-black text-on-surface font-mono">${signal.tp1.toFixed(2)}</p>
                  </div>
                  {signal.tp2 && (
                    <div className="flex-1 bg-primary/5 border border-primary/10 py-1.5 rounded-md text-center">
                      <p className="text-[9px] font-black text-on-surface font-mono">${signal.tp2.toFixed(2)}</p>
                    </div>
                  )}
                  {signal.tp3 && (
                    <div className="flex-1 bg-primary/5 border border-primary/10 py-1.5 rounded-md text-center">
                      <p className="text-[9px] font-black text-on-surface font-mono">${signal.tp3.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 relative z-10">
                <Link 
                  to={`/signal/${signal.activo}`}
                  className="flex-1 py-2.5 bg-primary text-on-primary rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Target className="w-2.5 h-2.5" />
                  VER ANÁLISIS
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GlobalSignalOverlay;
