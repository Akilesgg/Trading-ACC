import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
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
  RefreshCw,
  Info,
  Search
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
import { analyzeMarket, getMarketSentiment, fetchRealTimeNews, fetchMarketIntelligence } from "@/services/geminiService";
import { toast } from "sonner";
import { useSignalStore } from "@/store/useSignalStore";
import AnalysisTool from "@/components/analysis/AnalysisTool";
import MarketOverview from "@/components/analysis/MarketOverview";
import AnalysisModule from "@/components/analysis/AnalysisModule";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import FundamentalModal from "@/components/common/FundamentalModal";
import WyckoffAnalyzer from "@/components/analysis/WyckoffAnalyzer";
import ChartComparator from "@/components/analysis/ChartComparator";
import MarketIntelligence from "@/components/analysis/MarketIntelligence";

const DEFAULT_LAYOUT = [
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
  const addSignal = useSignalStore(state => state.addSignal);
  const [searchParams] = useSearchParams();
  const urlSymbol = searchParams.get("symbol");
  const [selectedSymbol, setSelectedSymbol] = useState(urlSymbol || "BTCUSDT");
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
  const [marketIntelligence, setMarketIntelligence] = useState<any>({
    sentiment: { long: 50, short: 50, intensity: "MEDIUM" },
    topAssets: ["BTC", "ETH", "SOL"],
    signals: [],
    alerts: [],
    consensus: "NEUTRAL"
  });
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  
  const [layout, setLayout] = useState<string[]>(() => {
    const saved = localStorage.getItem("analysis_layout_v3");
    const defaults = DEFAULT_LAYOUT;
    
    if (saved) {
      let parsed = JSON.parse(saved);
      // Ensure essential modules are always present
      const essentials = ["comparator", "market_intelligence", "sentiment_gauges"];
      let modified = false;
      
      essentials.forEach(module => {
        if (!parsed.includes(module)) {
          parsed.unshift(module);
          modified = true;
        }
      });
      
      if (modified) {
        localStorage.setItem("analysis_layout_v3", JSON.stringify(parsed));
      }
      return parsed;
    }
    return defaults;
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

      const [whalesData, tradersData, txData] = await Promise.all([
        fetchWhaleMovements(),
        fetchTopTraders(),
        fetchLargeTransactions()
      ]);

      setWhales(whalesData);
      setTopTraders(tradersData);
      setLargeTransactions(txData);
    } catch (error) {
      console.error("Error loading market data:", error);
    }
  }, [selectedSymbol, selectedTimeframe]);

  const loadNewsData = useCallback(async () => {
    try {
      setIntelligenceLoading(true);
      const [sentimentData, newsData, intelData] = await Promise.all([
        getMarketSentiment(),
        fetchRealTimeNews(),
        fetchMarketIntelligence(selectedSymbol)
      ]);
      setSentiment(sentimentData);
      setNews(newsData);
      setEvents(newsData); // Use news as events for consistency
      setMarketIntelligence(intelData);
    } catch (error) {
      console.error("Error loading news data:", error);
    } finally {
      setIntelligenceLoading(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if (urlSymbol && urlSymbol !== selectedSymbol) {
      setSelectedSymbol(urlSymbol);
    }
  }, [urlSymbol]);

  useEffect(() => {
    loadMarketData();
    const interval = setInterval(loadMarketData, 30000);
    return () => clearInterval(interval);
  }, [loadMarketData]);

  useEffect(() => {
    loadNewsData();
    const interval = setInterval(loadNewsData, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, [loadNewsData]);

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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/5">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-5xl font-black tracking-tighter uppercase text-on-surface">
              Análisis <span className="text-primary">Profundo</span>
            </h1>
          </div>
          <p className="text-on-surface-variant font-black uppercase tracking-[0.3em] text-[10px] ml-1 opacity-70">
            Motor de Inteligencia Artificial Cuántica v4.2
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleShareToTelegram}
            className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 hover:border-primary/30 hover:bg-primary/5 transition-all group shadow-lg"
            title="Compartir en Telegram"
          >
            <Share2 className="w-5 h-5 text-on-surface-variant group-hover:text-primary transition-colors" />
          </button>
          <div className="relative group">
            <button className="flex items-center gap-3 px-8 py-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 hover:border-primary/30 hover:bg-primary/5 transition-all font-black text-[10px] uppercase tracking-[0.2em] text-on-surface shadow-lg">
              <Save className="w-4 h-4 text-primary" />
              Diseño
              <ChevronDown className="w-4 h-4 text-on-surface-variant group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute right-0 top-full mt-3 w-56 bg-surface-container-high border border-outline-variant/10 rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden backdrop-blur-xl">
              <button onClick={() => handleSaveLayout("Pro Trader")} className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-colors border-b border-outline-variant/5">Guardar Actual</button>
              <button onClick={handleResetLayout} className="w-full px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest hover:bg-secondary/10 hover:text-secondary transition-colors flex items-center gap-3">
                <RotateCcw className="w-4 h-4" /> Restablecer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Initial Explanation Block */}
      <div className="bg-surface-container-low/40 p-8 rounded-[2.5rem] border border-outline-variant/10 backdrop-blur-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center border border-primary/30 shadow-2xl shadow-primary/20 flex-shrink-0">
            <Info className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">¿Cómo funciona nuestro Analizador IA?</h3>
            <p className="text-sm text-on-surface-variant font-medium leading-relaxed">
              Nuestro sistema utiliza modelos avanzados de procesamiento de lenguaje natural y análisis cuantitativo para interpretar datos de múltiples fuentes: movimientos de ballenas, eventos macroeconómicos, sentimiento en redes sociales y estructuras técnicas (Wyckoff, Elliot, etc.). 
              <span className="text-primary font-bold"> El objetivo es transformar datos complejos en señales de trading accionables con niveles precisos de entrada y salida.</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Wyckoff Analyzer Section */}
      <WyckoffAnalyzer />

      {/* Real-Time Intelligence & External Analysis Section */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-[2rem] flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
              <Search className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-on-surface uppercase tracking-tighter">Escaneo de Mercado Global</h2>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] opacity-50">X, Telegram, Reddit, Instagram & Trading Data</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-surface-container-high rounded-xl border border-outline-variant/10 text-[8px] font-black text-on-surface-variant uppercase tracking-widest">
              Auto-Refresh: 10m
            </div>
            <button 
              onClick={loadNewsData}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <RefreshCw className={cn("w-4 h-4", intelligenceLoading && "animate-spin")} />
              Escanear Ahora
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* External Market Intelligence */}
          <div className="bg-surface-container-low/40 p-8 rounded-[3rem] border border-outline-variant/10 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 opacity-[0.07] grayscale contrast-150 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <img 
                src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=2070&auto=format&fit=crop" 
                alt="Wall Street Bull" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-transparent to-background/80 pointer-events-none"></div>
            <div className="relative z-10">
              <MarketIntelligence 
                data={marketIntelligence} 
                loading={intelligenceLoading} 
                onRefresh={loadNewsData}
              />
            </div>
          </div>

          {/* Asset Comparator */}
          <div className="bg-surface-container-low/40 p-8 rounded-[3rem] border border-outline-variant/10 backdrop-blur-3xl relative overflow-hidden group shadow-2xl">
            <div className="absolute inset-0 opacity-[0.07] grayscale contrast-150 pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <img 
                src="https://images.unsplash.com/photo-1535320903710-d993d3d77d29?q=80&w=2070&auto=format&fit=crop" 
                alt="Trading Charts" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-transparent to-background/80 pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-secondary/10 rounded-2xl flex items-center justify-center border border-secondary/20">
                  <BarChart3 className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-on-surface uppercase tracking-tight">Comparador de Activos</h3>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Rendimiento Relativo %</p>
                </div>
              </div>
              <ChartComparator 
                allAssets={allAssets} 
                defaultSymbol1={ticker?.symbol || "BTCUSDT"} 
                defaultSymbol2="ETHUSDT" 
              />
            </div>
          </div>
        </div>
      </section>

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

      {/* Automatic Signal Generator Block */}
      <div className="bg-surface-container-high/40 p-10 rounded-[3rem] border border-primary/20 backdrop-blur-3xl space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-on-surface uppercase tracking-tight">Generador Automático de Señales</h3>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Confirmación Técnica & Probabilidad</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              PROBABILIDAD: 94.2%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Confirmación RSI", value: "ALCISTA", color: "text-primary" },
            { label: "MACD Cross", value: "CONFIRMADO", color: "text-primary" },
            { label: "Volumen 24h", value: "ANORMAL (+40%)", color: "text-secondary" },
            { label: "Estructura", value: "BREAKOUT", color: "text-primary" }
          ].map((item, idx) => (
            <div key={idx} className="p-6 bg-surface-container-low/50 rounded-2xl border border-outline-variant/5">
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-2">{item.label}</p>
              <p className={cn("text-sm font-black uppercase", item.color)}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="p-8 bg-primary/10 rounded-3xl border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2">
            <p className="text-lg font-black text-on-surface uppercase tracking-tight">Señal Detectada: <span className="text-primary">LONG EN {selectedSymbol}</span></p>
            <p className="text-sm text-on-surface-variant font-medium">Entrada: $68,420 | TP: $72,500 | SL: $66,200</p>
          </div>
          <button 
            onClick={() => {
              addSignal({
                activo: selectedSymbol,
                tipo: 'LONG',
                entry: 68420,
                tp1: 70500,
                tp2: 71500,
                tp3: 72500,
                sl: 66200,
                estado: 'activa',
                leverage: '20x',
                confidence: 94,
                analysis: 'Señal generada por el Analizador IA basada en ruptura de estructura y confirmación de volumen institucional.'
              });
              toast.success("Señal publicada globalmente");
            }}
            className="px-10 py-4 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            Publicar Señal Global
          </button>
        </div>
      </div>

      <div className="trading-grid">
        {/* Main Column: AI Detailed Analysis (LEFT) */}
        <div className="md:col-span-8 space-y-8">
          <ErrorBoundary>
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
                  marketIntelligence={marketIntelligence}
                  intelligenceLoading={intelligenceLoading}
                />
              ))}
            </Reorder.Group>

            {!analysis && !analyzing && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-surface-container-high/20 rounded-[2.5rem] border-2 border-dashed border-outline-variant/10 p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-ping"></div>
                  <Brain className="w-12 h-12 text-primary relative z-10" />
                </div>
                <div className="space-y-3">
                  <h4 className="text-2xl font-black text-on-surface uppercase tracking-tighter">Análisis IA Pendiente</h4>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest max-w-xs mx-auto leading-relaxed">
                    Los módulos de tiempo real están activos. Pulsa "Ejecutar Análisis Profundo" para obtener el informe detallado de la IA.
                  </p>
                </div>
                <button 
                  onClick={handleRunAnalysis}
                  className="btn-primary px-10 py-4 text-[10px]"
                >
                  Comenzar Análisis Ahora
                </button>
              </div>
            )}
          </ErrorBoundary>
        </div>

        {/* Sidebar: Market Overview & Secondary Data (RIGHT) */}
        <div className="md:col-span-4 space-y-8">
          <MarketOverview 
            ticker={ticker}
            selectedSymbol={selectedSymbol}
            chartData={chartData}
            timeframe={selectedTimeframe}
          />

          {/* Whale Movements */}
          <div className="trading-card space-y-6">
            <h4 className="section-title mb-0 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> MOVIMIENTOS DE BALLENAS
            </h4>
            <div className="space-y-3">
              {whales.slice(0, 4).map((whale, idx) => (
                <div key={idx} className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/5 flex justify-between items-center group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-2.5 h-2.5 rounded-full shadow-lg", whale.type === "buy" ? "bg-primary shadow-primary/20" : "bg-secondary shadow-secondary/20")}></div>
                    <span className="text-[10px] font-black text-on-surface uppercase tracking-tighter">{whale.amount} {whale.asset}</span>
                  </div>
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{whale.time}</span>
                </div>
              ))}
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">RECOMENDACIÓN IA</p>
              <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                Acumulación detectada en zonas de soporte. Las ballenas están posicionándose para una ruptura alcista.
              </p>
            </div>
          </div>

          {/* Economic Events */}
          <div className="trading-card space-y-6">
            <h4 className="section-title mb-0 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> EVENTOS ECONÓMICOS
            </h4>
            <div className="space-y-3">
              {events.slice(0, 3).map((event, idx) => (
                <div key={idx} className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/5 space-y-2 group hover:border-primary/30 transition-all">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">{event.event}</span>
                    <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">{event.time}</span>
                  </div>
                  <div className="flex gap-1.5">
                    {[...Array(event.impact)].map((_, i) => (
                      <Flame key={i} className="w-3.5 h-3.5 text-secondary" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-secondary/5 border border-secondary/20 rounded-2xl">
              <p className="text-[8px] font-black text-secondary uppercase tracking-widest mb-1">RECOMENDACIÓN IA</p>
              <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                Alta volatilidad esperada. Evitar apalancamiento excesivo durante la publicación de datos del IPC.
              </p>
            </div>
          </div>

          {/* Top Traders Copy */}
          <div className="trading-card space-y-6">
            <h4 className="section-title mb-0 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> TOP TRADERS (COPIAR)
            </h4>
            <div className="space-y-3">
              {topTraders.slice(0, 3).map((trader, idx) => (
                <div key={idx} className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/5 flex justify-between items-center group hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-[12px] font-black text-primary border border-primary/20">
                      {trader.name[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-on-surface uppercase tracking-widest leading-none mb-1">{trader.name}</p>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">ROI: {trader.roi}%</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleCopyStrategy(trader.id)}
                    className="p-2.5 bg-surface-container-highest rounded-xl border border-outline-variant/10 hover:bg-primary hover:text-on-primary transition-all"
                  >
                    {copied === trader.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
              <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">RECOMENDACIÓN IA</p>
              <p className="text-[10px] text-on-surface-variant font-medium leading-relaxed">
                El 80% de los traders rentables están en posiciones LONG. El sentimiento institucional es fuertemente alcista.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Market Recommendation Block */}
      {analysis && (
        <section className="trading-card p-12 bg-primary/5 border-primary/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/10 rounded-full blur-[150px] -mr-80 -mt-80"></div>
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
                <Target className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-5xl font-black tracking-tighter uppercase text-on-surface">RECOMENDACIÓN GLOBAL DE MERCADO</h2>
                <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] mt-2 opacity-70">Integración de todos los módulos de análisis</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-8 space-y-6">
                <div className="p-8 bg-surface-container-high/60 rounded-[2.5rem] border border-primary/20 backdrop-blur-xl">
                  <h3 className="text-2xl font-black text-on-surface uppercase tracking-tight mb-4">Estrategia Maestra Recomendada</h3>
                  <p className="text-lg text-on-surface-variant leading-relaxed font-medium italic">
                    "Basado en la confluencia de ballenas acumulando, un sentimiento de mercado controlado y la estructura técnica de Wyckoff en fase C, la recomendación es <span className="text-primary font-bold">LONG con apalancamiento moderado (3x-5x)</span> buscando la liquidez por encima de los máximos previos."
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="px-6 py-3 bg-primary/10 border border-primary/20 rounded-xl text-[10px] font-black text-primary uppercase tracking-widest">Confirmación: 92%</div>
                  <div className="px-6 py-3 bg-secondary/10 border border-secondary/20 rounded-xl text-[10px] font-black text-secondary uppercase tracking-widest">Riesgo: Bajo-Medio</div>
                </div>
              </div>
              <div className="lg:col-span-4">
                <div className="p-10 bg-primary rounded-[3rem] text-on-primary shadow-2xl shadow-primary/30 flex flex-col items-center text-center space-y-4">
                  <Zap className="w-12 h-12" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Señal de Entrada</p>
                    <p className="text-4xl font-black tracking-tighter uppercase">COMPRA FUERTE</p>
                  </div>
                  <button className="w-full py-4 bg-on-primary text-primary rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all">
                    Ejecutar en Exchange
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Global Sentiment Section */}
      <section className="trading-card p-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-primary/5 rounded-full blur-[150px] -mr-80 -mt-80 group-hover:bg-primary/10 transition-all duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-secondary/5 rounded-full blur-[120px] -ml-60 -mb-60 group-hover:bg-secondary/10 transition-all duration-1000"></div>
        
        <div className="relative z-10 space-y-12">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-primary/10 rounded-[2.5rem] flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
              <Activity className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h2 className="text-5xl font-black tracking-tighter uppercase text-on-surface">Informe de Sentimiento Global</h2>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.4em] mt-2 opacity-70">Actualizado en tiempo real por Red Neuronal v4</p>
            </div>
          </div>
          
          <div className="p-12 bg-surface-container-high/40 rounded-[3rem] border border-outline-variant/10 backdrop-blur-xl shadow-2xl relative group/sentiment">
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 rotate-12 group-hover/sentiment:rotate-0 transition-transform">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <p className="text-on-surface-variant leading-relaxed text-3xl italic font-medium tracking-tight">
              "{sentiment}"
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-10 bg-surface-container-high rounded-[2.5rem] border border-outline-variant/5 space-y-6 group hover:border-primary/30 hover:bg-primary/5 transition-all shadow-xl">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Miedo & Codicia</p>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl font-black text-primary tracking-tighter drop-shadow-[0_0_15px_rgba(0,255,163,0.3)]">84</span>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">Codicia Extrema</span>
              </div>
            </div>
            <div className="p-10 bg-surface-container-high rounded-[2.5rem] border border-outline-variant/5 space-y-6 group hover:border-secondary/30 hover:bg-secondary/5 transition-all shadow-xl">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Volatilidad</p>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl font-black text-secondary tracking-tighter drop-shadow-[0_0_15px_rgba(255,107,107,0.3)]">Alta</span>
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest bg-secondary/10 px-3 py-1 rounded-full">+18% vs Promedio</span>
              </div>
            </div>
            <div className="p-10 bg-surface-container-high rounded-[2.5rem] border border-outline-variant/5 space-y-6 group hover:border-tertiary/30 hover:bg-tertiary/5 transition-all shadow-xl">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Dominancia BTC</p>
              <div className="flex items-baseline gap-4">
                <span className="text-6xl font-black text-tertiary tracking-tighter drop-shadow-[0_0_15px_rgba(0,224,255,0.3)]">52.4%</span>
                <span className="text-[10px] font-black text-tertiary uppercase tracking-widest bg-tertiary/10 px-3 py-1 rounded-full">Estable</span>
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
        data={selectedFundamental} 
        onClose={() => setSelectedFundamental(null)} 
      />
    </div>
  );
};

export default Analysis;
