import React from "react";
import { motion } from "motion/react";
import { Bell, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FearGreedData } from "@/services/cryptoService";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface MarketPulseProps {
  sentiment: string;
  onShowSettings: () => void;
  marketRegime?: string;
  fearGreedHistory?: FearGreedData[];
}

const MarketPulse: React.FC<MarketPulseProps> = ({ sentiment, onShowSettings, marketRegime, fearGreedHistory = [] }) => {
  const latestData = fearGreedHistory[fearGreedHistory.length - 1];
  const currentValue = latestData?.value || 0;
  const classification = latestData?.value_classification || "CARGANDO...";
  
  // Calculate change vs yesterday
  const yesterdayValue = fearGreedHistory.length > 1 ? fearGreedHistory[fearGreedHistory.length - 2].value : currentValue;
  const diff = currentValue - yesterdayValue;
  const diffPercent = yesterdayValue !== 0 ? ((diff / yesterdayValue) * 100).toFixed(1) : "0";

  const getSentimentColor = (val: number) => {
    if (val >= 75) return "text-primary"; // Extreme Greed
    if (val >= 55) return "text-primary/70"; // Greed
    if (val >= 45) return "text-tertiary"; // Neutral
    if (val >= 25) return "text-secondary/70"; // Fear
    return "text-secondary"; // Extreme Fear
  };

  const getSentimentLabel = (label: string) => {
    const map: Record<string, string> = {
      "Extreme Greed": "CODICIA EXTREMA",
      "Greed": "CODICIA",
      "Neutral": "NEUTRAL",
      "Fear": "MIEDO",
      "Extreme Fear": "MIEDO EXTREMO"
    };
    return map[label] || label.toUpperCase();
  };

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
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-4">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className={cn(
                "text-4xl md:text-5xl font-black tracking-tighter leading-[0.9] uppercase flex flex-col",
                getSentimentColor(currentValue)
              )}>
                {getSentimentLabel(classification).split(' ').map((word, i) => (
                  <span key={i} className={i === 1 ? "text-on-surface" : ""}>{word}</span>
                ))}
              </h2>
              <p className="text-on-surface-variant text-[11px] font-medium uppercase tracking-widest max-w-md leading-relaxed opacity-60 border-l-2 border-primary/20 pl-4 line-clamp-3">
                {sentiment}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-baseline gap-4">
                <span className="text-7xl font-black tracking-tighter text-on-surface drop-shadow-2xl">{currentValue}</span>
                <div className="flex flex-col">
                  <span className={cn(
                    "font-black text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg border shadow-lg inline-flex items-center gap-2",
                    diff >= 0 ? "text-primary bg-primary/10 border-primary/20" : "text-secondary bg-secondary/10 border-secondary/20"
                  )}>
                    <Zap className="w-3.5 h-3.5" />
                    {diff >= 0 ? "+" : ""}{diffPercent}% VS AYER
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="h-[180px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={fearGreedHistory}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="timestamp" 
                  hide 
                />
                <YAxis 
                  domain={[0, 100]} 
                  hide 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-surface-container-highest border border-outline-variant/20 p-3 rounded-xl shadow-2xl backdrop-blur-xl">
                          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                            {new Date(payload[0].payload.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-lg font-black text-on-surface">
                            {payload[0].value}
                          </p>
                          <p className="text-[9px] font-bold text-on-surface-variant uppercase">
                            {payload[0].payload.value_classification}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Gauge Background Line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-outline-variant/10"></div>
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
