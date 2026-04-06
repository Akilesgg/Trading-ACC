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
  CryptoAsset 
} from "../core/correlationEngine";

const BTCComparison: React.FC = () => {
  const [btcMove, setBtcMove] = useState<number>(2.5); // Default 2.5% move
  const [searchQuery, setSearchQuery] = useState("");
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

  const results = useMemo(() => {
    return SUPPORTED_ASSETS
      .filter(a => selectedAssets.includes(a.symbol))
      .map(asset => {
        const estimatedMove = estimateAssetMove(btcMove, asset);
        const impact = getImpactLevel(asset);
        return {
          ...asset,
          estimatedMove,
          impact
        };
      })
      .sort((a, b) => Math.abs(b.estimatedMove) - Math.abs(a.estimatedMove));
  }, [btcMove, selectedAssets]);

  return (
    <div className="min-h-screen bg-background pt-24 pb-32 px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        
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
              Analiza el impacto de los movimientos de Bitcoin en el mercado de altcoins mediante modelos de correlación y volatilidad relativa.
            </p>
          </div>
          
          <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-2xl border border-outline-variant/10">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Motor Cuántico v2.0</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* BTC Scenario Card */}
            <section className="glass-card p-8 rounded-[2rem] space-y-8 border border-outline-variant/10">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Escenario BTC
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
                    "text-2xl font-black tracking-tighter",
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
                      className="py-2 bg-surface-container-high hover:bg-primary/10 rounded-xl text-[10px] font-black transition-all border border-outline-variant/5 hover:border-primary/20"
                    >
                      {val > 0 ? "+" : ""}{val}%
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Asset Selection Card */}
            <section className="glass-card p-8 rounded-[2rem] space-y-6 border border-outline-variant/10">
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> Seleccionar Activos
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
          <div className="lg:col-span-8 space-y-6">
            
            <div className="flex items-center justify-between px-4">
              <h3 className="text-sm font-black uppercase tracking-widest text-on-surface flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" /> Resultados Estimados
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
                    className="glass-card p-6 rounded-[2rem] border border-outline-variant/10 hover:border-primary/30 transition-all group"
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
                            asset.impact === "HIGH" ? "bg-secondary/10 text-secondary" : 
                            asset.impact === "MEDIUM" ? "bg-amber-500/10 text-amber-500" : "bg-primary/10 text-primary"
                          )}>
                            {asset.impact} IMPACT
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Movimiento Estimado</p>
                        <div className={cn(
                          "text-xl font-black tracking-tighter flex items-center justify-end gap-1",
                          asset.estimatedMove >= 0 ? "text-primary" : "text-secondary"
                        )}>
                          {asset.estimatedMove >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                          {asset.estimatedMove > 0 ? "+" : ""}{asset.estimatedMove.toFixed(2)}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-outline-variant/10">
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
                            <div className="h-full bg-secondary" style={{ width: `${(asset.relativeVolatility / 5) * 100}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-on-surface">{asset.relativeVolatility.toFixed(2)}x</span>
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
