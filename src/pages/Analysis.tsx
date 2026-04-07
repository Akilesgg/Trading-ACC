import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, Reorder } from "motion/react";
import { 
  Brain, 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Target, 
  Shield, 
  BarChart3, 
  Layers, 
  MessageSquare, 
  Flame, 
  ChevronDown, 
  Share2, 
  Save, 
  RotateCcw, 
  Bell, 
  Users, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchTicker, 
  CryptoData, 
  fetchKlines, 
  fetchEconomicEvents, 
  fetchWhaleMovements, 
  fetchTopTraders, 
  fetchLargeTransactions, 
  fetchCryptoData,
  fetchAssetFundamentals,
  AssetFundamental
} from "@/services/cryptoService";
import { analyzeMarket, getMarketSentiment, fetchRealTimeNews } from "@/services/geminiService";
import { toast } from "sonner";
import AnalysisTool from "@/components/analysis/AnalysisTool";
import MarketOverview from "@/components/analysis/MarketOverview";
import AnalysisModule from "@/components/analysis/AnalysisModule";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import FundamentalModal from "@/components/common/FundamentalModal";

const DEFAULT_LAYOUT = [
  "comparator",
  "sentiment_gauges",
  "strategy",
  "context",
  "recommendation",
  "levels",
  "objectives",
  "indicators",
  "wyckoff",
  "dominance",
  "predictions",
  "comments",
  "justification",
  "leverage",
  "raw"
];

