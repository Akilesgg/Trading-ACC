import React from "react";
import { Newspaper, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsFeedProps {
  economicEvents: any[];
}

const NewsFeed: React.FC<NewsFeedProps> = ({ economicEvents }) => {
  return (
    <div className="trading-card space-y-6">
      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
        <Newspaper className="w-5 h-5 text-on-surface-variant" />
        <h3 className="section-title mb-0">
          NOTICIAS DE IMPACTO
        </h3>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {economicEvents.map((news, i) => (
          <div 
            key={i} 
            className="block space-y-3 p-4 bg-surface-container-high/40 rounded-2xl border border-outline-variant/5 group hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-on-surface group-hover:text-primary transition-colors uppercase tracking-widest">
                {news.event}
              </h4>
              <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest">
                {news.time}
              </span>
            </div>
            
            <p className="text-[10px] text-on-surface-variant leading-relaxed font-medium">
              {news.description}
            </p>

            <div className="p-3 bg-surface-container-high rounded-xl border-l-2 border-primary/50">
              <p className="text-[9px] text-on-surface font-medium leading-relaxed">
                <span className="text-primary font-black uppercase mr-1 tracking-widest">Análisis:</span>
                {news.details}
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-widest",
                  news.impact === "CRITICAL" ? "text-secondary" : "text-orange-500"
                )}>
                  {news.impact === "CRITICAL" ? "Alto Impacto" : "Medio Impacto"}
                </span>
                <div className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                  news.recommendation === "COMPRA" ? "bg-primary/10 text-primary" :
                  news.recommendation === "VENTA" ? "bg-secondary/10 text-secondary" : "bg-tertiary/10 text-tertiary"
                )}>
                  REC: {news.recommendation}
                </div>
              </div>
              <a 
                href={news.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[9px] font-black text-primary uppercase hover:text-primary-dim transition-colors tracking-widest"
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
