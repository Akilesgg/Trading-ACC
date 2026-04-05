import React, { useState, useEffect } from "react";
import { motion, Reorder, AnimatePresence, useDragControls } from "motion/react";
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
  RefreshCw,
  Star,
  ChevronDown,
  Target,
  Shield,
  Clock,
  BarChart3,
  Layers,
  Users,
  ArrowRightLeft,
  X,
  GripVertical,
  LayoutGrid,
  Waves
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useSearchParams } from "react-router-dom";
import { getMarketSentiment, analyzeMarket } from "@/services/geminiService";
import { 
  fetchTickers, 
  fetchTicker, 
  CryptoData, 
  fetchCryptoData, 
  fetchEconomicEvents, 
  fetchWhaleMovements,
  fetchTopTraders,
  fetchLargeTransactions
} from "@/services/cryptoService";
import { sendTelegramAlert } from "@/services/telegramService";
import { toast } from "sonner";

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  ReferenceDot
} from 'recharts';

const WyckoffArrow = (props: any) => {
  const { cx, cy } = props;
  return (
    <path
      d="M0,-10 L5,0 L-5,0 Z"
      transform={`translate(${cx},${cy})`}
      fill="white"
      className="drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]"
    />
  );
};

  const parseAnalysis = (text: string) => {
    if (!text) return {};
    const sections: Record<string, string> = {};
    
    // Try to split by **HEADER**
    const parts = text.split(/\*\*([^*]+)\*\*/);
    
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i += 2) {
        const title = parts[i].trim().replace(':', '').toUpperCase();
        const content = parts[i+1]?.trim().replace(/^[:\s-]+/, '') || "";
        sections[title] = content;
      }
    } else {
      // Fallback: if no headers found, put everything in CONTEXTO
      sections["CONTEXTO Y EXPLICACIÓN BREVE"] = text;
    }
    return sections;
  };

  const getChartData = (price: string) => {
    const basePrice = parseFloat(price);
    return Array.from({ length: 20 }).map((_, i) => ({
      name: i.toString(),
      price: basePrice * (1 + (Math.random() * 0.04 - 0.02))
    }));
  };

  const getWyckoffData = (price: string, phase: string) => {
    const basePrice = parseFloat(price);
    const data = [];
    let currentPrice = basePrice;
    const lowerPhase = phase.toLowerCase();
    
    for (let i = 0; i < 30; i++) {
      let change = 0;
      if (lowerPhase.includes("acumulación") || lowerPhase.includes("accumulation")) {
        change = Math.sin(i / 2) * 0.01;
      } else if (lowerPhase.includes("markup")) {
        change = (i / 30) * 0.05;
      } else if (lowerPhase.includes("distribución") || lowerPhase.includes("distribution")) {
        change = Math.cos(i / 2) * 0.01;
      } else if (lowerPhase.includes("markdown")) {
        change = -(i / 30) * 0.05;
      } else {
        change = (Math.random() - 0.5) * 0.02;
      }
      
      data.push({
        name: i.toString(),
        price: currentPrice * (1 + change),
        arrow: i % 10 === 5
      });
    }
    return data;
  };

