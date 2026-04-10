import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Shield,
  Clock,
  Target,
  BarChart3,
  ChevronRight,
  Flame,
  Brain
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchTicker, CryptoData, fetchKlines } from "@/services/cryptoService";
import { analyzeMarket } from "@/services/geminiService";
import { 
  ComposedChart, 
  Line, 
  Area,
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  ReferenceArea,
  Cell,
  Legend
} from 'recharts';

const SignalDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tf = queryParams.get('tf') || '1h';
  
  const [ticker, setTicker] = useState<CryptoData | null>(null);
  const [klines, setKlines] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string>("Analizando estructura de mercado...");
  const [loading, setLoading] = useState(true);

  const trend = useMemo(() => {
    if (klines.length < 2) return "lateral";
    const startPrice = klines[0].close;
    const endPrice = klines[klines.length - 1].close;
    const change = ((endPrice - startPrice) / startPrice) * 100;
    if (change > 0.5) return "bullish";
    if (change < -0.5) return "bearish";
    return "lateral";
  }, [klines]);

  const chartData = useMemo(() => {
    return klines.map(d => ({
      ...d,
      bodyRange: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
      wickRange: [d.low, d.high],
      color: d.close >= d.open ? '#00ffa3' : '#ff7162'
    }));
  }, [klines]);

  useEffect(() => {
    const loadData = async () => {
      if (!symbol) return;
      try {
        const data = await fetchTicker(symbol, tf);
        setTicker(data);
        const chartData = await fetchKlines(symbol, tf, 50);
        setKlines(chartData);
        const aiAnalysis = await analyzeMarket(symbol, data.price, data.priceChangePercent);
        setAnalysis(aiAnalysis);
      } catch (error) {
        console.error("Signal detail data load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [symbol]);

  if (!ticker) return <div className="pt-32 text-center">Cargando datos de la señal...</div>;

  const isPositive = parseFloat(ticker.priceChangePercent) >= 0;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-3 text-on-surface-variant hover:text-primary transition-all group"
        >
          <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center border border-outline-variant/10 group-hover:border-primary/30 transition-all">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Volver al Panel</span>
        </button>
        <div className="flex items-center gap-4">
          <button className="p-3 bg-surface-container-high rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all shadow-lg">
            <Shield className="w-5 h-5 text-primary" />
          </button>
          <button className="p-3 bg-surface-container-high rounded-xl border border-outline-variant/10 hover:border-tertiary/30 transition-all shadow-lg">
            <Clock className="w-5 h-5 text-tertiary" />
          </button>
        </div>
      </div>

      {/* Main Signal Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="trading-card p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-primary/10 transition-all duration-1000"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-[2rem] bg-surface-container-high flex items-center justify-center shadow-2xl border border-outline-variant/10 group-hover:scale-105 transition-transform">
                  <Zap className="w-10 h-10 text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]" />
                </div>
                <div>
                  <h2 className="text-4xl font-black tracking-tighter uppercase text-on-surface">{ticker.symbol.replace("USDT", " / USDT")}</h2>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60">Binance Spot</span>
                    <div className="px-2 py-0.5 bg-primary/10 rounded border border-primary/20">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{ticker.timeframe}</span>
                    </div>
                    <div className="flex h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(0,255,163,0.8)]"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Señal en Vivo</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-5xl font-black tracking-tighter text-on-surface drop-shadow-sm">${parseFloat(ticker.price).toLocaleString()}</p>
                <div className={cn(
                  "text-xl font-black flex items-center justify-end gap-2 mt-1",
                  isPositive ? "text-primary" : "text-secondary"
                )}>
                  {isPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                  {ticker.priceChangePercent}%
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="h-80 w-full mt-8 relative">
              <div className="absolute top-0 right-0 z-20 flex items-center gap-2 bg-surface-container-high/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-outline-variant/20 shadow-xl">
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">Tendencia:</span>
                <div className={cn(
                  "flex items-center gap-2 font-black text-xs uppercase tracking-tighter",
                  trend === "bullish" ? "text-primary" : trend === "bearish" ? "text-secondary" : "text-tertiary"
                )}>
                  {trend === "bullish" ? (
                    <><ArrowUpRight className="w-4 h-4" /> Alcista</>
                  ) : trend === "bearish" ? (
                    <><ArrowDownRight className="w-4 h-4" /> Bajista</>
                  ) : (
                    <><Minus className="w-4 h-4" /> Lateral</>
                  )}
                </div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#00ffa3" : "#ff7162"} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={isPositive ? "#00ffa3" : "#ff7162"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.05} />
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    domain={['dataMin - 10', 'dataMax + 10']} 
                    orientation="right" 
                    tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
                    axisLine={false}
                    tickLine={false}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0b0f14", border: "1px solid #222", borderRadius: "12px", color: "#f8f9fe" }}
                    itemStyle={{ color: "#00ffa3" }}
                  />
                  
                  {/* Candlesticks */}
                  <Bar dataKey="wickRange" name="Wick" barSize={1} animationDuration={1000}>
                    {chartData.map((entry, index) => (
                      <Cell key={`wick-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Bar dataKey="bodyRange" name="Precio" barSize={8} animationDuration={1000}>
                    {chartData.map((entry, index) => (
                      <Cell key={`body-${index}`} fill={entry.color} />
                    ))}
                  </Bar>

                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke={isPositive ? "#00ffa3" : "#ff7162"} 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                    opacity={0.3}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="trading-card p-10 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tight">
                <Brain className="w-8 h-8 text-primary" />
                ANÁLISIS PROFUNDO IA
              </h3>
              <div className="px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Fase de Acumulación</span>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <div className="text-on-surface-variant leading-relaxed text-sm whitespace-pre-wrap bg-surface-container-high/30 p-8 rounded-[2rem] border border-outline-variant/10 shadow-inner">
                {analysis.split('\n').map((line, i) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return <div key={i} className="h-4" />;
                  
                  if (trimmedLine.startsWith('**') && trimmedLine.includes(':')) {
                    const [header, ...rest] = trimmedLine.replace(/\*\*/g, '').split(':');
                    return (
                      <div key={i} className="mb-8 last:mb-0">
                        <h4 className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-3 flex items-center gap-3">
                          <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,163,0.5)]" />
                          {header}
                        </h4>
                        <p className="text-on-surface-variant text-xs leading-relaxed font-medium pl-5 border-l-2 border-outline-variant/20">
                          {rest.join(':').trim()}
                        </p>
                      </div>
                    );
                  }
                  return <p key={i} className="text-on-surface-variant text-xs leading-relaxed mb-5 last:mb-0 opacity-80">{trimmedLine}</p>;
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
              {[
                { label: "RSI (14)", value: "42.5", status: "Neutral", color: "text-tertiary", bg: "bg-tertiary/10" },
                { label: "MACD", value: "Alcista", status: "Fuerte", color: "text-primary", bg: "bg-primary/10" },
                { label: "Volumen", value: "Alto", status: "Aumentando", color: "text-primary", bg: "bg-primary/10" },
                { label: "Volatilidad", value: "Bajo", status: "Estable", color: "text-tertiary", bg: "bg-tertiary/10" },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface-container-high p-6 rounded-2xl text-center space-y-2 border border-outline-variant/5 hover:border-primary/20 transition-all shadow-lg">
                  <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-60">{stat.label}</p>
                  <p className="font-black text-lg tracking-tight">{stat.value}</p>
                  <p className={cn("text-[10px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full inline-block", stat.color, stat.bg)}>{stat.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Execution Panel */}
        <div className="space-y-10">
          <div className="trading-card p-10 space-y-10 border-primary/30 shadow-2xl shadow-primary/5">
            <h3 className="text-2xl font-black uppercase tracking-tight text-on-surface">Ejecución de Señal</h3>
            <div className="space-y-8">
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60 ml-1">
                  <span>Zona de Entrada</span>
                  <span className="text-primary">Activa</span>
                </div>
                <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant/20 flex justify-between items-center group cursor-pointer hover:border-primary/50 transition-all shadow-inner">
                  <span className="text-2xl font-black tracking-tighter text-on-surface">${ticker.entry?.toFixed(2)}</span>
                  <ChevronRight className="w-6 h-6 text-on-surface-variant group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {ticker.takeProfits?.map((tp, index) => {
                const profitPercent = Math.abs(((tp - (ticker.entry || 0)) / (ticker.entry || 1)) * 100).toFixed(1);
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60 ml-1">
                      <span>Objetivo {index + 1}</span>
                      <span className="text-primary">+{profitPercent}%</span>
                    </div>
                    <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant/20 flex justify-between items-center group cursor-pointer hover:border-primary/50 transition-all shadow-inner">
                      <span className="text-2xl font-black tracking-tighter text-on-surface">${tp.toFixed(2)}</span>
                      <Target className="w-6 h-6 text-primary drop-shadow-[0_0_8px_rgba(0,255,163,0.5)]" />
                    </div>
                  </div>
                );
              })}

              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant opacity-60 ml-1">
                  <span>Stop Loss</span>
                  <span className="text-secondary">-{Math.abs(((ticker.stopLoss! - ticker.entry!) / ticker.entry!) * 100).toFixed(1)}%</span>
                </div>
                <div className="p-5 bg-surface-container rounded-2xl border border-outline-variant/20 flex justify-between items-center group cursor-pointer hover:border-secondary/50 transition-all shadow-inner">
                  <span className="text-2xl font-black tracking-tighter text-on-surface">${ticker.stopLoss?.toFixed(2)}</span>
                  <Shield className="w-6 h-6 text-secondary drop-shadow-[0_0_8px_rgba(255,107,107,0.5)]" />
                </div>
              </div>
            </div>
            <Link 
              to={`/terminal?symbol=${ticker.symbol}`}
              className="block w-full py-6 bg-primary text-on-primary rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] text-center shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              EJECUTAR AHORA
            </Link>
          </div>

          <div className="trading-card p-8 space-y-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant flex items-center gap-3 opacity-60">
              <Activity className="w-4 h-4" />
              Métricas de Velocidad
            </h4>
            <div className="space-y-4">
              {[
                { label: "Actividad de Ballenas", value: "Alta", color: "text-primary", bg: "bg-primary/10" },
                { label: "Calor Social", value: "Subiendo", color: "text-primary", bg: "bg-primary/10" },
                { label: "Flujo de Entrada", value: "Neutral", color: "text-tertiary", bg: "bg-tertiary/10" },
              ].map((m) => (
                <div key={m.label} className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-black uppercase tracking-widest text-[9px] opacity-70">{m.label}</span>
                  <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full", m.color, m.bg)}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default SignalDetail;
