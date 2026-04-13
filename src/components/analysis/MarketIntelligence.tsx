import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Users, 
  Zap,
  MessageSquare,
  Twitter,
  Hash,
  RefreshCw,
  Clock,
  BarChart3,
  Dices,
  LineChart,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { externalIntelService, ExternalIntelData } from "@/services/externalIntel";

interface MarketIntelligenceProps {
  data?: any; // Keep for compatibility but we will use internal state for better control
  loading?: boolean;
  onRefresh?: () => void;
  symbol?: string;
}

const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({ symbol = "BTCUSDT" }) => {
  const [intel, setIntel] = useState<ExternalIntelData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadIntel = async (force = false) => {
    setLoading(true);
    try {
      const data = await externalIntelService.getIntelligence(symbol, force);
      setIntel(data);
    } catch (error) {
      console.error("Error loading intelligence:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIntel();
    const interval = setInterval(() => loadIntel(), 10 * 60 * 1000); // 10 mins
    return () => clearInterval(interval);
  }, [symbol]);

  if (loading && !intel) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-12 bg-surface-container-high rounded-2xl w-1/2"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-surface-container-high rounded-[2.5rem]"></div>
          <div className="h-64 bg-surface-container-high rounded-[2.5rem]"></div>
        </div>
      </div>
    );
  }

  const data = intel || {
    sentiment: { long: 50, short: 50, intensity: "MEDIUM" },
    narrative: "Análisis en curso...",
    trendingTopics: ["BTC", "ETH", "SOL"],
    whaleActivity: "Escaneando movimientos...",
    keyLevels: { support: [], resistance: [] },
    signals: [],
    polymarket: { cryptoBets: [], popularBets: [] },
    stockMarket: null,
    alerts: [],
    consensus: "NEUTRAL",
    lastUpdate: new Date().toISOString()
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
            <Globe className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-on-surface uppercase tracking-tighter">Inteligencia Externa</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Fuentes: X, Reddit, Telegram, Foros, On-Chain</span>
              <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest">Live Scan</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end mr-2">
            <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Última actualización</p>
            <p className="text-[10px] font-bold text-on-surface uppercase">{new Date(data.lastUpdate).toLocaleTimeString()}</p>
          </div>
          <button 
            onClick={() => loadIntel(true)}
            disabled={loading}
            className="p-4 bg-primary text-on-primary rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50 group"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Polymarket Intelligence - Expanded Section */}
      <div className="bg-surface-container-high/60 p-8 rounded-[2.5rem] border border-outline-variant/10 backdrop-blur-xl space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary/50 to-primary"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
              <Dices className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="text-xl font-black text-on-surface uppercase tracking-tight">PolyMarket Intelligence</h4>
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Predicciones en Tiempo Real y Apuestas de Mercado</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-xl border border-outline-variant/5">
            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Estado:</span>
            <span className="text-[9px] font-black text-primary uppercase tracking-widest animate-pulse">Sincronizado</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Top 10 Crypto Bets */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
              <h5 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Top 10 Crypto Bets
              </h5>
              <span className="text-[8px] font-black text-on-surface-variant uppercase opacity-50">Basado en Volumen</span>
            </div>
            
            <div className="space-y-3">
              {data.polymarket?.cryptoBets && data.polymarket.cryptoBets.length > 0 ? (
                data.polymarket.cryptoBets.map((item: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className="p-4 bg-surface-container-low/40 rounded-2xl border border-outline-variant/5 flex items-center justify-between group hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-on-surface-variant opacity-30 w-4">{i + 1}</span>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors">{item.market}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded border border-primary/10">{item.odds}</span>
                          <span className="text-[9px] font-medium text-on-surface-variant opacity-50 uppercase">{item.volume} Vol.</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      item.trend === "UP" ? "bg-primary/10 text-primary" : item.trend === "DOWN" ? "bg-secondary/10 text-secondary" : "bg-surface-container text-on-surface-variant"
                    )}>
                      {item.trend === "UP" ? <ArrowUpRight className="w-3.5 h-3.5" /> : item.trend === "DOWN" ? <ArrowDownRight className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center space-y-3 opacity-30">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Escaneando apuestas cripto...</p>
                </div>
              )}
            </div>
          </div>

          {/* Top 10 Popular Bets */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
              <h5 className="text-xs font-black uppercase tracking-[0.2em] text-on-surface flex items-center gap-2">
                <Globe className="w-4 h-4 text-secondary" /> Top 10 Popular Bets
              </h5>
              <span className="text-[8px] font-black text-on-surface-variant uppercase opacity-50">Tendencia Global</span>
            </div>
            
            <div className="space-y-3">
              {data.polymarket?.popularBets && data.polymarket.popularBets.length > 0 ? (
                data.polymarket.popularBets.map((item: any, i: number) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={i} 
                    className="p-4 bg-surface-container-low/40 rounded-2xl border border-outline-variant/5 flex items-center justify-between group hover:border-secondary/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black text-on-surface-variant opacity-30 w-4">{i + 1}</span>
                      <div className="space-y-1">
                        <p className="text-[11px] font-black text-on-surface uppercase tracking-tight group-hover:text-secondary transition-colors">{item.market}</p>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-secondary bg-secondary/5 px-2 py-0.5 rounded border border-secondary/10">{item.odds}</span>
                          <span className="text-[9px] font-medium text-on-surface-variant opacity-50 uppercase">{item.volume} Vol.</span>
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      item.trend === "UP" ? "bg-primary/10 text-primary" : item.trend === "DOWN" ? "bg-secondary/10 text-secondary" : "bg-surface-container text-on-surface-variant"
                    )}>
                      {item.trend === "UP" ? <ArrowUpRight className="w-3.5 h-3.5" /> : item.trend === "DOWN" ? <ArrowDownRight className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="py-12 text-center space-y-3 opacity-30">
                  <RefreshCw className="w-8 h-8 mx-auto animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Escaneando apuestas populares...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Market Section */}
      <div className="bg-surface-container-high/60 p-8 rounded-[2.5rem] border border-outline-variant/10 backdrop-blur-xl space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
            <LineChart className="w-4 h-4 text-secondary" /> Mercado de Valores (Bolsa)
          </h4>
          <span className="text-[9px] font-bold text-secondary uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-lg">Correlación Macro</span>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {data.stockMarket?.indices.map((index: any, i: number) => (
              <div key={i} className="p-3 bg-surface-container-low/50 rounded-xl border border-outline-variant/5 text-center">
                <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">{index.name}</p>
                <p className="text-xs font-black text-on-surface">{index.value}</p>
                <p className={cn(
                  "text-[9px] font-bold mt-1",
                  index.change.includes("+") ? "text-primary" : "text-secondary"
                )}>{index.change}</p>
              </div>
            )) || (
              <div className="col-span-3 text-center py-4 opacity-50 text-[10px] font-black uppercase tracking-widest">Cargando índices...</div>
            )}
          </div>
          
          {data.stockMarket?.narrative && (
            <div className="p-4 bg-surface-container-low/30 rounded-2xl border border-outline-variant/5">
              <p className="text-[10px] font-medium text-on-surface leading-relaxed opacity-80 italic">
                "{data.stockMarket.narrative}"
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sentiment & Narrative Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface-container-high/60 p-8 rounded-[2.5rem] border border-outline-variant/10 backdrop-blur-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Sentimiento Social
              </h4>
              <span className={cn(
                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                data.consensus === "BULLISH" ? "bg-primary/10 text-primary border-primary/20" :
                data.consensus === "BEARISH" ? "bg-secondary/10 text-secondary border-secondary/20" :
                "bg-surface-container-high text-on-surface-variant border-outline-variant/10"
              )}>
                {data.consensus}
              </span>
            </div>

            <div className="space-y-10">
              {/* Dynamic Sentiment Bar */}
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className="text-primary">LONG {data.sentiment.long}%</span>
                  <span className="text-secondary">SHORT {data.sentiment.short}%</span>
                </div>
                <div className="h-6 bg-surface-container rounded-3xl overflow-hidden flex p-1 border border-outline-variant/5">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data.sentiment.long}%` }}
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-2xl relative group"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </motion.div>
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data.sentiment.short}%` }}
                    className="h-full bg-gradient-to-l from-secondary to-secondary/80 rounded-2xl relative group"
                  >
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </motion.div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/5 text-center">
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Intensidad</p>
                  <p className={cn(
                    "text-lg font-black uppercase",
                    data.sentiment.intensity === "HIGH" ? "text-secondary" : "text-primary"
                  )}>{data.sentiment.intensity}</p>
                </div>
                <div className="p-4 bg-surface-container-low/50 rounded-2xl border border-outline-variant/5 text-center">
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Menciones</p>
                  <p className="text-lg font-black text-on-surface uppercase">Alta Vol.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative & Whale Activity */}
          <div className="bg-surface-container-high/60 p-8 rounded-[2.5rem] border border-outline-variant/10 backdrop-blur-xl space-y-6">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Narrativa del Mercado</h4>
              <p className="text-[11px] font-medium text-on-surface leading-relaxed opacity-80">
                {data.narrative}
              </p>
            </div>
            
            <div className="pt-6 border-t border-outline-variant/5 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary">Actividad de Ballenas</h4>
              <p className="text-[11px] font-medium text-on-surface leading-relaxed opacity-80">
                {data.whaleActivity}
              </p>
            </div>
          </div>
        </div>

        {/* Signals, Levels & Trending Card */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Levels & Trending */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface-container-high/60 p-6 rounded-[2rem] border border-outline-variant/10 backdrop-blur-xl space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Niveles Clave Detectados</h4>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {data.keyLevels?.resistance?.map((level: number, i: number) => (
                    <span key={i} className="px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-lg text-[10px] font-black">
                      RES: ${level.toLocaleString()}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.keyLevels?.support?.map((level: number, i: number) => (
                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-black">
                      SUP: ${level.toLocaleString()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-surface-container-high/60 p-6 rounded-[2rem] border border-outline-variant/10 backdrop-blur-xl space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">Trending Topics</h4>
              <div className="flex flex-wrap gap-2">
                {data.trendingTopics?.map((topic: string, i: number) => (
                  <span key={i} className="px-3 py-1 bg-surface-container-highest rounded-lg text-[9px] font-black text-on-surface uppercase tracking-widest border border-outline-variant/5">
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="space-y-3">
              {data.alerts.map((alert, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={i} 
                  className="p-5 bg-secondary/10 border border-secondary/20 rounded-[1.5rem] flex items-center gap-4 shadow-xl backdrop-blur-md"
                >
                  <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-secondary" />
                  </div>
                  <p className="text-[11px] font-black text-secondary uppercase tracking-tight leading-relaxed">{alert}</p>
                </motion.div>
              ))}
            </div>
          )}

          {/* External Signals */}
          <div className="bg-surface-container-high/60 p-8 rounded-[2.5rem] border border-outline-variant/10 backdrop-blur-xl space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Señales Detectadas (Social)
              </h4>
              <Clock className="w-4 h-4 text-on-surface-variant opacity-30" />
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {data.signals.length > 0 ? (
                data.signals.map((signal, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="p-5 bg-surface-container-low/50 rounded-2xl border border-outline-variant/5 flex flex-col gap-4 group hover:border-primary/30 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg",
                          signal.type === "LONG" ? "bg-primary/10 border-primary/20 text-primary" : "bg-secondary/10 border-secondary/20 text-secondary"
                        )}>
                          {signal.type === "LONG" ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-on-surface uppercase tracking-tighter">{signal.asset}</p>
                            <span className={cn(
                              "text-[8px] font-black px-2 py-0.5 rounded uppercase",
                              signal.type === "LONG" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                            )}>{signal.type}</span>
                          </div>
                          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50 mt-1">Fuente: {signal.source}</p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[11px] font-black text-on-surface uppercase tracking-tight">Entry: <span className="text-primary">${signal.entry}</span></p>
                        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">TP: ${signal.tp}</p>
                      </div>
                    </div>
                    {signal.reasoning && (
                      <div className="pt-3 border-t border-outline-variant/5">
                        <p className="text-[10px] font-medium text-on-surface-variant leading-relaxed italic opacity-70">
                          "{signal.reasoning}"
                        </p>
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="relative h-[300px] rounded-3xl border border-dashed border-outline-variant/10 overflow-hidden bg-surface-container-low/30">
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center shadow-2xl">
                      <MessageSquare className="w-8 h-8 text-primary/40 animate-pulse" />
                    </div>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50 max-w-[200px] mx-auto leading-relaxed">
                      Escaneando redes sociales, foros y datos on-chain en busca de inteligencia operativa...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketIntelligence;