const SentimentGauge = ({ label, value, timeframe, onTimeframeChange }: any) => {
  const getColor = (val: number) => {
    if (val > 70) return "text-primary";
    if (val < 30) return "text-secondary";
    return "text-on-surface-variant";
  };

  const getLabel = (val: number) => {
    if (val > 80) return "EXTREMA CODICIA";
    if (val > 60) return "CODICIA";
    if (val > 40) return "NEUTRAL";
    if (val > 20) return "MIEDO";
    return "EXTREMO MIEDO";
  };

  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex flex-col items-center text-center space-y-4">
      <div className="flex items-center justify-between w-full">
        <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{label}</h4>
        <div className="flex bg-surface-container-highest rounded-lg p-0.5 border border-outline-variant/10">
          {["1h", "4h", "1d"].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={cn(
                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                timeframe === tf ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative w-32 h-32">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-surface-container-highest"
            strokeDasharray="188.5"
            strokeDashoffset="62.8"
            transform="rotate(150 50 50)"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className={getColor(value)}
            strokeDasharray="188.5"
            strokeDashoffset={188.5 - (188.5 * 0.66 * value / 100)}
            transform="rotate(150 50 50)"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-2xl font-black", getColor(value))}>{value}</span>
          <span className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">{getLabel(value)}</span>
        </div>
      </div>
    </div>
  );
};

const LiquidityMap = ({ symbol, price }: any) => {
  const currentPrice = parseFloat(price || "0");
  const liquidityData = [
    { price: currentPrice * 1.05, liquidity: 85, type: "resistance" },
    { price: currentPrice * 1.03, liquidity: 45, type: "resistance" },
    { price: currentPrice * 1.01, liquidity: 20, type: "resistance" },
    { price: currentPrice * 0.99, liquidity: 30, type: "support" },
    { price: currentPrice * 0.97, liquidity: 65, type: "support" },
    { price: currentPrice * 0.95, liquidity: 95, type: "support" },
  ];

  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
      <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
        <Waves className="w-3 h-3" /> MAPA DE LIQUIDEZ Y ZONAS DE CALOR
      </h4>
      <div className="space-y-2">
        {liquidityData.map((zone, i) => (
          <div key={i} className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-on-surface-variant w-16">${zone.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className="flex-1 h-4 bg-surface-container rounded-full overflow-hidden relative">
              <div 
                className={cn(
                  "h-full transition-all duration-1000",
                  zone.type === "support" ? "bg-primary/40" : "bg-secondary/40"
                )}
                style={{ width: `${zone.liquidity}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-end px-2">
                <span className="text-[8px] font-black text-on-surface-variant uppercase">{zone.liquidity}M</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-on-surface-variant italic leading-relaxed">
        * Las zonas de alta liquidez actúan como imanes de precio y fuertes soportes/resistencias.
      </p>
    </div>
  );
};

const AnalysisModule = ({ moduleId, analysisSections, analysis, ticker, btcSentiment, setBtcSentiment, top100Sentiment, setTop100Sentiment, generalSentiment, setGeneralSentiment, btcTF, setBtcTF, top100TF, setTop100TF, generalTF, setGeneralTF }: any) => {
  const controls = useDragControls();

  return (
    <Reorder.Item 
      value={moduleId}
      dragListener={false}
      dragControls={controls}
      className="relative"
    >
      <div 
        onPointerDown={(e) => controls.start(e)}
        className="absolute top-4 right-4 p-2 z-50 bg-surface-container-highest/50 rounded-lg border border-outline-variant/10 cursor-grab active:cursor-grabbing hover:bg-primary/10 hover:text-primary transition-all"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      
      {moduleId === "sentiment_gauges" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SentimentGauge 
            label="SENTIMIENTO BITCOIN" 
            value={btcSentiment} 
            timeframe={btcTF} 
            onTimeframeChange={(tf: string) => {
              setBtcTF(tf);
              setBtcSentiment(Math.floor(Math.random() * 40) + 40);
            }} 
          />
          <SentimentGauge 
            label="SENTIMIENTO TOP 100 CRYPTO" 
            value={top100Sentiment} 
            timeframe={top100TF} 
            onTimeframeChange={(tf: string) => {
              setTop100TF(tf);
              setTop100Sentiment(Math.floor(Math.random() * 40) + 30);
            }} 
          />
          <SentimentGauge 
            label="SENTIMIENTO MERCADO GENERAL" 
            value={generalSentiment} 
            timeframe={generalTF} 
            onTimeframeChange={(tf: string) => {
              setGeneralTF(tf);
              setGeneralSentiment(Math.floor(Math.random() * 40) + 35);
            }} 
          />
        </div>
      )}

      {moduleId === "liquidity" && (
        <LiquidityMap symbol={ticker?.symbol} price={ticker?.price} />
      )}

      {moduleId === "context" && analysisSections["CONTEXTO Y EXPLICACIÓN BREVE"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-3">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Brain className="w-3 h-3" /> CONTEXTO Y RESUMEN EJECUTIVO
          </h4>
          <p className="text-sm text-on-surface leading-relaxed font-medium italic">
            "{analysisSections["CONTEXTO Y EXPLICACIÓN BREVE"]}"
          </p>
        </div>
      )}

      {moduleId === "comments" && analysisSections["COMENTARIOS Y OBSERVACIONES"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-3">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="w-3 h-3" /> COMENTARIOS Y OBSERVACIONES
          </h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {analysisSections["COMENTARIOS Y OBSERVACIONES"]}
          </p>
        </div>
      )}

      {moduleId === "predictions" && analysisSections["PREDICCIONES DE MERCADO"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-3">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Target className="w-3 h-3" /> PREDICCIONES DE MERCADO
          </h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {analysisSections["PREDICCIONES DE MERCADO"]}
          </p>
        </div>
      )}

      {moduleId === "recommendation" && analysisSections["RECOMENDACIÓN IA"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-2 border-primary/20 bg-primary/5 p-6 rounded-2xl space-y-3 shadow-lg shadow-primary/5">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3" /> RECOMENDACIÓN FINAL DE LA IA
          </h4>
          <p className="text-base text-on-surface leading-relaxed font-bold">
            {analysisSections["RECOMENDACIÓN IA"]}
          </p>
        </div>
      )}

      {moduleId === "dominance" && analysisSections["DOMINANCIA BTC"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3" /> DOMINANCIA BTC & ESTRATEGIA ALTCOINS
          </h4>
          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/5">
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {analysisSections["DOMINANCIA BTC"]}
            </p>
          </div>
        </div>
      )}

      {moduleId === "wyckoff" && analysisSections["FASE WYCKOFF"] && (
        <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3 h-3" /> ANALIZADOR WYCKOFF (ESTADO ACTUAL)
            </h4>
            <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest">
              {analysisSections["FASE WYCKOFF"]?.split(":")[0] || "ANALIZANDO"}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                {analysisSections["FASE WYCKOFF"]}
              </p>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase">Soporte</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-[8px] font-bold text-on-surface-variant uppercase">Resistencia</span>
                </div>
              </div>
            </div>
            
            <div className="h-48 w-full bg-surface-container-high/20 rounded-xl p-4 border border-outline-variant/10 relative">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getWyckoffData(ticker?.price || "0", analysisSections["FASE WYCKOFF"] || "")}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Line type="monotone" dataKey="price" stroke="#fff" strokeWidth={2} dot={false} />
                  {/* Wyckoff Arrows (White) */}
                  <ReferenceDot x="5" y={getWyckoffData(ticker?.price || "0", analysisSections["FASE WYCKOFF"] || "")[5]?.price} r={6} shape={<WyckoffArrow />} />
                  <ReferenceDot x="15" y={getWyckoffData(ticker?.price || "0", analysisSections["FASE WYCKOFF"] || "")[15]?.price} r={6} shape={<WyckoffArrow />} />
                  <ReferenceDot x="25" y={getWyckoffData(ticker?.price || "0", analysisSections["FASE WYCKOFF"] || "")[25]?.price} r={6} shape={<WyckoffArrow />} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {moduleId === "strategy" && analysisSections["ESTRATEGIA"] && (
        <div className="bg-surface-container-low border-2 border-outline-variant/10 p-8 rounded-2xl relative overflow-hidden flex flex-col items-center text-center">
          <div className="mb-4">
            {analysisSections["ESTRATEGIA"]?.toUpperCase().includes("ALCISTA") ? (
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="w-20 h-20 text-primary animate-bounce" />
                <span className="text-4xl font-black text-primary uppercase tracking-tighter">ALCISTA</span>
              </div>
            ) : analysisSections["ESTRATEGIA"]?.toUpperCase().includes("BAJISTA") ? (
              <div className="flex flex-col items-center gap-2">
                <TrendingDown className="w-20 h-20 text-secondary animate-bounce" />
                <span className="text-4xl font-black text-secondary uppercase tracking-tighter">BAJISTA</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Minus className="w-20 h-20 text-on-surface-variant" />
                <span className="text-4xl font-black text-on-surface-variant uppercase tracking-tighter">NEUTRAL</span>
              </div>
            )}
          </div>
          <div className="max-w-xl">
            <p className="text-sm text-on-surface-variant leading-relaxed italic">
              {analysisSections["ESTRATEGIA"]}
            </p>
          </div>
          {analysisSections["NIVEL DE CONFIANZA"] && (
            <div className="mt-4 flex items-center gap-2">
              <div className="w-32 h-2 bg-surface-container rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${analysisSections["NIVEL DE CONFIANZA"]}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                CONFIANZA: {analysisSections["NIVEL DE CONFIANZA"]}%
              </span>
            </div>
          )}
        </div>
      )}

      {moduleId === "indicators" && analysisSections["INDICADORES TÉCNICOS (TOP 2026)"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <BarChart3 className="w-3 h-3" /> INDICADORES TÉCNICOS (TOP 2026)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysisSections["INDICADORES TÉCNICOS (TOP 2026)"].split("\n").filter((line: string) => line.trim()).map((line: string, idx: number) => (
              <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/5 flex items-center justify-between">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">{line.split(":")[0]?.replace(/^[-\s*]+/, "")}</span>
                <span className="text-[10px] font-black text-primary text-right">{line.split(":")[1] || "ACTIVO"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {moduleId === "levels" && analysisSections["NIVELES OPERATIVOS"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Target className="w-3 h-3" /> NIVELES OPERATIVOS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-surface-container rounded-xl border-l-4 border-primary">
              <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Entrada Sugerida</p>
              <p className="text-xl font-headline font-black text-on-surface">
                {analysisSections["NIVELES OPERATIVOS"]?.match(/ENTRADA:\s*(\$?\d+([,.]\d+)*)/i)?.[1] || 
                 analysisSections["NIVELES OPERATIVOS"]?.match(/ENTRADA:\s*(\d+([,.]\d+)*)/i)?.[1] || "---"}
              </p>
            </div>
            <div className="p-4 bg-surface-container rounded-xl border-l-4 border-secondary">
              <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Stop Loss</p>
              <p className="text-xl font-headline font-black text-secondary">
                {analysisSections["NIVELES OPERATIVOS"]?.match(/STOP LOSS:\s*(\$?\d+([,.]\d+)*)/i)?.[1] || 
                 analysisSections["NIVELES OPERATIVOS"]?.match(/STOP LOSS:\s*(\d+([,.]\d+)*)/i)?.[1] || "---"}
              </p>
            </div>
          </div>
        </div>
      )}

      {moduleId === "objectives" && analysisSections["NIVELES OPERATIVOS"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> OBJETIVOS (TAKE PROFITS)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col p-3 bg-surface-container rounded-xl border border-outline-variant/5">
                <span className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">TP {i}</span>
                <span className="text-sm font-black text-primary">
                  {analysisSections["NIVELES OPERATIVOS"]?.match(new RegExp(`TAKE PROFIT ${i}:\\s*(\\$?\\d+([,.]\\d+)*)`, 'i'))?.[1] || 
                   analysisSections["NIVELES OPERATIVOS"]?.match(new RegExp(`TAKE PROFIT ${i}:\\s*(\\d+([,.]\\d+)*)`, 'i'))?.[1] || "---"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {moduleId === "leverage" && analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Shield className="w-3 h-3" /> APALANCAMIENTO & GESTIÓN DE RIESGO
          </h4>
          <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[8px] font-bold text-on-surface-variant uppercase">Apalancamiento Sugerido</p>
              <p className="text-2xl font-black text-primary">
                {analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.match(/x\d+/i)?.[0] || "x3"}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[8px] font-bold text-on-surface-variant uppercase">Nivel de Riesgo</p>
              <span className={cn(
                "text-[10px] font-black px-2 py-1 rounded uppercase",
                analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.toUpperCase().includes("BAJO") ? "bg-primary/10 text-primary" :
                analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.toUpperCase().includes("ALTO") ? "bg-secondary/10 text-secondary" :
                "bg-orange-500/10 text-orange-500"
              )}>
                {analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.toUpperCase().includes("BAJO") ? "BAJO" :
                 analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.toUpperCase().includes("ALTO") ? "ALTO" : "MODERADO"}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant leading-relaxed italic px-2">
            {analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]}
          </p>
        </div>
      )}

      {moduleId === "justification" && (analysisSections["JUSTIFICACIÓN TÉCNICA"] || analysisSections["ANÁLISIS DE ESTRUCTURA"]) && (
        <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 space-y-6">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Activity className="w-3 h-3" /> JUSTIFICACIÓN TÉCNICA EXHAUSTIVA
          </h4>
          <div className="space-y-6">
            {analysisSections["ANÁLISIS DE ESTRUCTURA"] && (
              <div>
                <p className="text-[10px] font-black text-on-surface-variant uppercase mb-2 tracking-widest">Análisis de Estructura</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {analysisSections["ANÁLISIS DE ESTRUCTURA"]}
                </p>
              </div>
            )}
            {analysisSections["JUSTIFICACIÓN TÉCNICA"] && (
              <div className="pt-6 border-t border-outline-variant/5">
                <p className="text-[10px] font-black text-on-surface-variant uppercase mb-2 tracking-widest">Lógica de Niveles</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {analysisSections["JUSTIFICACIÓN TÉCNICA"]}
                </p>
              </div>
            )}
            {analysisSections["METÁFORA TÉCNICA"] && (
              <div className="pt-6 border-t border-outline-variant/5 flex items-center gap-3">
                <Flame className="w-5 h-5 text-primary animate-pulse" />
                <div>
                  <p className="text-[8px] font-black text-primary uppercase tracking-widest">Metáfora Técnica</p>
                  <p className="text-[10px] text-on-surface-variant italic leading-tight">
                    {analysisSections["METÁFORA TÉCNICA"]}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {moduleId === "raw" && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
          <h4 className="text-[10px] font-black text-on-surface-variant uppercase mb-2 tracking-widest flex items-center gap-2">
            <Brain className="w-3 h-3" /> CAMPO DE ANÁLISIS IA (RAW)
          </h4>
          <div className="p-4 bg-surface-container-high/50 rounded-xl border border-outline-variant/10 max-h-40 overflow-y-auto">
            <pre className="text-[10px] text-on-surface-variant whitespace-pre-wrap font-mono leading-relaxed">
              {analysis || "No hay datos de análisis disponibles."}
            </pre>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
};

const Analysis = () => {
  const [sentiment, setSentiment] = useState<string>("Cargando inteligencia de mercado...");
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());
  const [analysis, setAnalysis] = useState<string>("");
  const [tickers, setTickers] = useState<CryptoData[]>([]);
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedSymbol, setSelectedSymbol] = useState(searchParams.get("symbol") || "BTCUSDT");

  useEffect(() => {
    const symbolFromUrl = searchParams.get("symbol");
    if (symbolFromUrl && symbolFromUrl !== selectedSymbol) {
      setSelectedSymbol(symbolFromUrl);
    }
  }, [searchParams, selectedSymbol]);
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [selectedMode, setSelectedMode] = useState<"Standard" | "Scalping" | "Swing">("Standard");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ticker, setTicker] = useState<CryptoData | null>(null);
  const [whaleMovements, setWhaleMovements] = useState<any[]>([]);
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);
  const [topTraders, setTopTraders] = useState<any[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<any[]>([]);
  const [selectedTraderStrategy, setSelectedTraderStrategy] = useState<any>(null);
  const [showHotSignal, setShowHotSignal] = useState(false);
  const [hotSignalData, setHotSignalData] = useState<any>(null);

  // New sentiment states
  const [btcSentiment, setBtcSentiment] = useState(65);
  const [top100Sentiment, setTop100Sentiment] = useState(58);
  const [generalSentiment, setGeneralSentiment] = useState(62);
  const [btcTF, setBtcTF] = useState("1h");
  const [top100TF, setTop100TF] = useState("1h");
  const [generalTF, setGeneralTF] = useState("1h");

  const [moduleOrder, setModuleOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("analysis_module_order");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : ["sentiment_gauges", "context", "comments", "predictions", "recommendation", "liquidity", "dominance", "wyckoff", "strategy", "indicators", "levels", "objectives", "leverage", "justification", "raw"];
    } catch (e) {
      return ["sentiment_gauges", "context", "comments", "predictions", "recommendation", "liquidity", "dominance", "wyckoff", "strategy", "indicators", "levels", "objectives", "leverage", "justification", "raw"];
    }
  });

  const [savedLayouts, setSavedLayouts] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem("analysis_saved_layouts");
      const parsed = saved ? JSON.parse(saved) : null;
      return (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) ? parsed : {};
    } catch (e) {
      return {};
    }
  });

  const saveLayout = (name: string) => {
    const newLayouts = { ...savedLayouts, [name]: moduleOrder };
    setSavedLayouts(newLayouts);
    localStorage.setItem("analysis_saved_layouts", JSON.stringify(newLayouts));
    toast.success(`Diseño "${name}" guardado`);
  };

  const loadLayout = (name: string) => {
    if (savedLayouts[name]) {
      setModuleOrder(savedLayouts[name]);
      toast.success(`Diseño "${name}" cargado`);
    }
  };

  const resetLayout = () => {
    const defaultOrder = ["sentiment_gauges", "context", "comments", "predictions", "recommendation", "liquidity", "dominance", "wyckoff", "strategy", "indicators", "levels", "objectives", "leverage", "justification", "raw"];
    setModuleOrder(defaultOrder);
    localStorage.setItem("analysis_module_order", JSON.stringify(defaultOrder));
    toast.success("Diseño restablecido");
  };

  useEffect(() => {
    localStorage.setItem("analysis_module_order", JSON.stringify(moduleOrder));
  }, [moduleOrder]);

  const analysisSections = parseAnalysis(analysis);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [assets, aiSentiment, initialTicker, events, whales, traders, txs] = await Promise.all([
        fetchCryptoData(),
        getMarketSentiment(),
        fetchTicker(selectedSymbol),
        fetchEconomicEvents(),
        fetchWhaleMovements(),
        fetchTopTraders(),
        fetchLargeTransactions()
      ]);
      
      setAllAssets(assets);
      setSentiment(aiSentiment);
      setTicker(initialTicker);
      setEconomicEvents(events);
      setWhaleMovements(whales);
      setTopTraders(traders);
      setLargeTransactions(txs);
      
      const initialAnalysis = await analyzeMarket(selectedSymbol, initialTicker.price, initialTicker.priceChangePercent, selectedMode);
      setAnalysis(initialAnalysis);
    } catch (error) {
      console.error("Analysis initial load error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setAnalysis(""); // Clear previous analysis when symbol changes
    loadInitialData();
    
    // Auto-refresh every 2 minutes
    const interval = setInterval(async () => {
      setRefreshing(true);
      try {
        const [aiSentiment, currentTicker, events, whales, traders, txs] = await Promise.all([
          getMarketSentiment(),
          fetchTicker(selectedSymbol),
          fetchEconomicEvents(),
          fetchWhaleMovements(),
          fetchTopTraders(),
          fetchLargeTransactions()
        ]);
        setSentiment(aiSentiment);
        setTicker(currentTicker);
        setEconomicEvents(events);
        setWhaleMovements(whales);
        setTopTraders(traders);
        setLargeTransactions(txs);
        setLastUpdate(new Date().toLocaleTimeString());
      } catch (error) {
        console.error("Auto-refresh error:", error);
      } finally {
        setRefreshing(false);
      }
    }, 120000);

    return () => clearInterval(interval);
  }, [selectedSymbol]);

  const handleRunAnalysis = async () => {
    setAnalyzing(true);
    try {
      const currentTicker = await fetchTicker(selectedSymbol);
      setTicker(currentTicker);
      const result = await analyzeMarket(selectedSymbol, currentTicker.price, currentTicker.priceChangePercent, selectedMode);
      
      if (result && !result.includes("no disponible")) {
        setAnalysis(result);
        setLastUpdate(new Date().toLocaleTimeString());
        toast.success(`Análisis de ${selectedSymbol} completado`);
      } else {
        toast.error("La IA no pudo generar un análisis válido. Inténtalo de nuevo.");
      }

      // Check for hot signal
      const sections = parseAnalysis(result);
      const confidence = parseInt(sections["NIVEL DE CONFIANZA"] || "0");
      if (confidence >= 80) {
        setHotSignalData({
          symbol: selectedSymbol,
          price: currentTicker.price,
          confidence,
          strategy: sections["ESTRATEGIA"],
          context: sections["CONTEXTO Y EXPLICACIÓN BREVE"]
        });
        setShowHotSignal(true);
      }
    } catch (error) {
      console.error("Analysis run error:", error);
      toast.error("Error crítico al ejecutar el análisis.");
    } finally {
      setAnalyzing(false);
    }
  };

  const shareToTelegram = async () => {
    if (!analysis || !ticker) return;
    
    const levels = analysisSections?.["NIVELES OPERATIVOS"] || "";
    const leverageInfo = analysisSections?.["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"] || "";

    toast.promise(
      sendTelegramAlert({
        symbol: selectedSymbol,
        price: ticker.price,
        change: ticker.priceChangePercent,
        type: analysisSections?.["ESTRATEGIA"]?.toUpperCase().includes("ALCISTA") ? "BULLISH" : 
              analysisSections?.["ESTRATEGIA"]?.toUpperCase().includes("BAJISTA") ? "BEARISH" : "SIGNAL",
        confidence: parseInt(analysisSections?.["NIVEL DE CONFIANZA"] || "85"),
        analysis: analysis,
        entry: levels.match(/ENTRADA:\s*(\$?\d+([,.]\d+)*)/i)?.[1] || levels.match(/ENTRADA:\s*(\d+([,.]\d+)*)/i)?.[1],
        sl: levels.match(/STOP LOSS:\s*(\$?\d+([,.]\d+)*)/i)?.[1] || levels.match(/STOP LOSS:\s*(\d+([,.]\d+)*)/i)?.[1],
        tp1: levels.match(/TAKE PROFIT 1:\s*(\$?\d+([,.]\d+)*)/i)?.[1] || levels.match(/TAKE PROFIT 1:\s*(\d+([,.]\d+)*)/i)?.[1],
        tp2: levels.match(/TAKE PROFIT 2:\s*(\$?\d+([,.]\d+)*)/i)?.[1] || levels.match(/TAKE PROFIT 2:\s*(\d+([,.]\d+)*)/i)?.[1],
        tp3: levels.match(/TAKE PROFIT 3:\s*(\$?\d+([,.]\d+)*)/i)?.[1] || levels.match(/TAKE PROFIT 3:\s*(\d+([,.]\d+)*)/i)?.[1],
        leverage: leverageInfo.match(/x\d+/i)?.[0]
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-black uppercase tracking-widest text-on-surface-variant animate-pulse">Iniciando Red Neuronal...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      {/* Deep Analysis Tool - NOW AT TOP */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="space-y-1 w-full md:w-64">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Activo</label>
              <div className="relative">
                <select 
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-primary transition-all text-sm font-bold"
                >
                  {allAssets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name} (USDT)</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1 w-full md:w-32">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Temporalidad</label>
              <div className="relative">
                <select 
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-primary transition-all text-sm font-bold"
                >
                  {["1m", "5m", "15m", "1h", "4h", "1d"].map(tf => (
                    <option key={tf} value={tf}>{tf.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1 w-full md:w-auto flex-1">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Estrategia</label>
              <div className="flex gap-2">
                {[
                  { id: "Standard", label: "Estándar", tf: "1h" },
                  { id: "Scalping", label: "Scalping", tf: "5m" },
                  { id: "Swing", label: "Swing", tf: "4h" }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      setSelectedMode(mode.id as any);
                      setSelectedTimeframe(mode.tf);
                    }}
                    className={cn(
                      "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                      selectedMode === mode.id 
                        ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                        : "bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:border-primary/50"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1 w-full md:w-auto">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">GEMINI API KEY</label>
              <div className="flex gap-2">
                <input 
                  type="password"
                  placeholder="AIza..."
                  defaultValue={localStorage.getItem("GEMINI_API_KEY") || ""}
                  onChange={(e) => {
                    localStorage.setItem("GEMINI_API_KEY", e.target.value);
                    toast.success("API Key guardada localmente");
                  }}
                  className="w-full md:w-48 bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-all text-[10px] font-mono"
                />
              </div>
            </div>

            <div className="space-y-1 w-full md:w-auto">
              <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Diseño</label>
              <div className="flex gap-2">
                <button 
                  onClick={resetLayout}
                  className="px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all"
                >
                  Reset
                </button>
                <button 
                  onClick={() => {
                    const name = prompt("Nombre del diseño:");
                    if (name) saveLayout(name);
                  }}
                  className="px-4 py-3 bg-surface-container-high border border-outline-variant/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all"
                >
                  Guardar
                </button>
                {Object.keys(savedLayouts).length > 0 && (
                  <select 
                    onChange={(e) => loadLayout(e.target.value)}
                    className="bg-surface-container-high border border-outline-variant/20 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-on-surface-variant focus:outline-none"
                    value=""
                  >
                    <option value="" disabled>Cargar...</option>
                    {Object.keys(savedLayouts).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={handleRunAnalysis}
            disabled={analyzing}
            className={cn(
              "w-full md:w-auto px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-2xl",
              analyzing ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed" : "bg-primary text-on-primary shadow-primary/20 hover:scale-105 active:scale-95"
            )}
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin"></div>
                Procesando...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Ejecutar Análisis Profundo
              </>
            )}
          </button>
        </div>

        {/* Analysis Display */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Ticker & Chart */}
          <div className="space-y-6">
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center">
                    <img 
                      src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${selectedSymbol.replace("USDT", "").toLowerCase()}.png`} 
                      className="w-8 h-8" 
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-headline font-bold">{selectedSymbol.replace("USDT", "")}</h3>
                    <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Binance Spot</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-headline font-bold">${ticker ? parseFloat(ticker.price).toLocaleString() : "---"}</p>
                  <p className={cn("text-sm font-bold", (ticker && parseFloat(ticker.priceChangePercent) >= 0) ? "text-primary" : "text-secondary")}>
                    {ticker && parseFloat(ticker.priceChangePercent) >= 0 ? "+" : ""}{ticker?.priceChangePercent}%
                  </p>
                </div>
              </div>

              <div className="h-48 w-full bg-surface-container-high/20 rounded-xl p-4 border border-outline-variant/10">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getChartData(ticker?.price || "0")}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ffa3" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#00ffa3" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <YAxis hide domain={['auto', 'auto']} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '10px' }}
                      itemStyle={{ color: '#00ffa3' }}
                    />
                    <Area type="monotone" dataKey="price" stroke="#00ffa3" fillOpacity={1} fill="url(#colorPrice)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container p-4 rounded-xl space-y-1">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Máximo 24h</p>
                  <p className="text-sm font-bold text-primary">${ticker ? parseFloat(ticker.highPrice).toLocaleString() : "---"}</p>
                </div>
                <div className="bg-surface-container p-4 rounded-xl space-y-1">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Mínimo 24h</p>
                  <p className="text-sm font-bold text-secondary">${ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "---"}</p>
                </div>
              </div>
            </div>

            {/* Quick Indicators */}
            <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> INDICADORES TOP 2026 ({selectedTimeframe.toUpperCase()})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "RSI (14)", val: (Math.random() * 40 + 30).toFixed(1), status: "NEUTRAL" },
                  { label: "MACD", val: "0.45", status: "ALCISTA" },
                  { label: "EMA 20", val: ticker ? (parseFloat(ticker.price) * 1.001).toFixed(2) : "---", status: "RESISTENCIA" },
                  { label: "EMA 50", val: ticker ? (parseFloat(ticker.price) * 0.995).toFixed(2) : "---", status: "SOPORTE" },
                  { label: "EMA 200", val: ticker ? (parseFloat(ticker.price) * 0.98).toFixed(2) : "---", status: "SOPORTE" },
                  { label: "B. BOLLINGER", val: "2.5%", status: "VOLATILIDAD" },
                  { label: "VWAP", val: ticker ? (parseFloat(ticker.price) * 0.99).toFixed(2) : "---", status: "NEUTRAL" },
                  { label: "STOCH RSI", val: "82.4", status: "SOBRECOMPRA" },
                  { label: "ADX (25)", val: "32.1", status: "TENDENCIA" },
                  { label: "VOLUME", val: "ALTO", status: "CONFIRMADO" },
                ].map((ind) => (
                  <div key={ind.label} className="p-2 bg-surface-container rounded-lg border border-outline-variant/5">
                    <span className="text-[8px] font-bold text-on-surface-variant uppercase block mb-1">{ind.label}</span>
                    <div className="flex justify-between items-end">
                      <p className="text-[10px] font-black text-on-surface leading-none">{ind.val}</p>
                      <p className="text-[7px] font-bold text-primary uppercase leading-none">{ind.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Detailed Analysis */}
          <div className="lg:col-span-2">
            {analyzing ? (
              <div className="h-full flex flex-col items-center justify-center bg-surface-container-low rounded-2xl border border-outline-variant/30 p-12 text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                  <Brain className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-headline font-bold text-on-surface">Procesando Inteligencia de Mercado</h4>
                  <p className="text-sm text-on-surface-variant max-w-xs mx-auto">La IA está analizando patrones Wyckoff, indicadores técnicos y liquidez para generar una estrategia óptima.</p>
                </div>
                <div className="flex gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                </div>
              </div>
            ) : (analysisSections && Object.keys(analysisSections).length > 0) || analysis ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-2xl border border-outline-variant/10">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-black uppercase tracking-widest">Personalizar Diseño</h3>
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
                  </div>
                </div>

                <Reorder.Group 
                  axis="y" 
                  values={moduleOrder} 
                  onReorder={setModuleOrder}
                  className="space-y-6"
                >
                {moduleOrder.map((moduleId) => (
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
                  />
                ))}
                </Reorder.Group>

              <div className="pt-8 border-t border-outline-variant/10 flex flex-col gap-4">
                <div className="flex flex-col gap-2 p-4 bg-surface-container rounded-xl border border-outline-variant/10">
                  <h5 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-3 h-3" /> CONFIGURACIÓN TELEGRAM (BOT PRIVADO)
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input 
                      type="text" 
                      placeholder="Bot Token"
                      defaultValue={localStorage.getItem("telegramToken") || ""}
                      onChange={(e) => localStorage.setItem("telegramToken", e.target.value)}
                      className="bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-primary"
                    />
                    <input 
                      type="text" 
                      placeholder="Chat ID"
                      defaultValue={localStorage.getItem("telegramChatId") || ""}
                      onChange={(e) => localStorage.setItem("telegramChatId", e.target.value)}
                      className="bg-surface-container-high border border-outline-variant/20 rounded-lg px-3 py-2 text-[10px] font-bold focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  <button 
                    onClick={shareToTelegram}
                    className="flex-1 px-6 py-3 bg-[#0088cc] text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-[#0077b5] transition-all"
                  >
                    <MessageSquare className="w-4 h-4" /> Enviar Alerta Telegram
                  </button>
                  <button 
                    onClick={() => toast.success("Análisis guardado en favoritos")}
                    className="p-3 bg-surface-container-high rounded-xl border border-outline-variant/20 text-on-surface-variant hover:text-primary transition-all"
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Recent Alerts Feed */}
              <div className="pt-6 border-t border-outline-variant/10">
                <h4 className="text-[10px] font-black text-on-surface-variant uppercase mb-4 tracking-widest flex items-center gap-2">
                  <Bell className="w-3 h-3" /> ALERTAS DE TELEGRAM RECIENTES
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-surface-container rounded-lg border border-outline-variant/5">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <p className="text-[10px] text-on-surface-variant">
                      <span className="font-bold text-on-surface">ALERTA ENVIADA:</span> {selectedSymbol} {selectedMode} - Niveles confirmados
                    </p>
                    <span className="ml-auto text-[8px] text-on-surface-variant opacity-50">AHORA</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-surface-container/50 rounded-lg border border-outline-variant/5 opacity-50">
                    <div className="w-2 h-2 rounded-full bg-on-surface-variant" />
                    <p className="text-[10px] text-on-surface-variant">
                      <span className="font-bold text-on-surface">ALERTA ENVIADA:</span> BTC/USDT SCALPING - TP1 Alcanzado
                    </p>
                    <span className="ml-auto text-[8px] text-on-surface-variant opacity-50">15M AGO</span>
                  </div>
                </div>
              </div>
            </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30 p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center">
                  <Brain className="w-8 h-8 text-on-surface-variant opacity-20" />
                </div>
                <div>
                  <h4 className="text-lg font-headline font-bold text-on-surface">Esperando Instrucciones</h4>
                  <p className="text-sm text-on-surface-variant max-w-xs mx-auto">Selecciona un activo y temporalidad para que la IA realice un análisis exhaustivo.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AI Market Pulse - MOVED DOWN */}
      <section className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 relative overflow-hidden group">
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around p-4 opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none">
          <TrendingUp className="w-6 h-6 text-primary" />
          <TrendingUp className="w-6 h-6 text-primary" />
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around p-4 opacity-10 group-hover:opacity-30 transition-opacity pointer-events-none">
          <TrendingUp className="w-6 h-6 text-primary" />
          <TrendingUp className="w-6 h-6 text-primary" />
          <TrendingUp className="w-6 h-6 text-primary" />
        </div>
        
        <div className="relative z-10 flex flex-col lg:flex-row gap-8 items-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-[0_20px_40px_rgba(0,255,163,0.2)]">
              <Brain className="w-12 h-12 text-on-primary-fixed" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-surface-container-highest p-1.5 rounded-full border border-outline-variant/20">
              <RefreshCw 
                className={cn("w-4 h-4 text-primary cursor-pointer", refreshing && "animate-spin")} 
                onClick={loadInitialData}
              />
            </div>
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-label uppercase tracking-widest text-primary-dim">Inteligencia de Mercado IA</span>
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse"></span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest bg-surface-container-high px-3 py-1 rounded-full">
                <Activity className="w-3 h-3" />
                Actualizado: {lastUpdate}
              </div>
            </div>
            <h2 className="font-headline text-3xl font-bold tracking-tight">INFORME DE SENTIMIENTO GLOBAL</h2>
            <div className="p-6 bg-surface-container-high/30 rounded-xl border border-outline-variant/10">
              <p className="text-on-surface-variant leading-relaxed text-lg italic">
                "{sentiment}"
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Whale Movements & Economic Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6">
          <h3 className="font-headline text-xl font-bold uppercase tracking-wide flex items-center gap-2 text-primary">
            <Zap className="w-5 h-5" /> Movimientos de Ballenas
          </h3>
          <div className="space-y-4">
            {whaleMovements.map((whale, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-surface-container rounded-xl border border-outline-variant/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center">
                    <img src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} className="w-6 h-6" alt="" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{whale.symbol}</p>
                    <p className="text-[10px] text-on-surface-variant uppercase">{whale.exchange} • {whale.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-sm font-black", whale.type === "COMPRA" || whale.type === "BUY" ? "text-primary" : "text-secondary")}>{whale.type}</p>
                  <p className="text-xs font-bold">{whale.amount}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6">
          <h3 className="font-headline text-xl font-bold uppercase tracking-wide flex items-center gap-2 text-primary">
            <Globe className="w-5 h-5" /> Eventos Económicos
          </h3>
          <div className="space-y-4">
            {economicEvents.map((event, i) => (
              <div key={i} className="p-4 bg-surface-container rounded-xl border border-outline-variant/5 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-on-surface">{event.event}</h4>
                  <span className={cn(
                    "text-[8px] font-black px-2 py-0.5 rounded uppercase",
                    event.impact === "CRITICAL" ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary"
                  )}>
                    {event.impact}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant leading-relaxed">{event.description}</p>
                <div className="flex justify-between text-[8px] font-bold text-on-surface-variant uppercase">
                  <span>{event.date} • {event.time}</span>
                  <span className="text-primary">{event.effect}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Copy Trading & Top Traders - MOVED TO BOTTOM */}
      <section className="space-y-6">
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
          </div>

          {selectedTraderStrategy && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="bg-orange-500/5 border-b border-orange-500/20 p-6 relative"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1 space-y-2">
                  <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Trader</p>
                  <p className="text-lg font-headline font-bold">{selectedTraderStrategy.name}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded", selectedTraderStrategy.trade.includes("LONG") ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary")}>
                      {selectedTraderStrategy.trade}
                    </span>
                  </div>
                </div>
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase">Entrada</p>
                    <p className="text-sm font-bold text-on-surface">${selectedTraderStrategy.entry.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase">Stop Loss</p>
                    <p className="text-sm font-bold text-secondary">${selectedTraderStrategy.sl.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase">TP 1</p>
                    <p className="text-sm font-bold text-primary">${selectedTraderStrategy.tp1.toLocaleString()}</p>
                  </div>
                </div>
                <div className="md:col-span-1 border-l border-orange-500/10 pl-4">
                  <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Justificación</p>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed italic">
                    {selectedTraderStrategy.justification}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-outline-variant/10">
            {/* Whale Movements (Detailed) */}
            <div className="p-4 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                <TrendingUp className="w-3 h-3" /> MOVIMIENTOS RECIENTES
              </h4>
              <div className="space-y-3">
                {whaleMovements.slice(0, 5).map((whale, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px]">
                    <span className="font-bold">{whale.symbol}</span>
                    <span className={cn(whale.type === "BUY" || whale.type === "COMPRA" ? "text-primary" : "text-secondary")}>{whale.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Traders */}
            <div className="p-4 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                <Users className="w-3 h-3" /> TOP TRADERS
              </h4>
              <div className="space-y-3">
                {topTraders.map((trader, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px]">
                    <span className="font-bold">{trader.name}</span>
                    <button 
                      onClick={() => handleCopyStrategy(trader)}
                      className="text-orange-500 hover:underline"
                    >
                      Copiar
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Large Transactions */}
            <div className="p-4 space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
                <ArrowRightLeft className="w-3 h-3" /> TRANSACCIONES
              </h4>
              <div className="space-y-3">
                {largeTransactions.map((tx, i) => (
                  <div key={i} className="flex justify-between items-center text-[10px]">
                    <span className="text-on-surface-variant">{tx.address.slice(0, 6)}...</span>
                    <span className="font-bold">{tx.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Insights */}
      <section className="space-y-6">
        <h3 className="font-headline text-xl font-bold uppercase tracking-wide">Discusiones en Tendencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { tag: "#BTC", title: "¿Ha llegado el ciclo a su fin?", comments: 142, likes: 890, source: "https://twitter.com/search?q=%23BTC", author: "@CryptoWhale" },
            { tag: "#SOL", title: "Ruptura de Solana confirmada", comments: 56, likes: 320, source: "https://twitter.com/search?q=%23SOL", author: "@SolanaDaily" },
            { tag: "#ETH", title: "Análisis de entradas de ETF de Ethereum", comments: 89, likes: 540, source: "https://twitter.com/search?q=%23ETH", author: "@VitalikButerin" },
          ].map((post, i) => (
            <a 
              key={i} 
              href={post.source}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-surface-container-high p-6 rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-primary-dim uppercase tracking-widest">{post.tag}</span>
                  <span className="text-[8px] text-on-surface-variant font-bold uppercase tracking-widest">{post.author}</span>
                </div>
                <h4 className="font-bold text-sm mb-4 group-hover:text-primary transition-colors leading-tight">{post.title}</h4>
              </div>
              <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-label uppercase tracking-widest pt-4 border-t border-outline-variant/5">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {post.comments}</span>
                  <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {post.likes}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* Hot Signal Notification Modal */}
      <AnimatePresence>
        {showHotSignal && hotSignalData && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-surface-container-highest border-2 border-primary/50 rounded-3xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,255,163,0.3)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
              
              <button 
                onClick={() => setShowHotSignal(false)}
                className="absolute top-4 right-4 p-2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse">
                    <Flame className="w-12 h-12 text-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 bg-primary text-on-primary text-[10px] font-black px-2 py-1 rounded-full animate-bounce">
                    HOT!
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-on-surface uppercase tracking-tighter">¡SEÑAL DE ALTA CONFIANZA!</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Nuestra IA ha detectado una oportunidad con un nivel de confianza excepcional.
                  </p>
                </div>

                <div className="w-full bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Activo</span>
                    <span className="text-xl font-black text-primary">{hotSignalData.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Precio Actual</span>
                    <span className="text-xl font-black text-on-surface">${hotSignalData.price}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Confianza</span>
                    <span className="text-xl font-black text-primary">{hotSignalData.confidence}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Estrategia</span>
                    <span className={cn(
                      "text-sm font-black uppercase tracking-widest",
                      hotSignalData.strategy.includes("ALCISTA") ? "text-primary" : "text-secondary"
                    )}>
                      {hotSignalData.strategy}
                    </span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setShowHotSignal(false)}
                    className="px-6 py-4 bg-surface-container-high text-on-surface rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-surface-container-highest transition-all"
                  >
                    Ver Detalles
                  </button>
                  <button 
                    onClick={() => {
                      shareToTelegram();
                      setShowHotSignal(false);
                    }}
                    className="px-6 py-4 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-[0_0_20px_rgba(0,255,163,0.4)] transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" /> Telegram
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Analysis;
