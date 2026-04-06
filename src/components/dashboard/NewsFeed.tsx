import React from "react";
import { Newspaper, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsFeedProps {
  economicEvents: any[];
}

const NewsFeed: React.FC<NewsFeedProps> = ({ economicEvents }) => {
  return (
    <div className="bg-[#0a0c10] border border-outline-variant/10 rounded-2xl p-6 space-y-6 shadow-2xl">
      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
        <Newspaper className="w-5 h-5 text-on-surface-variant" />
        <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
          NOTICIAS DE IMPACTO
        </h3>
      </div>

      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {economicEvents.map((news, i) => (
          <div 
            key={i} 
            className="block space-y-3 p-4 bg-surface-container/20 rounded-xl border border-outline-variant/5 group"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors">
                {news.event}
              </h4>
              <span className="text-[10px] text-on-surface-variant font-mono">
                {news.time}
              </span>
            </div>
            
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              {news.description}
            </p>

            <div className="p-2 bg-surface-container/40 rounded-lg border-l-2 border-primary/50">
              <p className="text-[9px] text-on-surface font-medium leading-tight">
                <span className="text-primary font-black uppercase mr-1">Análisis:</span>
                {news.details}
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[10px] font-black uppercase",
                  news.impact === "CRITICAL" ? "text-secondary" : "text-orange-500"
                )}>
                  {news.impact === "CRITICAL" ? "Alto Impacto" : "Medio Impacto"}
                </span>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                  news.recommendation === "COMPRA" ? "bg-primary/20 text-primary" :
                  news.recommendation === "VENTA" ? "bg-secondary/20 text-secondary" : "bg-tertiary/20 text-tertiary"
                )}>
                  REC: {news.recommendation}
                </div>
              </div>
              <a 
                href={news.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] font-black text-primary uppercase hover:underline"
              >
                Fuente Oficial
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
