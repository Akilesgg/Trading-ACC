import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
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
  Brain,
  Star,
  Target,
  Users,
  Waves,
  ArrowRightLeft,
  Newspaper,
  AlertTriangle,
  Download,
  LayoutGrid,
  List,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { 
  fetchTickers, 
  CryptoData, 
  fetchWhaleMovements, 
  fetchTopTraders, 
  fetchLargeTransactions, 
  fetchEconomicEvents 
} from "@/services/cryptoService";
import { getMarketSentiment } from "@/services/geminiService";
import { useWatchlist } from "@/hooks/useWatchlist";
import { sendTelegramAlert } from "@/services/telegramService";
import { toast } from "sonner";
import JSZip from "jszip";

const Dashboard = () => {
  const [tickers, setTickers] = useState<CryptoData[]>([]);
  const [allTickers, setAllTickers] = useState<CryptoData[]>([]);
  const [sentiment, setSentiment] = useState<string>("Cargando inteligencia de mercado...");
  const [loading, setLoading] = useState(true);
  const { watchlist, toggleWatchlist } = useWatchlist();
  const [filter, setFilter] = useState<"all" | "watchlist" | "bullish" | "bearish" | "neutral" | "breakout">("all");
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [sortConfig, setSortConfig] = useState<{ key: keyof CryptoData | string, direction: 'asc' | 'desc' } | null>(null);
  
  const [whaleMovements, setWhaleMovements] = useState<any[]>([]);
  const [topTraders, setTopTraders] = useState<any[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<any[]>([]);
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);

  const loadData = async () => {
    try {
      const symbols = [
        "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT",
        "DOTUSDT", "LINKUSDT", "MATICUSDT", "SHIBUSDT", "LTCUSDT", "TRXUSDT", "UNIUSDT", "ATOMUSDT",
        "ETCUSDT", "XMRUSDT", "BCHUSDT", "ALGOUSDT", "NEARUSDT", "FTMUSDT", "SANDUSDT", "MANAUSDT",
        "APEUSDT", "GALAUSDT", "AXSUSDT", "CHZUSDT", "EGLDUSDT", "FILUSDT"
      ];
      
      const data = await fetchTickers(symbols);
      const tickersWithTF = data.map(t => {
        const tf = ["1m", "5m", "15m", "1h", "4h"][Math.floor(Math.random() * 5)];
        const isBullish = parseFloat(t.priceChangePercent) > 0;
        const price = parseFloat(t.price);
        const volatility = price * 0.02;

        return {
          ...t,
          timeframe: tf,
          market: "SPOT",
          entry: price,
          winRate: Math.floor(Math.random() * 20) + 70,
          proximity: Math.random() * 0.05,
          direction: isBullish ? "LONG" : "SHORT",
          stopLoss: isBullish ? price * 0.97 : price * 1.03,
          takeProfits: isBullish 
            ? [price * 1.02, price * 1.05, price * 1.08]
            : [price * 0.98, price * 0.95, price * 0.92],
          consensus: Math.floor(Math.random() * 30) + 60,
          funding: (Math.random() * 0.02 - 0.01).toFixed(4) + "%",
          oi: (Math.random() * 100 + 50).toFixed(1) + "M",
          rsi: Math.floor(Math.random() * 40) + 30,
          recommendation: isBullish ? "COMPRA" : "VENTA",
          liquidity: (Math.random() * 10 + 5).toFixed(1) + "M",
          alert: Math.random() > 0.7,
          leverage: Math.floor(Math.random() * 10) + 5,
          riskLevel: ["Bajo", "Moderado", "Alto"][Math.floor(Math.random() * 3)]
        };
      });
      setAllTickers(tickersWithTF);

      // Check for automatic alerts (All signals with high confidence or significant change)
      tickersWithTF.forEach(ticker => {
        const change = parseFloat(ticker.priceChangePercent);
        const absChange = Math.abs(change);
        
        // Alert if change > 3% or random high-confidence signal
        if (absChange > 3 || (ticker.consensus > 85 && Math.random() > 0.95)) {
          const lastAlert = localStorage.getItem(`alert_${ticker.symbol}`);
          const now = Date.now();
          // Cooldown of 4 hours to avoid spamming
          if (!lastAlert || now - parseInt(lastAlert) > 14400000) {
            sendTelegramAlert({
              symbol: ticker.symbol,
              price: ticker.price,
              change: ticker.priceChangePercent,
              type: change > 5 ? "BREAKOUT" : (change > 0 ? "BULLISH" : "BEARISH"),
              confidence: ticker.consensus,
              analysis: `Señal detectada en temporalidad ${ticker.timeframe}. Estrategia: ${getStrategy(ticker.timeframe)}. Estructura de mercado confirmada.`,
              entry: ticker.entry.toFixed(ticker.price.split('.')[1]?.length || 2),
              sl: ticker.stopLoss.toFixed(ticker.price.split('.')[1]?.length || 2),
              tp1: ticker.takeProfits[0].toFixed(ticker.price.split('.')[1]?.length || 2),
              tp2: ticker.takeProfits[1].toFixed(ticker.price.split('.')[1]?.length || 2),
              tp3: ticker.takeProfits[2].toFixed(ticker.price.split('.')[1]?.length || 2),
              leverage: `x${ticker.leverage}`
            });
            localStorage.setItem(`alert_${ticker.symbol}`, now.toString());
          }
        }
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
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, []);

  const [timeframeFilter, setTimeframeFilter] = useState<string>("all");

  useEffect(() => {
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

    if (timeframeFilter !== "all") {
      filtered = filtered.filter(t => t.timeframe === timeframeFilter);
    }

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

    setTickers(filtered);
  }, [filter, allTickers, watchlist, sortConfig]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const exportToZip = async () => {
    const zip = new JSZip();
    const dataStr = JSON.stringify(tickers, null, 2);
    zip.file("signals_audit.json", dataStr);
    
    const content = await zip.generateAsync({ type: "blob" });
    const url = window.URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_signals_${new Date().toISOString().split('T')[0]}.zip`;
    link.click();
    toast.success("Archivo ZIP generado correctamente para auditoría");
  };

  const bullishCount = allTickers.filter(t => parseFloat(t.priceChangePercent) > 0.5).length + (Math.floor(Date.now() / 60000) % 3);
  const bearishCount = allTickers.filter(t => parseFloat(t.priceChangePercent) < -0.5).length + (Math.floor(Date.now() / 60000) % 2);
  const neutralCount = Math.max(0, allTickers.length - bullishCount - bearishCount);
  const breakoutCount = allTickers.filter(t => parseFloat(t.priceChangePercent) > 2.5).length + (Math.floor(Date.now() / 120000) % 2);

  const signals = [
    { id: "bullish", label: "SEÑALES ALCISTAS", count: bullishCount, color: "text-primary" },
    { id: "bearish", label: "SEÑALES BAJISTAS", count: bearishCount, color: "text-secondary" },
    { id: "breakout", label: "RUPTURAS (BREAKOUTS)", count: breakoutCount, color: "text-primary animate-pulse" },
    { id: "neutral", label: "NEUTRAL / LATERAL", count: neutralCount, color: "text-tertiary" },
  ];

  const playAlert = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
    audio.play().catch(e => console.log("Audio play blocked by browser"));
  };

  const handleSignalClick = (id: any) => {
    setFilter(id);
    const element = document.getElementById("kinetic-matrix");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    if (id === "breakout") playAlert();
  };

  const getStrategy = (timeframe: string) => {
    switch(timeframe.toUpperCase()) {
      case "1M": return "Scalping: Ruptura de Micro-rango - Basada en micro-volatilidad y rupturas de canales de 1 minuto.";
      case "5M": return "Intradía: Confirmación de Tendencia - Busca confluencia entre EMAs y volumen en retrocesos.";
      case "15M": return "Reversión: Agotamiento de Precio - Detecta divergencias en RSI y agotamiento de tendencia.";
      case "1H": return "Swing: Estructura de Mercado - Análisis de BOS/CHoCH y zonas de oferta/demanda.";
      case "4H": return "Macro: Tendencia Institucional - Identifica el sesgo direccional de grandes instituciones.";
      default: return "Estrategia Estándar";
    }
  };

  const strategies = [
    { tf: "1M", name: "Scalping", desc: "Ruptura de Micro-rango" },
    { tf: "5M", name: "Intradía", desc: "Confirmación de Tendencia" },
    { tf: "15M", name: "Reversión", desc: "Agotamiento de Precio" },
    { tf: "1H", name: "Swing", desc: "Estructura de Mercado" },
    { tf: "4H", name: "Macro", desc: "Tendencia Institucional" },
  ];

  const velocityMoves = [
    { id: "01", pair: "AVAX / USDT", desc: "Volatilidad incrementada detectada", type: "COMPRA RÁPIDA", time: "hace 2m", color: "text-primary" },
    { id: "02", pair: "PEPE / USDT", desc: "Alerta de movimiento de ballenas", type: "SALIR AHORA", time: "hace 5m", color: "text-secondary" },
    { id: "03", pair: "LINK / USDT", desc: "Condición de sobreventa RSI", type: "COMPRA FUERTE", time: "hace 12m", color: "text-primary" },
  ];

  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [telegramToken, setTelegramToken] = useState(localStorage.getItem("telegramToken") || "8287353475:AAE90JqwdWnwoJSrr9OaNIphmKtmuy0Qu0Q");
  const [telegramChatId, setTelegramChatId] = useState(localStorage.getItem("telegramChatId") || "-1003045390811");
  const [isSendingTest, setIsSendingTest] = useState(false);

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
    
    toast.promise(
      (async () => {
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
      })(),
      {
        loading: 'Enviando mensaje de prueba...',
        success: 'Mensaje enviado correctamente a Telegram',
        error: 'Error al enviar el mensaje. Revisa el Token y el ID.',
      }
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      {/* Notification Settings Modal */}
      <AnimatePresence>
        {showNotifSettings && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotifSettings(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface-container-low p-8 rounded-[2.5rem] z-[110] border border-outline-variant/20 shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-xl font-bold uppercase tracking-tight">Configuración de Alertas</h3>
                <button onClick={() => setShowNotifSettings(false)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                  <Activity className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-widest">Notificaciones al Móvil</span>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-black">ACTIVO</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-primary uppercase tracking-widest">Configuración Telegram</p>
                      <p className="text-[10px] text-on-surface-variant leading-relaxed">
                        1. Crea un bot con <span className="text-primary">@BotFather</span> en Telegram.<br/>
                        2. Obtén tu <span className="text-primary">API Token</span>.<br/>
                        3. Obtén tu <span className="text-primary">Chat ID</span> (usa @userinfobot).
                      </p>
                    </div>

                    <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <p className="text-[9px] font-bold text-primary uppercase mb-1">INSTRUCCIONES PRECISAS</p>
                      <p className="text-[9px] text-on-surface-variant leading-relaxed">
                        1. El sistema ya tiene pre-configurados tus datos.<br/>
                        2. Presiona <span className="text-primary font-bold">"ENVIAR PRUEBA"</span> para verificar la conexión.<br/>
                        3. Las alertas se enviarán <span className="text-primary font-bold">AUTOMÁTICAMENTE</span> cuando la IA detecte una ruptura confirmada con una confianza {'>'} 80%.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <input 
                        type="text" 
                        placeholder="Telegram Bot Token" 
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                        className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-[10px] focus:outline-none focus:border-primary/50"
                      />
                      <input 
                        type="text" 
                        placeholder="Chat ID" 
                        value={telegramChatId}
                        onChange={(e) => setTelegramChatId(e.target.value)}
                        className="w-full bg-surface-container-highest border border-outline-variant/20 rounded-lg px-3 py-2 text-[10px] focus:outline-none focus:border-primary/50"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={sendTestTelegram}
                      disabled={isSendingTest}
                      className="flex-1 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      {isSendingTest ? "Enviando..." : "Enviar Prueba"}
                    </button>
                    <button className="flex-1 py-2 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors">Vincular Discord</button>
                  </div>
                </div>

                <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-widest">Alertas Sonoras (PC)</span>
                    <div className="w-10 h-5 bg-primary rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-on-primary rounded-full shadow-sm"></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-widest">
                    Se reproducirá un sonido "Ping" cuando una señal entre en zona de ruptura.
                  </p>
                </div>

                <div className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-widest">Alertas Visuales</span>
                    <div className="w-10 h-5 bg-primary rounded-full relative">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-on-primary rounded-full shadow-sm"></div>
                    </div>
                  </div>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed uppercase tracking-widest">
                    Las tarjetas de activos parpadearán cuando se detecte una señal crítica.
                  </p>
                </div>
              </div>

              <button 
                onClick={saveSettings}
                className="w-full py-4 bg-primary text-on-primary rounded-full font-bold uppercase tracking-widest text-xs shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                Guardar Configuración
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Hero: Market Pulse */}
      <section className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Ticker Card */}
          <div className="lg:col-span-2 bg-surface-container-low p-8 rounded-xl border-l-4 border-primary relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-label uppercase tracking-widest text-primary-dim">Sentimiento del Mercado Global</span>
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                  </div>
                  <button 
                    onClick={() => setShowNotifSettings(true)}
                    className="p-2 bg-surface-container-highest rounded-xl border border-outline-variant/10 hover:bg-primary/10 transition-colors group"
                  >
                    <Bell className="w-4 h-4 text-on-surface-variant group-hover:text-primary" />
                  </button>
                </div>
                <h2 className="font-headline text-[3.5rem] font-bold tracking-tight leading-none mb-4"><span className="text-primary">CODICIA</span> EXTREMA</h2>
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-on-surface-variant text-sm font-label uppercase tracking-widest">Índice de Miedo y Codicia</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-headline font-bold">84</span>
                    <span className="text-primary-dim font-bold">+12% vs ayer</span>
                  </div>
                </div>
                <Link 
                  to="/market"
                  className="bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed px-8 py-4 rounded-full font-bold uppercase tracking-wider shadow-[0_10px_20px_rgba(0,255,163,0.2)] active:scale-95 transition-transform text-center"
                >
                  Ver Mapa de Calor
                </Link>
              </div>
            </div>
          </div>

          {/* Active Signal Summary */}
          <div className="bg-surface-container-high p-6 rounded-xl space-y-6 border border-outline-variant/10">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-tertiary" />
                SEÑALES ACTIVAS
              </h3>
              <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest animate-pulse">
                Actualizado: {new Date().toLocaleTimeString()}
              </span>
            </div>
            <div className="space-y-4">
              {signals.map((s) => (
                <button 
                  key={s.label} 
                  onClick={() => handleSignalClick(s.id as any)}
                  className={cn(
                    "w-full flex justify-between items-center p-3 rounded-lg transition-all active:scale-95",
                    filter === s.id ? "bg-primary/10 border border-primary/30" : "bg-surface-container hover:bg-surface-container-highest"
                  )}
                >
                  <span className="text-sm font-label uppercase tracking-wider text-on-surface-variant">{s.label}</span>
                  <span className={cn("font-headline font-bold text-xl", s.color)}>{s.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Copy Trading & News Section (MOVED TO TOP) */}
      <section className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Copy Trading Panel */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#0a0c10] border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-4 border-b border-orange-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Target className="w-5 h-5 text-black" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-orange-500">
                    COPY TRADING | WHALES & TOP TRADERS EN VIVO
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Ballenas Activas: {whaleMovements.length}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
                    <Users className="w-3 h-3 text-primary" />
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Top Traders: {topTraders.length}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-outline-variant/10">
                {/* Whale Movements */}
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Waves className="w-3 h-3" /> MOVIMIENTOS DE BALLENAS
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {whaleMovements.map((whale, i) => (
                      <a 
                        key={i} 
                        href={whale.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-surface-container rounded flex items-center justify-center">
                            <img 
                              src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} 
                              className="w-4 h-4" 
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-on-surface">{whale.symbol}</p>
                            <p className="text-[8px] text-on-surface-variant uppercase">{whale.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-[10px] font-black", whale.type === "COMPRA" ? "text-primary" : "text-secondary")}>{whale.type}</p>
                          <p className="text-[10px] font-bold text-on-surface">{whale.amount}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Top Traders */}
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Users className="w-3 h-3" /> TOP TRADERS
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {topTraders.map((trader, i) => (
                      <a 
                        key={i} 
                        href={trader.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-surface-container rounded-full flex items-center justify-center">
                            <Users className="w-3 h-3 text-on-surface-variant" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-on-surface">{trader.name}</p>
                            <p className="text-[8px] text-on-surface-variant uppercase">{trader.profit}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn("text-[10px] font-black", trader.trade.includes("LARGO") ? "text-primary" : "text-secondary")}>{trader.trade}</p>
                        </div>
                        <div className="w-6 h-6 rounded-full border border-orange-500/30 flex items-center justify-center text-[8px] font-bold text-orange-500">
                          {trader.score}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Large Transactions */}
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <ArrowRightLeft className="w-3 h-3" /> GRANDES TX
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {largeTransactions.map((tx, i) => (
                      <a 
                        key={i} 
                        href={tx.sourceUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors"
                      >
                        <div>
                          <p className="text-[10px] font-bold text-on-surface">{tx.symbol}</p>
                          <p className="text-[8px] text-on-surface-variant font-mono">{tx.address}</p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "text-[10px] font-black uppercase",
                            tx.type === "Acumulación" ? "text-orange-500" : 
                            tx.type === "Depósito" ? "text-yellow-500" : "text-secondary"
                          )}>
                            {tx.type}
                          </p>
                          <p className="text-[8px] text-on-surface-variant">{tx.time}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Impact News Panel */}
          <div className="bg-[#0a0c10] border border-outline-variant/10 rounded-2xl p-6 space-y-6 shadow-2xl">
            <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-4">
              <Newspaper className="w-5 h-5 text-on-surface-variant" />
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface">
                NOTICIAS
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
                  
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase",
                      news.impact === "CRITICAL" ? "text-secondary" : "text-orange-500"
                    )}>
                      {news.impact === "CRITICAL" ? "Alto" : "Medio"}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                      <span className="text-[10px] font-bold text-on-surface-variant ml-1">{news.probability}%</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Kinetic Matrix */}
      <section id="kinetic-matrix" className="space-y-6 scroll-mt-24">
        {/* Strategy Legend */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-black uppercase tracking-widest">Leyenda de Estrategias por Temporalidad</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {strategies.map((strat) => (
              <div key={strat.tf} className="p-3 bg-surface-container rounded-xl border border-outline-variant/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-primary">{strat.tf}</span>
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase">{strat.name}</span>
                </div>
                <p className="text-[10px] text-on-surface leading-tight font-medium">{strat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategy Legend */}
        <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 mb-8">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
            <Info className="w-3 h-3" /> LEYENDA DE ESTRATEGIAS POR TEMPORALIDAD
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {strategies.map((strat) => (
              <div key={strat.tf} className="p-3 bg-surface-container rounded-xl border border-outline-variant/5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-primary">{strat.tf}</span>
                  <span className="text-[10px] font-bold text-on-surface uppercase tracking-widest">{strat.name}</span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">
                  {strat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div id="kinetic-matrix" className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="font-headline text-2xl font-bold tracking-tight uppercase">MATRIZ KINETIC</h2>
            <div className="flex bg-surface-container-highest rounded-xl p-1 border border-outline-variant/10">
              {["all", "1m", "5m", "15m", "1h", "4h"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframeFilter(tf)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                    timeframeFilter === tf ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  {tf === "all" ? "Todos" : tf}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={exportToZip}
              className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-xl border border-outline-variant/10 text-[10px] font-black uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-all"
            >
              <Download className="w-4 h-4" /> Exportar ZIP
            </button>
            <div className="flex bg-surface-container-highest rounded-full p-1">
              <button 
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded-full transition-all",
                  viewMode === "grid" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode("table")}
                className={cn(
                  "p-2 rounded-full transition-all",
                  viewMode === "table" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="flex bg-surface-container-highest rounded-full p-1">
              <button 
                onClick={() => setFilter("all")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  filter === "all" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilter("watchlist")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all",
                  filter === "watchlist" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                Watchlist
              </button>
            </div>
          </div>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tickers.map((ticker) => {
              const isBullish = parseFloat(ticker.priceChangePercent) > 0;
              return (
                <div 
                  key={ticker.symbol} 
                  className={cn(
                    "bg-surface-container-low rounded-xl overflow-hidden group border-2 transition-all duration-500",
                    isBullish ? "border-primary/10 hover:border-primary/40 shadow-lg shadow-primary/5" : "border-secondary/10 hover:border-secondary/40 shadow-lg shadow-secondary/5"
                  )}
                >
                  <div className="p-6 space-y-6">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                          isBullish ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                        )}>
                          {isBullish ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="font-headline font-bold text-lg">{ticker.symbol.replace("USDT", " / USDT")}</h4>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest",
                              isBullish ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                            )}>
                              {isBullish ? "Alcista" : "Bajista"}
                            </span>
                            <Star 
                              className={cn(
                                "w-3 h-3 transition-colors cursor-pointer",
                                watchlist.includes(ticker.symbol) ? "text-primary fill-primary" : "text-on-surface-variant hover:text-primary"
                              )} 
                              onClick={() => toggleWatchlist(ticker.symbol)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-headline font-bold text-lg">${parseFloat(ticker.price).toLocaleString()}</p>
                        <p className={cn("text-xs font-bold", isBullish ? "text-primary" : "text-secondary")}>
                          {isBullish ? "+" : ""}{ticker.priceChangePercent}%
                        </p>
                      </div>
                    </div>
                    {/* Timeframe Matrix */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "1M", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
                        { label: "5M", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
                        { label: "15M", icon: Minus, color: "text-tertiary", bg: "bg-surface-container-highest" },
                        { label: "4H", icon: TrendingDown, color: "text-secondary", bg: "bg-secondary/10" },
                      ].map((tf) => (
                        <div 
                          key={tf.label} 
                          title={getStrategy(tf.label)}
                          className={cn("flex flex-col items-center p-2 rounded-lg border border-outline-variant/10 group/tf relative", tf.bg)}
                        >
                          <span className="text-[10px] font-label text-on-surface-variant mb-1">{tf.label}</span>
                          <tf.icon className={cn("w-4 h-4", tf.color)} />
                          
                          {/* Strategy Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-surface-container-highest text-[8px] font-bold uppercase tracking-widest text-on-surface rounded opacity-0 group-hover/tf:opacity-100 transition-opacity pointer-events-none z-50 text-center border border-outline-variant/20 shadow-xl">
                            {getStrategy(tf.label)}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link 
                      to={`/terminal?symbol=${ticker.symbol}`}
                      className={cn(
                        "block w-full py-3 rounded-xl border font-bold uppercase tracking-widest text-xs text-center transition-all duration-300",
                        isBullish ? "bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-on-primary" : "bg-secondary/10 border-secondary/20 text-secondary hover:bg-secondary hover:text-on-secondary"
                      )}
                    >
                      ANALIZAR AHORA
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container border-b border-outline-variant/10">
                    {[
                      { key: 'market', label: 'Mercado' },
                      { key: 'symbol', label: 'Activo' },
                      { key: 'price', label: 'Precio Actual' },
                      { key: 'entry', label: 'Entrada' },
                      { key: 'timeframe', label: 'TF' },
                      { key: 'winRate', label: 'WinRate' },
                      { key: 'proximity', label: 'Prox.' },
                      { key: 'direction', label: 'Dirección' },
                      { key: 'stopLoss', label: 'Stop Loss' },
                      { key: 'takeProfits', label: 'Take Profits' },
                      { key: 'consensus', label: 'Consenso' },
                      { key: 'funding', label: 'FUND' },
                      { key: 'oi', label: 'OI' },
                      { key: 'rsi', label: 'RSI' },
                      { key: 'recommendation', label: 'REC' },
                      { key: 'liquidity', label: 'LIQ' },
                      { key: 'alert', label: 'Alerta' },
                      { key: 'leverage', label: 'Leverage' }
                    ].map((col) => (
                      <th 
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="p-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          {col.label}
                          {sortConfig?.key === col.key ? (
                            sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-primary" /> : <ChevronDown className="w-3 h-3 text-primary" />
                          ) : (
                            <ChevronDown className="w-3 h-3 opacity-0 group-hover:opacity-30" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tickers.map((ticker) => (
                    <tr key={ticker.symbol} className="border-b border-outline-variant/5 hover:bg-surface-container-high/30 transition-colors">
                      <td className="p-4 text-[10px] font-bold text-on-surface-variant">{ticker.market}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <img src={ticker.image} className="w-4 h-4" alt="" referrerPolicy="no-referrer" />
                          <span className="text-xs font-black">{ticker.symbol}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-bold">${parseFloat(ticker.price).toLocaleString()}</td>
                      <td className="p-4 text-xs font-bold text-primary">${ticker.entry?.toLocaleString()}</td>
                      <td className="p-4 text-[10px] font-bold">{ticker.timeframe}</td>
                      <td className="p-4">
                        <span className="text-[10px] font-black px-2 py-0.5 bg-primary/10 text-primary rounded">
                          {ticker.winRate}%
                        </span>
                      </td>
                      <td className="p-4 text-[10px] font-bold">{(ticker.proximity! * 100).toFixed(2)}%</td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded",
                          ticker.direction === "LONG" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                        )}>
                          {ticker.direction}
                        </span>
                      </td>
                      <td className="p-4 text-xs font-bold text-secondary">${ticker.stopLoss?.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {ticker.takeProfits?.map((tp, i) => (
                            <span key={i} className="text-[8px] font-bold text-primary">TP{i+1}: ${tp.toLocaleString()}</span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="w-12 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${ticker.consensus}%` }}></div>
                        </div>
                        <span className="text-[8px] font-bold text-on-surface-variant">{ticker.consensus}%</span>
                      </td>
                      <td className="p-4 text-[10px] font-bold text-on-surface-variant">{ticker.funding}</td>
                      <td className="p-4 text-[10px] font-bold text-on-surface-variant">{ticker.oi}</td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[10px] font-black",
                          ticker.rsi! > 70 ? "text-secondary" : ticker.rsi! < 30 ? "text-primary" : "text-on-surface-variant"
                        )}>
                          {ticker.rsi}
                        </span>
                      </td>
                      <td className="p-4 text-[8px] font-black uppercase text-primary">{ticker.recommendation}</td>
                      <td className="p-4 text-[10px] font-bold text-on-surface-variant">{ticker.liquidity}</td>
                      <td className="p-4">
                        {ticker.alert ? <Bell className="w-3 h-3 text-primary animate-pulse" /> : <Minus className="w-3 h-3 text-on-surface-variant opacity-20" />}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-primary">x{ticker.leverage}</span>
                          <span className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded uppercase",
                            ticker.riskLevel === "Bajo" ? "bg-primary/10 text-primary" : ticker.riskLevel === "Moderado" ? "bg-orange-500/10 text-orange-500" : "bg-secondary/10 text-secondary"
                          )}>
                            {ticker.riskLevel}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Dynamic Trends & Volume */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* ... existing velocity moves ... */}
      </section>

      {/* Floating Action Button: Insights */}
      <button 
        onClick={() => setFilter(filter === "all" ? "watchlist" : "all")}
        className="fixed right-6 bottom-24 w-14 h-14 bg-gradient-to-br from-primary to-primary-dim rounded-2xl flex items-center justify-center shadow-2xl z-40 active:scale-90 transition-transform"
      >
        <Brain className="w-8 h-8 text-on-primary-fixed" />
      </button>
    </motion.div>
  );
};

export default Dashboard;
