import React, { useEffect, useRef, useState, useMemo } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter, 
  Maximize2, 
  RefreshCw, 
  X, 
  ArrowRight, 
  Info,
  BarChart3,
  Activity,
  Brain,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  LayoutGrid,
  List
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAssetFundamentals, AssetFundamental } from "@/services/cryptoService";
import FundamentalModal from "@/components/common/FundamentalModal";

interface CryptoBubbleData extends d3.SimulationNodeDatum {
  id: string;
  symbol: string;
  name: string;
  priceChange: number;
  marketCap: number;
  volume: number;
  volatility: number;
  rsi: number;
  btcCorrelation: number;
}

const CryptoBubbles: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<CryptoBubbleData[]>([]);
  const [timeframe, setTimeframe] = useState("15m");
  const [activeTab, setActiveTab] = useState(100);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<CryptoBubbleData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"change" | "volume" | "volatility" | "marketCap">("marketCap");
  const [filterTrend, setFilterTrend] = useState<"all" | "bullish" | "bearish">("all");
  const [selectedFundamental, setSelectedFundamental] = useState<AssetFundamental | null>(null);

  const tabs = [100, 200, 300, 400, 500];

  const showFundamentals = async (symbol: string) => {
    const data = await fetchAssetFundamentals(symbol);
    setSelectedFundamental(data);
  };

  const generateMockData = (count: number) => {
    const baseSymbols = [
      "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "TRX",
      "LINK", "MATIC", "WBTC", "UNI", "LTC", "DAI", "BCH", "SHIB", "LEO", "NEAR",
      "ATOM", "XLM", "OKB", "XMR", "ETC", "ICP", "FIL", "LDO", "HBAR", "APT",
      "CRO", "VET", "KAS", "TIA", "RNDR", "INJ", "STX", "OP", "GRT", "AAVE",
      "IMX", "EGLD", "THETA", "ALGO", "FLOW", "QNT", "BSV", "SAND", "MANA", "AXS",
      "MKR", "SNX", "NEO", "EOS", "FTM", "RUNE", "GALA", "KAVA", "CFX", "MINA",
      "DYDX", "ORDI", "SUI", "SEI", "BEAM", "PYTH", "BONK", "WLD", "JUP", "STRK",
      "MORPHO", "SKY", "HYPE", "CHZ", "ZRO", "ENA", "TAO", "JST", "ARE", "PI"
    ];

    const result: CryptoBubbleData[] = [];
    for (let i = 0; i < count; i++) {
      const symbol = i < baseSymbols.length ? baseSymbols[i] : `TOKEN-${i+1}`;
      const priceChange = (Math.random() * 20) - 10; // -10% to +10%
      const marketCap = 100000000000 / (i + 1) * (0.8 + Math.random() * 0.4);
      const volume = marketCap * (0.05 + Math.random() * 0.1);
      const volatility = Math.random() * 100;
      const rsi = 30 + Math.random() * 40;
      const btcCorrelation = 0.5 + Math.random() * 0.45;

      result.push({
        id: symbol + i,
        symbol,
        name: symbol,
        priceChange,
        marketCap,
        volume,
        volatility,
        rsi,
        btcCorrelation
      });
    }
    return result;
  };

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setData(generateMockData(activeTab));
      setLoading(false);
    }, 600);
    return () => clearTimeout(timeout);
  }, [timeframe, activeTab]);

  const filteredData = useMemo(() => {
    let filtered = data.filter(d => 
      d.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (filterTrend === "bullish") filtered = filtered.filter(d => d.priceChange > 0);
    if (filterTrend === "bearish") filtered = filtered.filter(d => d.priceChange < 0);

    return filtered.sort((a, b) => {
      if (sortBy === "change") return b.priceChange - a.priceChange;
      if (sortBy === "volume") return b.volume - a.volume;
      if (sortBy === "volatility") return b.volatility - a.volatility;
      return b.marketCap - a.marketCap;
    });
  }, [data, searchQuery, filterTrend, sortBy]);

  useEffect(() => {
    if (!svgRef.current || filteredData.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const sizeScale = d3.scaleSqrt()
      .domain([d3.min(filteredData, d => d.marketCap) || 0, d3.max(filteredData, d => d.marketCap) || 1])
      .range([25, 100]);

    const colorScale = d3.scaleLinear<string>()
      .domain([-10, 0, 10])
      .range(["#ff4d4d", "#1a1c1e", "#00ffa3"]);

    const simulation = d3.forceSimulation<CryptoBubbleData>(filteredData)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("charge", d3.forceManyBody().strength(10))
      .force("collide", d3.forceCollide<CryptoBubbleData>(d => (sizeScale(d.marketCap) / 2) + 8))
      .force("x", d3.forceX(width / 2).strength(0.1))
      .force("y", d3.forceY(height / 2).strength(0.1))
      .on("tick", () => {
        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });

    const node = svg.append("g")
      .selectAll("g")
      .data(filteredData)
      .enter()
      .append("g")
      .attr("class", "bubble-node")
      .on("click", (event, d) => setSelectedToken(d))
      .call(d3.drag<SVGGElement, CryptoBubbleData>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    node.append("rect")
      .attr("width", d => sizeScale(d.marketCap))
      .attr("height", d => sizeScale(d.marketCap))
      .attr("x", d => -sizeScale(d.marketCap) / 2)
      .attr("y", d => -sizeScale(d.marketCap) / 2)
      .attr("rx", 16)
      .attr("fill", d => colorScale(d.priceChange))
      .attr("stroke", d => d.priceChange >= 0 ? "#00ffa344" : "#ff4d4d44")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all duration-500 hover:brightness-125")
      .style("filter", d => `drop-shadow(0 10px 20px ${d.priceChange >= 0 ? "rgba(0,255,163,0.15)" : "rgba(255,77,77,0.15)"})`);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".1em")
      .attr("fill", "#fff")
      .attr("font-size", d => Math.max(9, sizeScale(d.marketCap) / 3.5))
      .attr("font-weight", "900")
      .attr("class", "pointer-events-none uppercase tracking-tighter")
      .text(d => d.symbol);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => sizeScale(d.marketCap) / 3.2)
      .attr("fill", "#fff")
      .attr("opacity", 0.8)
      .attr("font-size", d => Math.max(7, sizeScale(d.marketCap) / 6))
      .attr("font-weight", "bold")
      .attr("class", "pointer-events-none")
      .text(d => `${d.priceChange >= 0 ? "+" : ""}${d.priceChange.toFixed(1)}%`);

    return () => {
      simulation.stop();
    };
  }, [filteredData]);

  const marketConclusion = useMemo(() => {
    const avgChange = data.reduce((acc, d) => acc + d.priceChange, 0) / data.length;
    const bullishCount = data.filter(d => d.priceChange > 0).length;
    const percentBullish = (bullishCount / data.length) * 100;

    let status = "Neutral";
    let recommendation = "El mercado muestra una fase de consolidación lateral. Se recomienda esperar confirmación de ruptura en niveles clave de BTC.";

    if (avgChange > 1.5 && percentBullish > 60) {
      status = "Bullish";
      recommendation = "Fuerte impulso alcista detectado en el Top 500. El capital está rotando hacia altcoins de mediana capitalización. Oportunidad en breakouts confirmados.";
    } else if (avgChange < -1.5 && percentBullish < 40) {
      status = "Bearish";
      recommendation = "Presión vendedora dominante. Alta correlación con la debilidad de BTC. Se recomienda cautela, priorizar la liquidez y buscar coberturas.";
    }

    return { status, percentBullish, avgChange, recommendation };
  }, [data]);

  return (
    <div className="min-h-screen bg-[#080a0c] pt-24 pb-32 px-6 flex flex-col gap-6 overflow-hidden">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-surface-container-low/40 p-6 rounded-[2.5rem] border border-outline-variant/10 backdrop-blur-3xl shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20 shadow-[0_0_30px_rgba(0,255,163,0.1)]">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-on-surface leading-none">Explorador de Mercado</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">Terminal de Inteligencia Cuántica</p>
            </div>
          </div>
        </div>

        {/* Tab System */}
        <div className="flex items-center gap-1 bg-surface-container-high/50 p-1.5 rounded-2xl border border-outline-variant/10">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative overflow-hidden group",
                activeTab === tab 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                  : "text-on-surface-variant hover:text-on-surface hover:bg-white/5"
              )}
            >
              TOP {tab}
              {activeTab === tab && (
                <motion.div layoutId="activeTab" className="absolute inset-0 bg-primary -z-10" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="BUSCAR ACTIVO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-high/50 border border-outline-variant/10 rounded-2xl py-3.5 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary/50 transition-all w-64 backdrop-blur-md"
            />
          </div>
          <button onClick={() => setData(generateMockData(activeTab))} className="p-3.5 bg-surface-container-high/50 hover:bg-primary/10 rounded-2xl border border-outline-variant/10 transition-all text-on-surface-variant hover:text-primary active:scale-90">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters & Sorting Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface-container-low/20 px-6 py-4 rounded-2xl border border-outline-variant/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-on-surface-variant" />
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Filtros:</span>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "Todos" },
              { id: "bullish", label: "Alcistas" },
              { id: "bearish", label: "Bajistas" }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterTrend(f.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                  filterTrend === f.id 
                    ? "bg-on-surface text-background border-on-surface" 
                    : "border-outline-variant/20 text-on-surface-variant hover:border-on-surface/30"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-4 h-4 text-on-surface-variant" />
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Ordenar por:</span>
          </div>
          <div className="flex items-center gap-2">
            {[
              { id: "marketCap", label: "Cap. Mercado" },
              { id: "change", label: "% Cambio" },
              { id: "volume", label: "Volumen" },
              { id: "volatility", label: "Volatilidad" }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id as any)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border",
                  sortBy === s.id 
                    ? "bg-primary/20 text-primary border-primary/30" 
                    : "border-outline-variant/20 text-on-surface-variant hover:border-primary/20"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden min-h-[600px]">
        {/* Left: Market Stats & Indicators */}
        <div className="w-full lg:w-80 flex flex-col gap-4">
          <div className="trading-card p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-outline-variant/10 pb-4">
              <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-on-surface">Monitor en Tiempo Real</h3>
              <Activity className="w-4 h-4 text-primary animate-pulse" />
            </div>
            
            <div className="space-y-3">
              {filteredData.slice(0, 12).map((token) => (
                <motion.div 
                  layout
                  key={token.id} 
                  onClick={() => setSelectedToken(token)}
                  className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-outline-variant/10 hover:bg-white/5 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-surface-container-highest rounded-lg flex items-center justify-center font-black text-[10px] group-hover:scale-110 transition-transform">
                      {token.symbol[0]}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-tighter">{token.symbol}</p>
                      <p className="text-[8px] text-on-surface-variant font-bold opacity-50 uppercase">RSI: {token.rsi.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-[10px] font-black flex items-center justify-end gap-1", token.priceChange >= 0 ? "text-primary" : "text-secondary")}>
                      {token.priceChange >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(token.priceChange).toFixed(2)}%
                    </p>
                    <div className="w-16 h-1 bg-surface-container-highest rounded-full mt-1 overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-1000", token.priceChange >= 0 ? "bg-primary" : "bg-secondary")} 
                        style={{ width: `${Math.min(100, Math.abs(token.priceChange) * 10)}%` }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Timeframe Selector (Moved here for better UX) */}
          <div className="bg-surface-container-low/30 p-2 rounded-2xl border border-outline-variant/10 flex justify-between">
            {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                  timeframe === tf ? "bg-on-surface text-background shadow-lg" : "text-on-surface-variant hover:text-on-surface"
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Bubble Chart */}
        <div className="flex-1 relative bg-[#050708] rounded-[3rem] border border-outline-variant/10 overflow-hidden shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] group/chart">
          <AnimatePresence>
            {loading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex flex-col items-center justify-center bg-[#080a0c]/90 backdrop-blur-2xl z-50"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_60px_rgba(0,255,163,0.2)]" />
                  <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" />
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary mt-8 animate-pulse">Sincronizando Nodos de Mercado...</p>
              </motion.div>
            )}
          </AnimatePresence>
          
          <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
          
          {/* Chart Controls Overlay */}
          <div className="absolute top-6 right-6 flex flex-col gap-2">
            <button className="p-3 bg-surface-container-low/40 backdrop-blur-xl rounded-xl border border-outline-variant/10 hover:bg-primary/10 transition-all text-on-surface-variant hover:text-primary">
              <Maximize2 className="w-4 h-4" />
            </button>
            <button className="p-3 bg-surface-container-low/40 backdrop-blur-xl rounded-xl border border-outline-variant/10 hover:bg-primary/10 transition-all text-on-surface-variant hover:text-primary">
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Legend Overlay */}
          <div className="absolute bottom-8 left-8 flex items-center gap-8 bg-surface-container-low/40 backdrop-blur-2xl px-6 py-4 rounded-2xl border border-outline-variant/10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_rgba(0,255,163,0.6)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface">Alcista</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-secondary shadow-[0_0_15px_rgba(255,77,77,0.6)]" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface">Bajista</span>
            </div>
            <div className="h-4 w-px bg-outline-variant/20 mx-2" />
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Tamaño = Market Cap</span>
            </div>
          </div>
        </div>

        {/* Right: Detailed Analysis & Recommendation */}
        <div className="w-full lg:w-96 flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {selectedToken ? (
              <motion.div 
                key={selectedToken.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="bg-surface-container-low/40 rounded-[2.5rem] border border-outline-variant/10 p-8 space-y-8 backdrop-blur-3xl flex-1 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-[60px] -mr-20 -mt-20"></div>
                
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center border border-primary/20 shadow-xl">
                      <img 
                        src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${selectedToken.symbol.toLowerCase()}.png`} 
                        className="w-10 h-10" 
                        alt=""
                        onError={(e) => (e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2584/2584687.png")}
                      />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedToken.symbol}</h2>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Análisis Profundo</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedToken(null)} className="p-2.5 hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-6 h-6 text-on-surface-variant" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="p-5 bg-surface-container-high/50 rounded-2xl border border-outline-variant/5">
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Cambio 24h</p>
                    <p className={cn("text-2xl font-black tracking-tighter", selectedToken.priceChange >= 0 ? "text-primary" : "text-secondary")}>
                      {selectedToken.priceChange >= 0 ? "+" : ""}{selectedToken.priceChange.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-5 bg-surface-container-high/50 rounded-2xl border border-outline-variant/5">
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-2">Volatilidad</p>
                    <p className="text-2xl font-black tracking-tighter text-on-surface">{selectedToken.volatility.toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-5 relative z-10">
                  <div className="flex items-center justify-between border-b border-outline-variant/10 pb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface">Métricas de Red</h3>
                    <ChevronRight className="w-4 h-4 text-on-surface-variant" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-on-surface-variant uppercase font-bold">Correlación BTC</span>
                      <span className="text-[11px] font-black text-primary">{(selectedToken.btcCorrelation * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-on-surface-variant uppercase font-bold">RSI (14)</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[11px] font-black", selectedToken.rsi > 70 ? "text-secondary" : selectedToken.rsi < 30 ? "text-primary" : "text-on-surface")}>
                          {selectedToken.rsi.toFixed(1)}
                        </span>
                        <div className="w-12 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${selectedToken.rsi}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-on-surface-variant uppercase font-bold">Volumen 24h</span>
                      <span className="text-[11px] font-black">${(selectedToken.volume / 1000000).toFixed(1)}M</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-primary/10 rounded-3xl border border-primary/20 relative z-10 group hover:bg-primary/15 transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-primary" />
                    <p className="text-[11px] font-black text-primary uppercase tracking-widest">Recomendación IA</p>
                  </div>
                  <p className="text-[11px] text-on-surface leading-relaxed font-medium opacity-90">
                    {selectedToken.priceChange > 0 
                      ? `Impulso alcista sostenido con RSI en zona saludable. La correlación con BTC es moderada, lo que sugiere fuerza propia del activo. Recomendación: MANTENER / ACUMULAR.`
                      : `Corrección técnica en curso. Se observa soporte institucional cerca de niveles actuales. La volatilidad es alta, se recomienda esperar estabilización. Recomendación: CAUTELA / ESPERAR.`}
                  </p>
                </div>

                <div className="flex flex-col gap-3 relative z-10">
                  <button className="w-full py-5 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                    <LayoutGrid className="w-4 h-4" />
                    Abrir Analizador Pro
                  </button>
                  <button 
                    onClick={() => showFundamentals(selectedToken.symbol)}
                    className="w-full py-5 bg-surface-container-high text-on-surface rounded-2xl font-black uppercase tracking-widest text-[11px] border border-outline-variant/10 hover:bg-white/5 transition-all flex items-center justify-center gap-3"
                  >
                    <Info className="w-4 h-4" /> Ver Fundamentos
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface-container-low/20 rounded-[2.5rem] border border-dashed border-outline-variant/20 p-10 flex flex-col items-center justify-center text-center gap-6 flex-1"
              >
                <div className="w-20 h-20 bg-surface-container-high/50 rounded-full flex items-center justify-center shadow-inner">
                  <Filter className="w-10 h-10 text-on-surface-variant opacity-30" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-on-surface">Selección de Activo</h3>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed opacity-60">
                    Interactúa con los nodos del mercado para desplegar el análisis técnico avanzado, métricas on-chain y proyecciones algorítmicas.
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-high/30 rounded-full border border-outline-variant/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                  <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Esperando Entrada...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Market Conclusion & Recommendation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-surface-container-low/40 p-8 rounded-[2rem] border border-outline-variant/10 backdrop-blur-3xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-on-surface/5 rounded-xl flex items-center justify-center border border-outline-variant/10">
                <BarChart3 className="w-5 h-5 text-on-surface" />
              </div>
              <h3 className="text-[12px] font-black uppercase tracking-widest text-on-surface">Conclusión del Mercado</h3>
            </div>
            <div className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-widest">Estado General:</span>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
                  marketConclusion.status === "Bullish" ? "bg-primary/20 text-primary shadow-primary/10" : 
                  marketConclusion.status === "Bearish" ? "bg-secondary/20 text-secondary shadow-secondary/10" : 
                  "bg-on-surface/10 text-on-surface"
                )}>
                  {marketConclusion.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                  <span className="text-on-surface-variant">Dominancia Alcista</span>
                  <span className="text-primary">{marketConclusion.percentBullish.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${marketConclusion.percentBullish}%` }}
                    className="h-full bg-primary shadow-[0_0_10px_rgba(0,255,163,0.5)]" 
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-outline-variant/10 mt-6">
            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Basado en el análisis del Top {activeTab}</p>
          </div>
        </div>

        <div className="lg:col-span-2 bg-primary/5 p-8 rounded-[2rem] border border-primary/20 backdrop-blur-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-primary/10 transition-all duration-1000"></div>
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-[12px] font-black uppercase tracking-widest text-primary">Recomendación Estratégica</h3>
              </div>
              <p className="text-lg font-black text-on-surface leading-tight tracking-tighter uppercase mt-4">
                {marketConclusion.recommendation}
              </p>
            </div>
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-primary/10">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Riesgo Estimado</span>
                  <span className="text-[11px] font-black text-on-surface">MODERADO</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-primary uppercase tracking-widest opacity-60">Temporalidad Sugerida</span>
                  <span className="text-[11px] font-black text-on-surface">H1 / H4</span>
                </div>
              </div>
              <button className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest group/btn">
                Ver Plan de Ejecución
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fundamental Modal */}
      <FundamentalModal 
        data={selectedFundamental} 
        onClose={() => setSelectedFundamental(null)} 
      />
    </div>
  );
};

export default CryptoBubbles;
