import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Zap, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { useSignalStore, Signal } from "../../store/useSignalStore";
import { cn } from "../../lib/utils";

const SignalNotificationHandler: React.FC = () => {
  const activeSignals = useSignalStore(state => state.activeSignals);
  const navigate = useNavigate();
  const shownSignalsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    // On initial load, we don't want to show notifications for existing signals
    if (isInitialLoadRef.current && activeSignals.length > 0) {
      activeSignals.forEach(s => {
        if (s.id) shownSignalsRef.current.add(s.id);
      });
      isInitialLoadRef.current = false;
      return;
    }

    if (activeSignals.length > 0) {
      isInitialLoadRef.current = false;
    }

    activeSignals.forEach((signal) => {
      if (signal.id && !shownSignalsRef.current.has(signal.id) && signal.estado === 'activa') {
        shownSignalsRef.current.add(signal.id);
        
        // Show custom notification
        toast.custom((t) => (
          <div 
            onClick={() => {
              navigate(`/terminal?symbol=${signal.activo}`);
              toast.dismiss(t);
            }}
            className={cn(
              "w-full max-w-[320px] bg-surface-container-high border-2 rounded-2xl p-4 shadow-2xl cursor-pointer transition-all hover:scale-[1.02] active:scale-95 group",
              signal.tipo === 'LONG' ? "border-primary/40 shadow-primary/10" : "border-secondary/40 shadow-secondary/10"
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                signal.tipo === 'LONG' ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
              )}>
                {signal.tipo === 'LONG' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 space-y-0.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-on-surface uppercase tracking-tight">
                    {signal.activo}
                  </h4>
                  <div className={cn(
                    "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                    signal.tipo === 'LONG' ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  )}>
                    {signal.tipo}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                  <div className="bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/5">
                    <p className="text-[7px] font-black text-on-surface-variant uppercase tracking-widest">Entrada</p>
                    <p className="text-[10px] font-black text-on-surface">${signal.entry}</p>
                  </div>
                  <div className="bg-surface-container-low p-1.5 rounded-lg border border-outline-variant/5">
                    <p className="text-[7px] font-black text-on-surface-variant uppercase tracking-widest">Stop Loss</p>
                    <p className="text-[10px] font-black text-secondary">${signal.sl}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-1.5">
                  <p className="text-[8px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5" />
                    IA: {signal.confidence || 90}%
                  </p>
                  <div className="flex items-center gap-1 text-[8px] font-black text-on-surface-variant uppercase tracking-widest group-hover:text-primary transition-colors">
                    EJECUTAR
                    <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ), {
          duration: 10000,
          position: 'top-right',
        });
      }
    });
  }, [activeSignals, navigate]);

  return null;
};

export default SignalNotificationHandler;
