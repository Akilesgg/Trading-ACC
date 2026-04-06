import React, { useEffect, useRef, useState } from "react";
import { useTerminalStore } from "../../store/useTerminalStore";
import { 
  BarChart3, 
  Maximize2, 
  Minimize2, 
  Settings, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Activity, 
  Layers, 
  Target, 
  Shield 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  ReferenceArea,
  ReferenceDot
} from 'recharts';

const TerminalChart: React.FC = () => {
  const { activeSymbol, timeframe, addLog } = useTerminalStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const generateMockData = () => {
    const basePrice = 64000;
    const mockData = [];
    for (let i = 0; i < 50; i++) {
      const change = (Math.random() - 0.5) * 200;
      const price = basePrice + change + (i * 50);
      mockData.push({
        time: `${i}:00`,
        open: price - 50,
        high: price + 100,
        low: price - 100,
        close: price,
        volume: Math.floor(Math.random() * 1000) + 500,
        rsi: Math.floor(Math.random() * 40) + 30,
        ema20: price - 20,
        ema50: price - 80,
        isBOS: i === 35,
        isCHoCH: i === 15,
        isOB: i === 25 || i === 45
      });
    }
    return mockData;
  };

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
      addLog(`SUCCESS: Data loaded for ${activeSymbol} (${timeframe})`);
    }, 800);
    return () => clearTimeout(timeout);
  }, [activeSymbol, timeframe]);

  return (
    <div className="h-full flex flex-col bg-surface-container-low/50 backdrop-blur-xl relative group">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-50">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-2xl shadow-primary/20" />
        </div>
      )}

      <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/10">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center border border-outline-variant/10 shadow-lg">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="text-sm font-black text-on-surface tracking-tighter">{activeSymbol}</h4>
              <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Binance Spot • {timeframe}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-outline-variant/20" />

          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Precio</span>
              <span className="text-sm font-black text-primary">$64,231.42</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Cambio 24h</span>
              <span className="text-sm font-black text-primary">+2.45%</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-high rounded-lg p-1 border border-outline-variant/10">
            <button className="p-1.5 hover:bg-surface-container-highest rounded-md transition-colors text-on-surface-variant hover:text-on-surface">
              <Layers className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-surface-container-highest rounded-md transition-colors text-on-surface-variant hover:text-on-surface">
              <Settings className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-surface-container-highest rounded-md transition-colors text-on-surface-variant hover:text-on-surface">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.2} />
            <XAxis dataKey="time" hide />
            <YAxis 
              domain={['auto', 'auto']} 
              orientation="right" 
              tick={{ fontSize: 10, fill: '#666', fontWeight: 'bold' }} 
              axisLine={false}
              tickLine={false}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0b0e11', border: '1px solid #333', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
              itemStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
              labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '8px', fontWeight: 'black' }}
            />
            
            {/* SMC Visualizations */}
            {data.map((entry, index) => (
              entry.isBOS && (
                <ReferenceLine key={`bos-${index}`} x={entry.time} stroke="#00ffa3" strokeDasharray="3 3" label={{ position: 'top', value: 'BOS', fill: '#00ffa3', fontSize: 10, fontWeight: 'black' }} />
              )
            ))}
            
            {data.map((entry, index) => (
              entry.isCHoCH && (
                <ReferenceLine key={`choch-${index}`} x={entry.time} stroke="#ff7162" strokeDasharray="3 3" label={{ position: 'top', value: 'CHoCH', fill: '#ff7162', fontSize: 10, fontWeight: 'black' }} />
              )
            ))}

            {/* Order Blocks */}
            {data.map((entry, index) => (
              entry.isOB && (
                <ReferenceArea key={`ob-${index}`} x1={entry.time} x2={data[index+2]?.time} y1={entry.close - 100} y2={entry.close + 100} fill="#00ffa3" fillOpacity={0.05} stroke="#00ffa3" strokeOpacity={0.2} />
              )
            ))}

            <Line type="monotone" dataKey="close" stroke="#00ffa3" strokeWidth={2} dot={false} animationDuration={1000} />
            <Line type="monotone" dataKey="ema20" stroke="#ff7162" strokeWidth={1} dot={false} opacity={0.5} />
            <Line type="monotone" dataKey="ema50" stroke="#00e0ff" strokeWidth={1} dot={false} opacity={0.3} />
            
            <Bar dataKey="volume" fill="#ffffff" opacity={0.05} yAxisId={0} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="h-12 bg-surface-container-high/30 border-t border-outline-variant/10 px-6 flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-on-surface-variant">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>SMC: BULLISH BOS DETECTED</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <span>LIQUIDITY: SWEEP AT $63,800</span>
          </div>
        </div>
        <div className="flex gap-6">
          <span>LATENCY: 12ms</span>
          <span>ENGINE: SMC-V4</span>
        </div>
      </div>
    </div>
  );
};

export default TerminalChart;
