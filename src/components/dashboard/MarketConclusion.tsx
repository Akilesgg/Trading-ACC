import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, X, TrendingUp, TrendingDown, Target, Shield, Zap, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketConclusionProps {
  sentiment: string;
  regime: string;
}

const MarketConclusion: React.FC<MarketConclusionProps> = ({ sentiment, regime }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 right-8 z-[60] w-16 h-16 bg-primary rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,255,163,0.5)] border-4 border-background group"
      >
        <Brain className="w-8 h-8 text-on-primary group-hover:animate-pulse" />
        <div className="absolute -top-2 -right-2 bg-secondary text-on-secondary text-[10px] font-black px-2 py-1 rounded-full border-2 border-background shadow-lg">
          IA
        </div>
      </motion.button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl trading-card p-0 overflow-hidden shadow-[0_0_100px_rgba(0,255,163,0.2)] border-primary/20"
            >
              {/* Header */}
              <div className="p-8 bg-gradient-to-br from-primary/10 to-transparent border-b border-outline-variant/10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                    <Brain className="w-7 h-7 text-on-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tighter uppercase text-on-surface">Conclusión del Mercado</h2>
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Análisis Cuántico en Tiempo Real</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-3 hover:bg-surface-container-high rounded-xl transition-all"
                >
                  <X className="w-6 h-6 text-on-surface-variant" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {/* Sentiment & Regime */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-surface-container-high rounded-3xl border border-outline-variant/10 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Zap className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Sentimiento IA</span>
                    </div>
                    <p className="text-sm font-black text-on-surface leading-relaxed">
                      {sentiment}
                    </p>
                  </div>
                  <div className="p-6 bg-surface-container-high rounded-3xl border border-outline-variant/10 space-y-3">
                    <div className="flex items-center gap-2 text-secondary">
                      <Target className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Régimen Actual</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border",
                        regime.includes("TRENDING_UP") ? "bg-primary/10 text-primary border-primary/20" : 
                        regime.includes("TRENDING_DOWN") ? "bg-secondary/10 text-secondary border-secondary/20" : 
                        "bg-tertiary/10 text-tertiary border-tertiary/20"
                      )}>
                        {regime.replace("_", " ")}
                      </div>
                    </div>
                    <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed opacity-60">
                      El mercado muestra una estructura de {regime.toLowerCase().includes('trending') ? 'tendencia definida' : 'rango lateral'}. Se recomienda ajustar el apalancamiento según la volatilidad detectada.
                    </p>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="space-y-4">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-on-surface-variant opacity-50">Recomendaciones Operativas</h3>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-3xl border border-primary/10">
                      <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center shrink-0">
                        <TrendingUp className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-on-surface uppercase mb-1">Estrategia Alcista</p>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          Buscar entradas en retrocesos a la EMA de 20 periodos en 1H. Priorizar activos con RSI inferior a 40 que muestren divergencias alcistas.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-6 bg-secondary/5 rounded-3xl border border-secondary/10">
                      <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center shrink-0">
                        <TrendingDown className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-on-surface uppercase mb-1">Gestión de Riesgo</p>
                        <p className="text-[11px] text-on-surface-variant leading-relaxed">
                          Colocar Stop Loss por debajo del último mínimo estructural. No exceder el 2% de riesgo por operación dada la volatilidad del régimen actual.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footnote */}
                <div className="p-6 bg-surface-container-lowest rounded-3xl border border-outline-variant/5 flex items-center gap-4">
                  <Shield className="w-6 h-6 text-on-surface-variant opacity-30" />
                  <p className="text-[9px] text-on-surface-variant font-medium leading-tight italic">
                    Este análisis es generado por un modelo de IA y no constituye asesoría financiera. Realice su propia investigación antes de operar.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 bg-surface-container-high/50 border-t border-outline-variant/10 text-center">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-12 py-4 bg-on-background text-background rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-primary hover:text-on-primary transition-all active:scale-95"
                >
                  Entendido, Continuar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MarketConclusion;
