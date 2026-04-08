import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { History, TrendingUp, TrendingDown, Calendar, Filter, Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { db, collection, query, orderBy, onSnapshot } from "../services/firebase";
import { useAuth } from "../AuthProvider";

const SignalHistoryPage = () => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "signals_history"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSignals(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = {
    winRate: 72.5,
    profitFactor: 2.4,
    totalTrades: signals.length,
    avgPnL: 4.2
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pt-32 pb-20 px-8 max-w-7xl mx-auto space-y-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-on-surface mb-2">Historial de Señales</h1>
          <p className="text-primary font-black text-[11px] uppercase tracking-[0.3em] opacity-70">Rendimiento histórico y auditoría de resultados</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="BUSCAR PAR..."
              className="bg-surface-container-high border border-outline-variant/10 rounded-2xl pl-12 pr-6 py-3.5 text-[11px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all w-64 shadow-inner"
            />
          </div>
          <button className="p-3.5 bg-surface-container-high rounded-2xl border border-outline-variant/10 hover:border-primary/30 text-on-surface-variant hover:text-primary transition-all">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="trading-card p-6 space-y-2">
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Win Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary">{stats.winRate}%</span>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="trading-card p-6 space-y-2">
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Profit Factor</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-on-surface">{stats.profitFactor}</span>
          </div>
        </div>
        <div className="trading-card p-6 space-y-2">
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Total Trades</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-on-surface">{stats.totalTrades}</span>
          </div>
        </div>
        <div className="trading-card p-6 space-y-2">
          <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">PnL Promedio</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-primary">+{stats.avgPnL}%</span>
          </div>
        </div>
      </div>

      <div className="trading-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high border-b border-outline-variant/10">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Activo</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Entrada</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Salida</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Resultado</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {signals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4 opacity-30">
                    <History className="w-12 h-12" />
                    <p className="text-[11px] font-black uppercase tracking-widest">No hay historial disponible</p>
                  </div>
                </td>
              </tr>
            ) : (
              signals.map((s) => (
                <tr key={s.id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-container-high rounded-lg flex items-center justify-center border border-outline-variant/10">
                        <span className="text-[10px] font-black">{s.symbol.substring(0, 3)}</span>
                      </div>
                      <span className="text-sm font-black text-on-surface">{s.symbol}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      s.type === "LONG" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                    )}>
                      {s.type}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-sm font-black text-on-surface-variant">${s.entry.toLocaleString()}</td>
                  <td className="px-8 py-6 text-sm font-black text-on-surface-variant">${s.exit.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <div className={cn(
                      "flex items-center gap-2 font-black text-sm",
                      s.pnl > 0 ? "text-primary" : "text-secondary"
                    )}>
                      {s.pnl > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {s.pnl > 0 ? "+" : ""}{s.pnl}%
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] font-black text-on-surface-variant opacity-50">
                    {new Date(s.timestamp).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default SignalHistoryPage;
