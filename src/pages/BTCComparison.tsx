import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Info, 
  ChevronRight, 
  Zap, 
  ArrowRight, 
  BarChart3,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  SUPPORTED_ASSETS, 
  estimateAssetMove, 
  getImpactLevel, 
  CryptoAsset,
  calculateDynamicBeta
} from "../core/correlationEngine";

const BTCComparison: React.FC = () => {
  const [btcMove, setBtcMove] = useState<number>(2.5); // Default 2.5% move
  const [searchQuery, setSearchQuery] = useState("");
  const [dynamicBetas, setDynamicBetas] = useState<Record<string, number>>({});
  const [selectedAssets, setSelectedAssets] = useState<string[]>(
    SUPPORTED_ASSETS.slice(0, 6).map(a => a.symbol)
  );

  const filteredAssets = useMemo(() => {
    return SUPPORTED_ASSETS.filter(asset => 
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const toggleAsset = (symbol: string) => {
    setSelectedAssets(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol) 
        : [...prev, symbol]
    );
  };

  React.useEffect(() => {
    const updateBetas = async () => {
      const newBetas: Record<string, number> = { ...dynamicBetas };
      let changed = false;
      for (const symbol of selectedAssets) {
        if (!newBetas[symbol]) {
          const beta = await calculateDynamicBeta(symbol);
          newBetas[symbol] = beta;
          changed = true;
        }
      }
      if (changed) setDynamicBetas(newBetas);
    };
    updateBetas();
  }, [selectedAssets]);

  const results = useMemo(() => {
    return SUPPORTED_ASSETS
      .filter(a => selectedAssets.includes(a.symbol))
      .map(asset => {
        const beta = dynamicBetas[asset.symbol] || asset.beta;
        const estimatedMove = btcMove * beta;
        const impact = getImpactLevel(asset);
        // New logic: Profit Potential = expectedMoveAsset - btcMove
        const profitPotential = Math.abs(estimatedMove) - Math.abs(btcMove);
        const recommendation = profitPotential > 1.5 
          ? "MEJOR QUE BTC" 
          : profitPotential > 0 
            ? "SIMILAR A BTC" 
            : "PEOR QUE BTC";
            
        return {
          ...asset,
          beta,
          estimatedMove,
          impact,
          profitPotential,
          recommendation
        };
      })
      .sort((a, b) => b.profitPotential - a.profitPotential);
  }, [btcMove, selectedAssets, dynamicBetas]);

  const topOpportunities = useMemo(() => {
    return results.filter(r => r.profitPotential > 0).slice(0, 3);
  }, [results]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-32 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-on-surface">Comparativa BTC vs Cripto</h1>
            </div>
            <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest max-w-2xl">
              Detecta qué altcoins pueden generar MÁS beneficio que BTC aprovechando la dominancia y volatilidad relativa.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/10">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Motor de Decisión v3.0</span>
            </div>
          </div>
        </div>

        {/* Explanation Block */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-container-high/40 backdrop-blur-md border border-primary/20 rounded-3xl p-8 flex flex-col md:flex-row items-start gap-8"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center flex-shrink-0 border border-primary/20 shadow-2xl shadow-primary/10">
            <Info className="w-8 h-8 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="text-[12px] font-black uppercase tracking-[0.2em] text-primary">Estrategia de Maximización de Beneficios</h3>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-5xl">
              Esta herramienta analiza cómo reaccionan las altcoins frente a Bitcoin para identificar oportunidades donde el movimiento sea mayor y potencialmente más rentable. 
              Dado que Bitcoin domina el mercado: 
              <span className="text-on-surface font-bold"> cuando BTC sube, las altcoins con alta sensibilidad suelen subir más</span>, amplificando tus ganancias. 
              El objetivo es detectar qué activos tienen mayor sensibilidad para maximizar beneficios frente a una posición simple en BTC.
            </p>
          </div>
        </motion.div>

        {/* Top Opportunities Summary */}
        {topOpportunities.length > 0 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topOpportunities.map((opp, idx) => (
                <div key={opp.symbol} className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between group hover:bg-primary/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-[10px] font-black text-primary">
                      #{idx + 1}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-on-surface uppercase">{opp.symbol}</p>
                      <p className="text-[8px] font-bold text-primary uppercase tracking-widest">POTENCIAL: +{opp.profitPotential.toFixed(1)}% vs BTC</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-primary text-on-primary text-[8px] font-black rounded-full uppercase tracking-widest">
                    MEJOR QUE BTC
                  </div>
                </div>
              ))}
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 bg-surface-container-high/60 rounded-3xl border border-primary/30 backdrop-blur-xl relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-black text-primary uppercase tracking-widest">Recomendación Estratégica del Sistema</h3>
              </div>
              <p className="text-sm text-on-surface leading-relaxed font-medium">
                Basado en la secuencia actual de Bitcoin ({btcMove > 0 ? "Tendencia Alcista" : "Tendencia Bajista"}), el sistema recomienda priorizar posiciones en <span className="text-primary font-black">{topOpportunities.map(o => o.symbol).join(", ")}</span>. 
                Estos activos presentan la mayor rentabilidad esperada debido a su volatilidad relativa y correlación optimizada. 
                <span className="block mt-2 text-on-surface-variant italic opacity-80">
                  *Estrategia: Ejecutar entradas escalonadas en zonas de retroceso para maximizar el ratio riesgo/beneficio frente a una posición estática en BTC.
                </span>
              </p>
            </motion.div>
          </div>
        )}

        <div className="trading-grid">
          
          {/* Left Column: Controls */}
          <div className="md:col-span-4 space-y-6">
            
            {/* BTC Scenario Card */}
            <section className="trading-card space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="section-title flex items-center gap-2 mb-0">
                  <TrendingUp className="w-4 h-4" /> Escenario BTC
                </h3>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                  btcMove >= 0 ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                )}>
                  {btcMove >= 0 ? "Bullish" : "Bearish"}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Movimiento Esperado</span>
                  <span className={cn(
                    "text-3xl font-black tracking-tighter",
                    btcMove >= 0 ? "text-primary" : "text-secondary"
                  )}>
                    {btcMove > 0 ? "+" : ""}{btcMove.toFixed(1)}%
                  </span>
                </div>

                <div className="relative pt-6 pb-2">
                  <input 
                    type="range" 
                    min="-10" 
                    max="10" 
                    step="0.1"
                    value={btcMove}
                    onChange={(e) => setBtcMove(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-surface-container-highest rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between mt-4 text-[8px] font-black text-on-surface-variant uppercase tracking-widest">
                    <span>-10%</span>
                    <span>0%</span>
                    <span>+10%</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[-5, -2, 2, 5].map(val => (
                    <button 
                      key={val}
                      onClick={() => setBtcMove(val)}
                      className={cn(
                        "py-2 rounded-xl text-[10px] font-black transition-all border",
                        btcMove === val 
                          ? "bg-primary text-on-primary border-primary" 
                          : "bg-surface-container-high border-outline-variant/5 hover:border-primary/20"
                      )}
                    >
                      {val > 0 ? "+" : ""}{val}%
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Asset Selection Card */}
            <section className="trading-card space-y-6">
              <h3 className="section-title flex items-center gap-2 mb-0">
                <Filter className="w-4 h-4" /> Seleccionar Activos
              </h3>

              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="BUSCAR ACTIVO..."
                  className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary transition-all"
                />
              </div>

              <div className="max-h-64 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {filteredAssets.map(asset => (
                  <button 
                    key={asset.symbol}
                    onClick={() => toggleAsset(asset.symbol)}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-xl transition-all border",
                      selectedAssets.includes(asset.symbol) 
                        ? "bg-primary/10 border-primary/30 text-primary" 
                        : "bg-surface-container-high border-outline-variant/5 text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-container-highest rounded-lg flex items-center justify-center font-black text-[10px]">
                        {asset.symbol[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black leading-none mb-1">{asset.symbol}</p>
                        <p className="text-[8px] font-bold opacity-50 uppercase">{asset.name}</p>
                      </div>
                    </div>
                    {selectedAssets.includes(asset.symbol) && <Zap className="w-3 h-3 fill-primary" />}
                  </button>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column: Results */}
          <div className="md:col-span-8 space-y-6">
            
            <div className="flex items-center justify-between px-4">
              <h3 className="section-title flex items-center gap-2 mb-0">
                <Activity className="w-4 h-4" /> Resultados Estimados
              </h3>
              <div className="flex items-center gap-2 text-[8px] font-black text-on-surface-variant uppercase tracking-widest">
                <RefreshCw className="w-3 h-3 animate-spin-slow" /> Actualización en tiempo real
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {results.map((asset, idx) => (
                  <motion.div 
                    key={asset.symbol}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className="trading-card group"
                  >
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-container-high rounded-2xl flex items-center justify-center border border-outline-variant/10 shadow-lg group-hover:border-primary/30 transition-colors">
                          <span className="text-sm font-black text-primary">{asset.symbol}</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-on-surface tracking-tighter leading-none mb-1">{asset.name}</h4>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest",
                            asset.recommendation === "MEJOR QUE BTC" ? "bg-primary/20 text-primary" : 
                            asset.recommendation === "SIMILAR A BTC" ? "bg-amber-500/10 text-amber-500" : "bg-secondary/10 text-secondary"
                          )}>
                            {asset.recommendation}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Potencial vs BTC</p>
                        <div className={cn(
                          "text-xl font-black tracking-tighter flex items-center justify-end gap-1",
                          asset.profitPotential >= 0 ? "text-primary" : "text-secondary"
                        )}>
                          {asset.profitPotential >= 0 ? "+" : ""}{asset.profitPotential.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Movimiento Estimado</span>
                        <span className={cn("text-sm font-black", asset.estimatedMove >= 0 ? "text-primary" : "text-secondary")}>
                          {asset.estimatedMove > 0 ? "+" : ""}{asset.estimatedMove.toFixed(2)}%
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/10">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                          <TrendingUp className="w-2 h-2" /> Correlación
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${asset.correlation * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-on-surface">{(asset.correlation * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-1">
                          <Activity className="w-2 h-2" /> Volatilidad Rel.
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-surface-container-highest rounded-full overflow-hidden">
                            <div className="h-full bg-secondary" style={{ width: `${(asset.beta / 5) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-on-surface">{asset.beta.toFixed(2)}x</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {results.length === 0 && (
              <div className="h-96 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                <BarChart3 className="w-16 h-16" />
                <p className="text-[10px] font-black uppercase tracking-widest">Selecciona activos para ver la comparativa</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BTCComparison;
