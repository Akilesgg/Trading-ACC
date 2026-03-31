import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Search, 
  Bell, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Globe,
  MessageSquare,
  Share2,
  Bookmark,
  ChevronRight,
  Filter,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMarketSentiment, analyzeMarket } from "@/services/geminiService";
import { fetchTickers, CryptoData } from "@/services/cryptoService";

const Analysis = () => {
  const [sentiment, setSentiment] = useState<string>("Cargando inteligencia de mercado...");
  const [analysis, setAnalysis] = useState<Record<string, string>>({});
  const [tickers, setTickers] = useState<CryptoData[]>([]);
  const [loading, setLoading] = useState(true);

  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTickers(symbols);
        setTickers(data);
        const aiSentiment = await getMarketSentiment();
        setSentiment(aiSentiment);
        
        // Initial analysis for BTC
        const btcAnalysis = await analyzeMarket("BTCUSDT", data[0].price, data[0].priceChangePercent);
        setAnalysis({ "BTCUSDT": btcAnalysis });
      } catch (error) {
        console.error("Analysis data load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleAnalyze = async (symbol: string) => {
    const ticker = tickers.find(t => t.symbol === symbol);
    if (!ticker) return;
    
    setAnalysis(prev => ({ ...prev, [symbol]: "Generando análisis profundo..." }));
    const result = await analyzeMarket(symbol, ticker.price, ticker.priceChangePercent);
    setAnalysis(prev => ({ ...prev, [symbol]: result }));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      {/* AI Market Pulse */}
      <section className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32 transition-transform duration-1000 group-hover:scale-110"></div>
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-[0_20px_40px_rgba(0,255,163,0.2)]">
            <Brain className="w-12 h-12 text-on-primary-fixed" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-label uppercase tracking-widest text-primary-dim">Inteligencia de Mercado IA</span>
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">INFORME DE SENTIMIENTO GLOBAL</h2>
            <p className="text-on-surface-variant leading-relaxed text-lg italic">
              "{sentiment}"
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full border border-outline-variant/20">
                <Globe className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Fuente: Google Search Grounding</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-full border border-outline-variant/20">
                <Zap className="w-4 h-4 text-tertiary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Modelo: Gemini 3 Flash</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Analysis Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-headline text-xl font-bold uppercase tracking-wide">Análisis Profundo de Activos</h3>
          <button className="flex items-center gap-2 text-primary hover:text-primary-dim transition-colors">
            <RefreshCw className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Actualizar Todo</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {tickers.map((ticker) => (
            <div key={ticker.symbol} className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10 flex flex-col">
              <div className="p-6 bg-surface-container-high/50 flex justify-between items-center border-b border-outline-variant/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-headline font-bold">{ticker.symbol.replace("USDT", "")}</h4>
                    <p className="text-[10px] text-on-surface-variant font-label uppercase">Binance Spot</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-headline font-bold">${parseFloat(ticker.price).toLocaleString()}</p>
                  <p className={cn("text-xs font-bold", parseFloat(ticker.priceChangePercent) >= 0 ? "text-primary" : "text-secondary")}>
                    {parseFloat(ticker.priceChangePercent) > 0 ? "+" : ""}{ticker.priceChangePercent}%
                  </p>
                </div>
              </div>
              <div className="p-8 flex-1 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary-dim">
                    <Activity className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Metodología Wyckoff</span>
                  </div>
                  <div className="wyckoff-label">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Fase de Acumulación</span>
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-on-surface-variant leading-relaxed text-sm">
                    {analysis[ticker.symbol] || "Aún no se ha generado ningún análisis. Haz clic en analizar para comenzar."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                      <MessageSquare className="w-4 h-4 text-on-surface-variant" />
                    </button>
                    <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                      <Share2 className="w-4 h-4 text-on-surface-variant" />
                    </button>
                    <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
                      <Bookmark className="w-4 h-4 text-on-surface-variant" />
                    </button>
                  </div>
                  <button 
                    onClick={() => handleAnalyze(ticker.symbol)}
                    className="px-6 py-2 bg-primary text-on-primary rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-primary-dim transition-all active:scale-95"
                  >
                    Análisis Profundo
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Community Insights */}
      <section className="space-y-6">
        <h3 className="font-headline text-xl font-bold uppercase tracking-wide">Discusiones en Tendencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { tag: "#BTC", title: "¿Ha llegado el ciclo a su fin?", comments: 142, likes: 890 },
            { tag: "#SOL", title: "Ruptura de Solana confirmada", comments: 56, likes: 320 },
            { tag: "#ETH", title: "Análisis de entradas de ETF de Ethereum", comments: 89, likes: 540 },
          ].map((post, i) => (
            <div key={i} className="bg-surface-container-high p-6 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all cursor-pointer group">
              <span className="text-[10px] font-bold text-primary-dim uppercase tracking-widest mb-2 block">{post.tag}</span>
              <h4 className="font-bold text-sm mb-4 group-hover:text-primary transition-colors">{post.title}</h4>
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-label uppercase tracking-widest">
                <span>{post.comments} Comentarios</span>
                <span>{post.likes} Me gusta</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
};

export default Analysis;
