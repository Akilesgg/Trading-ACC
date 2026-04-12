import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain,
  Info,
  Download,
  X,
  Zap,
  RefreshCw,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchTickers, 
  CryptoData, 
  fetchWhaleMovements, 
  fetchTopTraders, 
  fetchLargeTransactions, 
  fetchAssetFundamentals,
  AssetFundamental
} from "@/services/cryptoService";
import { getMarketSentiment, fetchRealTimeNews } from "@/services/geminiService";
import { useWatchlist } from "@/hooks/useWatchlist";
import { sendTelegramAlert } from "@/services/telegramService";
import { detectMarketRegime } from "@/services/signalEngine";
import { fetchKlines } from "@/services/cryptoService";
import { toast } from "sonner";
import JSZip from "jszip";
import FundamentalModal from "@/components/common/FundamentalModal";

// Modular Components
import MarketPulse from "@/components/dashboard/MarketPulse";
import SignalSummary from "@/components/dashboard/SignalSummary";
import WhaleFeed from "@/components/dashboard/WhaleFeed";
import NewsFeed from "@/components/dashboard/NewsFeed";
import SignalMatrix from "@/components/dashboard/SignalMatrix";
import NotificationSettings from "@/components/dashboard/NotificationSettings";
import LiveSignalFeed from "@/components/dashboard/LiveSignalFeed";
import PriceAlerts from "@/components/dashboard/PriceAlerts";
import MarketConclusion from "@/components/dashboard/MarketConclusion";

import { useSignalStore } from "@/store/useSignalStore";

