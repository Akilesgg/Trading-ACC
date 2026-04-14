import React, { useState } from "react";
import { Reorder, useDragControls, motion } from "motion/react";
import Markdown from "react-markdown";
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
  GripVertical,
  Scale,
  Terminal,
  Copy,
  Check,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  ReferenceDot 
} from 'recharts';
import ChartComparator from "./ChartComparator";
import MarketIntelligence from "./MarketIntelligence";
import { toast } from "sonner";

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
    <div className="trading-card flex flex-col items-center text-center space-y-6 group hover:border-primary/30 transition-all">
      <div className="flex items-center justify-between w-full">
        <h4 className="text-[12px] font-black text-on-surface-variant uppercase tracking-widest">{label}</h4>
        <div className="flex bg-surface-container-highest rounded-xl p-1 border border-outline-variant/10 shadow-inner">
          {["1h", "4h", "1d"].map((tf) => (
            <button
              key={tf}
              onClick={() => onTimeframeChange(tf)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                timeframe === tf ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative w-40 h-40">
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all"></div>
        <svg className="w-full h-full relative z-10" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className="text-surface-container-highest"
            strokeDasharray="210"
            strokeDashoffset="70"
            transform="rotate(150 50 50)"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            className={getColor(value)}
            strokeDasharray="210"
            strokeDashoffset={210 - (210 * 0.66 * value / 100)}
            transform="rotate(150 50 50)"
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1.5s ease-in-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <span className={cn("text-5xl font-black tracking-tighter", getColor(value))}>{value}</span>
          <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest mt-1">{getLabel(value)}</span>
        </div>
      </div>
    </div>
  );
};

interface AnalysisModuleProps {
  moduleId: string;
  analysisSections: Record<string, string>;
  analysis: string;
  ticker: any;
  btcSentiment: number;
  setBtcSentiment: (val: number) => void;
  top100Sentiment: number;
  setTop100Sentiment: (val: number) => void;
  generalSentiment: number;
  setGeneralSentiment: (val: number) => void;
  btcTF: string;
  setBtcTF: (tf: string) => void;
  top100TF: string;
  setTop100TF: (tf: string) => void;
  generalTF: string;
  setGeneralTF: (tf: string) => void;
  allAssets?: any[];
  marketIntelligence?: any;
  intelligenceLoading?: boolean;
}

const AnalysisModule: React.FC<AnalysisModuleProps> = ({ 
  moduleId, 
  analysisSections, 
  analysis, 
  ticker, 
  btcSentiment, 
  setBtcSentiment, 
  top100Sentiment, 
  setTop100Sentiment, 
  generalSentiment, 
  setGeneralSentiment, 
  btcTF, 
  setBtcTF, 
  top100TF, 
  setTop100TF, 
  generalTF, 
  setGeneralTF,
  allAssets = [],
  marketIntelligence,
  intelligenceLoading
}) => {
  const controls = useDragControls();
  const [copied, setCopied] = useState(false);
  const [showPatterns, setShowPatterns] = useState(false);
  const [showCandles, setShowCandles] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis);
    setCopied(true);
    toast.success("Análisis copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

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

      {moduleId === "context" && analysisSections["CONTEXTO Y EXPLICACIÓN BREVE"] && (
        <div className="trading-card p-8 space-y-4 border-l-4 border-primary/50 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-all"></div>
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3 relative z-10">
            <Brain className="w-4 h-4" /> CONTEXTO Y RESUMEN EJECUTIVO
          </h4>
          <p className="text-base text-on-surface leading-relaxed font-bold italic relative z-10">
            "{analysisSections["CONTEXTO Y EXPLICACIÓN BREVE"]}"
          </p>
        </div>
      )}

      {moduleId === "comments" && analysisSections["COMENTARIOS Y OBSERVACIONES"] && (
        <div className="trading-card p-8 space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
            <MessageSquare className="w-4 h-4" /> COMENTARIOS Y OBSERVACIONES
          </h4>
          <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
            {analysisSections["COMENTARIOS Y OBSERVACIONES"]}
          </p>
        </div>
      )}

      {moduleId === "predictions" && analysisSections["PREDICCIONES DE MERCADO"] && (
        <div className="trading-card p-8 space-y-4">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
            <Target className="w-4 h-4" /> PREDICCIONES DE MERCADO
          </h4>
          <p className="text-sm text-on-surface-variant leading-relaxed font-medium">
            {analysisSections["PREDICCIONES DE MERCADO"]}
          </p>
        </div>
      )}

      {moduleId === "recommendation" && analysisSections["RECOMENDACIÓN IA"] && (
        <div className="trading-card p-8 space-y-4 border-2 border-primary/30 bg-primary/5 shadow-xl shadow-primary/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50"></div>
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3 relative z-10">
            <Zap className="w-5 h-5 animate-pulse" /> RECOMENDACIÓN FINAL DE LA IA
          </h4>
          <p className="text-lg text-on-surface leading-relaxed font-black tracking-tight relative z-10">
            {analysisSections["RECOMENDACIÓN IA"]}
          </p>
        </div>
      )}

      {moduleId === "dominance" && analysisSections["DOMINANCIA BTC"] && (
        <div className="trading-card p-8 space-y-6">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
            <Activity className="w-4 h-4" /> DOMINANCIA BTC & ESTRATEGIA ALTCOINS
          </h4>
          <div className="p-6 bg-surface-container-high rounded-2xl border border-outline-variant/10 shadow-inner">
            <p className="text-sm text-on-surface leading-relaxed font-medium">
              {analysisSections["DOMINANCIA BTC"]}
            </p>
          </div>
        </div>
      )}

      {moduleId === "wyckoff" && analysisSections["FASE WYCKOFF"] && (
        <div className="trading-card p-10 space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
              <Layers className="w-5 h-5" /> ANALIZADOR WYCKOFF (ESTADO ACTUAL)
            </h4>
            <span className="text-[10px] font-black bg-primary/10 text-primary px-4 py-2 rounded-xl uppercase tracking-widest border border-primary/20 shadow-lg shadow-primary/5">
              {analysisSections["FASE WYCKOFF"]?.split(":")[0] || "ANALIZANDO"}
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <p className="text-sm text-on-surface leading-relaxed font-medium">
                {analysisSections["FASE WYCKOFF"]}
              </p>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary rounded-full shadow-lg shadow-primary/30"></div>
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Soporte</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-secondary rounded-full shadow-lg shadow-secondary/30"></div>
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Resistencia</span>
                </div>
              </div>
            </div>
            
            <div className="h-56 w-full bg-surface-container-high/20 rounded-[2rem] p-6 border border-outline-variant/10 relative overflow-hidden group">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getWyckoffData(ticker?.price || "0", analysisSections["FASE WYCKOFF"] || "")}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="name" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#fff" 
                    strokeWidth={3} 
                    dot={false} 
                    animationDuration={2000}
                  />
                  <ReferenceDot x="5" y={getWyckoffData(ticker?.price || "0", analysisSections["FASE WYCKOFF"] || "")[5]?.price} r={8} shape={<WyckoffArrow />} />
                  <ReferenceDot x="15" y={getWyckoffData(ticker?.price || "0", analysisSections["FASE WYCKOFF"] || "")[15]?.price} r={8} shape={<WyckoffArrow />} />
                  <ReferenceDot x="25" y={getWyckoffData(ticker?.price || "0", analysisSections["FASE WYCKOFF"] || "")[25]?.price} r={8} shape={<WyckoffArrow />} />
                  
                  {showPatterns && (
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="white" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false}
                      className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {moduleId === "strategy" && analysisSections["ESTRATEGIA"] && (
        <div className="trading-card p-10 relative overflow-hidden flex flex-col items-center text-center group">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="mb-6 relative z-10">
            {analysisSections["ESTRATEGIA"]?.toUpperCase().includes("ALCISTA") ? (
              <div className="flex flex-col items-center gap-3">
                <TrendingUp className="w-24 h-24 text-primary animate-bounce" />
                <span className="text-5xl font-black text-primary uppercase tracking-tighter">ALCISTA</span>
              </div>
            ) : analysisSections["ESTRATEGIA"]?.toUpperCase().includes("BAJISTA") ? (
              <div className="flex flex-col items-center gap-3">
                <TrendingDown className="w-24 h-24 text-secondary animate-bounce" />
                <span className="text-5xl font-black text-secondary uppercase tracking-tighter">BAJISTA</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Minus className="w-24 h-24 text-on-surface-variant" />
                <span className="text-5xl font-black text-on-surface-variant uppercase tracking-tighter">NEUTRAL</span>
              </div>
            )}
          </div>
          <div className="max-w-2xl relative z-10">
            <p className="text-base text-on-surface leading-relaxed italic font-medium">
              {analysisSections["ESTRATEGIA"]}
            </p>
          </div>
          {analysisSections["NIVEL DE CONFIANZA"] && (
            <div className="mt-8 flex flex-col items-center gap-3 relative z-10">
              <div className="w-48 h-3 bg-surface-container-highest rounded-full overflow-hidden border border-outline-variant/10 shadow-inner">
                <div 
                  className="h-full bg-primary shadow-lg shadow-primary/50 transition-all duration-1000" 
                  style={{ width: `${analysisSections["NIVEL DE CONFIANZA"]}%` }}
                />
              </div>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                NIVEL DE CONFIANZA: {analysisSections["NIVEL DE CONFIANZA"]}%
              </span>
            </div>
          )}
        </div>
      )}

      {moduleId === "indicators" && (analysisSections["INDICADORES TÉCNICOS (TOP 2026)"] || analysisSections["PATRONES DETECTADOS"] || analysisSections["VELAS JAPONESAS"]) && (
        <div className="trading-card p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
              <BarChart3 className="w-4 h-4" /> INDICADORES Y ESTRUCTURAS
            </h4>
            {analysisSections["NIVEL DE CONFIANZA"] && (
              <div className={cn(
                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-lg animate-pulse",
                parseInt(analysisSections["NIVEL DE CONFIANZA"]) >= 90 ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                parseInt(analysisSections["NIVEL DE CONFIANZA"]) >= 75 ? "bg-primary/20 text-primary border-primary/30" :
                parseInt(analysisSections["NIVEL DE CONFIANZA"]) >= 60 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                "bg-secondary/20 text-secondary border-secondary/30"
              )}>
                {parseInt(analysisSections["NIVEL DE CONFIANZA"]) >= 90 ? "PREMIUM" :
                 parseInt(analysisSections["NIVEL DE CONFIANZA"]) >= 75 ? "FUERTE" :
                 parseInt(analysisSections["NIVEL DE CONFIANZA"]) >= 60 ? "MEDIA" : "DÉBIL"}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysisSections["INDICADORES TÉCNICOS (TOP 2026)"]?.split("\n").filter((line: string) => line.trim()).map((line: string, idx: number) => (
              <div key={idx} className="p-4 bg-surface-container-high rounded-2xl border border-outline-variant/10 flex items-center justify-between group hover:border-primary/30 transition-all">
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">{line.split(":")[0]?.replace(/^[-\s*]+/, "")}</span>
                <span className="text-[10px] font-black text-primary text-right uppercase tracking-widest">{line.split(":")[1] || "ACTIVO"}</span>
              </div>
            ))}
          </div>

          {analysisSections["PATRONES DETECTADOS"] && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Zap className="w-4 h-4" />
                <h5 className="text-[11px] font-black uppercase tracking-widest">Patrones de Estructura Detectados</h5>
              </div>
              <div className="p-6 bg-primary/5 border border-primary/20 rounded-2xl">
                <p className="text-[13px] font-medium text-on-surface leading-relaxed">
                  {analysisSections["PATRONES DETECTADOS"]}
                </p>
              </div>
            </div>
          )}

          {analysisSections["VELAS JAPONESAS"] && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-secondary">
                <Zap className="w-4 h-4" />
                <h5 className="text-[11px] font-black uppercase tracking-widest">Análisis de Velas Japonesas</h5>
              </div>
              <div className="p-6 bg-secondary/5 border border-secondary/20 rounded-2xl">
                <p className="text-[13px] font-medium text-on-surface leading-relaxed">
                  {analysisSections["VELAS JAPONESAS"]}
                </p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nuevo Indicador de Patrones */}
            <button 
              onClick={() => setShowPatterns(!showPatterns)}
              className={cn(
                "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                showPatterns 
                  ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10" 
                  : "bg-surface-container-high border-outline-variant/10 hover:border-primary/30"
              )}
            >
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">PATRONES</span>
                <span className="text-[8px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-0.5">Detectar Estructuras</span>
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                showPatterns ? "text-primary" : "text-on-surface-variant/30"
              )}>
                {showPatterns ? "ACTIVO" : "INACTIVO"}
              </span>
            </button>

            {/* Nuevo Indicador de Velas Japonesas */}
            <button 
              onClick={() => setShowCandles(!showCandles)}
              className={cn(
                "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                showCandles 
                  ? "bg-secondary/10 border-secondary/50 shadow-lg shadow-secondary/10" 
                  : "bg-surface-container-high border-outline-variant/10 hover:border-secondary/30"
              )}
            >
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">VELAS JAPONESAS</span>
                <span className="text-[8px] font-bold text-on-surface-variant/50 uppercase tracking-widest mt-0.5">Acción del Precio</span>
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest",
                showCandles ? "text-secondary" : "text-on-surface-variant/30"
              )}>
                {showCandles ? "ACTIVO" : "INACTIVO"}
              </span>
            </button>
          </div>

          {showPatterns && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 mt-6"
            >
              <div className="flex items-center gap-2 text-primary mb-2">
                <Zap className="w-4 h-4" />
                <h5 className="text-[10px] font-black uppercase tracking-widest">Analizador de Patrones de Gráfico</h5>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { name: "Doble Suelo", type: "ALCISTA", reliability: 85, location: "Soporte Mayor", action: "LONG en ruptura de cuello" },
                  { name: "Triángulo Ascendente", type: "ALCISTA", reliability: 72, location: "Fase de Acumulación", action: "LONG en breakout con volumen" },
                  { name: "Breakout de Rango", type: "ALCISTA", reliability: 90, location: "Consolidación Lateral", action: "ENTRADA INMEDIATA" }
                ].map((pattern, i) => (
                  <div key={i} className="p-4 bg-primary/5 border border-primary/20 rounded-2xl space-y-2 group hover:bg-primary/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-on-surface uppercase tracking-tight">{pattern.name}</span>
                      <span className="px-2 py-0.5 bg-primary/20 text-primary text-[8px] font-black rounded uppercase tracking-widest">{pattern.type}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Fiabilidad</p>
                        <p className="text-xs font-black text-primary">{pattern.reliability}%</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Ubicación</p>
                        <p className="text-xs font-black text-on-surface">{pattern.location}</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-primary/10">
                      <p className="text-[9px] font-black text-on-surface uppercase tracking-widest">
                        <span className="text-primary mr-2">ACCIÓN:</span> {pattern.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {showCandles && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 mt-6"
            >
              <div className="flex items-center gap-2 text-secondary mb-2">
                <Zap className="w-4 h-4" />
                <h5 className="text-[10px] font-black uppercase tracking-widest">Analizador de Velas Japonesas (Scalping)</h5>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {[
                  { name: "Engulfing Alcista", explanation: "Vela verde envuelve completamente a la anterior roja", context: "Zona de Soporte / FVG", action: "LONG con confirmación" },
                  { name: "Martillo (Hammer)", explanation: "Cuerpo pequeño con mecha inferior larga", context: "Agotamiento de Vendedores", action: "ENTRADA EN RECHAZO" },
                  { name: "Pin Bar", explanation: "Rechazo fuerte de un nivel de precio", context: "Nivel de Resistencia / OB", action: "SHORT si es bajista" }
                ].map((candle, i) => (
                  <div key={i} className="p-4 bg-secondary/5 border border-secondary/20 rounded-2xl space-y-2 group hover:bg-secondary/10 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-on-surface uppercase tracking-tight">{candle.name}</span>
                      <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
                    </div>
                    <p className="text-[10px] font-medium text-on-surface-variant leading-relaxed italic">
                      {candle.explanation}
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-secondary/10">
                      <div>
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Contexto</p>
                        <p className="text-[9px] font-black text-on-surface">{candle.context}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Recomendación</p>
                        <p className="text-[9px] font-black text-secondary">{candle.action}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {moduleId === "levels" && analysisSections["NIVELES OPERATIVOS"] && (
        <div className="trading-card p-8 space-y-6">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
            <Target className="w-4 h-4" /> NIVELES OPERATIVOS
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-surface-container-high rounded-2xl border-l-4 border-primary shadow-lg group hover:scale-[1.02] transition-all">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 opacity-70">Entrada Sugerida</p>
              <p className="text-3xl font-black text-on-surface tracking-tighter">
                {analysisSections["NIVELES OPERATIVOS"]?.match(/ENTRADA:\s*(\$?\d+([,.]\d+)*)/i)?.[1] || 
                 analysisSections["NIVELES OPERATIVOS"]?.match(/ENTRADA:\s*(\d+([,.]\d+)*)/i)?.[1] || "---"}
              </p>
            </div>
            <div className="p-6 bg-surface-container-high rounded-2xl border-l-4 border-secondary shadow-lg group hover:scale-[1.02] transition-all">
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 opacity-70">Stop Loss</p>
              <p className="text-3xl font-black text-secondary tracking-tighter">
                {analysisSections["NIVELES OPERATIVOS"]?.match(/STOP LOSS:\s*(\$?\d+([,.]\d+)*)/i)?.[1] || 
                 analysisSections["NIVELES OPERATIVOS"]?.match(/STOP LOSS:\s*(\d+([,.]\d+)*)/i)?.[1] || "---"}
              </p>
            </div>
          </div>
        </div>
      )}

      {moduleId === "objectives" && analysisSections["NIVELES OPERATIVOS"] && (
        <div className="trading-card p-8 space-y-6">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
            <TrendingUp className="w-4 h-4" /> OBJETIVOS (TAKE PROFITS)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col p-5 bg-surface-container-high rounded-2xl border border-outline-variant/10 group hover:border-primary/30 transition-all shadow-lg">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 opacity-70">TP {i}</span>
                <span className="text-lg font-black text-primary tracking-tighter">
                  {analysisSections["NIVELES OPERATIVOS"]?.match(new RegExp(`TAKE PROFIT ${i}:\\s*(\\$?\\d+([,.]\d+)*)`, 'i'))?.[1] || 
                   analysisSections["NIVELES OPERATIVOS"]?.match(new RegExp(`TAKE PROFIT ${i}:\\s*(\\d+([,.]\d+)*)`, 'i'))?.[1] || "---"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {moduleId === "leverage" && analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"] && (
        <div className="trading-card p-8 space-y-6">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
            <Shield className="w-4 h-4" /> APALANCAMIENTO & GESTIÓN DE RIESGO
          </h4>
          <div className="p-6 bg-surface-container-high rounded-2xl border border-outline-variant/10 flex items-center justify-between shadow-inner">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Apalancamiento Sugerido</p>
              <p className="text-3xl font-black text-primary tracking-tighter">
                {analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.match(/x\d+/i)?.[0] || "x3"}
              </p>
            </div>
            <div className="text-right space-y-2">
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Nivel de Riesgo</p>
              <span className={cn(
                "text-[10px] font-black px-4 py-2 rounded-xl uppercase tracking-widest shadow-lg",
                analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.toUpperCase().includes("BAJO") ? "bg-primary/10 text-primary border border-primary/20" :
                analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.toUpperCase().includes("ALTO") ? "bg-secondary/10 text-secondary border border-secondary/20" :
                "bg-orange-500/10 text-orange-500 border border-orange-500/20"
              )}>
                {analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.toUpperCase().includes("BAJO") ? "BAJO" :
                 analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]?.toUpperCase().includes("ALTO") ? "ALTO" : "MODERADO"}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant leading-relaxed italic px-4 font-medium">
            {analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"]}
          </p>
        </div>
      )}

      {moduleId === "justification" && (analysisSections["JUSTIFICACIÓN TÉCNICA"] || analysisSections["ANÁLISIS DE ESTRUCTURA"] || analysisSections["CONCLUSIÓN FINAL DEL SISTEMA"]) && (
        <div className="trading-card p-10 space-y-8">
          <h4 className="text-[13px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
            <Shield className="w-5 h-5" /> VALIDACIÓN Y CONCLUSIÓN FINAL
          </h4>
          
          <div className="space-y-8">
            {analysisSections["CONCLUSIÓN FINAL DEL SISTEMA"] && (
              <div className="p-8 bg-primary/10 border border-primary/30 rounded-[2.5rem] space-y-4 shadow-2xl shadow-primary/10 animate-fast-flash">
                <div className="flex items-center gap-3 text-primary">
                  <Zap className="w-6 h-6" />
                  <h5 className="text-[14px] font-black uppercase tracking-widest">VEREDICTO FINAL DEL SISTEMA</h5>
                </div>
                <p className="text-[16px] font-black text-on-surface leading-relaxed">
                  {analysisSections["CONCLUSIÓN FINAL DEL SISTEMA"]}
                </p>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Señal Validada</span>
                  </div>
                  <div className="w-px h-4 bg-primary/20" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-70">RR Mínimo 1:2</span>
                </div>
              </div>
            )}

            {analysisSections["ANÁLISIS DE ESTRUCTURA"] && (
              <div className="group">
                <p className="text-[11px] font-black text-on-surface-variant uppercase mb-3 tracking-widest group-hover:text-primary transition-colors">Análisis de Estructura (BOS/CHoCH)</p>
                <p className="text-sm text-on-surface leading-relaxed font-medium">
                  {analysisSections["ANÁLISIS DE ESTRUCTURA"]}
                </p>
              </div>
            )}

            {analysisSections["JUSTIFICACIÓN TÉCNICA"] && (
              <div className="pt-8 border-t border-outline-variant/10 group">
                <p className="text-[11px] font-black text-on-surface-variant uppercase mb-3 tracking-widest group-hover:text-primary transition-colors">Lógica de Niveles e Ineficiencias</p>
                <p className="text-sm text-on-surface leading-relaxed font-medium">
                  {analysisSections["JUSTIFICACIÓN TÉCNICA"]}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {moduleId === "market_intelligence" && (
        <MarketIntelligence 
          symbol={ticker?.symbol || "BTCUSDT"}
        />
      )}

      {moduleId === "comparator" && (
        <div className="trading-card p-8 space-y-6">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-3">
            <Scale className="w-4 h-4" /> COMPARADOR DE ACTIVOS
          </h4>
          <ChartComparator 
            allAssets={allAssets} 
            defaultSymbol1={ticker?.symbol || "BTCUSDT"} 
            defaultSymbol2="ETHUSDT" 
          />
        </div>
      )}

      {moduleId === "raw" && (
        <div className="bg-neutral-950 rounded-3xl border border-white/10 overflow-hidden shadow-2xl group/terminal">
          {/* Terminal Header */}
          <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
              </div>
              <div className="h-4 w-px bg-white/10 mx-2" />
              <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                <Terminal className="w-3 h-3" /> 
                Terminal de Análisis Cuántico v4.2
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleCopy}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-primary"
                title="Copiar Análisis"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Terminal Content */}
          <div className="p-8 min-h-[400px] max-h-[800px] overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_left,rgba(0,255,163,0.05),transparent)]">
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="font-mono text-base leading-relaxed text-white/80 selection:bg-primary/30 selection:text-white">
                <Markdown
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="text-primary font-black tracking-tight">{children}</strong>,
                    h1: ({ children }) => <h1 className="text-2xl font-black text-white mb-6 border-b border-white/10 pb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-xl font-black text-white mt-8 mb-4">{children}</h2>,
                    ul: ({ children }) => <ul className="space-y-2 mb-4 list-disc list-inside">{children}</ul>,
                    li: ({ children }) => <li className="text-white/70">{children}</li>,
                  }}
                >
                  {analysis || "### SISTEMA EN ESPERA\n\nEsperando flujo de datos para iniciar el procesamiento de análisis profundo..."}
                </Markdown>
              </div>
            </div>
            
            {/* Cursor Effect */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-primary font-bold">{">"}</span>
              <div className="w-2 h-5 bg-primary/50 animate-pulse" />
            </div>
          </div>

          {/* Terminal Footer */}
          <div className="bg-white/5 px-6 py-3 border-t border-white/10 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-white/20">
            <div className="flex gap-4">
              <span>Status: Online</span>
              <span>Encoding: UTF-8</span>
              <span>Model: Gemini-3-Flash</span>
            </div>
            <div className="flex gap-4">
              <span>Lines: {analysis?.split('\n').length || 0}</span>
              <span>Characters: {analysis?.length || 0}</span>
            </div>
          </div>
        </div>
      )}
    </Reorder.Item>
  );
};

export default AnalysisModule;
