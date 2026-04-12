import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Newspaper, 
  Star, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Globe, 
  BarChart3,
  ExternalLink,
  Clock,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchRealTimeNews, getMarketSentiment } from "@/services/geminiService";

const News: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentiment, setSentiment] = useState<string>("Cargando análisis de sentimiento...");

  const loadData = async () => {
    try {
      const [newsData, sentimentData] = await Promise.all([
        fetchRealTimeNews(),
        getMarketSentiment()
      ]);
      setNews(newsData);
      setSentiment(sentimentData);
    } catch (error) {
      console.error("Error loading news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface p-4 md:p-8 space-y-8 relative overflow-hidden">
      {/* Page Specific Background */}
      <div className="fixed inset-0 opacity-[0.06] grayscale contrast-150 pointer-events-none z-0">
        <img 
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
          alt="News Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="relative z-10 space-y-8">
        {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 -rotate-3">
              <Newspaper className="w-7 h-7 text-on-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-black uppercase tracking-tighter">Terminal de Noticias</h1>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Impacto Económico & Geopolítico en Tiempo Real</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-surface-container-low px-6 py-3 rounded-2xl border border-outline-variant/10 flex items-center gap-4 shadow-xl">
            <Globe className="w-5 h-5 text-primary animate-spin-slow" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Fuentes Globales</p>
              <p className="text-xs font-black text-on-surface uppercase">24/7 Monitoreo</p>
            </div>
          </div>
        </div>
      </header>

      {/* Impact Alert */}
      <section className="bg-secondary/10 border border-secondary/30 rounded-3xl p-6 flex items-center gap-6 shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center shrink-0">
          <AlertTriangle className="w-10 h-10 text-secondary animate-pulse" />
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black uppercase tracking-widest text-secondary">Alerta de Alta Volatilidad</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Se esperan movimientos bruscos en el mercado debido a los próximos anuncios de la Reserva Federal y tensiones geopolíticas en Europa. Ajuste su gestión de riesgo.
          </p>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Zap className="w-24 h-24 text-secondary" />
        </div>
      </section>

      {/* News Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {news.map((item, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/5 hover:border-primary/30 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                      item.impact === "CRITICAL" ? "bg-secondary/10 text-secondary" : "bg-orange-500/10 text-orange-500"
                    )}>
                      {item.impact === "CRITICAL" ? "Impacto Crítico" : "Impacto Alto"}
                    </span>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.date} | {item.time}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-headline font-black text-on-surface group-hover:text-primary transition-colors">
                    {item.event}
                  </h2>
                  
                  <p className="text-on-surface-variant leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-outline-variant/5">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-bold text-on-surface uppercase">{item.effect}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-orange-500 fill-orange-500" />
                      <span className="text-xs font-bold text-on-surface uppercase">Probabilidad: {item.probability}%</span>
                    </div>
                    {item.sourceUrl && (
                      <a 
                        href={item.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-primary hover:underline transition-all"
                      >
                        <Globe className="w-4 h-4" />
                        <span className="text-xs font-bold uppercase">Fuente</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="md:w-32 flex flex-col items-center gap-4">
                  <div className="w-24 h-24 rounded-2xl bg-surface-container flex flex-col items-center justify-center border border-outline-variant/10">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-1">Impacto</p>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star 
                          key={s} 
                          className={cn(
                            "w-3 h-3", 
                            s <= (item.impact === "CRITICAL" ? 5 : 3) ? "text-orange-500 fill-orange-500" : "text-on-surface-variant/20"
                          )} 
                        />
                      ))}
                    </div>
                  </div>
                  <button className="w-full py-3 bg-surface-container-high hover:bg-primary/10 hover:text-primary rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest">
                    Detalles <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="space-y-8">
          {/* Market Sentiment Summary */}
          <section className="bg-[#0a0c10] border border-primary/30 rounded-3xl p-8 space-y-6 shadow-2xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Resumen de Sentimiento
            </h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-on-surface-variant">Alcista</span>
                  <span className="text-primary">64%</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "64%" }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase">
                  <span className="text-on-surface-variant">Bajista</span>
                  <span className="text-secondary">36%</span>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: "36%" }}></div>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-on-surface-variant italic leading-relaxed">
              "{sentiment}"
            </p>
          </section>

          {/* Economic Calendar Widget */}
          <section className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 space-y-6 shadow-xl">
            <h3 className="text-sm font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
              <Clock className="w-4 h-4 text-on-surface-variant" /> Próximos Eventos
            </h3>
            <div className="space-y-4">
              {[
                { time: "Mañana 14:30", event: "IPC EE.UU.", impact: "Alto" },
                { time: "Jueves 13:00", event: "Decisión Tipos BCE", impact: "Crítico" },
                { time: "Viernes 15:00", event: "NFP (Nóminas no Agrícolas)", impact: "Alto" }
              ].map((e, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-surface-container rounded-2xl border border-outline-variant/5">
                  <div>
                    <p className="text-xs font-black text-on-surface">{e.event}</p>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase">{e.time}</p>
                  </div>
                  <span className={cn(
                    "text-[8px] font-black px-2 py-1 rounded uppercase",
                    e.impact === "Crítico" ? "bg-secondary/10 text-secondary" : "bg-orange-500/10 text-orange-500"
                  )}>
                    {e.impact}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
        </div>
      </div>
    </div>
  );
};

export default News;
