import React, { useMemo } from "react";
import { motion } from "motion/react";
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter,
  Download,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminalStore } from "../store/useTerminalStore";
import { SignalStatus } from "../core/signals/types";

const SignalHistory: React.FC = () => {
  const { signals } = useTerminalStore();

  const stats = useMemo(() => {
    const closedSignals = signals.filter(s => 
      s.status === SignalStatus.TP1_HIT || 
      s.status === SignalStatus.TP2_HIT || 
      s.status === SignalStatus.TP3_HIT || 
      s.status === SignalStatus.SL_HIT
    );
    
    const wins = closedSignals.filter(s => 
      s.status === SignalStatus.TP1_HIT || 
      s.status === SignalStatus.TP2_HIT || 
      s.status === SignalStatus.TP3_HIT
    ).length;

    const total = signals.length;
    const winRate = closedSignals.length > 0 ? (wins / closedSignals.length) * 100 : 0;
    const totalProfit = signals.reduce((acc, s) => acc + (s.profit || 0), 0);

    return { total, wins, winRate, totalProfit };
  }, [signals]);

  return (
    <div className="relative min-h-screen">
      {/* Page Specific Background */}
      <div className="fixed inset-0 opacity-[0.05] grayscale contrast-125 pointer-events-none z-0">
        <img 
          src="https://images.unsplash.com/photo-1611974717482-4828c9fd6273?q=80&w=2070&auto=format&fit=crop" 
          alt="Signal History Background" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="relative z-10 min-h-screen bg-background/20 pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container-low/40 p-8 rounded-[2.5rem] border border-outline-variant/10 backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
            <History className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-on-surface leading-none">Historial de Señales</h1>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-2 opacity-50">Auditoría de Rendimiento Algorítmico</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-2 opacity-50">Win Rate Global</span>
            <span className="text-3xl font-black text-primary leading-none tracking-tighter">{stats.winRate.toFixed(1)}%</span>
          </div>
          <div className="h-10 w-px bg-outline-variant/20 mx-4" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-none mb-2 opacity-50">P&L Acumulado</span>
            <span className="text-3xl font-black text-primary leading-none tracking-tighter">+{stats.totalProfit.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Total Señales", value: stats.total, icon: Activity, color: "text-on-surface" },
          { label: "Trades Exitosos", value: stats.wins, icon: TrendingUp, color: "text-primary" },
          { label: "Drawdown Máx", value: "2.4%", icon: Shield, color: "text-secondary" },
          { label: "Factor de Beneficio", value: "3.2", icon: Zap, color: "text-tertiary" },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="trading-card p-6 flex items-center justify-between group hover:border-primary/30 transition-all"
          >
            <div>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mb-2 opacity-50">{stat.label}</p>
              <p className={cn("text-2xl font-black tracking-tighter", stat.color)}>{stat.value}</p>
            </div>
            <stat.icon className={cn("w-8 h-8 opacity-20 group-hover:opacity-100 transition-opacity", stat.color)} />
          </motion.div>
        ))}
      </div>

      {/* Signals Table */}
      <div className="trading-card p-0 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="FILTRAR POR SÍMBOLO..."
                className="bg-surface-container-high/50 border border-outline-variant/10 rounded-xl py-2.5 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all w-64"
              />
            </div>
            <button className="p-2.5 bg-surface-container-high/50 rounded-xl border border-outline-variant/10 text-on-surface-variant hover:text-primary transition-all">
              <Filter className="w-4 h-4" />
            </button>
          </div>
          <button className="flex items-center gap-2 px-6 py-2.5 bg-surface-container-high/50 rounded-xl border border-outline-variant/10 text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary transition-all">
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/30">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Fecha</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Activo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Entrada</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Resultado</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">P&L</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {signals.length > 0 ? signals.slice().reverse().map((signal, i) => (
                <tr key={signal.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-[11px] font-bold text-on-surface-variant">
                    {new Date(signal.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-surface-container-highest rounded-lg flex items-center justify-center font-black text-[10px]">
                        {signal.symbol[0]}
                      </div>
                      <span className="text-[11px] font-black uppercase tracking-tighter">{signal.symbol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                      signal.type === "LONG" ? "bg-primary/10 text-primary border border-primary/20" : "bg-secondary/10 text-secondary border border-secondary/20"
                    )}>
                      {signal.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[11px] font-black text-on-surface">
                    ${signal.entry.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                        signal.status.includes("TP") ? "bg-primary shadow-primary/50" : 
                        signal.status === SignalStatus.SL_HIT ? "bg-secondary shadow-secondary/50" : "bg-on-surface-variant/30"
                      )} />
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        signal.status.includes("TP") ? "text-primary" : 
                        signal.status === SignalStatus.SL_HIT ? "text-secondary" : "text-on-surface-variant"
                      )}>
                        {signal.status.replace("_", " ")}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "flex items-center gap-1 font-black text-[11px]",
                      (signal.profit || 0) >= 0 ? "text-primary" : "text-secondary"
                    )}>
                      {(signal.profit || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {(signal.profit || 0) >= 0 ? "+" : ""}{(signal.profit || 0).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${signal.score}%` }} />
                      </div>
                      <span className="text-[10px] font-black text-on-surface-variant">{signal.score}%</span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <Activity className="w-12 h-12" />
                      <p className="text-[11px] font-black uppercase tracking-[0.3em]">No hay señales registradas en el historial</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SignalHistory;
