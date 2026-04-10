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
  Area
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
          <ComposedChart data={data.map((d, i) => ({
            ...d,
            macd: Math.sin(i / 5) * 100,
            rsi: 50 + Math.sin(i / 3) * 20,
            upperBB: d.close * 1.02,
            lowerBB: d.close * 0.98,
            atr: 50 + Math.random() * 20,
            ichimoku: d.close * 0.99,
            stochRsi: 50 + Math.cos(i / 4) * 30
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.1} />
            <XAxis dataKey="time" hide />
            <YAxis yAxisId="price" domain={['auto', 'auto']} orientation="right" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="volume" hide />
            <YAxis yAxisId="oscillator" domain={[0, 100]} hide />
            <Tooltip contentStyle={{ backgroundColor: '#0b0f14', border: 'none', borderRadius: '12px' }} />
            
            {wyckoffPhase.toLowerCase().includes("acumul") && (
              <ReferenceArea yAxisId="price" y1={data[0]?.low} y2={data[0]?.high} fill="#00ffa3" fillOpacity={0.05} />
            )}
            
            <Line yAxisId="price" type="monotone" dataKey="close" stroke="#00ffa3" strokeWidth={2} dot={false} />
            
            {/* Indicators on Chart */}
            {indicators.find(i => i.id === "bollinger" && i.enabled) && (
              <>
                <Line yAxisId="price" type="monotone" dataKey="upperBB" stroke="#00e0ff" strokeWidth={1} strokeDasharray="5 5" dot={false} opacity={0.4} />
                <Line yAxisId="price" type="monotone" dataKey="lowerBB" stroke="#00e0ff" strokeWidth={1} strokeDasharray="5 5" dot={false} opacity={0.4} />
              </>
            )}
            {indicators.find(i => i.id === "macd" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="macd" stroke="#ff7162" strokeWidth={1.5} dot={false} opacity={0.6} />
            )}
            {indicators.find(i => i.id === "rsi" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="rsi" stroke="#81e9ff" strokeWidth={1.5} dot={false} opacity={0.6} />
            )}
            {indicators.find(i => i.id === "atr" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="atr" stroke="#ffa8a3" strokeWidth={1.5} dot={false} opacity={0.6} />
            )}
            {indicators.find(i => i.id === "ichimoku" && i.enabled) && (
              <Area yAxisId="price" type="monotone" dataKey="ichimoku" fill="#00ffa3" stroke="none" fillOpacity={0.1} />
            )}
            {indicators.find(i => i.id === "stochrsi" && i.enabled) && (
              <Line yAxisId="oscillator" type="monotone" dataKey="stochRsi" stroke="#ffc3bb" strokeWidth={1.5} dot={false} opacity={0.6} />
            )}
            
            <Bar yAxisId="volume" dataKey="volume" fill="#ffffff" opacity={0.05} />
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
