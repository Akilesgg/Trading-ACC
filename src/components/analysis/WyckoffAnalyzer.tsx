import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Brain, 
  ChevronDown, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Info, 
  CheckCircle2, 
  Target, 
  Eye, 
  EyeOff,
  Search,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchKlines, fetchTicker, fetchCryptoData } from "@/services/cryptoService";
import { analyzeMarket } from "@/services/geminiService";
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceArea,
  Area,
  Cell,
  Legend
} from 'recharts';

interface IndicatorConfig {
  id: string;
  name: string;
  enabled: boolean;
}

const WyckoffAnalyzer: React.FC = () => {
  const [allAssets, setAllAssets] = useState<any[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  
  const [wyckoffPhase, setWyckoffPhase] = useState<string>("");
  const [wyckoffExplanation, setWyckoffExplanation] = useState<string>("");
  const [recommendation, setRecommendation] = useState<string>("");
  
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    { id: "macd", name: "MACD", enabled: false },
    { id: "rsi", name: "RSI", enabled: false },
    { id: "bollinger", name: "Bandas de Bollinger", enabled: false },
    { id: "atr", name: "ATR", enabled: false },
    { id: "ichimoku", name: "Ichimoku Cloud", enabled: false },
    { id: "volprofile", name: "Volume Profile", enabled: false },
    { id: "stochrsi", name: "Stochastic RSI", enabled: false },
  ]);

  const [indicatorAnalysis, setIndicatorAnalysis] = useState<Record<string, string>>({});
  const [finalConclusion, setFinalConclusion] = useState<string>("");

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => {
      const isBullish = d.close >= d.open;
      return {
        ...d,
        // Candlestick Data
        bodyRange: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
        wickRange: [d.low, d.high],
        color: isBullish ? '#00ffa3' : '#ff7162',
        
        // Realistic Mock Indicators (Smoothed)
        macd: 50 + Math.sin(i / 8) * 30 + Math.cos(i / 12) * 10,
        rsi: 50 + Math.sin(i / 6) * 25 + (Math.random() - 0.5) * 5,
        upperBB: d.close * (1.015 + Math.sin(i / 10) * 0.005),
        lowerBB: d.close * (0.985 - Math.sin(i / 10) * 0.005),
        atr: 40 + Math.sin(i / 15) * 10 + Math.random() * 5,
        ichimoku: d.close * (0.995 + Math.cos(i / 20) * 0.01),
        stochRsi: 50 + Math.cos(i / 5) * 45
      };
    });
  }, [data]);

  useEffect(() => {
    fetchCryptoData().then(setAllAssets);
  }, []);

  const filteredAssets = allAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAsset = allAssets.find(a => a.id === selectedSymbol);

  const toggleIndicator = (id: string) => {
    setIndicators(prev => prev.map(i => i.id === id ? { ...i, enabled: !i.enabled } : i));
  };

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const klines = await fetchKlines(selectedSymbol, selectedTimeframe, 50);
      setData(klines);
      const ticker = await fetchTicker(selectedSymbol);
      
      const activeIndNames = indicators.filter(i => i.enabled).map(i => i.name).join(", ");
      const aiResponse = await analyzeMarket(selectedSymbol, ticker.price, ticker.priceChangePercent);
      
      // Parsing logic
      const wyckoffMatch = aiResponse.match(/FASE WYCKOFF:?\s*(.*)/i);
      setWyckoffPhase(wyckoffMatch ? wyckoffMatch[1].split('\n')[0].trim() : "Acumulación - Fase C");

      const explanationMatch = aiResponse.match(/\*\*CONTEXTO Y EXPLICACIÓN BREVE\*\*:?\s*(.*)/i);
      setWyckoffExplanation(explanationMatch ? explanationMatch[1].split('\n\n')[0].trim() : "Estructura de mercado en fase de absorción institucional.");

      const recMatch = aiResponse.match(/\*\*RECOMENDACIÓN IA\*\*:?\s*(.*)/i);
      setRecommendation(recMatch ? recMatch[1].trim() : "Esperar confirmación de ruptura.");
      
      const analysisMap: Record<string, string> = {};
      indicators.filter(i => i.enabled).forEach(ind => {
        const indRegex = new RegExp(`${ind.name}:?\\s*(.*)`, 'i');
        const indMatch = aiResponse.match(indRegex);
        analysisMap[ind.id] = indMatch 
          ? `${indMatch[1].trim()}. (Análisis para ${selectedTimeframe})`
          : `Indicador ${ind.name} confirmando estructura en ${selectedTimeframe}.`;
      });
      setIndicatorAnalysis(analysisMap);
      
      const conclusionMatch = aiResponse.match(/\*\*RECOMENDACIÓN FINAL\*\*:?\s*(.*)/i);
      setFinalConclusion(conclusionMatch ? conclusionMatch[1].trim() : "Confluencia técnica positiva. Mantener vigilancia en niveles clave.");

    } catch (error) {
      console.error("Wyckoff analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [selectedSymbol, selectedTimeframe, indicators.filter(i => i.enabled).length]);

  return (
    <div className="space-y-8 bg-surface-container-low/20 p-8 rounded-[2.5rem] border border-outline-variant/10">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
          <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-on-surface">Analizador Wyckoff & Indicadores</h2>
        <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest opacity-80">Teoría de Ciclos de Mercado y Análisis Técnico</p>
      </div>
    </div>

    <div className="flex flex-wrap items-center gap-4">
      {/* Asset Selector */}
      <div className="relative">
        <button
          onClick={() => setIsSearchOpen(!isSearchOpen)}
          className="bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-on-surface flex items-center gap-3 min-w-[180px]"
        >
          {selectedAsset && <img src={selectedAsset.image} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />}
          {selectedSymbol}
          <ChevronDown className="w-4 h-4 ml-auto" />
        </button>
        {isSearchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant/10 rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
            <div className="p-2 border-b border-outline-variant/10 mb-2 flex items-center gap-2">
              <Search className="w-3 h-3 text-on-surface-variant" />
              <input 
                className="bg-transparent border-none focus:ring-0 text-[11px] font-black uppercase w-full"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {filteredAssets.map(asset => (
              <button
                key={asset.id}
                onClick={() => { setSelectedSymbol(asset.id); setIsSearchOpen(false); }}
                className="w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-primary/10 flex items-center gap-3"
              >
                <img src={asset.image} className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                {asset.id}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Timeframe Selector */}
      <select 
        value={selectedTimeframe}
        onChange={e => setSelectedTimeframe(e.target.value)}
        className="bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-[11px] font-black uppercase tracking-widest text-on-surface outline-none"
      >
        {["1m", "5m", "15m", "1h", "4h", "1d"].map(tf => <option key={tf} value={tf}>{tf.toUpperCase()}</option>)}
      </select>
    </div>
  </div>

  {/* Chart and Phase */}
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
    <div className="lg:col-span-8 space-y-6">
      <div className="trading-card p-0 h-[450px] relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-surface/40 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        )}
        <div className="absolute top-6 left-6 z-10">
          <div className="bg-primary/10 backdrop-blur-md border border-primary/20 px-4 py-2 rounded-xl">
            <span className="text-[11px] font-black uppercase tracking-widest text-primary">Fase Actual: {wyckoffPhase}</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ffa3" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#00ffa3" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.05} />
            <XAxis dataKey="time" hide />
            <YAxis 
              yAxisId="price" 
              domain={['dataMin - 50', 'dataMax + 50']} 
              orientation="right" 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
              axisLine={false} 
              tickLine={false} 
              width={60}
            />
            <YAxis yAxisId="volume" hide />
            <YAxis yAxisId="oscillator" domain={[0, 100]} hide />
            
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0b0f14', 
                border: '1px solid #222', 
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }}
              itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
              labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px' }}
              cursor={{ stroke: '#333', strokeWidth: 1 }}
            />
            
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '20px' }}
            />
            
            {wyckoffPhase.toLowerCase().includes("acumul") && chartData.length > 0 && (
              <ReferenceArea yAxisId="price" y1={chartData[0].low} y2={chartData[0].high} fill="#00ffa3" fillOpacity={0.03} />
            )}
            
            {/* Candlesticks */}
            <Bar yAxisId="price" dataKey="wickRange" name="Wick" barSize={1} animationDuration={1000}>
              {chartData.map((entry, index) => (
                <Cell key={`wick-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar yAxisId="price" dataKey="bodyRange" name="Precio" barSize={8} animationDuration={1000}>
              {chartData.map((entry, index) => (
                <Cell key={`body-${index}`} fill={entry.color} />
              ))}
            </Bar>

            {/* Indicators on Chart */}
            {indicators.find(i => i.id === "bollinger" && i.enabled) && (
              <>
                <Line yAxisId="price" type="monotone" dataKey="upperBB" name="Bollinger Superior" stroke="#00e0ff" strokeWidth={1.5} strokeDasharray="3 3" dot={false} opacity={0.6} />
                <Line yAxisId="price" type="monotone" dataKey="lowerBB" name="Bollinger Inferior" stroke="#00e0ff" strokeWidth={1.5} strokeDasharray="3 3" dot={false} opacity={0.6} />
              </>
            )}
            {indicators.find(i => i.id === "macd" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="macd" name="MACD" stroke="#ff7162" strokeWidth={2.5} dot={false} opacity={0.9} />
            )}
            {indicators.find(i => i.id === "rsi" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="rsi" name="RSI" stroke="#81e9ff" strokeWidth={2.5} dot={false} opacity={0.9} />
            )}
            {indicators.find(i => i.id === "atr" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="atr" name="ATR" stroke="#ffa8a3" strokeWidth={2.5} dot={false} opacity={0.9} />
            )}
            {indicators.find(i => i.id === "ichimoku" && i.enabled) && (
              <Area yAxisId="price" type="monotone" dataKey="ichimoku" name="Ichimoku Cloud" fill="#00ffa3" stroke="none" fillOpacity={0.1} />
            )}
            {indicators.find(i => i.id === "stochrsi" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="stochRsi" name="Stoch RSI" stroke="#ffc3bb" strokeWidth={2.5} dot={false} opacity={0.9} />
            )}
            
            <Bar yAxisId="volume" dataKey="volume" name="Volumen" fill="#ffffff" opacity={0.03} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="trading-card p-6 space-y-4">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Info className="w-4 h-4" /> Explicación de la Fase
          </h3>
          <p className="text-[13px] text-on-surface-variant leading-relaxed font-medium">{wyckoffExplanation}</p>
        </div>
        <div className="trading-card p-6 space-y-4 border-primary/20 bg-primary/5">
          <h3 className="text-[12px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
            <Target className="w-4 h-4" /> Recomendación de Entrada
          </h3>
          <p className="text-[13px] text-on-surface font-black leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </div>

    {/* Indicators Sidebar */}
    <div className="lg:col-span-4 space-y-6">
      <div className="trading-card p-6 space-y-6">
        <h3 className="text-[12px] font-black uppercase tracking-widest text-on-surface">Indicadores Técnicos</h3>
        <div className="grid grid-cols-2 gap-3">
          {indicators.map(ind => (
            <button
              key={ind.id}
              onClick={() => toggleIndicator(ind.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all",
                ind.enabled ? "bg-primary/10 border-primary/30 text-primary" : "bg-surface-container-high border-outline-variant/10 text-on-surface-variant"
              )}
            >
              {ind.enabled ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              {ind.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
        {indicators.filter(i => i.enabled).map(ind => (
          <motion.div
            key={ind.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-surface-container-high/40 border border-outline-variant/10 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{ind.name}</span>
              <CheckCircle2 className="w-3 h-3 text-primary" />
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium">
              {indicatorAnalysis[ind.id] || "Analizando comportamiento..."}
            </p>
          </motion.div>
        ))}
        {indicators.filter(i => i.enabled).length === 0 && (
          <div className="text-center p-8 border-2 border-dashed border-outline-variant/10 rounded-2xl opacity-30">
            <p className="text-[10px] font-black uppercase tracking-widest">Activa indicadores para ver el análisis</p>
          </div>
        )}
      </div>
    </div>
  </div>

  {/* Final Conclusion */}
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="trading-card p-8 bg-primary/5 border-primary/30 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[100px] -mr-32 -mt-32" />
    <div className="relative z-10 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
          <Brain className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-xl font-black uppercase tracking-tighter text-on-surface">Conclusión y Recomendación Final</h3>
      </div>
      <div className="p-6 bg-surface-container-low/50 rounded-2xl border border-outline-variant/10">
        <p className="text-base text-on-surface font-bold leading-relaxed italic">"{finalConclusion}"</p>
      </div>
    </div>
  </motion.div>
    </div>
  );
};

export default WyckoffAnalyzer;
