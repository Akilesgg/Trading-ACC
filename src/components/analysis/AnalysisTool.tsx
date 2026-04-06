import React, { useState, useRef, useEffect } from "react";
import { Brain, ChevronDown, Search, X } from "lucide-react";
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
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 shadow-xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="space-y-1 w-full md:w-64" ref={dropdownRef}>
            <label className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Activo</label>
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 pl-4 pr-10 text-left focus:outline-none focus:border-primary transition-all text-sm font-bold flex items-center justify-between"
              >
                <span className="truncate">
                  {selectedAsset ? `${selectedAsset.name} (USDT)` : "Seleccionar Activo"}
                </span>
                <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform", isSearchOpen && "rotate-180")} />
              </button>

              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in duration-200">
                  <div className="p-2 border-b border-outline-variant/10 flex items-center gap-2">
                    <Search className="w-4 h-4 text-on-surface-variant" />
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Buscar activo..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-on-surface-variant/50"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")}>
                        <X className="w-4 h-4 text-on-surface-variant" />
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
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
                            "w-full text-left px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-3",
                            selectedSymbol === asset.id ? "bg-primary text-on-primary" : "hover:bg-primary/10 text-on-surface"
                          )}
                        >
                          <img 
                            src={asset.image} 
                            alt={asset.name} 
                            className="w-5 h-5 rounded-full"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col">
                            <span>{asset.name}</span>
                            <span className="text-[8px] opacity-70 uppercase tracking-tighter">{asset.id}</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-on-surface-variant font-bold italic">
                        No se encontraron activos
                      </div>
                    )}
                  </div>
                </div>
              )}
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
