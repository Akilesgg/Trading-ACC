import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

const SignalDetail = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const [ticker, setTicker] = useState<CryptoData | null>(null);
  const [klines, setKlines] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<string>("Analizando estructura de mercado...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!symbol) return;
      try {
        const data = await fetchTicker(symbol);
        setTicker(data);
        const chartData = await fetchKlines(symbol, "1h", 24);
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
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-widest">Volver al Panel</span>
        </button>
        <div className="flex items-center gap-4">
          <button className="p-2 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
            <Shield className="w-5 h-5 text-primary" />
          </button>
          <button className="p-2 bg-surface-container-high rounded-lg hover:bg-surface-container-highest transition-colors">
            <Clock className="w-5 h-5 text-tertiary" />
          </button>
        </div>
      </div>

      {/* Main Signal Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-container-high flex items-center justify-center shadow-lg">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h2 className="font-headline text-3xl font-bold tracking-tight">{ticker.symbol.replace("USDT", " / USDT")}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Binance Spot</span>
                    <span className="flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Señal en Vivo</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-headline text-4xl font-bold tracking-tight">${parseFloat(ticker.price).toLocaleString()}</p>
                <p className={cn("text-lg font-bold flex items-center justify-end gap-1", isPositive ? "text-primary" : "text-secondary")}>
                  {isPositive ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                  {ticker.priceChangePercent}%
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-64 w-full mt-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={klines}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "#b1ffce" : "#ff7162"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={isPositive ? "#b1ffce" : "#ff7162"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#1c2024", border: "none", borderRadius: "12px", color: "#f8f9fe" }}
                    itemStyle={{ color: "#b1ffce" }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="close" 
                    stroke={isPositive ? "#b1ffce" : "#ff7162"} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-surface-container-low p-8 rounded-2xl border border-outline-variant/10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-xl font-bold flex items-center gap-2">
                <Brain className="w-6 h-6 text-primary" />
                ANÁLISIS PROFUNDO IA
              </h3>
              <div className="wyckoff-label">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Fase de Acumulación</span>
              </div>
            </div>
            <div className="prose prose-invert max-w-none">
              <p className="text-on-surface-variant leading-relaxed text-lg italic">
                "{analysis}"
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              {[
                { label: "RSI (14)", value: "42.5", status: "Neutral", color: "text-tertiary" },
                { label: "MACD", value: "Alcista", status: "Fuerte", color: "text-primary" },
                { label: "Volumen", value: "Alto", status: "Aumentando", color: "text-primary" },
                { label: "Volatilidad", value: "Bajo", status: "Estable", color: "text-tertiary" },
              ].map((stat) => (
                <div key={stat.label} className="bg-surface-container-high p-4 rounded-xl text-center space-y-1">
                  <p className="text-[10px] font-label uppercase text-on-surface-variant">{stat.label}</p>
                  <p className="font-bold text-sm">{stat.value}</p>
                  <p className={cn("text-[10px] font-bold uppercase tracking-widest", stat.color)}>{stat.status}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Execution Panel */}
        <div className="space-y-8">
          <div className="bg-surface-container-high p-8 rounded-2xl border border-primary/20 space-y-8">
            <h3 className="font-headline text-xl font-bold uppercase tracking-wide">Ejecución de Señal</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>Zona de Entrada</span>
                  <span className="text-primary">Activa</span>
                </div>
                <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 flex justify-between items-center">
                  <span className="font-headline font-bold text-lg">${(parseFloat(ticker.price) * 0.99).toFixed(2)}</span>
                  <ChevronRight className="w-5 h-5 text-on-surface-variant" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>Objetivo 1</span>
                  <span className="text-primary">+15.4%</span>
                </div>
                <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 flex justify-between items-center">
                  <span className="font-headline font-bold text-lg">${(parseFloat(ticker.price) * 1.15).toFixed(2)}</span>
                  <Target className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <span>Stop Loss</span>
                  <span className="text-secondary">-5.2%</span>
                </div>
                <div className="p-4 bg-surface-container rounded-xl border border-outline-variant/20 flex justify-between items-center">
                  <span className="font-headline font-bold text-lg">${(parseFloat(ticker.price) * 0.95).toFixed(2)}</span>
                  <Shield className="w-5 h-5 text-secondary" />
                </div>
              </div>
            </div>
            <Link 
              to={`/terminal?symbol=${ticker.symbol}`}
              className="block w-full py-5 bg-gradient-to-br from-primary to-primary-dim text-on-primary-fixed rounded-2xl font-extrabold uppercase tracking-widest text-center shadow-[0_20px_40px_rgba(0,255,163,0.2)] active:scale-95 transition-all"
            >
              EJECUTAR AHORA
            </Link>
          </div>

          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Métricas de Velocidad
            </h4>
            <div className="space-y-3">
              {[
                { label: "Actividad de Ballenas", value: "Alta", color: "text-primary" },
                { label: "Calor Social", value: "Subiendo", color: "text-primary" },
                { label: "Flujo de Entrada", value: "Neutral", color: "text-tertiary" },
              ].map((m) => (
                <div key={m.label} className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-label">{m.label}</span>
                  <span className={cn("font-bold uppercase tracking-widest", m.color)}>{m.value}</span>
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
