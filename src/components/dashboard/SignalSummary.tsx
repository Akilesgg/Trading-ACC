import React from "react";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignalSummaryProps {
  signals: any[];
  activeFilter: string;
  onFilterClick: (id: any) => void;
}

const SignalSummary: React.FC<SignalSummaryProps> = ({ signals, activeFilter, onFilterClick }) => {
  return (
    <div className="trading-card space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="section-title flex items-center gap-3 mb-0">
          <Activity className="w-5 h-5 text-tertiary" />
          SEÑALES ACTIVAS
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">
            LIVE FEED
          </span>
        </div>
      </div>
      <div className="space-y-4">
        {signals.map((s) => (
          <button 
            key={s.label} 
            onClick={() => onFilterClick(s.id)}
            className={cn(
              "w-full flex justify-between items-center p-5 rounded-[1.5rem] transition-all active:scale-95 border group",
              activeFilter === s.id 
                ? "bg-primary/10 border-primary/30 shadow-lg shadow-primary/5" 
                : "bg-surface-container-high border-outline-variant/10 hover:border-primary/30 hover:bg-surface-container-highest"
            )}
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant group-hover:text-on-surface transition-colors">{s.label}</span>
            <span className={cn("text-3xl font-black tracking-tighter transition-transform group-hover:scale-110", s.color)}>{s.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SignalSummary;
