import React, { useEffect, useRef, useState, useMemo } from "react";
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
  ReferenceDot,
  Cell,
  Legend
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

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, i) => {
      const isBullish = d.close >= d.open;
      return {
        ...d,
        bodyRange: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
        wickRange: [d.low, d.high],
        color: isBullish ? '#00ffa3' : '#ff7162',
        ema20: d.close * (1 + Math.sin(i / 10) * 0.002),
        ema50: d.close * (1 - Math.cos(i / 15) * 0.005)
      };
    });
  }, [data]);

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
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <defs>
              <linearGradient id="colorPriceMain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ffa3" stopOpacity={0.1}/>
                <stop offset="95%" stopColor="#00ffa3" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} opacity={0.05} />
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
              contentStyle={{ backgroundColor: '#0b0f14', border: '1px solid #222', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
              itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
              labelStyle={{ fontSize: '10px', color: '#94a3b8', marginBottom: '4px', fontWeight: 'bold' }}
              cursor={{ stroke: '#333', strokeWidth: 1 }}
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', paddingBottom: '10px' }}
            />
            
            {/* SMC Visualizations - Soft Colors */}
            {chartData.map((entry, index) => (
              entry.isBOS && (
                <ReferenceLine yAxisId="price" key={`bos-${index}`} x={entry.time} stroke="#00ffa3" strokeDasharray="3 3" opacity={0.4} label={{ position: 'top', value: 'BOS', fill: '#00ffa3', fontSize: 9, fontWeight: 'black', opacity: 0.6 }} />
              )
            ))}
            
            {chartData.map((entry, index) => (
              entry.isCHoCH && (
                <ReferenceLine yAxisId="price" key={`choch-${index}`} x={entry.time} stroke="#ff7162" strokeDasharray="3 3" opacity={0.4} label={{ position: 'top', value: 'CHoCH', fill: '#ff7162', fontSize: 9, fontWeight: 'black', opacity: 0.6 }} />
              )
            ))}

            {/* Order Blocks - Soft Fills */}
            {chartData.map((entry, index) => (
              entry.isOB && (
                <ReferenceArea yAxisId="price" key={`ob-${index}`} x1={entry.time} x2={chartData[index+2]?.time} y1={entry.close - 100} y2={entry.close + 100} fill="#00ffa3" fillOpacity={0.03} stroke="#00ffa3" strokeOpacity={0.1} />
              )
            ))}

            {/* Candlesticks */}
            <Bar yAxisId="price" dataKey="wickRange" name="Wick" barSize={1} animationDuration={1000}>
              {chartData.map((entry, index) => (
                <Cell key={`wick-${index}`} fill={entry.color} />
              ))}
            </Bar>
            <Bar yAxisId="price" dataKey="bodyRange" name="Precio" barSize={8} animationDuration={1000}>
              {chartData.map((entry, index) => (
                <Cell key={`body-${index}`} fill={entry.color} />
              ))}
            </Bar>

            <Line yAxisId="price" type="monotone" dataKey="ema20" name="EMA 20" stroke="#ff7162" strokeWidth={1} dot={false} opacity={0.4} />
            <Line yAxisId="price" type="monotone" dataKey="ema50" name="EMA 50" stroke="#00e0ff" strokeWidth={1} dot={false} opacity={0.3} />
            
            <Bar yAxisId="volume" dataKey="volume" name="Volumen" fill="#ffffff" opacity={0.03} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TerminalChart;
