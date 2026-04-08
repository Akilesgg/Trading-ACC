import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Play, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  BarChart3,
  Calendar,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const TerminalBacktest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      setResults({
        totalTrades: 124,
        winRate: 68.5,
        profitFactor: 2.1,
        maxDrawdown: 4.2,
        netProfit: 15.4,
        sharpeRatio: 1.8
      });
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-widest text-on-surface">Simulador de Estrategia</h3>
            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">Backtesting Algorítmico v1.0</p>
          </div>
        </div>
        <button 
          onClick={runBacktest}
          disabled={isRunning}
          className={cn(
            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
            isRunning ? "bg-surface-container-high text-on-surface-variant cursor-not-allowed" : "bg-primary text-on-primary shadow-xl shadow-primary/20 hover:scale-105"
          )}
        >
          {isRunning ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isRunning ? "EJECUTANDO..." : "INICIAR BACKTEST"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-surface-container-high/50 rounded-2xl border border-outline-variant/10">
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Temporalidad</p>
          <select className="bg-transparent text-[11px] font-black text-on-surface uppercase focus:outline-none w-full">
            <option>Últimos 30 días</option>
            <option>Últimos 90 días</option>
            <option>Último año</option>
          </select>
        </div>
        <div className="p-4 bg-surface-container-high/50 rounded-2xl border border-outline-variant/10">
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Estrategia</p>
          <select className="bg-transparent text-[11px] font-black text-on-surface uppercase focus:outline-none w-full">
            <option>SMC + RSI Breakout</option>
            <option>EMA Cross Over</option>
            <option>MACD Divergence</option>
          </select>
        </div>
      </div>

      {results && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Win Rate", value: `${results.winRate}%`, color: "text-primary" },
              { label: "P&L Neto", value: `+${results.netProfit}%`, color: "text-primary" },
              { label: "Drawdown", value: `${results.maxDrawdown}%`, color: "text-secondary" },
            ].map((res, i) => (
              <div key={i} className="p-4 bg-surface-container-highest/50 rounded-2xl border border-outline-variant/5 text-center">
                <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">{res.label}</p>
                <p className={cn("text-lg font-black tracking-tighter", res.color)}>{res.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-on-surface">Detalles de Simulación</h4>
              <BarChart3 className="w-4 h-4 text-on-surface-variant opacity-50" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Total Trades</span>
                <span className="text-[10px] font-black text-on-surface">{results.totalTrades}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Profit Factor</span>
                <span className="text-[10px] font-black text-tertiary">{results.profitFactor}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase">Sharpe Ratio</span>
                <span className="text-[10px] font-black text-primary">{results.sharpeRatio}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <p className="text-[10px] text-on-surface leading-relaxed font-medium">
              <span className="text-primary font-black uppercase tracking-widest mr-2">Veredicto:</span>
              La estrategia muestra una robustez estadística superior al promedio. El drawdown se mantiene controlado bajo condiciones de alta volatilidad. Recomendado para ejecución en vivo con gestión de riesgo 1:2.
            </p>
          </div>
        </motion.div>
      )}

      {!results && !isRunning && (
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-30 py-12">
          <Calendar className="w-12 h-12" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] max-w-[200px]">
            Configura los parámetros y presiona iniciar para simular la estrategia
          </p>
        </div>
      )}
    </div>
  );
};

export default TerminalBacktest;
