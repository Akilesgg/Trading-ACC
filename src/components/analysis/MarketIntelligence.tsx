import React from "react";
import { motion } from "motion/react";
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Zap,
  MessageSquare,
  Twitter,
  Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketIntelligenceProps {
  data: {
    sentiment: { long: number; short: number; intensity: string };
    topAssets: string[];
    signals: any[];
    alerts: string[];
    consensus: string;
  };
  loading?: boolean;
}

const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="trading-card animate-pulse space-y-6">
        <div className="h-8 bg-surface-container-high rounded-xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 bg-surface-container-high rounded-3xl"></div>
          <div className="h-40 bg-surface-container-high rounded-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-on-surface uppercase tracking-tight">Inteligencia Externa</h3>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Análisis de X, Reddit y Telegram</p>
          </div>
        </div>
        <div className={cn(
          "px-6 py-2 rounded-full border font-black text-[10px] uppercase tracking-widest",
          data.consensus === "BULLISH" ? "bg-primary/10 text-primary border-primary/20" :
          data.consensus === "BEARISH" ? "bg-secondary/10 text-secondary border-secondary/20" :
          "bg-surface-container-high text-on-surface-variant border-outline-variant/10"
        )}>
          Consenso: {data.consensus}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sentiment Gauges */}
        <div className="lg:col-span-5 trading-card space-y-8">
          <h4 className="text-sm font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Sentimiento del Mercado
          </h4>
          
          <div className="space-y-8">
            <div className="relative h-4 bg-surface-container rounded-full overflow-hidden flex">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.sentiment.long}%` }}
                className="h-full bg-primary relative group"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${data.sentiment.short}%` }}
                className="h-full bg-secondary relative group"
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-center">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">LONG</p>
                <p className="text-3xl font-black text-on-surface tracking-tighter">{data.sentiment.long}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Intensidad</p>
                <p className="text-sm font-black text-primary uppercase">{data.sentiment.intensity}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">SHORT</p>
                <p className="text-3xl font-black text-on-surface tracking-tighter">{data.sentiment.short}%</p>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-outline-variant/5">
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Top Activos Mencionados</p>
            <div className="flex flex-wrap gap-2">
              {data.topAssets.map((asset, i) => (
                <span key={i} className="px-3 py-1.5 bg-surface-container-high rounded-xl border border-outline-variant/10 text-[10px] font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                  <Hash className="w-3 h-3 text-primary" /> {asset}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Signals & Alerts */}
        <div className="lg:col-span-7 space-y-8">
          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="space-y-4">
              {data.alerts.map((alert, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="p-4 bg-secondary/10 border border-secondary/30 rounded-2xl flex items-center gap-4 shadow-lg"
                >
                  <AlertTriangle className="w-5 h-5 text-secondary shrink-0" />
                  <p className="text-[11px] font-black text-secondary uppercase tracking-tight leading-relaxed">{alert}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* External Signals */}
          <div className="trading-card space-y-6">
            <h4 className="text-sm font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" /> Señales Detectadas
            </h4>
            
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {data.signals.length > 0 ? (
                data.signals.map((signal, i) => (
                  <div key={i} className="p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/5 flex items-center justify-between group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                        signal.type === "LONG" ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary/10 border-secondary/20 text-secondary"
                      )}>
                        {signal.type === "LONG" ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-on-surface uppercase tracking-tighter">{signal.asset} {signal.type}</p>
                        <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Fuente: {signal.source}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-on-surface uppercase tracking-tight">Entrada: ${signal.entry}</p>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">TP: ${signal.tp}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 space-y-4">
                  <MessageSquare className="w-12 h-12 text-on-surface-variant/20 mx-auto" />
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">No se han detectado señales claras en las últimas horas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence;
