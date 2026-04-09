import React from "react";
import { motion } from "motion/react";
import { Bell, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface MarketPulseProps {
  sentiment: string;
  onShowSettings: () => void;
  marketRegime?: string;
}

const MarketPulse: React.FC<MarketPulseProps> = ({ sentiment, onShowSettings, marketRegime }) => {
  return (
    <div className="trading-card border-l-4 border-primary relative overflow-visible group min-h-[420px] flex flex-col p-8 h-full">
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -mr-48 -mt-48 group-hover:bg-primary/10 transition-all duration-1000 pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_15px_rgba(0,255,163,0.8)]"></div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] text-on-surface opacity-80">Índice de Miedo y Codicia</span>
          </div>
          {marketRegime && (
            <div className="px-4 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/10 flex items-center gap-2">
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                marketRegime.includes("TRENDING_UP") ? "bg-primary" : marketRegime.includes("TRENDING_DOWN") ? "bg-secondary" : "bg-tertiary"
              )} />
              <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                RÉGIMEN: <span className="text-on-surface">{marketRegime.replace("_", " ")}</span>
              </span>
            </div>
          )}
          <button 
            onClick={onShowSettings}
            className="p-3 bg-surface-container-high rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-all group/btn shadow-xl active:scale-90"
          >
            <Bell className="w-5 h-5 text-on-surface-variant group-hover/btn:text-primary transition-colors" />
          </button>
        </div>

        {/* Main Content Section */}
        <div className="flex-1 flex flex-col justify-center py-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-[0.9] uppercase flex flex-col">
              <span className="text-primary drop-shadow-[0_0_30px_rgba(0,255,163,0.4)] filter brightness-110">CODICIA</span>
              <span className="text-on-surface">EXTREMA</span>
            </h2>
            <p className="text-on-surface-variant text-[12px] font-medium uppercase tracking-widest max-w-md leading-relaxed opacity-60 border-l-2 border-primary/20 pl-4">
              {sentiment}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-baseline gap-4">
              <span className="text-7xl font-black tracking-tighter text-on-surface drop-shadow-2xl">84</span>
              <div className="flex flex-col">
                <span className="text-primary font-black text-[11px] uppercase tracking-widest bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/20 shadow-lg shadow-primary/5 inline-flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5" />
                  +12% VS AYER
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Section */}
        <div className="pt-6 border-t border-outline-variant/5">
          <Link 
            to="/market"
            className="btn-primary w-full py-5 text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_20px_40px_rgba(0,255,163,0.15)] hover:shadow-primary/30 transition-all active:scale-95 text-center block"
          >
            Ver Mapa de Calor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MarketPulse;
