import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain,
  Info,
  Download,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchTickers, 
  CryptoData, 
  fetchWhaleMovements, 
  fetchTopTraders, 
  fetchLargeTransactions, 
  fetchEconomicEvents,
  fetchAssetFundamentals,
  AssetFundamental
} from "@/services/cryptoService";
import { getMarketSentiment } from "@/services/geminiService";
import { useWatchlist } from "@/hooks/useWatchlist";
import { sendTelegramAlert } from "@/services/telegramService";
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

import { useSignalStore } from "@/store/useSignalStore";

const Dashboard = () => {
  const { addSignal } = useSignalStore();
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
  const [telegramToken, setTelegramToken] = useState(localStorage.getItem("telegramToken") || import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "");
  const [telegramChatId, setTelegramChatId] = useState(localStorage.getItem("telegramChatId") || import.meta.env.VITE_TELEGRAM_CHAT_ID || "");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [enabledAlerts, setEnabledAlerts] = useState<Set<string>>(new Set());
  const [triggeredAlerts, setTriggeredAlerts] = useState<Set<string>>(new Set());
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [selectedFundamental, setSelectedFundamental] = useState<AssetFundamental | null>(null);

  const showFundamentals = async (symbol: string) => {
    const data = await fetchAssetFundamentals(symbol);
    setSelectedFundamental(data);
  };

  const loadData = useCallback(async () => {
    try {
      const symbols = [
        "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT",
        "DOTUSDT", "LINKUSDT", "MATICUSDT", "SHIBUSDT", "LTCUSDT", "TRXUSDT", "UNIUSDT", "ATOMUSDT",
        "ETCUSDT", "XMRUSDT", "BCHUSDT", "ALGOUSDT", "NEARUSDT", "FTMUSDT", "SANDUSDT", "MANAUSDT",
        "APEUSDT", "GALAUSDT", "AXSUSDT", "CHZUSDT", "EGLDUSDT", "FILUSDT"
      ];
      
      const data = await fetchTickers(symbols);
      
      setAllTickers(prev => {
        const updated = data.map(t => {
          const existing = prev.find(p => p.symbol === t.symbol);
          if (existing) {
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
              proximity: Math.abs((parseFloat(t.price) - existing.entry) / existing.entry) * 100
            };
          }
          return t;
        });

        // Signal Detection Logic
        updated.forEach(ticker => {
          const proximity = ticker.proximity || 0;
          // If price is very close to entry (within 0.5%) and not already triggered
          if (proximity <= 0.5 && !triggeredAlerts.has(ticker.symbol)) {
            // Trigger Global Signal Store
            addSignal(ticker);
            
            // Trigger Telegram Alert
            if (telegramToken && telegramChatId) {
              const isBullish = parseFloat(ticker.priceChangePercent) > 0;
              sendTelegramAlert({
                symbol: ticker.symbol,
                price: ticker.price,
                change: ticker.priceChangePercent,
                type: "SIGNAL",
                confidence: ticker.consensus || 85,
                entry: ticker.entry?.toFixed(4),
                sl: ticker.stopLoss?.toFixed(4),
                tp1: ticker.takeProfits?.[0]?.toFixed(4),
                tp2: ticker.takeProfits?.[1]?.toFixed(4),
                tp3: ticker.takeProfits?.[2]?.toFixed(4),
                leverage: `${ticker.leverage}x`
              });
            }

            setTriggeredAlerts(prev => new Set(prev).add(ticker.symbol));
            toast.info(`¡Nueva señal activa para ${ticker.symbol}!`, {
              description: `Precio cerca de zona de entrada: $${ticker.entry?.toFixed(4)}`,
              duration: 10000,
            });
          }
        });

        return updated;
      });

      const [whales, traders, txs, events] = await Promise.all([
        fetchWhaleMovements(),
        fetchTopTraders(),
        fetchLargeTransactions(),
        fetchEconomicEvents()
      ]);
      setWhaleMovements(whales);
      setTopTraders(traders);
      setLargeTransactions(txs);
      setEconomicEvents(events);

      const aiSentiment = await getMarketSentiment();
      setSentiment(aiSentiment);
    } catch (error) {
      console.error("Dashboard data load error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
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
        <div className="md:col-span-8">
          <MarketPulse sentiment={sentiment} onShowSettings={() => setShowNotifSettings(true)} />
        </div>
        <div className="md:col-span-4">
          <SignalSummary signals={signalStats} activeFilter={filter} onFilterClick={setFilter} />
        </div>
      </div>

      <div className="trading-grid">
        <div className="md:col-span-8">
          <WhaleFeed whaleMovements={whaleMovements} topTraders={topTraders} largeTransactions={largeTransactions} />
        </div>
        <div className="md:col-span-4">
          <NewsFeed economicEvents={economicEvents} />
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
            <button 
              onClick={exportToZip}
              className="btn-secondary flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              Exportar Auditoría
            </button>
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

      {/* Fundamental Modal */}
      <FundamentalModal 
        data={selectedFundamental} 
        onClose={() => setSelectedFundamental(null)} 
      />
    </motion.div>
  );
};

export default Dashboard;
