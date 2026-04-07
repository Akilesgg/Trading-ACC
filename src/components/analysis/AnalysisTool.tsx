import React, { useState, useRef, useEffect } from "react";
import { Brain, ChevronDown, Search, X, Info } from "lucide-react";
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
  onShowFundamentals?: (symbol: string) => void;
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
  onLoadLayout,
  onShowFundamentals
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredAssets = allAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAsset = allAssets.find(a => a.id === selectedSymbol);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="trading-card p-8 space-y-8">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
          <div className="space-y-2 w-full md:w-72" ref={dropdownRef}>
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Activo de Referencia</label>
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="w-full bg-surface-container-high border border-outline-variant/10 rounded-2xl py-4 pl-5 pr-12 text-left focus:outline-none focus:border-primary transition-all text-[10px] font-black uppercase tracking-widest text-on-surface flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  {selectedAsset && (
                    <img src={selectedAsset.image} alt="" className="w-5 h-5 rounded-full" referrerPolicy="no-referrer" />
                  )}
                  <span className="truncate">
                    {selectedAsset ? `${selectedAsset.name} (USDT)` : "Seleccionar Activo"}
                  </span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform group-hover:text-primary", isSearchOpen && "rotate-180")} />
              </button>
              
              <button 
                onClick={() => onShowFundamentals?.(selectedSymbol)}
                className="absolute -right-14 top-1/2 -translate-y-1/2 p-3 bg-surface-container-high border border-outline-variant/10 rounded-2xl hover:border-primary/30 hover:text-primary transition-all text-on-surface-variant"
                title="Historial Fundamental"
              >
                <Info className="w-5 h-5" />
              </button>

              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-surface-container-high border border-outline-variant/10 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200 backdrop-blur-xl">
                  <div className="p-3 border-b border-outline-variant/10 flex items-center gap-3 bg-surface-container-highest/50">
                    <Search className="w-4 h-4 text-on-surface-variant" />
                    <input 
                      autoFocus
                      type="text"
                      placeholder="BUSCAR ACTIVO..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest placeholder:text-on-surface-variant/30 text-on-surface"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")}>
                        <X className="w-4 h-4 text-on-surface-variant hover:text-primary" />
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto p-2 custom-scrollbar">
                    {filteredAssets.length > 0 ? (
                      filteredAssets.map(asset => (
                        <button
                          key={asset.id}
                          onClick={() => {
                            setSelectedSymbol(asset.id);
                            setIsSearchOpen(false);
                            setSearchQuery("");
                          }}
                          className={cn(
                            "w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-4 mb-1",
                            selectedSymbol === asset.id ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "hover:bg-primary/10 text-on-surface"
                          )}
                        >
                          <img 
                            src={asset.image} 
                            alt={asset.name} 
                            className="w-6 h-6 rounded-full"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col">
                            <span className="leading-none mb-0.5">{asset.name}</span>
                            <span className="text-[8px] opacity-50 tracking-tighter">{asset.id}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-6 text-center text-[10px] text-on-surface-variant font-black uppercase tracking-widest italic">
                        No se encontraron activos
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 w-full md:w-40">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Temporalidad</label>
            <div className="relative">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/10 rounded-2xl py-4 pl-5 pr-12 appearance-none focus:outline-none focus:border-primary transition-all text-[10px] font-black uppercase tracking-widest text-on-surface cursor-pointer"
              >
                {["1m", "5m", "15m", "1h", "4h", "1d"].map(tf => (
                  <option key={tf} value={tf} className="bg-surface-container-high">{tf.toUpperCase()}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2 w-full md:w-auto flex-1">
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Modelo de Ejecución</label>
            <div className="flex gap-3">
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
                    "flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border",
                    selectedMode === mode.id 
                      ? "bg-primary text-on-primary border-primary shadow-xl shadow-primary/20 scale-[1.02]" 
                      : "bg-surface-container-high text-on-surface-variant border-outline-variant/10 hover:border-primary/30"
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
            "w-full lg:w-auto px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 transition-all shadow-2xl",
            analyzing ? "bg-surface-container-highest text-on-surface-variant cursor-not-allowed" : "btn-primary shadow-primary/30 hover:scale-105 active:scale-95"
          )}
        >
          {analyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-on-surface-variant border-t-transparent rounded-full animate-spin"></div>
              Procesando...
            </>
          ) : (
            <>
              <Brain className="w-6 h-6" />
              Ejecutar Análisis Profundo
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AnalysisTool;
