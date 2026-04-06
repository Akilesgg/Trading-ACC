import React from "react";
import { Reorder, useDragControls } from "motion/react";
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
  Scale 
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
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 flex flex-col items-center text-center space-y-4 shadow-lg">
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
  allAssets = []
}) => {
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
      
      {moduleId === "comparator" && (
        <ChartComparator 
          allAssets={allAssets} 
          defaultSymbol1={ticker?.symbol || "BTCUSDT"} 
          defaultSymbol2="ETHUSDT" 
        />
      )}

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
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-3 shadow-lg">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Brain className="w-3 h-3" /> CONTEXTO Y RESUMEN EJECUTIVO
          </h4>
          <p className="text-sm text-on-surface leading-relaxed font-medium italic">
            "{analysisSections["CONTEXTO Y EXPLICACIÓN BREVE"]}"
          </p>
        </div>
      )}

      {moduleId === "comments" && analysisSections["COMENTARIOS Y OBSERVACIONES"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-3 shadow-lg">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="w-3 h-3" /> COMENTARIOS Y OBSERVACIONES
          </h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {analysisSections["COMENTARIOS Y OBSERVACIONES"]}
          </p>
        </div>
      )}

      {moduleId === "predictions" && analysisSections["PREDICCIONES DE MERCADO"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-3 shadow-lg">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Target className="w-3 h-3" /> PREDICCIONES DE MERCADO
          </h4>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            {analysisSections["PREDICCIONES DE MERCADO"]}
          </p>
        </div>
      )}

      {moduleId === "recommendation" && analysisSections["RECOMENDACIÓN IA"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border-2 border-primary/20 bg-primary/5 space-y-3 shadow-lg shadow-primary/5">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <Zap className="w-3 h-3" /> RECOMENDACIÓN FINAL DE LA IA
          </h4>
          <p className="text-base text-on-surface leading-relaxed font-bold">
            {analysisSections["RECOMENDACIÓN IA"]}
          </p>
        </div>
      )}

      {moduleId === "dominance" && analysisSections["DOMINANCIA BTC"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-lg">
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
        <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 space-y-6 shadow-lg">
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
        <div className="bg-surface-container-low border-2 border-outline-variant/10 p-8 rounded-2xl relative overflow-hidden flex flex-col items-center text-center shadow-lg">
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
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-lg">
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
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-lg">
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
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-lg">
          <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> OBJETIVOS (TAKE PROFITS)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col p-3 bg-surface-container rounded-xl border border-outline-variant/5">
                <span className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">TP {i}</span>
                <span className="text-sm font-black text-primary">
                  {analysisSections["NIVELES OPERATIVOS"]?.match(new RegExp(`TAKE PROFIT ${i}:\\s*(\\$?\\d+([,.]\d+)*)`, 'i'))?.[1] || 
                   analysisSections["NIVELES OPERATIVOS"]?.match(new RegExp(`TAKE PROFIT ${i}:\\s*(\\d+([,.]\d+)*)`, 'i'))?.[1] || "---"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {moduleId === "leverage" && analysisSections["RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO"] && (
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-lg">
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
        <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 space-y-6 shadow-lg">
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
        <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4 shadow-lg">
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

export default AnalysisModule;
