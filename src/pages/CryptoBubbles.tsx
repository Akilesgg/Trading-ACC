import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion } from "motion/react";
import { Zap, TrendingUp, TrendingDown, Search, Filter, Maximize2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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
      const priceChange = (Math.random() * 10) - 5; // -5% to +5%
      // Market cap decreases as index increases (roughly)
      const marketCap = 100000000000 / (index + 1) * (0.8 + Math.random() * 0.4);
      
      return {
        id: symbol,
        symbol,
        name: symbol, // Simplified for mock
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
    }, 1000);
    return () => clearTimeout(timeout);
  }, [timeframe]);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Scales
    const radiusScale = d3.scaleSqrt()
      .domain([d3.min(data, d => d.marketCap) || 0, d3.max(data, d => d.marketCap) || 1])
      .range([20, 80]);

    const colorScale = d3.scaleLinear<string>()
      .domain([-5, 0, 5])
      .range(["#ff7162", "#2a2e33", "#00ffa3"]);

    // Simulation
    const simulation = d3.forceSimulation<CryptoBubbleData>(data)
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("charge", d3.forceManyBody().strength(5))
      .force("collide", d3.forceCollide<CryptoBubbleData>(d => radiusScale(d.marketCap) + 2))
      .on("tick", () => {
        node.attr("transform", d => `translate(${d.x},${d.y})`);
      });

    const node = svg.append("g")
      .selectAll("g")
      .data(data)
      .enter()
      .append("g")
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

    // Bubble Circle
    node.append("circle")
      .attr("r", d => radiusScale(d.marketCap))
      .attr("fill", d => colorScale(d.priceChange))
      .attr("stroke", d => d.priceChange >= 0 ? "#00ffa333" : "#ff716233")
      .attr("stroke-width", 2)
      .attr("class", "cursor-pointer transition-all duration-300 hover:brightness-125")
      .style("filter", d => `drop-shadow(0 0 ${Math.abs(d.priceChange) * 2}px ${d.priceChange >= 0 ? "#00ffa344" : "#ff716244"})`);

    // Symbol Text
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".3em")
      .attr("fill", "#fff")
      .attr("font-size", d => Math.max(8, radiusScale(d.marketCap) / 3))
      .attr("font-weight", "900")
      .attr("class", "pointer-events-none uppercase tracking-tighter")
      .text(d => d.symbol);

    // Price Change Text
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", d => radiusScale(d.marketCap) / 1.8)
      .attr("fill", "#fff")
      .attr("opacity", 0.8)
      .attr("font-size", d => Math.max(6, radiusScale(d.marketCap) / 5))
      .attr("font-weight", "bold")
      .attr("class", "pointer-events-none")
      .text(d => `${d.priceChange >= 0 ? "+" : ""}${d.priceChange.toFixed(2)}%`);

    return () => {
      simulation.stop();
    };
  }, [data]);

  return (
    <div className="min-h-screen bg-[#0b0f14] pt-24 pb-10 px-6 flex flex-col overflow-hidden">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tighter text-on-surface leading-none mb-1">Estado de Top 100 Cripto</h1>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Visualización de Burbujas en Tiempo Real</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-surface-container-low p-1 rounded-2xl border border-outline-variant/10">
          {["1m", "5m", "15m", "Hora", "4 Horas", "Día"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
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
              placeholder="BUSCAR..."
              className="bg-surface-container-high border border-outline-variant/10 rounded-xl py-2 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary transition-all w-40"
            />
          </div>
          <button className="p-2 hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant">
            <Maximize2 className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-surface-container-high rounded-xl transition-colors text-on-surface-variant">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Visualization Area */}
      <div className="flex-1 relative glass-card rounded-[2.5rem] border border-outline-variant/10 overflow-hidden bg-[#0b0f14]">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0b0f14]/80 backdrop-blur-sm z-50">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Escaneando Top 100...</p>
          </div>
        )}
        <svg ref={svgRef} className="w-full h-full" />
        
        {/* Legend */}
        <div className="absolute bottom-8 left-8 flex items-center gap-6 bg-surface-container-low/50 backdrop-blur-md p-4 rounded-2xl border border-outline-variant/10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">Alcista</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">Bajista</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-surface-container-highest" />
            <span className="text-[8px] font-black uppercase tracking-widest text-on-surface-variant">Neutral</span>
          </div>
        </div>

        {/* Range Selector */}
        <div className="absolute bottom-8 right-8">
          <select className="bg-surface-container-low border border-outline-variant/10 rounded-xl py-2 px-4 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-primary transition-all cursor-pointer">
            <option>1 - 100</option>
            <option>101 - 200</option>
            <option>201 - 300</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default CryptoBubbles;