const Analysis = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [selectedMode, setSelectedMode] = useState<"Standard" | "Scalping" | "Swing">("Standard");
  const [ticker, setTicker] = useState<CryptoData | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string>("");
  const [analysisSections, setAnalysisSections] = useState<Record<string, string>>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState<string>("Analizando sentimiento global...");
  const [news, setNews] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [whales, setWhales] = useState<any[]>([]);
  const [topTraders, setTopTraders] = useState<any[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<any[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  
  const [layout, setLayout] = useState<string[]>(() => {
    const saved = localStorage.getItem("analysis_layout_v3");
    return saved ? JSON.parse(saved) : DEFAULT_LAYOUT;
  });
  const [savedLayouts, setSavedLayouts] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem("analysis_saved_layouts_v3");
    return saved ? JSON.parse(saved) : {};
  });

  // Sentiment Gauges States
  const [btcSentiment, setBtcSentiment] = useState(72);
  const [top100Sentiment, setTop100Sentiment] = useState(65);
  const [generalSentiment, setGeneralSentiment] = useState(58);
  const [btcTF, setBtcTF] = useState("1h");
  const [top100TF, setTop100TF] = useState("1h");
  const [generalTF, setGeneralTF] = useState("1h");

  const [showHotSignal, setShowHotSignal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedFundamental, setSelectedFundamental] = useState<AssetFundamental | null>(null);

  const showFundamentals = async (symbol: string) => {
    const data = await fetchAssetFundamentals(symbol);
    setSelectedFundamental(data);
  };

  const loadMarketData = useCallback(async () => {
    try {
      const [tickerData, assets] = await Promise.all([
        fetchTicker(selectedSymbol),
        fetchCryptoData()
      ]);
      setTicker(tickerData);
      setAllAssets(assets);
      
      const klines = await fetchKlines(selectedSymbol, selectedTimeframe, 30);
      setChartData(klines.map((k: any) => ({
        name: new Date(k.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: k.close
      })));

      const [sentimentData, newsData, eventsData, whalesData, tradersData, txData] = await Promise.all([
        getMarketSentiment(),
        fetchRealTimeNews(),
        fetchEconomicEvents(),
        fetchWhaleMovements(),
        fetchTopTraders(),
        fetchLargeTransactions()
      ]);

      setSentiment(sentimentData);
      setNews(newsData);
      setEvents(eventsData);
      setWhales(whalesData);
      setTopTraders(tradersData);
      setLargeTransactions(txData);
    } catch (error) {
      console.error("Error loading market data:", error);
    }
  }, [selectedSymbol, selectedTimeframe]);

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 30000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  const parseAnalysis = (raw: string) => {
    const sections: Record<string, string> = {};
    const parts = raw.split(/\[(.*?)\]/);
    
    for (let i = 1; i < parts.length; i += 2) {
      const title = parts[i].trim().toUpperCase();
      const content = parts[i + 1]?.trim();
      if (title && content) {
        sections[title] = content;
      }
    }
    
    if (!sections["NIVEL DE CONFIANZA"]) {
      const confidenceMatch = raw.match(/CONFIANZA:\s*(\d+)%/i);
      if (confidenceMatch) sections["NIVEL DE CONFIANZA"] = confidenceMatch[1];
    }
    
    return sections;
  };

  const handleRunAnalysis = async () => {
    if (!ticker) return;
    setAnalyzing(true);
    setAnalysis("");
    setAnalysisSections({});
    
    try {
      const result = await analyzeMarket(selectedSymbol, ticker.price, ticker.priceChangePercent, selectedMode);
      setAnalysis(result);
      setAnalysisSections(parseAnalysis(result));
      toast.success("Análisis completado con éxito");
      
      if (Math.random() > 0.7) {
        setTimeout(() => setShowHotSignal(true), 2000);
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Error al generar el análisis");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveLayout = (name: string) => {
    const newLayouts = { ...savedLayouts, [name]: layout };
    setSavedLayouts(newLayouts);
    localStorage.setItem("analysis_saved_layouts_v3", JSON.stringify(newLayouts));
    toast.success(`Diseño "${name}" guardado`);
  };

  const handleResetLayout = () => {
    setLayout(DEFAULT_LAYOUT);
    localStorage.setItem("analysis_layout_v3", JSON.stringify(DEFAULT_LAYOUT));
    toast.success("Diseño restablecido");
  };

  const handleShareToTelegram = () => {
    const message = `🚀 *ANÁLISIS PROFUNDO: ${selectedSymbol}*\n\n` +
      `💰 Precio: $${ticker?.price}\n` +
      `📊 Cambio 24h: ${ticker?.priceChangePercent}%\n\n` +
      `🤖 *Recomendación IA:* ${analysisSections["RECOMENDACIÓN IA"] || "Pendiente"}\n\n` +
      `🎯 *Niveles:* ${analysisSections["NIVELES OPERATIVOS"] || "Pendiente"}\n\n` +
      `#TradingACC #CryptoAnalysis #${selectedSymbol}`;
    
    const encoded = encodeURIComponent(message);
    window.open(`https://t.me/share/url?url=${window.location.href}&text=${encoded}`, '_blank');
  };

  const handleCopyStrategy = (id: string) => {
    setCopied(id);
    toast.success("Estrategia copiada al portapapeles");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <h1 className="font-headline text-5xl font-black tracking-tighter uppercase">
            Deep <span className="text-primary">Analysis</span>
          </h1>
          <p className="text-on-surface-variant font-label uppercase tracking-widest text-xs">
            Motor de Inteligencia Artificial Cuántica v4.2
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleShareToTelegram}
            className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/10 hover:bg-primary/10 hover:text-primary transition-all group"
          >
            <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-6 py-3 bg-surface-container-low rounded-xl border border-outline-variant/10 hover:border-primary/50 transition-all font-bold text-xs uppercase tracking-widest">
              <Save className="w-4 h-4" />
              Diseño
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-high border border-outline-variant/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
              <button onClick={() => handleSaveLayout("Pro Trader")} className="w-full px-4 py-3 text-left text-[10px] font-black uppercase hover:bg-primary/10 hover:text-primary transition-colors border-b border-outline-variant/5">Guardar Actual</button>
              <button onClick={handleResetLayout} className="w-full px-4 py-3 text-left text-[10px] font-black uppercase hover:bg-secondary/10 hover:text-secondary transition-colors flex items-center gap-2">
                <RotateCcw className="w-3 h-3" /> Restablecer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Tool */}
      <AnalysisTool 
        selectedSymbol={selectedSymbol}
        setSelectedSymbol={setSelectedSymbol}
        allAssets={allAssets}
        selectedTimeframe={selectedTimeframe}
        setSelectedTimeframe={setSelectedTimeframe}
        selectedMode={selectedMode}
        setSelectedMode={setSelectedMode}
        analyzing={analyzing}
        onRunAnalysis={handleRunAnalysis}
        onResetLayout={handleResetLayout}
        onSaveLayout={handleSaveLayout}
        savedLayouts={savedLayouts}
        onLoadLayout={() => {}}
        onShowFundamentals={showFundamentals}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: AI Detailed Analysis (LEFT) */}
        <div className="lg:col-span-2 space-y-8">
          <ErrorBoundary>
            {analysis ? (
              <Reorder.Group 
                axis="y" 
                values={layout} 
                onReorder={(newOrder) => {
                  setLayout(newOrder);
                  localStorage.setItem("analysis_layout_v3", JSON.stringify(newOrder));
                }}
                className="space-y-8"
              >
                {layout.map((moduleId) => (
                  <AnalysisModule 
                    key={moduleId}
                    moduleId={moduleId}
                    analysisSections={analysisSections}
                    analysis={analysis}
                    ticker={ticker}
                    btcSentiment={btcSentiment}
                    setBtcSentiment={setBtcSentiment}
                    top100Sentiment={top100Sentiment}
                    setTop100Sentiment={setTop100Sentiment}
                    generalSentiment={generalSentiment}
                    setGeneralSentiment={setGeneralSentiment}
                    btcTF={btcTF}
                    setBtcTF={setBtcTF}
                    top100TF={top100TF}
                    setTop100TF={setTop100TF}
                    generalTF={generalTF}
                    setGeneralTF={setGeneralTF}
                    allAssets={allAssets}
                  />
                ))}
              </Reorder.Group>
            ) : (
              <div className="h-full min-h-[600px] flex flex-col items-center justify-center bg-surface-container-low rounded-3xl border border-dashed border-outline-variant/30 p-12 text-center space-y-6">
                <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
                  <Brain className="w-12 h-12 text-primary relative z-10" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-headline font-bold text-on-surface">Esperando Instrucciones</h4>
                  <p className="text-sm text-on-surface-variant max-w-xs mx-auto">
                    Selecciona un activo y temporalidad arriba para que nuestra IA realice un análisis exhaustivo de mercado.
                  </p>
                </div>
                <button 
                  onClick={handleRunAnalysis}
                  className="px-8 py-4 bg-primary text-on-primary rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-primary/20"
                >
                  Comenzar Análisis Ahora
                </button>
              </div>
            )}
          </ErrorBoundary>
        </div>

        {/* Sidebar: Market Overview & Secondary Data (RIGHT) */}
        <div className="space-y-8">
          <MarketOverview 
            ticker={ticker}
            selectedSymbol={selectedSymbol}
            chartData={chartData}
            timeframe={selectedTimeframe}
          />

          {/* Whale Movements */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-xl">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Activity className="w-3 h-3" /> MOVIMIENTOS DE BALLENAS
            </h4>
            <div className="space-y-3">
              {whales.slice(0, 4).map((whale, idx) => (
                <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/5 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2 h-2 rounded-full", whale.type === "buy" ? "bg-primary" : "bg-secondary")}></div>
                    <span className="text-[10px] font-bold text-on-surface">{whale.amount} {whale.asset}</span>
                  </div>
                  <span className="text-[8px] font-black text-on-surface-variant uppercase">{whale.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Economic Events */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-xl">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-3 h-3" /> EVENTOS ECONÓMICOS
            </h4>
            <div className="space-y-3">
              {events.slice(0, 3).map((event, idx) => (
                <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-on-surface uppercase">{event.event}</span>
                    <span className="text-[8px] font-bold text-on-surface-variant">{event.time}</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(event.impact)].map((_, i) => (
                      <Flame key={i} className="w-3 h-3 text-secondary" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Traders Copy */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-xl">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3 h-3" /> TOP TRADERS (COPIAR)
            </h4>
            <div className="space-y-3">
              {topTraders.slice(0, 3).map((trader, idx) => (
                <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/5 flex justify-between items-center group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-[10px] font-black text-primary">
                      {trader.name[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-on-surface uppercase">{trader.name}</p>
                      <p className="text-[8px] font-bold text-primary">ROI: {trader.roi}%</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCopyStrategy(trader.id)}
                    className="p-2 bg-surface-container-highest rounded-lg hover:bg-primary hover:text-on-primary transition-all"
                  >
                    {copied === trader.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Global Sentiment Section */}
      <section className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -mr-48 -mt-48 group-hover:bg-primary/10 transition-all duration-1000"></div>
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="font-headline text-3xl font-bold tracking-tight uppercase">Informe de Sentimiento Global</h2>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Actualizado hace 2 minutos</p>
            </div>
          </div>
          
          <div className="p-8 bg-surface-container-high/30 rounded-2xl border border-outline-variant/10 backdrop-blur-sm">
            <p className="text-on-surface-variant leading-relaxed text-xl italic font-medium">
              "{sentiment}"
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-surface-container rounded-2xl border border-outline-variant/5 space-y-3">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Miedo & Codicia</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-headline font-black text-primary">84</span>
                <span className="text-xs font-bold text-primary-dim uppercase">Codicia Extrema</span>
              </div>
            </div>
            <div className="p-6 bg-surface-container rounded-2xl border border-outline-variant/5 space-y-3">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Volatilidad</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-headline font-black text-secondary">Alta</span>
                <span className="text-xs font-bold text-secondary/70 uppercase">+18% vs Promedio</span>
              </div>
            </div>
            <div className="p-6 bg-surface-container rounded-2xl border border-outline-variant/5 space-y-3">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Dominancia BTC</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-headline font-black text-tertiary">52.4%</span>
                <span className="text-xs font-bold text-tertiary/70 uppercase">Estable</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hot Signal Modal */}
      <AnimatePresence>
        {showHotSignal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-surface-container-low p-8 rounded-3xl border-2 border-primary/50 shadow-[0_0_50px_rgba(0,255,163,0.3)] max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10 text-center space-y-6">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Flame className="w-10 h-10 text-primary animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-headline font-black text-on-surface uppercase tracking-tighter">¡Señal Caliente!</h3>
                  <p className="text-on-surface-variant text-sm">
                    Nuestra IA ha detectado una oportunidad de alta probabilidad en <span className="text-primary font-bold">{selectedSymbol}</span>.
                  </p>
                </div>
                <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/10 flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-[8px] font-black text-on-surface-variant uppercase">Confianza</p>
                    <p className="text-xl font-headline font-black text-primary">94.2%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black text-on-surface-variant uppercase">Potencial</p>
                    <p className="text-xl font-headline font-black text-primary">+12.5%</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowHotSignal(false)}
                    className="flex-1 py-4 bg-surface-container-highest text-on-surface rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-surface-container transition-all"
                  >
                    Ignorar
                  </button>
                  <button 
                    onClick={() => {
                      setShowHotSignal(false);
                      handleRunAnalysis();
                    }}
                    className="flex-1 py-4 bg-primary text-on-primary rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                  >
                    Ver Análisis
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Fundamental Modal */}
      <FundamentalModal 
        fundamental={selectedFundamental} 
        onClose={() => setSelectedFundamental(null)} 
      />
    </div>
  );
};

export default Analysis;
