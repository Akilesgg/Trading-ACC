import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "motion/react";
import { Zap, TrendingUp, TrendingDown, Search, Filter, Maximize2, RefreshCw, X, ArrowRight, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchAssetFundamentals, AssetFundamental } from "@/services/cryptoService";
import FundamentalModal from "@/components/common/FundamentalModal";

interface CryptoBubbleData extends d3.SimulationNodeDatum {
  id: string;
  symbol: string;
  name: string;
  priceChange: number;
  marketCap: number;
}

const CryptoBubbles: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<CryptoBubbleData[]>([]);
  const [timeframe, setTimeframe] = useState("15m");
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState<CryptoBubbleData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFundamental, setSelectedFundamental] = useState<AssetFundamental | null>(null);

  const showFundamentals = async (symbol: string) => {
    const data = await fetchAssetFundamentals(symbol);
    setSelectedFundamental(data);
  };

  // Generate mock data for top 100 cryptos
  const generateMockData = () => {
    const symbols = [
      "BTC", "ETH", "BNB", "SOL", "XRP", "ADA", "DOGE", "AVAX", "DOT", "TRX",
      "LINK", "MATIC", "WBTC", "UNI", "LTC", "DAI", "BCH", "SHIB", "LEO", "NEAR",
      "ATOM", "XLM", "OKB", "XMR", "ETC", "ICP", "FIL", "LDO", "HBAR", "APT",
      "CRO", "VET", "KAS", "TIA", "RNDR", "INJ", "STX", "OP", "GRT", "AAVE",
      "IMX", "EGLD", "THETA", "ALGO", "FLOW", "QNT", "BSV", "SAND", "MANA", "AXS",
      "MKR", "SNX", "NEO", "EOS", "FTM", "RUNE", "GALA", "KAVA", "CFX", "MINA",
      "DYDX", "ORDI", "SUI", "SEI", "BEAM", "PYTH", "BONK", "WLD", "JUP", "STRK",
      "MORPHO", "SKY", "HYPE", "CHZ", "ZRO", "ENA", "TAO", "JST", "ARE", "PI",
      "XTZ", "BCH", "NEXO", "STABLE", "NIGHT", "TON", "FLR", "XDC", "PUMP", "WLD",
      "LTC", "UNI", "VET", "XMR", "KAS", "SHIB", "TRX", "ALGO", "PEPE", "TRUMP"
    ];

    return symbols.map((symbol, index) => {
      const priceChange = (Math.random() * 14) - 7; // -7% to +7%
      const marketCap = 100000000000 / (index + 1) * (0.8 + Math.random() * 0.4);
      
      return {
        id: symbol,
        symbol,
        name: symbol,
        priceChange,
        marketCap
      };
    });
  };

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 800);
    return () => clearTimeout(timeout);
  }, [timeframe]);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Scales
    const sizeScale = d3.scaleSqrt()
      .domain([d3.min(data, d => d.marketCap) || 0, d3.max(data, d => d.marketCap) || 1])
      .range([30, 120]);

    const colorScale = d3.scaleLinear<string>()
      .domain([-7, 0, 7])
      .range(["#ff4d4d", "#1a1c1e", "#00ffa3"]);

    // Simulation
    const simulation = d3.forceSimulation<CryptoBubbleData>(data)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("charge", d3.forceManyBody().strength(15))
      .force("collide", d3.forceCollide<CryptoBubbleData>(d => (sizeScale(d.marketCap) / 2) + 5))
      .force("x", d3.forceX(width / 2).strength(0.08))
      .force("y", d3.forceY(height / 2).strength(0.08))
      .on("tick", () => {
        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });

    const node = svg.append("g")
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
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

    // Square (Rect)
    node.append("rect")
      .attr("width", d => sizeScale(d.marketCap))
      .attr("height", d => sizeScale(d.marketCap))
      .attr("x", d => -sizeScale(d.marketCap) / 2)
      .attr("y", d => -sizeScale(d.marketCap) / 2)
      .attr("rx", 12) // Elegant corner radius
      .attr("fill", d => colorScale(d.priceChange))
      .attr("stroke", d => d.priceChange >= 0 ? "#00ffa388" : "#ff4d4d88")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all duration-700 hover:brightness-125 hover:scale-110")
      .style("filter", d => `drop-shadow(0 20px 40px ${d.priceChange >= 0 ? "rgba(0,255,163,0.3)" : "rgba(255,77,77,0.3)"})`)
      .append("title")
      .text(d => `${d.name}: ${d.priceChange.toFixed(2)}%`);

    // Floating & Breathing Animation
    node.each(function(d, i) {
      const element = d3.select(this);
      
      function float() {
        element
          .transition()
          .duration(3000 + Math.random() * 3000)
          .ease(d3.easeSinInOut)
          .attr("transform", `translate(${d.x}, ${d.y - 12})`)
          .transition()
          .duration(3000 + Math.random() * 3000)
          .ease(d3.easeSinInOut)
          .attr("transform", `translate(${d.x}, ${d.y + 12})`)
          .on("end", float);
      }
      
      float();
    });

    // Symbol Text
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".1em")
      .attr("fill", "#fff")
      .attr("font-size", d => Math.max(10, sizeScale(d.marketCap) / 3))
      .attr("font-weight", "900")
      .attr("class", "pointer-events-none uppercase tracking-tighter")
      .text(d => d.symbol);

    // Price Change Text
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => sizeScale(d.marketCap) / 3)
      .attr("fill", "#fff")
      .attr("opacity", 0.9)
      .attr("font-size", d => Math.max(8, sizeScale(d.marketCap) / 5))
      .attr("font-weight", "bold")
      .attr("class", "pointer-events-none")
      .text(d => `${d.priceChange >= 0 ? "+" : ""}${d.priceChange.toFixed(2)}%`);

    return () => {
      simulation.stop();
    };
  }, [data]);

  const topGainers = [...data].sort((a, b) => b.priceChange - a.priceChange).slice(0, 5);
  const topLosers = [...data].sort((a, b) => a.priceChange - b.priceChange).slice(0, 5);

  return (
    <div className="min-h-screen bg-[#080a0c] pt-20 pb-6 px-4 flex flex-col gap-4 overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-surface-container-low/50 p-4 rounded-3xl border border-outline-variant/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(0,255,163,0.1)]">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-on-surface leading-none">Terminal Top 100</h1>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest mt-1">Análisis de Flujo de Capital Cuántico</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-high p-1 rounded-2xl border border-outline-variant/10">
          {["1m", "5m", "15m", "1H", "4H", "1D"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                timeframe === tf ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {tf}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="FILTRAR ACTIVOS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-surface-container-high border border-outline-variant/10 rounded-xl py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary transition-all w-56"
            />
          </div>
          <button className="p-2.5 hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant">
            <Maximize2 className="w-5 h-5" />
          </button>
          <button onClick={() => setData(generateMockData())} className="p-2.5 hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* Left Sidebar: Market Stats */}
        <div className="w-64 flex flex-col gap-3">
          <div className="bg-surface-container-low/50 rounded-2xl border border-outline-variant/10 p-4 space-y-5 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface">Top Ganadores</h3>
            </div>
            <div className="space-y-2.5">
              {topGainers.map((token) => (
                <div key={token.symbol} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors" onClick={() => setSelectedToken(token)}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-surface-container-highest rounded flex items-center justify-center font-black text-[9px]">{token.symbol[0]}</div>
                    <span className="text-[9px] font-black uppercase">{token.symbol}</span>
                  </div>
                  <span className="text-[9px] font-black text-primary">+{token.priceChange.toFixed(2)}%</span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 border-b border-outline-variant/10 pb-2 pt-2">
              <TrendingDown className="w-4 h-4 text-secondary" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-on-surface">Top Perdedores</h3>
            </div>
            <div className="space-y-2.5">
              {topLosers.map((token) => (
                <div key={token.symbol} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-1 rounded-lg transition-colors" onClick={() => setSelectedToken(token)}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-surface-container-highest rounded flex items-center justify-center font-black text-[9px]">{token.symbol[0]}</div>
                    <span className="text-[9px] font-black uppercase">{token.symbol}</span>
                  </div>
                  <span className="text-[9px] font-black text-secondary">{token.priceChange.toFixed(2)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl border border-primary/20 p-4 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Sentimiento</h3>
            <p className="text-[9px] text-on-surface-variant leading-relaxed">
              Acumulación <span className="text-primary font-bold">Alcista</span> detectada en Capa 1.
            </p>
            <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[65%]" />
            </div>
            <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-on-surface-variant">
              <span>Miedo</span>
              <span>Codicia (65)</span>
            </div>
          </div>
        </div>

        {/* Center: Main Bubble Chart */}
        <div className="flex-1 relative bg-[#050708] rounded-2xl border border-outline-variant/10 overflow-hidden shadow-[inset_0_0_100px_rgba(0,0,0,0.8)]">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#080a0c]/80 backdrop-blur-xl z-50">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_40px_rgba(0,255,163,0.2)]" />
              <p className="text-[12px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sincronizando Terminal...</p>
            </div>
          )}
          <svg ref={svgRef} className="w-full h-full" />
          
          {/* Legend Overlay */}
          <div className="absolute bottom-6 left-6 flex items-center gap-6 bg-surface-container-low/60 backdrop-blur-xl p-4 rounded-xl border border-outline-variant/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary shadow-[0_0_10px_rgba(0,255,163,0.5)]" />
              <span className="text-[8px] font-black uppercase tracking-widest text-on-surface">Bullish</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-secondary shadow-[0_0_10px_rgba(255,77,77,0.5)]" />
              <span className="text-[8px] font-black uppercase tracking-widest text-on-surface">Bearish</span>
            </div>
            <div className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant border-l border-outline-variant/20 pl-6">
              Área = Market Cap
            </div>
          </div>
        </div>

        {/* Right Sidebar: Token Details / Smart Analysis */}
        <div className="w-72 flex flex-col gap-3">
          <AnimatePresence mode="wait">
            {selectedToken ? (
              <motion.div 
                key={selectedToken.symbol}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-surface-container-low/50 rounded-[2rem] border border-outline-variant/10 p-6 space-y-6 backdrop-blur-md flex-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center border border-primary/20">
                      <img 
                        src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${selectedToken.symbol.toLowerCase()}.png`} 
                        className="w-8 h-8" 
                        alt=""
                        onError={(e) => (e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2584/2584687.png")}
                      />
                    </div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tighter">{selectedToken.symbol}</h2>
                      <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Activo Seleccionado</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedToken(null)} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/5">
                    <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Cambio 24h</p>
                    <p className={cn("text-lg font-black", selectedToken.priceChange >= 0 ? "text-primary" : "text-secondary")}>
                      {selectedToken.priceChange >= 0 ? "+" : ""}{selectedToken.priceChange.toFixed(2)}%
                    </p>
                  </div>
                  <div className="p-4 bg-surface-container rounded-2xl border border-outline-variant/5">
                    <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-1">Market Cap</p>
                    <p className="text-lg font-black">${(selectedToken.marketCap / 1000000000).toFixed(2)}B</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest border-b border-outline-variant/10 pb-2">Análisis Técnico IA</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold">RSI (14)</span>
                      <span className="text-[10px] font-black text-primary">62.4 (Neutral-Alcista)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold">Volatilidad</span>
                      <span className="text-[10px] font-black">Media-Alta</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-on-surface-variant uppercase font-bold">Soporte Clave</span>
                      <span className="text-[10px] font-black text-primary">$42,500</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/10 rounded-2xl border border-primary/20">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Recomendación IA</p>
                  <p className="text-[10px] text-on-surface leading-relaxed font-medium">
                    Se observa una divergencia alcista en temporalidades bajas. El flujo de órdenes indica una absorción institucional cerca de niveles de soporte. <span className="font-bold">Mantener / Acumular.</span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button className="py-4 bg-primary text-on-primary rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                    Abrir Analizador
                  </button>
                  <button 
                    onClick={() => showFundamentals(selectedToken.symbol)}
                    className="py-4 bg-surface-container text-on-surface rounded-2xl font-black uppercase tracking-widest text-[10px] border border-outline-variant/10 hover:bg-surface-container-high transition-all flex items-center justify-center gap-2"
                  >
                    <Info className="w-4 h-4" /> Fundamentos
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-surface-container-low/30 rounded-[2rem] border border-dashed border-outline-variant/20 p-8 flex flex-col items-center justify-center text-center gap-4 flex-1"
              >
                <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center">
                  <Filter className="w-8 h-8 text-on-surface-variant" />
                </div>
                <div>
                  <h3 className="text-[12px] font-black uppercase tracking-widest">Selecciona un Activo</h3>
                  <p className="text-[10px] text-on-surface-variant mt-2 leading-relaxed">Haz clic en una burbuja para desplegar el análisis técnico profundo y métricas on-chain.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
