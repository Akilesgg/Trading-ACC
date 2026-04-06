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
    <div className="bg-surface-container-high p-6 rounded-xl space-y-6 border border-outline-variant/10">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-lg font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-tertiary" />
          SEÑALES ACTIVAS
        </h3>
        <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest animate-pulse">
          LIVE FEED
        </span>
      </div>
      <div className="space-y-4">
        {signals.map((s) => (
          <button 
            key={s.label} 
            onClick={() => onFilterClick(s.id)}
            className={cn(
              "w-full flex justify-between items-center p-3 rounded-lg transition-all active:scale-95",
              activeFilter === s.id ? "bg-primary/10 border border-primary/30" : "bg-surface-container hover:bg-surface-container-highest"
            )}
          >
            <span className="text-sm font-label uppercase tracking-wider text-on-surface-variant">{s.label}</span>
            <span className={cn("font-headline font-bold text-xl", s.color)}>{s.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SignalSummary;
