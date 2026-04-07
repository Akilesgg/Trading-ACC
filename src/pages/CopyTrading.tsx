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
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/20 rotate-3">
              <Target className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-headline font-black uppercase tracking-tighter">Copy Trading PRO</h1>
              <p className="text-xs font-bold text-orange-500 uppercase tracking-widest">Inteligencia de Ballenas & Top Traders en Tiempo Real</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-surface-container-low px-6 py-3 rounded-2xl border border-outline-variant/10 flex items-center gap-4 shadow-xl">
            <div className="text-right">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">Estado del Sistema</p>
              <p className="text-xs font-black text-primary uppercase">Sincronizado</p>
            </div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Whale Movements */}
        <div className="xl:col-span-2 space-y-8">
          <section className="bg-[#0a0c10] border border-orange-500/30 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-6 border-b border-orange-500/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/30">
                  <Waves className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-orange-500">Movimientos de Ballenas</h2>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Grandes órdenes detectadas en exchanges principales</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full border border-outline-variant/10">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-xs font-black text-on-surface uppercase">Alta Volatilidad</span>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {whaleMovements.map((whale, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={i} 
                    className="bg-surface-container-low p-5 rounded-2xl border border-outline-variant/5 hover:border-orange-500/30 transition-all group relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-surface-container rounded-xl flex items-center justify-center shadow-inner">
                          <img 
                            src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} 
                            className="w-8 h-8 group-hover:scale-110 transition-transform" 
                            alt=""
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-on-surface">{whale.symbol}</h3>
                          <p className="text-[10px] font-bold text-on-surface-variant uppercase">{whale.exchange} • {whale.time}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "text-xs font-black px-3 py-1 rounded-full inline-block mb-1",
                          whale.type === "BUY" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                        )}>
                          {whale.type} ORDER
                        </div>
                        <p className="text-xl font-black text-on-surface">{whale.amount}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-outline-variant/5 flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-on-surface-variant uppercase">Impacto:</span>
                        <span className={cn(
                          "text-[10px] font-black uppercase",
                          whale.impact === "Alta" ? "text-orange-500" : "text-on-surface-variant"
                        )}>
                          {whale.impact}
                        </span>
                      </div>
                      <button className="flex items-center gap-2 text-[10px] font-black text-primary uppercase hover:underline">
                        Ver TX <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                    
                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/30">
                  <ArrowRightLeft className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-on-surface">Grandes Transacciones On-Chain</h2>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Monitoreo de flujos institucionales y depósitos en exchanges</p>
                </div>
              </div>
              <button className="p-2 hover:bg-surface-container rounded-lg transition-colors">
                <Filter className="w-5 h-5 text-on-surface-variant" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="pb-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Activo</th>
                    <th className="pb-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Tipo de Flujo</th>
                    <th className="pb-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Cantidad</th>
                    <th className="pb-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Dirección / Wallet</th>
                    <th className="pb-4 text-[10px] font-black text-on-surface-variant uppercase tracking-widest text-right">Tiempo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {largeTransactions.map((tx, i) => (
                    <tr key={i} className="group hover:bg-surface-container/30 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-surface-container rounded-lg flex items-center justify-center">
                            <img 
                              src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${tx.symbol.replace("USDT", "").toLowerCase()}.png`} 
                              className="w-5 h-5" 
                              alt=""
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <span className="text-sm font-black text-on-surface">{tx.symbol}</span>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-1 rounded-md uppercase",
                          tx.type === "Acumulación" ? "bg-orange-500/10 text-orange-500" : 
                          tx.type === "Depósito" ? "bg-yellow-500/10 text-yellow-500" : "bg-secondary/10 text-secondary"
                        )}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-sm text-on-surface">{tx.amount}</td>
                      <td className="py-4">
                        <span className="text-xs font-mono text-on-surface-variant">{tx.address}</span>
                      </td>
                      <td className="py-4 text-right text-[10px] font-bold text-on-surface-variant uppercase">{tx.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* Right Column: Top Traders & Recommendations */}
        <div className="space-y-8">
          <section className="bg-[#0a0c10] border border-primary/30 rounded-3xl overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-r from-primary/20 to-transparent p-6 border-b border-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/30">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase tracking-widest text-primary">Top Traders</h2>
                  <p className="text-[10px] font-bold text-on-surface-variant uppercase">Líderes de rentabilidad en tiempo real</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {topTraders.map((trader, i) => (
                <div key={i} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5 hover:border-primary/30 transition-all group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center border border-outline-variant/10">
                        <Users className="w-5 h-5 text-on-surface-variant" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-on-surface">{trader.name}</h3>
                        <p className="text-[10px] font-bold text-on-surface-variant uppercase">{trader.exchange} • {trader.followers} Seg</p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-orange-500/30 flex items-center justify-center text-[10px] font-black text-orange-500 shadow-lg shadow-orange-500/10">
                      {trader.score}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-surface-container p-3 rounded-xl">
                      <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Profit Reciente</p>
                      <p className="text-sm font-black text-primary">{trader.profit}</p>
                    </div>
                    <div className="bg-surface-container p-3 rounded-xl">
                      <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Posición Actual</p>
                      <p className={cn(
                        "text-sm font-black uppercase",
                        trader.trade.includes("LONG") ? "text-primary" : "text-secondary"
                      )}>
                        {trader.trade}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => navigate("/terminal")}
                      className="py-3 bg-primary text-black rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                    >
                      <Activity className="w-3 h-3" /> Analizar
                    </button>
                    <button 
                      onClick={() => showFundamentals(trader.trade.split(" ")[1])}
                      className="py-3 bg-surface-container text-on-surface rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors border border-outline-variant/10"
                    >
                      <Info className="w-3 h-3" /> Fundamentos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Fundamental Modal */}
          <FundamentalModal 
            fundamental={selectedFundamental} 
            onClose={() => setSelectedFundamental(null)} 
          />

          {/* AI Recommendation Card */}
          <section className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-3xl p-8 text-white space-y-6 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-black uppercase tracking-widest">Recomendación ACC PRO</h3>
              </div>
              
              <p className="text-sm font-medium leading-relaxed opacity-90 italic">
                "El flujo institucional actual muestra una fuerte acumulación en activos de alta capitalización. Las ballenas están posicionándose para una expansión de volatilidad. Se recomienda seguir a traders con sesgo alcista en BTC y SOL."
              </p>

              <div className="pt-4 flex items-center gap-4">
                <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <p className="text-[8px] font-bold uppercase opacity-70 mb-1">Confianza IA</p>
                  <p className="text-xl font-black">94%</p>
                </div>
                <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <p className="text-[8px] font-bold uppercase opacity-70 mb-1">Riesgo Sugerido</p>
                  <p className="text-xl font-black">Bajo</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          </section>

          {/* Security & Verification */}
          <section className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Verificación de Seguridad</h3>
            </div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Todos los movimientos de ballenas y transacciones on-chain son verificados a través de múltiples nodos y APIs de exchanges para garantizar la precisión de los datos.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span className="text-[8px] font-bold text-on-surface-variant uppercase">Nodos Activos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span className="text-[8px] font-bold text-on-surface-variant uppercase">SSL Encrypted</span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default CopyTrading;
