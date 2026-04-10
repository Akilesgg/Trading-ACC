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
  Area,
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
    <div className="h-full flex flex-col bg-surface-container-low/30 relative group">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm z-50">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin shadow-2xl shadow-primary/10" />
        </div>
      )}

      <div className="flex-1 min-h-0 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <defs>
              <linearGradient id="colorPriceMain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ffa3" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#00ffa3" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.1} />
            <XAxis dataKey="time" hide />
            <YAxis 
              yAxisId="price"
              domain={['dataMin - 100', 'dataMax + 100']} 
              orientation="right" 
              tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} 
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <YAxis yAxisId="volume" hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0b0f14', border: '1px solid #222', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
              labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
            />
            
            {/* SMC Visualizations - Soft Colors */}
            {data.map((entry, index) => (
              entry.isBOS && (
                <ReferenceLine yAxisId="price" key={`bos-${index}`} x={entry.time} stroke="#00ffa3" strokeDasharray="3 3" opacity={0.4} label={{ position: 'top', value: 'BOS', fill: '#00ffa3', fontSize: 9, fontWeight: 'black', opacity: 0.6 }} />
              )
            ))}
            
            {data.map((entry, index) => (
              entry.isCHoCH && (
                <ReferenceLine yAxisId="price" key={`choch-${index}`} x={entry.time} stroke="#ff7162" strokeDasharray="3 3" opacity={0.4} label={{ position: 'top', value: 'CHoCH', fill: '#ff7162', fontSize: 9, fontWeight: 'black', opacity: 0.6 }} />
              )
            ))}

            {/* Order Blocks - Soft Fills */}
            {data.map((entry, index) => (
              entry.isOB && (
                <ReferenceArea yAxisId="price" key={`ob-${index}`} x1={entry.time} x2={data[index+2]?.time} y1={entry.close - 100} y2={entry.close + 100} fill="#00ffa3" fillOpacity={0.03} stroke="#00ffa3" strokeOpacity={0.1} />
              )
            ))}

            <Area yAxisId="price" type="monotone" dataKey="close" stroke="#00ffa3" strokeWidth={2} fill="url(#colorPriceMain)" dot={false} animationDuration={1000} opacity={0.8} />
            <Line yAxisId="price" type="monotone" dataKey="ema20" stroke="#ff7162" strokeWidth={1} dot={false} opacity={0.3} />
            <Line yAxisId="price" type="monotone" dataKey="ema50" stroke="#00e0ff" strokeWidth={1} dot={false} opacity={0.2} />
            
            <Bar yAxisId="volume" dataKey="volume" fill="#ffffff" opacity={0.03} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TerminalChart;
