import React, { useState, useEffect } from "react";
import { useTerminalStore } from "../../store/useTerminalStore";
import { Zap, DollarSign, Percent, Target, Shield, ArrowRight, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

const TerminalTradePanel: React.FC = () => {
  const { signals, activeSymbol } = useTerminalStore();
  const [amount, setAmount] = useState<string>("1000");
  const [riskPercent, setRiskPercent] = useState<number>(1); // 1% risk
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);

  // Auto-select the first signal for the active symbol if available
  useEffect(() => {
    const activeSignal = signals.find(s => s.symbol === activeSymbol);
    if (activeSignal) {
      setSelectedSignalId(activeSignal.id);
    } else if (signals.length > 0) {
      setSelectedSignalId(signals[0].id);
    }
  }, [activeSymbol, signals]);

  const selectedSignal = signals.find(s => s.id === selectedSignalId);

  // Calculation Logic
  const calculateRecommendation = () => {
    if (!selectedSignal) return null;

    const entry = selectedSignal.entry;
    const sl = selectedSignal.stopLoss;
    const tp = selectedSignal.takeProfit[0];
    
    // Distance to SL in percentage
    const slDistancePercent = Math.abs((entry - sl) / entry) * 100;
    
    // Amount to risk in USD
    const riskAmount = (parseFloat(amount) || 0) * (riskPercent / 100);
    
    // Position size in USD (without leverage)
    // Formula: Position Size = Risk Amount / SL Distance %
    const positionSize = riskAmount / (slDistancePercent / 100);
    
    // Recommended Leverage
    // Leverage = Position Size / Account Balance (Amount)
    const recommendedLeverage = positionSize / (parseFloat(amount) || 1);

    return {
      leverage: Math.min(Math.round(recommendedLeverage), 125),
      positionSize,
      riskAmount,
      slDistance: slDistancePercent,
      rr: selectedSignal.riskReward
    };
  };

  const rec = calculateRecommendation();

  return (
    <div className="h-full flex flex-col p-4 bg-surface-container-low/30">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <Calculator className="w-3 h-3" /> CALCULADORA DE POSICIÓN
        </h4>
        <span className="text-[8px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-widest">
          PRO MODE
        </span>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-1">
        {/* Input Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Importe (USD)</label>
            <div className="relative group">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface-container-high/40 border border-outline-variant/10 rounded-lg py-2 pl-8 pr-3 text-xs font-black focus:outline-none focus:border-primary transition-all"
                placeholder="1000"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Riesgo (%)</label>
            <div className="relative group">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-on-surface-variant group-focus-within:text-primary transition-colors" />
              <input 
                type="number" 
                value={riskPercent}
                onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-surface-container-high/40 border border-outline-variant/10 rounded-lg py-2 pl-8 pr-3 text-xs font-black focus:outline-none focus:border-primary transition-all"
                placeholder="1"
              />
            </div>
          </div>
        </div>

        {/* Signal Selection */}
        <div className="space-y-1.5">
          <label className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Señal de Análisis</label>
          <select 
            value={selectedSignalId || ""}
            onChange={(e) => setSelectedSignalId(e.target.value)}
            className="w-full bg-surface-container-high/40 border border-outline-variant/10 rounded-lg py-2 px-3 text-xs font-black focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
          >
            {signals.map(s => (
              <option key={s.id} value={s.id} className="bg-surface-container-high text-on-surface">
                {s.type} {s.symbol} - Score: {s.score}%
              </option>
            ))}
            {signals.length === 0 && <option disabled>No hay señales activas</option>}
          </select>
          {selectedSignal && (
            <p className="text-[7px] font-black text-on-surface-variant/60 uppercase tracking-widest leading-relaxed px-1">
              {selectedSignal.explanation}
            </p>
          )}
        </div>

        {/* Recommendation Result */}
        {selectedSignal && rec ? (
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  selectedSignal.type === "LONG" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary"
                )}>
                  {selectedSignal.type === "LONG" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div>
                  <h5 className="text-[10px] font-black text-on-surface uppercase tracking-tight leading-none mb-1">Recomendación</h5>
                  <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Apalancamiento Óptimo</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-primary leading-none drop-shadow-[0_0_8px_rgba(0,255,163,0.3)]">{rec.leverage}x</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-surface-container-high/40 rounded-lg border border-outline-variant/5 group/item cursor-pointer hover:bg-primary/5 transition-colors">
                <p className="text-[7px] font-black text-on-surface-variant uppercase mb-1 flex justify-between items-center">
                  Entrada <ArrowRight className="w-2 h-2 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </p>
                <p className="text-[10px] font-black text-on-surface">${selectedSignal.entry.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-surface-container-high/40 rounded-lg border border-outline-variant/5 group/item cursor-pointer hover:bg-secondary/5 transition-colors">
                <p className="text-[7px] font-black text-on-surface-variant uppercase mb-1 flex justify-between items-center">
                  Stop Loss <ArrowRight className="w-2 h-2 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </p>
                <p className="text-[10px] font-black text-secondary">${selectedSignal.stopLoss.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-surface-container-high/40 rounded-lg border border-outline-variant/5 group/item cursor-pointer hover:bg-primary/5 transition-colors">
                <p className="text-[7px] font-black text-on-surface-variant uppercase mb-1 flex justify-between items-center">
                  Take Profit <ArrowRight className="w-2 h-2 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                </p>
                <p className="text-[10px] font-black text-primary">${selectedSignal.takeProfit[0].toLocaleString()}</p>
              </div>
              <div className="p-2 bg-surface-container-high/40 rounded-lg border border-outline-variant/5">
                <p className="text-[7px] font-black text-on-surface-variant uppercase mb-1">Riesgo en USD</p>
                <p className="text-[10px] font-black text-on-surface">${rec.riskAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Risk/Reward Visualizer */}
            <div className="space-y-1">
              <div className="flex justify-between text-[7px] font-black uppercase tracking-widest text-on-surface-variant">
                <span>Riesgo ({rec.slDistance.toFixed(2)}%)</span>
                <span>Recompensa ({(rec.slDistance * rec.rr).toFixed(2)}%)</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container-high rounded-full overflow-hidden flex">
                <div className="h-full bg-secondary/40" style={{ width: `${100 / (1 + rec.rr)}%` }} />
                <div className="h-full bg-primary/40" style={{ width: `${(100 * rec.rr) / (1 + rec.rr)}%` }} />
              </div>
            </div>

            <div className="pt-2 border-t border-primary/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Posición: ${rec.positionSize.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">R:R: {rec.rr}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-surface-container-high/20 border border-dashed border-outline-variant/20 rounded-xl p-8 flex flex-col items-center justify-center text-center opacity-40">
            <Zap className="w-8 h-8 mb-2" />
            <p className="text-[8px] font-black uppercase tracking-widest">Selecciona una señal para calcular</p>
          </div>
        )}

        <button className="w-full bg-primary text-on-primary py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 group">
          Ejecutar Orden <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default TerminalTradePanel;
