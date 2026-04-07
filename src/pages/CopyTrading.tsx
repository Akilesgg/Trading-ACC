import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";
import { 
  Target, 
  Zap, 
  Users, 
  Waves, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Activity,
  BarChart3,
  ExternalLink,
  Copy,
  Info,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  fetchWhaleMovements, 
  fetchTopTraders, 
  fetchLargeTransactions,
  fetchAssetFundamentals,
  AssetFundamental
} from "@/services/cryptoService";
import FundamentalModal from "@/components/common/FundamentalModal";

const CopyTrading: React.FC = () => {
  const navigate = useNavigate();
  const [whaleMovements, setWhaleMovements] = useState<any[]>([]);
  const [topTraders, setTopTraders] = useState<any[]>([]);
  const [largeTransactions, setLargeTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFundamental, setSelectedFundamental] = useState<AssetFundamental | null>(null);

  const showFundamentals = async (symbol: string) => {
    const data = await fetchAssetFundamentals(symbol);
    setSelectedFundamental(data);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [whales, traders, txs] = await Promise.all([
          fetchWhaleMovements(),
          fetchTopTraders(),
          fetchLargeTransactions()
        ]);
        setWhaleMovements(whales);
        setTopTraders(traders);
        setLargeTransactions(txs);
      } catch (error) {
        console.error("Error loading copy trading data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/5 rotate-3">
              <Target className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-on-surface">Copy Trading <span className="text-primary">PRO</span></h1>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] opacity-70">Inteligencia de Ballenas & Top Traders en Tiempo Real</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-surface-container-high px-8 py-4 rounded-[2rem] border border-outline-variant/10 flex items-center gap-6 shadow-2xl backdrop-blur-xl">
            <div className="text-right">
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Estado del Sistema</p>
              <p className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Sincronizado</p>
            </div>
            <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_10px_rgba(0,255,163,0.8)]"></div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Whale Movements */}
        <div className="xl:col-span-2 space-y-10">
          <section className="trading-card p-0 overflow-hidden shadow-2xl border-primary/20">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-8 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/5">
                  <Waves className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-[0.1em] text-primary">Movimientos de Ballenas</h2>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Grandes órdenes detectadas en exchanges principales</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-2 bg-surface-container rounded-full border border-outline-variant/10 shadow-inner">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black text-on-surface uppercase tracking-widest">Alta Volatilidad</span>
              </div>
            </div>

            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {whaleMovements.map((whale, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="bg-surface-container-high/40 p-6 rounded-[2rem] border border-outline-variant/5 hover:border-primary/30 transition-all group relative overflow-hidden shadow-lg"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-surface-container rounded-2xl flex items-center justify-center shadow-inner border border-outline-variant/5 group-hover:scale-110 transition-transform">
                          <img 
                            src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} 
                            className="w-9 h-9 drop-shadow-md" 
                            alt=""
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-on-surface tracking-tight">{whale.symbol}</h3>
                          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">{whale.exchange} • {whale.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-[9px] font-black px-3 py-1 rounded-full inline-block mb-2 uppercase tracking-widest",
                          whale.type === "BUY" ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary/10 text-secondary border border-secondary/20"
                        )}>
                          {whale.type} ORDER
                        </div>
                        <p className="text-2xl font-black text-on-surface tracking-tighter">{whale.amount}</p>
                      </div>
                    </div>
                    
                    <div className="mt-5 pt-5 border-t border-outline-variant/10 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Impacto:</span>
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md",
                          whale.impact === "Alta" ? "text-primary bg-primary/10" : "text-on-surface-variant bg-surface-container"
                        )}>
                          {whale.impact}
                        </span>
                      </div>
                      <button className="flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest hover:underline group/tx">
                        Ver TX <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>
                    
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="trading-card p-10 space-y-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/5">
                  <ArrowRightLeft className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-[0.1em] text-on-surface">Grandes Transacciones On-Chain</h2>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Monitoreo de flujos institucionales y depósitos en exchanges</p>
                </div>
              </div>
              <button className="p-3 bg-surface-container-high hover:bg-surface-container rounded-xl border border-outline-variant/10 transition-all shadow-lg">
                <Filter className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="pb-6 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Activo</th>
                    <th className="pb-6 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Tipo de Flujo</th>
                    <th className="pb-6 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Cantidad</th>
                    <th className="pb-6 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60">Dirección / Wallet</th>
                    <th className="pb-6 text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] opacity-60 text-right">Tiempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {largeTransactions.map((tx, i) => (
                    <tr key={i} className="group hover:bg-primary/5 transition-all cursor-pointer">
                      <td className="py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center border border-outline-variant/5 shadow-inner group-hover:scale-110 transition-transform">
                            <img 
                              src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${tx.symbol.replace("USDT", "").toLowerCase()}.png`} 
                              className="w-6 h-6" 
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-sm font-black text-on-surface tracking-tight">{tx.symbol}</span>
                        </div>
                      </td>
                      <td className="py-6">
                        <span className={cn(
                          "text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest border",
                          tx.type === "Acumulación" ? "bg-primary/10 text-primary border-primary/20" : 
                          tx.type === "Depósito" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-secondary/10 text-secondary border-secondary/20"
                        )}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-6 font-black text-sm text-on-surface tracking-tighter">{tx.amount}</td>
                      <td className="py-6">
                        <span className="text-xs font-mono text-on-surface-variant opacity-60 group-hover:opacity-100 transition-opacity">{tx.address}</span>
                      </td>
                      <td className="py-6 text-right text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">{tx.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Top Traders & Recommendations */}
        <div className="space-y-10">
          <section className="trading-card p-0 overflow-hidden shadow-2xl border-primary/20">
            <div className="bg-gradient-to-r from-primary/10 to-transparent p-8 border-b border-outline-variant/10 flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/5">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-[0.1em] text-primary">Top Traders</h2>
                  <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Líderes de rentabilidad en tiempo real</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              {topTraders.map((trader, i) => (
                <div key={i} className="bg-surface-container-high/40 p-6 rounded-[2rem] border border-outline-variant/5 hover:border-primary/30 transition-all group shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-surface-container rounded-full flex items-center justify-center border border-outline-variant/10 shadow-inner group-hover:scale-105 transition-transform">
                        <Users className="w-6 h-6 text-on-surface-variant opacity-50" />
                      </div>
                      <div>
                        <h3 className="text-base font-black text-on-surface tracking-tight">{trader.name}</h3>
                        <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">{trader.exchange} • {trader.followers} Seg</p>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-2xl border-2 border-primary/30 flex items-center justify-center text-[11px] font-black text-primary shadow-xl shadow-primary/10 bg-primary/5">
                      {trader.score}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/5 shadow-inner">
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Profit Reciente</p>
                      <p className="text-base font-black text-primary tracking-tighter">{trader.profit}</p>
                    </div>
                    <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant/5 shadow-inner">
                      <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Posición Actual</p>
                      <p className={cn(
                        "text-base font-black uppercase tracking-tighter",
                        trader.trade.includes("LONG") ? "text-primary" : "text-secondary"
                      )}>
                        {trader.trade}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => navigate("/terminal")}
                      className="py-4 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-all active:scale-95 shadow-xl shadow-primary/20"
                    >
                      <Activity className="w-4 h-4" /> Analizar
                    </button>
                    <button 
                      onClick={() => showFundamentals(trader.trade.split(" ")[1])}
                      className="py-4 bg-surface-container text-on-surface rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 hover:bg-surface-container-high transition-all active:scale-95 border border-outline-variant/10 shadow-lg"
                    >
                      <Info className="w-4 h-4" /> Info
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* AI Recommendation Card */}
          <section className="bg-gradient-to-br from-primary to-primary-dim rounded-[2.5rem] p-10 text-on-primary space-y-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-white/20 transition-all duration-1000"></div>
            
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30 shadow-xl">
                  <Zap className="w-7 h-7 text-white drop-shadow-md" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-[0.2em]">Recomendación ACC PRO</h3>
              </div>
              
              <p className="text-base font-medium leading-relaxed opacity-90 italic tracking-tight">
                "El flujo institucional actual muestra una fuerte acumulación en activos de alta capitalización. Las ballenas están posicionándose para una expansión de volatilidad. Se recomienda seguir a traders con sesgo alcista en BTC y SOL."
              </p>

              <div className="pt-6 flex items-center gap-6">
                <div className="flex-1 bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 shadow-inner">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-2">Confianza IA</p>
                  <p className="text-3xl font-black tracking-tighter">94%</p>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-xl p-5 rounded-[2rem] border border-white/10 shadow-inner">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-2">Riesgo Sugerido</p>
                  <p className="text-3xl font-black tracking-tighter">Bajo</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
          </section>

          {/* Security & Verification */}
          <section className="trading-card p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface">Verificación de Seguridad</h3>
            </div>
            <p className="text-[11px] text-on-surface-variant leading-relaxed font-medium opacity-70">
              Todos los movimientos de ballenas y transacciones on-chain son verificados a través de múltiples nodos y APIs de exchanges para garantizar la precisión de los datos.
            </p>
            <div className="flex items-center gap-6 pt-4 border-t border-outline-variant/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,163,0.5)]"></div>
                <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Nodos Activos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_8px_rgba(0,255,163,0.5)]"></div>
                <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">SSL Encrypted</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CopyTrading;
