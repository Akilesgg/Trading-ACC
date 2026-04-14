import React from "react";
import { motion } from "motion/react";
import { Brain, Zap, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageRecommendationProps {
  title: string;
  recommendation: string;
  score: number;
  type?: "LONG" | "SHORT" | "NEUTRAL";
  className?: string;
}

const PageRecommendation: React.FC<PageRecommendationProps> = ({
  title,
  recommendation,
  score,
  type = "NEUTRAL",
  className
}) => {
  const getStatusColor = () => {
    if (score >= 90) return "text-primary border-primary/40 bg-primary/5";
    if (score >= 75) return "text-primary/80 border-primary/30 bg-primary/5";
    if (score >= 60) return "text-secondary border-secondary/40 bg-secondary/5";
    return "text-on-surface-variant border-outline-variant/20 bg-surface-container-high";
  };

  const getIcon = () => {
    if (score >= 90) return <ShieldCheck className="w-10 h-10" />;
    if (score >= 75) return <Zap className="w-10 h-10" />;
    return <Brain className="w-10 h-10" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-10 rounded-[3rem] border backdrop-blur-3xl relative overflow-hidden group shadow-2xl mb-12",
        getStatusColor(),
        className
      )}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-current opacity-[0.05] rounded-full blur-[100px] -mr-48 -mt-48"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
        <div className={cn(
          "w-24 h-24 rounded-[2rem] flex items-center justify-center border shadow-2xl flex-shrink-0 transition-transform group-hover:scale-110 duration-500",
          score >= 75 ? "bg-primary/20 border-primary/40 shadow-primary/30" : "bg-surface-container-highest border-outline-variant/20"
        )}>
          {getIcon()}
        </div>
        
        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h3 className="text-3xl font-black uppercase tracking-tighter text-on-surface">
              {title}
            </h3>
            <div className="flex items-center gap-3 justify-center md:justify-start">
              <span className={cn(
                "px-5 py-2 rounded-full text-[14px] font-black uppercase tracking-widest border shadow-lg",
                type === "LONG" ? "bg-primary text-on-primary border-primary/20" :
                type === "SHORT" ? "bg-secondary text-on-secondary border-secondary/20" :
                "bg-surface-container-high text-on-surface-variant border-outline-variant/10"
              )}>
                {type}
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-[14px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Score:</span>
                <span className={cn("text-2xl font-black tracking-tighter", score >= 75 ? "text-primary" : "text-on-surface")}>{score}%</span>
              </div>
            </div>
          </div>
          
          <p className="text-xl font-black text-on-surface leading-tight tracking-tight uppercase">
            {recommendation}
          </p>
          
          <div className="flex flex-wrap items-center gap-6 pt-4 justify-center md:justify-start border-t border-outline-variant/10">
            <div className="flex items-center gap-3">
              <div className={cn("w-3 h-3 rounded-full", score >= 60 ? "bg-primary animate-pulse shadow-[0_0_10px_rgba(0,255,163,0.5)]" : "bg-secondary")} />
              <span className="text-[13px] font-black uppercase tracking-widest opacity-80">
                {score >= 60 ? "Señal Validada por Multi-Confluencia" : "Esperando Confirmación de Estructura"}
              </span>
            </div>
            <div className="hidden sm:block w-px h-6 bg-outline-variant/20" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-[13px] font-black uppercase tracking-widest opacity-60">
                SISTEMA DE FILTRADO PRO v5.0
              </span>
            </div>
          </div>
        </div>

        {/* Visual Score Gauge */}
        <div className="hidden lg:block w-32 h-32 shrink-0 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="10" className="opacity-10" />
            <circle 
              cx="50" cy="50" r="40" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="10" 
              strokeDasharray={`${score * 2.51} 251`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black tracking-tighter">{score}%</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PageRecommendation;
