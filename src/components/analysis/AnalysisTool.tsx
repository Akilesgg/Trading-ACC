import React from "react";
import { Brain, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisToolProps {
  selectedSymbol: string;
  setSelectedSymbol: (symbol: string) => void;
  allAssets: any[];
  selectedTimeframe: string;
  setSelectedTimeframe: (tf: string) => void;
  selectedMode: string;
  setSelectedMode: (mode: any) => void;
  analyzing: boolean;
  onRunAnalysis: () => void;
  onResetLayout: () => void;
  onSaveLayout: (name: string) => void;
  savedLayouts: Record<string, string[]>;
  onLoadLayout: (name: string) => void;
}

const AnalysisTool: React.FC<AnalysisToolProps> = ({
  selectedSymbol,
  setSelectedSymbol,
  allAssets,
  selectedTimeframe,
  setSelectedTimeframe,
  selectedMode,
  setSelectedMode,
  analyzing,
  onRunAnalysis,
  onResetLayout,
  onSaveLayout,
  savedLayouts,
  onLoadLayout
}) => {
  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="space-y-1 w-full md:w-64">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Activo</label>
            <div className="relative">
              <select 
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-primary transition-all text-sm font-bold"
              >
                {allAssets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name} (USDT)</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1 w-full md:w-32">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Temporalidad</label>
            <div className="relative">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 pl-4 pr-10 appearance-none focus:outline-none focus:border-primary transition-all text-sm font-bold"
              >
                {["1m", "5m", "15m", "1h", "4h", "1d"].map(tf => (
                  <option key={tf} value={tf}>{tf.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1 w-full md:w-auto flex-1">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Estrategia</label>
            <div className="flex gap-2">
              {[
                { id: "Standard", label: "Estándar", tf: "1h" },
                { id: "Scalping", label: "Scalping", tf: "5m" },
                { id: "Swing", label: "Swing", tf: "4h" }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode.id as any);
                    setSelectedTimeframe(mode.tf);
                  }}
                  className={cn(
                    "flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border",
                    selectedMode === mode.id 
                      ? "bg-primary text-on-primary border-primary shadow-lg shadow-primary/20" 
                      : "bg-surface-container-high text-on-surface-variant border-outline-variant/20 hover:border-primary/50"
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          onClick={onRunAnalysis}
          disabled={analyzing}
          className={cn(
            "w-full lg:w-auto px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 transition-all shadow-2xl",
            analyzing ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed" : "bg-primary text-on-primary shadow-primary/20 hover:scale-105 active:scale-95"
          )}
        >
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin"></div>
              Procesando...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5" />
              Ejecutar Análisis Profundo
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AnalysisTool;
