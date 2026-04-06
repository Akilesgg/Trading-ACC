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
          <a 
            key={i} 
            href={news.sourceUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block space-y-2 group cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-on-surface group-hover:text-primary transition-colors">
                {news.event}
              </h4>
              <span className="text-[10px] text-on-surface-variant font-mono">
                {news.time}
              </span>
            </div>
            
            <p className="text-[10px] text-on-surface-variant line-clamp-2 leading-relaxed">
              {news.description}
            </p>
            
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-[10px] font-black uppercase",
                news.impact === "CRITICAL" ? "text-secondary" : "text-orange-500"
              )}>
                {news.impact === "CRITICAL" ? "Alto Impacto" : "Medio Impacto"}
              </span>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                <span className="text-[10px] font-bold text-on-surface-variant ml-1">{news.probability}% Prob.</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default NewsFeed;
