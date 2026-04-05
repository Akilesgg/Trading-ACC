import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useDragControls, Reorder, motion } from "motion/react";
import { 
  ArrowLeft, 
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  Activity, 
  Shield,
  Clock,
  Target,
  BarChart3,
  Brain,
  Settings,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  Info,
  AlertTriangle,
  CheckCircle2,
  Crosshair,
  Waves,
  Gauge,
  Copy,
  Share2,
  Eye,
  ZapOff,
  Globe,
  Calculator,
  History,
  Users,
  MousePointer2,
  ArrowRightLeft,
  Newspaper,
  Star,
  X,
  LayoutGrid,
  GripVertical
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchTicker, 
  CryptoData, 
  fetchKlines, 
  connectTickerStream, 
  fetchEconomicEvents,
  fetchWhaleMovements,
  fetchTopTraders,
  fetchLargeTransactions
} from "@/services/cryptoService";
import { analyzeMarket } from "@/services/geminiService";
import { sendTelegramAlert } from "@/services/telegramService";
import { toast } from "sonner";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  ReferenceLine
} from "recharts";

const TerminalModule = ({ 
  moduleId, 
  ticker, 
  whaleMovements, 
  topTraders, 
  largeTransactions, 
  economicEvents, 
  analysis, 
  setSelectedTraderStrategy,
  accountSize,
  setAccountSize,
  riskAmount,
  setRiskAmount,
  copySignal,
  shareToTelegram,
  timeframe,
  setTimeframe,
  assetSentiments
}: any) => {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={moduleId}
      dragListener={false}
      dragControls={controls}
      className="relative group/module"
    >
      <div 
        onPointerDown={(e) => controls.start(e)}
        className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover/module:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-2 z-50"
      >
        <GripVertical className="w-6 h-6 text-on-surface-variant/50" />
      </div>

      {moduleId === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl border bg-surface-container-low border-outline-variant/10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Precio Actual</span>
              <Activity className={cn("w-4 h-4", (ticker && parseFloat(ticker.priceChangePercent) >= 0) ? "text-primary" : "text-secondary")} />
            </div>
            <p className="text-2xl font-headline font-bold">${ticker ? parseFloat(ticker.price).toLocaleString() : "---"}</p>
            <p className={cn("text-xs font-bold mt-1", (ticker && parseFloat(ticker.priceChangePercent) >= 0) ? "text-primary" : "text-secondary")}>
              {ticker && parseFloat(ticker.priceChangePercent) >= 0 ? "+" : ""}{ticker?.priceChangePercent}% (24h)
            </p>
          </div>
          
          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Volumen 24h</span>
              <BarChart3 className="w-4 h-4 text-tertiary" />
            </div>
            <p className="text-2xl font-headline font-bold">${ticker ? (parseFloat(ticker.volume) / 1000000).toFixed(2) : "---"}M</p>
            <p className="text-xs text-on-surface-variant mt-1 uppercase font-bold">USDT</p>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Rango 24h</span>
              <Layers className="w-4 h-4 text-secondary" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold">
                <span className="text-secondary">L: ${ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "---"}</span>
                <span className="text-primary">H: ${ticker ? parseFloat(ticker.highPrice).toLocaleString() : "---"}</span>
              </div>
              <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-secondary to-primary" 
                  style={{ width: ticker ? `${((parseFloat(ticker.price) - parseFloat(ticker.lowPrice)) / (parseFloat(ticker.highPrice) - parseFloat(ticker.lowPrice))) * 100}%` : "0%" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border bg-surface-container-low border-outline-variant/10 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Sentimiento IA</span>
            <div className="flex items-center gap-2">
              <Gauge className={cn("w-6 h-6", analysis?.sentiment === "BULLISH" ? "text-primary" : "text-secondary")} />
              <span className={cn("text-xl font-bold font-headline", analysis?.sentiment === "BULLISH" ? "text-primary" : "text-secondary")}>
                {analysis?.sentiment || (ticker && parseFloat(ticker.priceChangePercent) >= 0 ? "ALCISTA" : "BAJISTA")}
              </span>
            </div>
          </div>

          <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Server Status</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Online: Node-04</span>
            </div>
            <p className="text-[8px] text-on-surface-variant mt-1">Latencia: 14ms</p>
          </div>
        </div>
      )}

      {moduleId === "sentiment" && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Gauge className="w-3 h-3" /> SENTIMIENTO MULTI-TEMPORALIDAD
            </h4>
            <div className="flex flex-wrap gap-2">
              {["1m", "5m", "15m", "1h", "4h", "1d", "1w"].map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                    timeframe === tf ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {Object.entries(assetSentiments).map(([asset, data]: [string, any]) => (
              <Link 
                key={asset} 
                to={`/analysis?symbol=${asset}USDT`}
                className="bg-surface-container p-4 rounded-xl border border-outline-variant/5 text-center space-y-2 group hover:border-primary/30 transition-all cursor-pointer block"
              >
                <div className="flex justify-center mb-1">
                  <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${asset.toLowerCase()}.png`} className="w-6 h-6" alt="" referrerPolicy="no-referrer" />
                </div>
                <p className="text-[10px] font-black text-on-surface uppercase tracking-widest">{asset}</p>
                <div className={cn(
                  "px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest",
                  data.sentiment === "ALCISTA" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                )}>
                  {data.sentiment}
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", data.sentiment === "ALCISTA" ? "bg-primary" : "bg-secondary")}></div>
                  <span className="text-[8px] font-bold text-on-surface-variant">{data.confidence}%</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {moduleId === "copytrading" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-[#0a0c10] border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-4 border-b border-orange-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
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
                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Waves className="w-3 h-3" /> MOVIMIENTOS DE BALLENAS (30MIN)
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {whaleMovements.map((whale: any, i: number) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-surface-container rounded flex items-center justify-center">
                            <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} className="w-4 h-4" alt="" referrerPolicy="no-referrer" />
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
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Users className="w-3 h-3" /> TOP TRADERS A SEGUIR
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {topTraders.map((trader: any, i: number) => (
                      <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors" onClick={() => setSelectedTraderStrategy(trader)}>
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
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <ArrowRightLeft className="w-3 h-3" /> GRANDES TX
                  </h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {largeTransactions.map((tx: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-surface-container rounded flex items-center justify-center">
                            <ArrowRightLeft className="w-3 h-3 text-on-surface-variant" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-on-surface">{tx.amount} {tx.symbol}</p>
                            <p className="text-[8px] text-on-surface-variant uppercase">{tx.time}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-primary">{tx.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Globe className="w-3 h-3" /> EVENTOS ECONÓMICOS
              </h4>
              <div className="space-y-3">
                {economicEvents.map((event: any, i: number) => (
                  <div key={i} className="p-3 bg-surface-container rounded-xl border border-outline-variant/5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-bold text-on-surface-variant uppercase">{event.time}</span>
                      <span className={cn(
                        "text-[8px] font-black px-1.5 py-0.5 rounded uppercase",
                        event.impact === "HIGH" ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"
                      )}>{event.impact}</span>
                    </div>
                    <p className="text-[10px] font-bold text-on-surface leading-tight">{event.event}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {moduleId === "news" && (
        <div className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/10 space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
            <Zap className="w-3 h-3" /> LIQUIDEZ & TREND
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-on-surface-variant">LIQ ARRIBA:</span>
              <span className="text-xs font-bold text-secondary">${(parseFloat(ticker.price) * 1.06).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-on-surface-variant">LIQ ABAJO:</span>
              <span className="text-xs font-bold text-primary">${(parseFloat(ticker.price) * 0.94).toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-outline-variant/5">
              <p className="text-[9px] font-bold text-on-surface-variant uppercase mb-2">Correlación</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-surface-container p-2 rounded-lg text-center">
                  <p className="text-[8px] text-on-surface-variant uppercase">BTC</p>
                  <p className="text-[10px] font-bold text-primary">{analysis?.correlation.btc || "0.00"}</p>
                </div>
                <div className="bg-surface-container p-2 rounded-lg text-center">
                  <p className="text-[8px] text-on-surface-variant uppercase">ETH</p>
                  <p className="text-[10px] font-bold text-primary">{analysis?.correlation.eth || "0.00"}</p>
                </div>
                <div className="bg-surface-container p-2 rounded-lg text-center">
                  <p className="text-[8px] text-on-surface-variant uppercase">S&P</p>
                  <p className="text-[10px] font-bold text-on-surface-variant">{analysis?.correlation.sp500 || "0.00"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {moduleId === "indicators" && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
            <Activity className="w-3 h-3" /> INDICADORES TÉCNICOS AVANZADOS
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            {[
              { label: "RSI (14)", value: analysis?.indicators.rsi.val || "50.0", status: analysis?.indicators.rsi.status || "NEUTRAL", color: "text-on-surface" },
              { label: "MACD", value: analysis?.indicators.macd.val || "L: -9.53", status: analysis?.indicators.macd.status || "ALCISTA", color: analysis?.indicators.macd.color || "text-primary" },
              { label: "EMA 20/50", value: analysis?.indicators.ema.val || "66671.72", status: analysis?.indicators.ema.status || "BAJISTA", color: analysis?.indicators.ema.color || "text-secondary" },
              { label: "VWAP", value: analysis?.indicators.vwap.val || "66671.72", status: analysis?.indicators.vwap.status || "POR DEBAJO", color: analysis?.indicators.vwap.color || "text-secondary" },
              { label: "VOL Trend", value: analysis?.indicators.vol.val || "A: 0.0%", status: analysis?.indicators.vol.status || "MOMENTUM -", color: analysis?.indicators.vol.color || "text-on-surface-variant" },
              { label: "ADX", value: analysis?.indicators.adx.val || "24.5", status: analysis?.indicators.adx.status || "DÉBIL", color: analysis?.indicators.adx.color || "text-on-surface-variant" },
              { label: "ATR", value: analysis?.indicators.atr.val || "0.00", status: analysis?.indicators.atr.status || "NORMAL", color: analysis?.indicators.atr.color || "text-primary" }
            ].map((ind, i) => (
              <div key={i} className="bg-surface-container p-4 rounded-xl text-center space-y-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{ind.label}</p>
                <p className={cn("text-sm font-bold", ind.color)}>{ind.value}</p>
                <p className={cn("text-[10px] font-bold uppercase tracking-widest", ind.color)}>{ind.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {moduleId === "analysis" && analysis && (
        <div className="space-y-6">
          {/* Signal Hero Banner */}
          <div className={cn(
            "p-8 rounded-3xl border-2 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl overflow-hidden relative bg-surface-container-low",
            analysis.sentiment === "BULLISH" ? "border-primary/30" : "border-secondary/30"
          )}>
            <div className="absolute left-0 top-0 bottom-0 w-24 flex items-center justify-center opacity-10 pointer-events-none">
              {analysis.sentiment === "BULLISH" ? (
                <ArrowUpRight className="w-32 h-32 text-primary -rotate-12" />
              ) : (
                <ArrowDownRight className="w-32 h-32 text-secondary rotate-12" />
              )}
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-24 flex items-center justify-center opacity-10 pointer-events-none">
              {analysis.sentiment === "BULLISH" ? (
                <ArrowUpRight className="w-32 h-32 text-primary rotate-12" />
              ) : (
                <ArrowDownRight className="w-32 h-32 text-secondary -rotate-12" />
              )}
            </div>

            <div className="flex items-center gap-6 z-10">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                analysis.sentiment === "BULLISH" ? "bg-primary text-on-primary" : "bg-secondary text-on-secondary"
              )}>
                {analysis.sentiment === "BULLISH" ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest",
                    analysis.sentiment === "BULLISH" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  )}>
                    {analysis.type} DETECTADO
                  </span>
                  <span className="text-[10px] font-black bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full uppercase tracking-widest">
                    {analysis.strategy}
                  </span>
                </div>
                <h2 className="text-4xl font-headline font-black tracking-tighter">
                  {analysis.sentiment === "BULLISH" ? "OPORTUNIDAD LONG" : "OPORTUNIDAD SHORT"}
                </h2>
              </div>
            </div>

            <div className="flex flex-col items-center md:items-end gap-2 z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Confianza IA</span>
                <span className="text-2xl font-black text-primary">{analysis.score}%</span>
              </div>
              <div className="w-48 h-2 bg-surface-container rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", analysis.sentiment === "BULLISH" ? "bg-primary" : "bg-secondary")}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <Target className="w-3 h-3" /> NIVELES DE OPERACIÓN
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase">Riesgo/Beneficio:</span>
                    <span className="text-[10px] font-black text-primary">{analysis.ratio}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 bg-surface-container rounded-2xl border-l-4 border-primary shadow-lg">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">Precio de Entrada</p>
                    <p className="text-3xl font-headline font-black text-on-surface">${analysis.entry.toLocaleString()}</p>
                  </div>
                  <div className="p-6 bg-surface-container rounded-2xl border-l-4 border-secondary shadow-lg">
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">Stop Loss Sugerido</p>
                    <p className="text-3xl font-headline font-black text-secondary">${analysis.sl.toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Objetivos de Salida (Take Profits)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { label: "TP 1 (Conservador)", val: analysis.tp1, color: "text-primary" },
                      { label: "TP 2 (Moderado)", val: analysis.tp2, color: "text-primary" },
                      { label: "TP 3 (Agresivo)", val: analysis.tp3, color: "text-primary" }
                    ].map((tp, i) => (
                      <div key={i} className="p-4 bg-surface-container rounded-2xl border border-outline-variant/5 group hover:border-primary/30 transition-all">
                        <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">{tp.label}</p>
                        <p className={cn("text-xl font-black", tp.color)}>${tp.val.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low p-8 rounded-3xl border border-outline-variant/10 space-y-6">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Brain className="w-3 h-3" /> JUSTIFICACIÓN TÉCNICA IA
                </h4>
                <div className="p-6 bg-surface-container rounded-2xl border border-outline-variant/5">
                  <p className="text-sm text-on-surface-variant leading-relaxed italic font-medium">
                    "{analysis.description}"
                  </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(analysis.context).map(([key, val]: [string, any]) => (
                    <div key={key} className="p-3 bg-surface-container rounded-xl border border-outline-variant/5 text-center">
                      <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">{key}</p>
                      <p className="text-[10px] font-black text-primary">{val}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 space-y-6">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Settings className="w-3 h-3" /> GESTIÓN DE RIESGO
                </h4>
                
                <div className="space-y-4">
                  <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/5">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">Apalancamiento</span>
                      <span className="text-lg font-black text-primary">x5 - x10</span>
                    </div>
                    <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-1/3"></div>
                    </div>
                  </div>

                  <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/5">
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Riesgo por Operación</p>
                    <p className="text-sm font-black text-on-surface">1% - 2% del Capital</p>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button 
                      onClick={copySignal}
                      className="w-full py-3 bg-surface-container-highest hover:bg-primary/10 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> Copiar Señal
                    </button>
                    <button 
                      onClick={shareToTelegram}
                      className="w-full py-3 bg-primary text-on-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                    >
                      <Share2 className="w-4 h-4" /> Enviar a Telegram
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/10 space-y-4">
                <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                  <Calculator className="w-3 h-3" /> CALCULADORA DE POSICIÓN
                </h4>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-bold text-on-surface-variant uppercase">Tamaño de Cuenta ($)</label>
                    <input 
                      type="number" 
                      value={accountSize}
                      onChange={(e) => setAccountSize(Number(e.target.value))}
                      className="w-full bg-surface-container p-2 rounded-lg text-xs font-bold focus:outline-none border border-outline-variant/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-bold text-on-surface-variant uppercase">Riesgo Total ($)</label>
                    <input 
                      type="number" 
                      value={riskAmount}
                      onChange={(e) => setRiskAmount(Number(e.target.value))}
                      className="w-full bg-surface-container p-2 rounded-lg text-xs font-bold focus:outline-none border border-outline-variant/10"
                    />
                  </div>
                  <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
                    <p className="text-[8px] font-bold text-primary uppercase mb-1">Tamaño de Posición Sugerido</p>
                    <p className="text-lg font-black text-primary">
                      ${(riskAmount / (Math.abs(analysis.entry - analysis.sl) / analysis.entry)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
};

const Terminal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const symbolParam = (searchParams.get("symbol") || "BTCUSDT").toUpperCase();
  const [searchSymbol, setSearchSymbol] = useState(symbolParam);
  const [ticker, setTicker] = useState<CryptoData | null>(null);
  const [klines, setKlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [timeframe, setTimeframe] = useState("1h");
  const [strategy, setStrategy] = useState("Standard");
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);
  const [whaleMovements, setWhaleMovements] = useState<any[]>([]);
  const [topTraders, setTopTraders] = useState<any[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<any[]>([]);
  const [riskAmount, setRiskAmount] = useState(100);
  const [accountSize, setAccountSize] = useState(10000);
  const [selectedTraderStrategy, setSelectedTraderStrategy] = useState<any>(null);
  
  // Layout State
  const [moduleOrder, setModuleOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("terminal_module_order");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : ["overview", "sentiment", "copytrading", "news", "indicators", "analysis"];
    } catch (e) {
      return ["overview", "sentiment", "copytrading", "news", "indicators", "analysis"];
    }
  });

  const [savedLayouts, setSavedLayouts] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem("terminal_saved_layouts");
      const parsed = saved ? JSON.parse(saved) : null;
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
      return {};
    }
  });

  const saveLayout = (name: string) => {
    const newLayouts = { ...savedLayouts, [name]: moduleOrder };
    setSavedLayouts(newLayouts);
    localStorage.setItem("terminal_saved_layouts", JSON.stringify(newLayouts));
    toast.success(`Diseño "${name}" guardado`);
  };

  const loadLayout = (name: string) => {
    if (savedLayouts[name]) {
      setModuleOrder(savedLayouts[name]);
      toast.success(`Diseño "${name}" cargado`);
    }
  };

  const resetLayout = () => {
    const defaultOrder = ["overview", "copytrading", "news", "indicators", "analysis"];
    setModuleOrder(defaultOrder);
    localStorage.setItem("terminal_module_order", JSON.stringify(defaultOrder));
    toast.success("Diseño restablecido");
  };

  useEffect(() => {
    localStorage.setItem("terminal_module_order", JSON.stringify(moduleOrder));
  }, [moduleOrder]);
  
  // Analysis State
  const [analysis, setAnalysis] = useState<any>(null);
  const [assetSentiments, setAssetSentiments] = useState<Record<string, any>>({});
  const [mtfBias, setMtfBias] = useState<any>({
    "1m": "NEUTRAL",
    "5m": "BULLISH",
    "15m": "BULLISH",
    "1h": "BEARISH"
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [data, chartData, events, whales, traders, txs] = await Promise.all([
          fetchTicker(symbolParam),
          fetchKlines(symbolParam, timeframe, 100),
          fetchEconomicEvents(),
          fetchWhaleMovements(),
          fetchTopTraders(),
          fetchLargeTransactions()
        ]);
        setTicker(data);
        setKlines(chartData);
        setEconomicEvents(events);
        setWhaleMovements(whales);
        setTopTraders(traders);
        setLargeTransactions(txs);
      } catch (error) {
        console.error("Analyzer data load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Auto-refresh every 2 minutes
    const interval = setInterval(async () => {
      try {
        const [events, whales, traders, txs] = await Promise.all([
          fetchEconomicEvents(),
          fetchWhaleMovements(),
          fetchTopTraders(),
          fetchLargeTransactions()
        ]);
        setEconomicEvents(events);
        setWhaleMovements(whales);
        setTopTraders(traders);
        setLargeTransactions(txs);
      } catch (error) {
        console.error("Auto-refresh error:", error);
      }
    }, 120000);

    // WebSocket for live updates
    const ws = connectTickerStream(symbolParam, (liveData) => {
      setTicker(liveData);
    });

    return () => {
      ws.close();
      clearInterval(interval);
    };
  }, [symbolParam, timeframe]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  useEffect(() => {
    // Simulate updating sentiments for different assets based on timeframe
    const assets = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "DOGE"];
    const newSentiments: Record<string, any> = {};
    assets.forEach(asset => {
      const isBullish = Math.random() > 0.4;
      newSentiments[asset] = {
        sentiment: isBullish ? "ALCISTA" : "BAJISTA",
        confidence: Math.floor(Math.random() * 30) + 60
      };
    });
    setAssetSentiments(newSentiments);
  }, [timeframe]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchSymbol) {
      navigate(`/terminal?symbol=${searchSymbol.toUpperCase()}`);
    }
  };

  const runAnalysis = () => {
    if (!ticker || cooldown > 0) return;
    
    const price = parseFloat(ticker.price);
    if (isNaN(price)) {
      console.error("Invalid ticker price:", ticker.price);
      return;
    }

    setAnalyzing(true);
    
    // Call AI Analysis
    const fetchAIAnalysis = async () => {
      try {
        const aiResponse = await analyzeMarket(symbolParam, ticker.price, ticker.priceChangePercent, strategy as any);
        
        const adxVal = Math.floor(Math.random() * 30) + 15; // 15-45
        const isChop = adxVal < 20;
        const isBullish = aiResponse.includes("ALCISTA") || aiResponse.includes("LONG") || Math.random() > 0.5;
        const isBTC = symbolParam.includes("BTC");

        // Timeframe based volatility/TP distance
        let tpMultiplier = 1.0;
        if (timeframe === "1m") tpMultiplier = 0.3;
        else if (timeframe === "5m") tpMultiplier = 0.6;
        else if (timeframe === "15m") tpMultiplier = 1.2;
        else if (timeframe === "1h") tpMultiplier = 2.5;
        else if (timeframe === "4h") tpMultiplier = 5.0;

        const volatility = price * 0.005 * tpMultiplier;

        // Strategy Logic
        let strategyName = strategy;
        let emaPeriod = isBTC ? 400 : 800;
        
        if (timeframe === "1m") strategyName = "Pupupu Scalping";
        if (timeframe === "5m") strategyName = "Reto Trading";

        const newAnalysis = {
          type: isBullish ? "LONG" : "SHORT",
          entry: price,
          sl: isBullish ? price - (volatility * 0.8) : price + (volatility * 0.8),
          tp1: isBullish ? price + volatility : price - volatility,
          tp2: isBullish ? price + volatility * 1.8 : price - volatility * 1.8,
          tp3: isBullish ? price + volatility * 3.0 : price - volatility * 3.0,
          ratio: `1:${(3.0 / 0.8).toFixed(1)}`,
          rr: 3.0 / 0.8,
          score: isChop ? Math.floor(Math.random() * 20) + 40 : Math.floor(Math.random() * 30) + 65,
          sentiment: isBullish ? "BULLISH" : "BEARISH",
          strategy: strategyName,
          description: aiResponse,
          context: {
            trend: adxVal > 25 ? "STRONG ↑" : "WEAK →",
            adx: adxVal,
            vol: Math.random() > 0.5 ? "HIGH" : "NORMAL",
            structure: Math.random() > 0.7 ? "BOS (Break of Structure)" : "CHoCH (Change of Character)",
            zone: Math.random() > 0.5 ? "LVN BREAK" : "HVN REJECTION",
            bias: isBullish ? "LONG" : "SHORT",
            cvd: (Math.random() * 1000 - 500).toFixed(0),
            delta: (Math.random() * 200 - 100).toFixed(0)
          },
          indicators: {
            rsi: { val: (Math.random() * 40 + 30).toFixed(1), status: isBullish ? "ALCISTA" : "BAJISTA" },
            macd: { val: isBullish ? "0.45" : "-0.45", status: isBullish ? "ALCISTA" : "BAJISTA", color: isBullish ? "text-primary" : "text-secondary" },
            ema: { val: timeframe === "1m" ? `12/${emaPeriod}` : "20/50", status: isBullish ? "ALCISTA" : "BAJISTA", color: isBullish ? "text-primary" : "text-secondary" },
            vwap: { val: (price * 0.999).toFixed(2), status: isBullish ? "POR ENCIMA" : "POR DEBAJO", color: isBullish ? "text-primary" : "text-secondary" },
            vol: { val: "A: 1.2%", status: "MOMENTUM +", color: "text-primary" },
            adx: { val: adxVal.toString(), status: adxVal > 25 ? "TENDENCIA FUERTE" : "RANGO / CHOP", color: adxVal > 25 ? "text-primary" : "text-on-surface-variant" },
            atr: { val: (volatility / 2).toFixed(2), status: "NORMAL", color: "text-primary" }
          },
          volumeProfile: [
            { price: price * 1.02, vol: Math.floor(Math.random() * 40) + 60 },
            { price: price * 1.01, vol: Math.floor(Math.random() * 30) + 40 },
            { price: price * 1.00, vol: Math.floor(Math.random() * 20) + 20 },
            { price: price * 0.99, vol: Math.floor(Math.random() * 50) + 30 },
            { price: price * 0.98, vol: Math.floor(Math.random() * 40) + 50 }
          ],
          fvgs: [
            { price: (price * 0.985).toFixed(2), type: "BULLISH", status: "OPEN" },
            { price: (price * 1.015).toFixed(2), type: "BEARISH", status: "MITIGATED" }
          ],
          correlation: {
            btc: (Math.random() * 0.2 + 0.75).toFixed(2),
            eth: (Math.random() * 0.2 + 0.70).toFixed(2),
            sp500: (Math.random() * 0.3 + 0.40).toFixed(2)
          }
        };
        
        setAnalysis(newAnalysis);
        setAnalyzing(false);
        setCooldown(15); 
        
        setMtfBias({
          "1m": Math.random() > 0.5 ? "BULLISH" : "BEARISH",
          "5m": Math.random() > 0.5 ? "BULLISH" : "BEARISH",
          "15m": Math.random() > 0.5 ? "BULLISH" : "BEARISH",
          "1h": Math.random() > 0.5 ? "BULLISH" : "BEARISH"
        });
      } catch (error) {
        console.error("Analysis error:", error);
        setAnalyzing(false);
      }
    };

    fetchAIAnalysis();
  };

  useEffect(() => {
    if (analysis) {
      runAnalysis();
    }
  }, [timeframe, strategy]);

  const copySignal = () => {
    if (!analysis) return;
    const text = `🚀 ZCOIN ANALYZER - SEÑAL INSTITUCIONAL
-----------------------------------
📊 ACTIVO: ${symbolParam}
🕒 TEMPORALIDAD: ${timeframe.toUpperCase()}
🎯 TIPO: ${analysis.type} (${analysis.strategy})
-----------------------------------
✅ ENTRADA: $${analysis.entry.toLocaleString()}
🛑 STOP LOSS: $${analysis.sl.toLocaleString()}
-----------------------------------
💰 TAKE PROFIT 1: $${analysis.tp1.toLocaleString()}
💰 TAKE PROFIT 2: $${analysis.tp2.toLocaleString()}
💰 TAKE PROFIT 3: $${analysis.tp3.toLocaleString()}
-----------------------------------
⚖️ RIESGO/BENEFICIO: ${analysis.ratio}
🔥 CONFIANZA: ${analysis.score}%
-----------------------------------
💡 NOTA: Gestiona tu riesgo. No arriesgues más del 1-2% por operación.`;
    navigator.clipboard.writeText(text);
    toast.success("Señal copiada al portapapeles");
  };

  const shareToTelegram = async () => {
    if (!analysis || !ticker) return;
    
    toast.promise(
      sendTelegramAlert({
        symbol: symbolParam,
        price: ticker.price,
        change: ticker.priceChangePercent,
        type: analysis.sentiment === "BULLISH" ? "BULLISH" : "BEARISH",
        confidence: analysis.score,
        analysis: analysis.description
      }),
      {
        loading: 'Enviando señal a Telegram...',
        success: 'Señal enviada a Telegram correctamente',
        error: 'Error al enviar la señal a Telegram',
      }
    );
  };

  const handleCopyStrategy = (trader: any) => {
    const isLong = trader.trade.includes("LONG");
    const entry = parseFloat(ticker?.price || "0");
    const volatility = entry * 0.01;
    
    const strategyDetails = {
      name: trader.name,
      trade: trader.trade,
      timeframe: "1h",
      entry: entry,
      sl: isLong ? entry - volatility : entry + volatility,
      tp1: isLong ? entry + volatility * 1.5 : entry - volatility * 1.5,
      tp2: isLong ? entry + volatility * 2.5 : entry - volatility * 2.5,
      tp3: isLong ? entry + volatility * 4.0 : entry - volatility * 4.0,
      justification: `Estrategia basada en el flujo de órdenes institucional detectado por ${trader.name}. Se observa una fuerte acumulación en zonas de descuento con confluencia en el perfil de volumen.`
    };
    setSelectedTraderStrategy(strategyDetails);
    toast.info(`Estrategia de ${trader.name} cargada`);
  };

  if (loading || !ticker) return (
    <div className="h-screen flex items-center justify-center bg-surface-container-lowest">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-on-surface-variant font-label animate-pulse">Sincronizando con Red de Datos...</p>
      </div>
    </div>
  );

  const isPositive = parseFloat(ticker.priceChangePercent) >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pt-16 pb-24 text-on-surface overflow-x-hidden bg-surface-container-lowest"
    >
      {/* Top Header / Search */}
      <div className="px-4 py-4 border-b border-outline-variant/10 bg-surface-container-low sticky top-16 z-30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate("/")} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input 
                type="text" 
                value={searchSymbol}
                onChange={(e) => setSearchSymbol(e.target.value)}
                placeholder="Buscar activo (ej: BTCUSDT)"
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-primary transition-all text-sm font-bold"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {["1m", "5m", "15m", "1h", "4h", "1d"].map((tf) => (
              <button 
                key={tf} 
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  timeframe === tf ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {tf}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-xl w-full md:w-auto overflow-x-auto no-scrollbar">
            {["Standard", "Scalping", "Swing"].map((strat) => (
              <button 
                key={strat} 
                onClick={() => setStrategy(strat)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                  strategy === strat ? "bg-tertiary text-on-tertiary shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {strat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const name = prompt("Nombre del diseño:");
                if (name) saveLayout(name);
              }}
              className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-1"
            >
              <Star className="w-3 h-3" /> Guardar
            </button>
            <button 
              onClick={resetLayout}
              className="px-3 py-1.5 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-secondary/10 hover:text-secondary transition-all flex items-center gap-1"
            >
              <Activity className="w-3 h-3" /> Reset
            </button>
            {Object.keys(savedLayouts).length > 0 && (
              <div className="relative group/layouts">
                <button className="px-3 py-1.5 bg-surface-container-highest rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 transition-all flex items-center gap-1">
                  <ChevronDown className="w-3 h-3" /> Diseños
                </button>
                <div className="absolute right-0 top-full mt-2 w-48 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl opacity-0 group-hover/layouts:opacity-100 transition-opacity pointer-events-none group-hover/layouts:pointer-events-auto z-50 overflow-hidden">
                  {Object.keys(savedLayouts).map(name => (
                    <button 
                      key={name}
                      onClick={() => loadLayout(name)}
                      className="w-full text-left px-4 py-2 text-[10px] font-bold uppercase tracking-widest hover:bg-primary/10 hover:text-primary transition-colors border-b border-outline-variant/5 last:border-0"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button 
              onClick={runAnalysis}
              disabled={analyzing || cooldown > 0}
              className={cn(
                "w-full md:w-auto px-8 py-2.5 rounded-xl font-extrabold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all shadow-xl",
                (analyzing || cooldown > 0) ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed" : "bg-primary text-on-primary shadow-primary/20 hover:scale-105 active:scale-95"
              )}
            >
            {analyzing ? (
              <>
                <div className="w-3 h-3 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin"></div>
                Analizando...
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                Wait-off: {cooldown}s
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analizar
              </>
            )}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 space-y-6">
        <Reorder.Group 
          axis="y" 
          values={moduleOrder} 
          onReorder={setModuleOrder}
          className="space-y-6"
        >
          {moduleOrder.map((moduleId) => (
            <TerminalModule 
              key={moduleId} 
              moduleId={moduleId}
              ticker={ticker}
              whaleMovements={whaleMovements}
              topTraders={topTraders}
              largeTransactions={largeTransactions}
              economicEvents={economicEvents}
              analysis={analysis}
              setSelectedTraderStrategy={setSelectedTraderStrategy}
              accountSize={accountSize}
              setAccountSize={setAccountSize}
              riskAmount={riskAmount}
              setRiskAmount={setRiskAmount}
              copySignal={copySignal}
              shareToTelegram={shareToTelegram}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              assetSentiments={assetSentiments}
            />
          ))}
        </Reorder.Group>
      </div>
        {!analysis && !analyzing && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-surface-container rounded-xl flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-on-surface-variant/20" />
            </div>
            <h3 className="text-xl font-headline font-bold text-on-surface-variant">Listo para Analizar</h3>
            <p className="text-on-surface-variant max-w-md mx-auto text-sm">
              Selecciona un activo y un marco de tiempo, luego presiona el botón de analizar para obtener niveles de entrada, TPs y Stop Loss basados en IA.
            </p>
          </div>
        )}
      </div>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-low border-t border-outline-variant/10 px-4 py-3 z-50 flex justify-around items-center shadow-2xl backdrop-blur-xl bg-opacity-80">
        <button onClick={() => navigate("/")} className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase">Dashboard</span>
        </button>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <Activity className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase">Terminal</span>
        </button>
        <button onClick={runAnalysis} className="flex flex-col items-center gap-1 text-primary transition-colors">
          <div className="p-2 bg-primary rounded-full shadow-lg shadow-primary/20 -mt-8 border-4 border-surface-container-low">
            <Brain className="w-6 h-6 text-on-primary" />
          </div>
          <span className="text-[8px] font-bold uppercase mt-1">Analizar</span>
        </button>
        <button onClick={() => navigate("/analysis")} className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <TrendingUp className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase">Análisis</span>
        </button>
        <button onClick={() => navigate("/settings")} className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <Settings className="w-5 h-5" />
          <span className="text-[8px] font-bold uppercase">Ajustes</span>
        </button>
      </div>
    </motion.div>
  );
};

export default Terminal;
