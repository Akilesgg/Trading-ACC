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
    <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-xl border-l-4 border-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 animate-pulse"></div>
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-label uppercase tracking-widest text-primary-dim">Sentimiento del Mercado Global</span>
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            </div>
            <button 
              onClick={onShowSettings}
              className="p-2 bg-surface-container-highest rounded-xl border border-outline-variant/10 hover:bg-primary/10 transition-colors group"
            >
              <Bell className="w-4 h-4 text-on-surface-variant group-hover:text-primary" />
            </button>
          </div>
          <h2 className="font-headline text-[3.5rem] font-bold tracking-tight leading-none mb-4 uppercase">
            <span className="text-primary">CODICIA</span> EXTREMA
          </h2>
          <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest max-w-md line-clamp-2">
            {sentiment}
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-8">
          <div className="space-y-1">
            <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest">Índice de Miedo y Codicia</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-headline font-bold">84</span>
              <span className="text-primary-dim font-bold text-sm">+12% vs ayer</span>
            </div>
          </div>
          <Link 
            to="/market"
            className="bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed px-8 py-4 rounded-full font-bold uppercase tracking-wider shadow-[0_10px_20px_rgba(0,255,163,0.2)] active:scale-95 transition-transform text-center"
          >
            Ver Mapa de Calor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MarketPulse;
