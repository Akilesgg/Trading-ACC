import React from "react";
import { motion } from "motion/react";
import { Bell, Zap } from "lucide-react";
import { Link } from "react-router-dom";

interface MarketPulseProps {
  sentiment: string;
  onShowSettings: () => void;
}

const MarketPulse: React.FC<MarketPulseProps> = ({ sentiment, onShowSettings }) => {
  return (
    <div className="lg:col-span-2 trading-card border-l-4 border-primary relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-primary/10 transition-all duration-1000"></div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="section-title mb-0">Sentimiento Global</span>
              <div className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(0,255,163,0.5)]"></div>
            </div>
            <button 
              onClick={onShowSettings}
              className="p-3 bg-surface-container-high rounded-2xl border border-outline-variant/10 hover:border-primary/30 transition-all group/btn shadow-lg"
            >
              <Bell className="w-5 h-5 text-on-surface-variant group-hover/btn:text-primary transition-colors" />
            </button>
          </div>
          <h2 className="text-[4.5rem] font-black tracking-tighter leading-[0.9] mb-6 uppercase">
            <span className="text-primary drop-shadow-[0_0_20px_rgba(0,255,163,0.3)]">CODICIA</span><br />
            <span className="text-on-surface">EXTREMA</span>
          </h2>
          <p className="text-on-surface-variant text-[11px] font-black uppercase tracking-widest max-w-md leading-relaxed opacity-70">
            {sentiment}
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mt-12">
          <div className="space-y-2">
            <p className="text-on-surface-variant text-[10px] font-black uppercase tracking-widest opacity-50">Fear & Greed Index</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black tracking-tighter text-on-surface">84</span>
              <span className="text-primary font-black text-[11px] uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 shadow-lg shadow-primary/5">+12% VS AYER</span>
            </div>
          </div>
          <Link 
            to="/market"
            className="btn-primary px-10 py-4 text-[11px]"
          >
            Ver Mapa de Calor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MarketPulse;
