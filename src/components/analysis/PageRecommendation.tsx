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
    if (score >= 90) return "text-primary border-primary/30 bg-primary/5";
    if (score >= 75) return "text-primary/80 border-primary/20 bg-primary/5";
    if (score >= 60) return "text-secondary border-secondary/30 bg-secondary/5";
    return "text-on-surface-variant border-outline-variant/20 bg-surface-container-high";
  };

  const getIcon = () => {
    if (score >= 90) return <ShieldCheck className="w-6 h-6" />;
    if (score >= 75) return <Zap className="w-6 h-6" />;
    return <Brain className="w-6 h-6" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-8 rounded-[2.5rem] border backdrop-blur-3xl relative overflow-hidden group shadow-2xl mb-8",
        getStatusColor(),
        className
      )}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-current opacity-[0.03] rounded-full blur-[80px] -mr-32 -mt-32"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
        <div className={cn(
          "w-20 h-20 rounded-3xl flex items-center justify-center border shadow-2xl flex-shrink-0",
          score >= 75 ? "bg-primary/20 border-primary/30 shadow-primary/20" : "bg-surface-container-highest border-outline-variant/20"
        )}>
          {getIcon()}
        </div>
        
        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-3">
            <h3 className="text-2xl font-black uppercase tracking-tighter text-on-surface">
              {title}
            </h3>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <span className={cn(
                "px-4 py-1 rounded-full text-[12px] font-black uppercase tracking-widest border",
                type === "LONG" ? "bg-primary/10 text-primary border-primary/20" :
                type === "SHORT" ? "bg-secondary/10 text-secondary border-secondary/20" :
                "bg-surface-container-high text-on-surface-variant border-outline-variant/10"
              )}>
                {type}
              </span>
              <span className="text-[12px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">
                Score: {score}%
              </span>
            </div>
          </div>
          
          <p className="text-lg font-bold text-on-surface leading-relaxed italic">
            "{recommendation}"
          </p>
          
          <div className="flex items-center gap-4 pt-2 justify-center md:justify-start">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", score >= 60 ? "bg-primary animate-pulse" : "bg-secondary")} />
              <span className="text-[12px] font-black uppercase tracking-widest opacity-70">
                {score >= 60 ? "Señal Validada" : "Esperando Confluencia"}
              </span>
            </div>
            <div className="w-px h-4 bg-outline-variant/20" />
            <span className="text-[12px] font-black uppercase tracking-widest opacity-50">
              SISTEMA DE FILTRADO PRO v5.0
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PageRecommendation;