const Dashboard = () => {
  const addSignal = useSignalStore(state => state.addSignal);
  const currentTimeframe = useSignalStore(state => state.currentTimeframe);
  const setTimeframe = useSignalStore(state => state.setTimeframe);
  const [tickers, setTickers] = useState<CryptoData[]>([]);
  const [allTickers, setAllTickers] = useState<CryptoData[]>([]);
  const [sentiment, setSentiment] = useState<string>("Cargando inteligencia de mercado...");
  const [loading, setLoading] = useState(true);
  const { watchlist, toggleWatchlist } = useWatchlist();
  const [filter, setFilter] = useState<"all" | "watchlist" | "bullish" | "bearish" | "neutral" | "breakout">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  
  const [whaleMovements, setWhaleMovements] = useState<any[]>([]);
  const [topTraders, setTopTraders] = useState<any[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<any[]>([]);
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);

  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [telegramToken, setTelegramToken] = useState(localStorage.getItem("telegramToken") || (import.meta as any).env.VITE_TELEGRAM_TOKEN || "");
  const [telegramChatId, setTelegramChatId] = useState(localStorage.getItem("telegramChatId") || (import.meta as any).env.VITE_TELEGRAM_CHAT_ID || "");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [enabledAlerts, setEnabledAlerts] = useState<Set<string>>(new Set());
  const [triggeredAlerts, setTriggeredAlerts] = useState<Set<string>>(new Set());
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [selectedFundamental, setSelectedFundamental] = useState<AssetFundamental | null>(null);
  const [marketRegime, setMarketRegime] = useState<string>("CARGANDO...");

  useEffect(() => {
    const getRegime = async () => {
      try {
        const klines = await fetchKlines("BTCUSDT", "1h", 100);
        const regime = detectMarketRegime(klines);
        setMarketRegime(regime);
      } catch (error) {
        console.error("Error detecting market regime:", error);
      }
    };
    getRegime();
  }, []);

  const showFundamentals = async (symbol: string) => {
    const data = await fetchAssetFundamentals(symbol);
    setSelectedFundamental(data);
  };

  const sendBestSignalToTelegram = async () => {
    if (allTickers.length === 0) return;
    
    // Find ticker with highest consensus
    const bestSignal = [...allTickers].sort((a, b) => (b.consensus || 0) - (a.consensus || 0))[0];
    
    if (bestSignal) {
      setIsSendingTest(true);
      try {
        await sendTelegramAlert({
          symbol: bestSignal.symbol,
          price: bestSignal.price,
          change: bestSignal.priceChangePercent,
          type: "SIGNAL",
          confidence: bestSignal.consensus || 90,
          entry: bestSignal.entry?.toFixed(2),
          sl: bestSignal.stopLoss?.toFixed(2),
          tp1: bestSignal.takeProfits?.[0]?.toFixed(2),
          tp2: bestSignal.takeProfits?.[1]?.toFixed(2),
          tp3: bestSignal.takeProfits?.[2]?.toFixed(2),
          leverage: `${bestSignal.leverage || 10}x`,
          analysis: `Señal de alta confianza detectada por el motor IA para ${bestSignal.symbol}.`
        });
        toast.success(`Señal de ${bestSignal.symbol} enviada a Telegram`);
      } catch (e) {
        toast.error("Error al enviar la señal");
      } finally {
        setIsSendingTest(false);
      }
    }
  };

  const loadData = useCallback(async () => {
    try {
      const symbols = [
        "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT",
        "DOTUSDT", "LINKUSDT", "MATICUSDT", "SHIBUSDT", "LTCUSDT", "TRXUSDT", "UNIUSDT", "ATOMUSDT",
        "ETCUSDT", "XMRUSDT", "BCHUSDT", "ALGOUSDT", "NEARUSDT", "FTMUSDT", "SANDUSDT", "MANAUSDT",
        "APEUSDT", "GALAUSDT", "AXSUSDT", "CHZUSDT", "EGLDUSDT", "FILUSDT"
      ];
      
      const data = await fetchTickers(symbols, currentTimeframe);
      
      setAllTickers(prev => {
        // If timeframe changed, we might want to reset or filter differently
        // For now, let's just update with new data
        return data.map(t => {
          const existing = prev.find(p => p.symbol === t.symbol);
          if (existing) {
            const currentPrice = parseFloat(t.price);
            const currentProximity = Math.abs((currentPrice - existing.entry) / existing.entry) * 100;
            
            // If price is more than 3% away from entry, treat it as a new signal/refresh
            if (currentProximity > 3.0) {
              return t;
            }

            return {
              ...t,
              timeframe: existing.timeframe,
              entry: existing.entry,
              winRate: existing.winRate,
              stopLoss: existing.stopLoss,
              takeProfits: existing.takeProfits,
              consensus: existing.consensus,
              leverage: existing.leverage,
              riskLevel: existing.riskLevel,
              proximity: currentProximity
            };
          }
          return t;
        });
      });

      // Set loading to false as soon as we have the primary data
      setLoading(false);

      const [whales, traders, txs] = await Promise.all([
        fetchWhaleMovements(),
        fetchTopTraders(),
        fetchLargeTransactions()
      ]);
      setWhaleMovements(whales);
      setTopTraders(traders);
      setLargeTransactions(txs);

      const aiSentiment = await getMarketSentiment();
      setSentiment(aiSentiment);
    } catch (error) {
      console.error("Dashboard data load error:", error);
    } finally {
      setLoading(false);
    }
  }, [currentTimeframe]);

  const loadNews = useCallback(async () => {
    try {
      const news = await fetchRealTimeNews();
      // Filter news from previous day if they have a date property or just trust Gemini
      // The user specifically asked to remove news from previous day.
      setEconomicEvents(news);
    } catch (error) {
      console.error("News load error:", error);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData, currentTimeframe]);

  useEffect(() => {
    loadNews();
    const interval = setInterval(loadNews, 600000); // 10 minutes
    return () => clearInterval(interval);
  }, [loadNews]);

  useEffect(() => {
    setAllTickers([]); // Clear current signals when timeframe changes
  }, [currentTimeframe]);

  useEffect(() => {
    audioRef.current = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg");
  }, []);

  const filteredTickers = useMemo(() => {
    let filtered = [...allTickers];
    if (filter === "watchlist") {
      filtered = allTickers.filter(t => watchlist.includes(t.symbol));
    } else if (filter === "bullish") {
      filtered = allTickers.filter(t => parseFloat(t.priceChangePercent) > 1);
    } else if (filter === "bearish") {
      filtered = allTickers.filter(t => parseFloat(t.priceChangePercent) < -1);
    } else if (filter === "neutral") {
      filtered = allTickers.filter(t => Math.abs(parseFloat(t.priceChangePercent)) <= 1);
    } else if (filter === "breakout") {
      filtered = allTickers.filter(t => parseFloat(t.priceChangePercent) > 3);
    }

    // Filter by proximity: only show signals within 2% of entry price
    filtered = filtered.filter(t => (t.proximity || 0) <= 2.0);

    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof CryptoData];
        const bValue = b[sortConfig.key as keyof CryptoData];
        if (aValue === undefined || bValue === undefined) return 0;
        let comparison = 0;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    return filtered;
  }, [filter, allTickers, watchlist, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const toggleAlert = (e: React.MouseEvent, symbol: string) => {
    e.stopPropagation();
    const newAlerts = new Set(enabledAlerts);
    if (newAlerts.has(symbol)) {
      newAlerts.delete(symbol);
      const newTriggered = new Set(triggeredAlerts);
      newTriggered.delete(symbol);
      setTriggeredAlerts(newTriggered);
    } else {
      newAlerts.add(symbol);
    }
    setEnabledAlerts(newAlerts);
  };

  const saveSettings = () => {
    localStorage.setItem("telegramToken", telegramToken);
    localStorage.setItem("telegramChatId", telegramChatId);
    setShowNotifSettings(false);
    toast.success("Configuración guardada correctamente");
  };

  const sendTestTelegram = async () => {
    if (!telegramToken || !telegramChatId) {
      toast.error("Por favor, introduce el Token y el Chat ID");
      return;
    }
    setIsSendingTest(true);
    try {
      const message = "🔔 *PRUEBA DE ALERTA KINETIC*\n\nTu bot de Telegram ha sido vinculado correctamente. Recibirás alertas de rupturas y análisis de IA aquí.";
      const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: "Markdown"
        })
      });
      if (!response.ok) throw new Error("Failed to send");
      toast.success('Mensaje enviado correctamente a Telegram');
    } catch (e) {
      toast.error('Error al enviar el mensaje. Revisa el Token y el ID.');
    } finally {
      setIsSendingTest(false);
    }
  };

  const exportToZip = async () => {
    const zip = new JSZip();
    const dataStr = JSON.stringify(filteredTickers, null, 2);
    zip.file("signals_audit.json", dataStr);
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_signals_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    toast.success("Archivo ZIP generado correctamente para auditoría");
  };

  const signalStats = useMemo(() => [
    { id: "bullish", label: "SEÑALES ALCISTAS", count: allTickers.filter(t => parseFloat(t.priceChangePercent) > 0.5).length, color: "text-primary" },
    { id: "bearish", label: "SEÑALES BAJISTAS", count: allTickers.filter(t => parseFloat(t.priceChangePercent) < -0.5).length, color: "text-secondary" },
    { id: "breakout", label: "RUPTURAS (BREAKOUTS)", count: allTickers.filter(t => parseFloat(t.priceChangePercent) > 2.5).length, color: "text-primary animate-pulse" },
    { id: "neutral", label: "NEUTRAL / LATERAL", count: allTickers.filter(t => Math.abs(parseFloat(t.priceChangePercent)) <= 0.5).length, color: "text-tertiary" },
  ], [allTickers]);

  const currentPricesMap = useMemo(() => {
    const map: Record<string, number> = {};
    allTickers.forEach(t => {
      map[t.symbol] = parseFloat(t.price);
    });
    return map;
  }, [allTickers]);

  const strategies = [
    { tf: "1M", name: "Scalping", desc: "Ruptura de Micro-rango" },
    { tf: "5M", name: "Intradía", desc: "Confirmación de Tendencia" },
    { tf: "15M", name: "Reversión", desc: "Agotamiento de Precio" },
    { tf: "1H", name: "Swing", desc: "Estructura de Mercado" },
    { tf: "4H", name: "Macro", desc: "Tendencia Institucional" },
  ];

  if (loading && allTickers.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Page Specific Background */}
      <div className="fixed inset-0 opacity-[0.03] grayscale pointer-events-none z-0">
        <img 
          src="https://images.unsplash.com/photo-1611974717482-4828c9fd6273?q=80&w=2070&auto=format&fit=crop" 
          alt="Dashboard Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative z-10 pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
      >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container-high/40 p-6 rounded-[2rem] border border-outline-variant/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <Clock className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tighter text-on-surface uppercase">Temporalidad del Mercado</h2>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Escaneo activo en {currentTimeframe}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all border",
                currentTimeframe === tf 
                  ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                  : "bg-surface-container-high text-on-surface-variant border-outline-variant/10 hover:border-primary/30"
              )}
            >
              {tf}
            </button>
          ))}
          <div className="w-px h-8 bg-outline-variant/20 mx-2 hidden md:block" />
          <button 
            onClick={() => {
              setLoading(true);
              loadData();
              toast.success("Actualizando señales y datos de mercado...");
            }}
            className="p-3 bg-surface-container-high text-primary rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all active:rotate-180 duration-500"
            title="Actualizar Datos"
          >
            <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <NotificationSettings 
        isOpen={showNotifSettings}
        onClose={() => setShowNotifSettings(false)}
        telegramToken={telegramToken}
        setTelegramToken={setTelegramToken}
        telegramChatId={telegramChatId}
        setTelegramChatId={setTelegramChatId}
        onSendTest={sendTestTelegram}
        onSave={saveSettings}
        isSendingTest={isSendingTest}
      />

      <div className="trading-grid">
        <div className="md:col-span-9 space-y-8">
          <MarketPulse 
            sentiment={sentiment} 
            onShowSettings={() => setShowNotifSettings(true)} 
            marketRegime={marketRegime}
          />
          <PriceAlerts currentPrices={currentPricesMap} />
        </div>
        <div className="md:col-span-3">
          <LiveSignalFeed />
        </div>
      </div>

      <div className="trading-grid">
        <div className="md:col-span-4">
          <SignalSummary signals={signalStats} activeFilter={filter} onFilterClick={setFilter} />
        </div>
        <div className="md:col-span-8">
          <NewsFeed economicEvents={economicEvents} />
        </div>
      </div>

      <div className="trading-grid">
        <div className="md:col-span-12">
          <WhaleFeed whaleMovements={whaleMovements} topTraders={topTraders} largeTransactions={largeTransactions} />
        </div>
      </div>

      <section className="space-y-6">
        <div className="trading-card space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="section-title mb-0">Estrategias por Temporalidad</h3>
                <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Modelos de ejecución optimizados</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={sendTestTelegram}
                disabled={isSendingTest}
                className="btn-primary flex items-center gap-2 bg-primary/20 text-primary border-primary/30 hover:bg-primary hover:text-on-primary"
              >
                <Zap className={cn("w-3 h-3", isSendingTest && "animate-pulse")} />
                {isSendingTest ? "Enviando..." : "Probar Telegram"}
              </button>
              <button 
                onClick={exportToZip}
                className="btn-secondary flex items-center gap-2"
              >
                <Download className="w-3 h-3" />
                Exportar Auditoría
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {strategies.map((strat) => (
              <div key={strat.tf} className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/5 space-y-2 group hover:border-primary/30 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{strat.tf}</span>
                  <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">{strat.name}</span>
                </div>
                <p className="text-[10px] text-on-surface leading-tight font-black uppercase tracking-tighter">{strat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <SignalMatrix 
          tickers={filteredTickers}
          viewMode={viewMode}
          setViewMode={setViewMode}
          filter={filter}
          setFilter={setFilter}
          watchlist={watchlist}
          toggleWatchlist={toggleWatchlist}
          onSort={handleSort}
          sortConfig={sortConfig}
          enabledAlerts={enabledAlerts}
          triggeredAlerts={triggeredAlerts}
          onToggleAlert={toggleAlert}
          onShowFundamentals={showFundamentals}
        />
      </section>

      <MarketConclusion sentiment={sentiment} regime={marketRegime} />

      {/* Fundamental Modal */}
      <FundamentalModal 
        data={selectedFundamental} 
        onClose={() => setSelectedFundamental(null)} 
      />
    </motion.div>
    </div>
  );
};

export default Dashboard;
