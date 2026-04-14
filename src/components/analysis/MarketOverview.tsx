import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, BarChart3, Zap, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { CryptoData } from "@/services/cryptoService";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  ReferenceDot,
  Scatter
} from 'recharts';
import { detectPatterns, detectCandles } from "@/lib/technicalAnalysis";

interface MarketOverviewProps {
  ticker: CryptoData | null;
  selectedSymbol: string;
  chartData: any[];
  timeframe: string;
  showPatterns?: boolean;
  showCandles?: boolean;
  onTogglePatterns?: (val: boolean) => void;
  onToggleCandles?: (val: boolean) => void;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({
  ticker,
  selectedSymbol,
  chartData,
  timeframe,
  showPatterns = false,
  showCandles = false,
  onTogglePatterns,
  onToggleCandles
}) => {
  const isBullish = ticker && parseFloat(ticker.priceChangePercent) >= 0;

  const patterns = useMemo(() => showPatterns ? detectPatterns(chartData) : [], [chartData, showPatterns]);
  const candles = useMemo(() => showCandles ? detectCandles(chartData) : [], [chartData, showCandles]);

  return (
    <div className="trading-card space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center border border-outline-variant/10 shadow-inner group">
            <img 
              src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${selectedSymbol.replace("USDT", "").toLowerCase()}.png`} 
              className="w-10 h-10 group-hover:scale-110 transition-transform" 
              alt=""
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h3 className="text-4xl font-black tracking-tighter text-on-surface leading-none mb-1">{selectedSymbol.replace("USDT", "")}</h3>
            <p className="text-[13px] font-black text-on-surface-variant uppercase tracking-widest">Binance Spot • {timeframe.toUpperCase()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black tracking-tighter text-on-surface leading-none mb-1">${ticker ? parseFloat(ticker.price).toLocaleString() : "---"}</p>
          <p className={cn("text-[12px] font-black flex items-center justify-end gap-1 uppercase tracking-widest", isBullish ? "text-primary" : "text-secondary")}>
            {isBullish ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {ticker?.priceChangePercent}%
          </p>
        </div>
      </div>

      <div className="h-96 w-full bg-surface-container-high/20 rounded-[2.5rem] p-8 border border-outline-variant/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        
        {/* Chart Toggles Overlay */}
        <div className="absolute top-6 right-6 z-30 flex gap-2">
          <button 
            onClick={() => onTogglePatterns?.(!showPatterns)}
            className={cn(
              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all backdrop-blur-md",
              showPatterns 
                ? "bg-primary/20 border-primary/40 text-primary shadow-lg shadow-primary/20" 
                : "bg-surface-container-highest/50 border-outline-variant/10 text-on-surface-variant hover:border-primary/30"
            )}
          >
            Patrones {showPatterns ? "ON" : "OFF"}
          </button>
          <button 
            onClick={() => onToggleCandles?.(!showCandles)}
            className={cn(
              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all backdrop-blur-md",
              showCandles 
                ? "bg-secondary/20 border-secondary/40 text-secondary shadow-lg shadow-secondary/20" 
                : "bg-surface-container-highest/50 border-outline-variant/10 text-on-surface-variant hover:border-secondary/30"
            )}
          >
            Velas {showCandles ? "ON" : "OFF"}
          </button>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isBullish ? "#00ffa3" : "#ff7162"} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={isBullish ? "#00ffa3" : "#ff7162"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0c10', border: '1px solid #333', fontSize: '12px', borderRadius: '16px', fontWeight: '900', textTransform: 'uppercase' }}
              itemStyle={{ color: isBullish ? '#00ffa3' : '#ff7162' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isBullish ? "#00ffa3" : "#ff7162"} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              strokeWidth={5} 
              animationDuration={2000}
            />

            {/* Render Patterns */}
            {patterns.map((p, i) => (
              <React.Fragment key={`pattern-${i}`}>
                {p.points.map((pt, j) => j < p.points.length - 1 && (
                  <ReferenceLine 
                    key={`line-${i}-${j}`}
                    segment={[
                      { x: chartData[pt.x]?.name, y: pt.y },
                      { x: chartData[p.points[j+1].x]?.name, y: p.points[j+1].y }
                    ]}
                    stroke={p.type === "ALCISTA" ? "#00ffa3" : "#ff7162"}
                    strokeWidth={3}
                    strokeDasharray="5 5"
                  />
                ))}
                <ReferenceDot 
                  x={chartData[p.points[p.points.length-1].x]?.name} 
                  y={p.points[p.points.length-1].y} 
                  r={6} 
                  fill={p.type === "ALCISTA" ? "#00ffa3" : "#ff7162"} 
                  stroke="white"
                  label={{ 
                    position: 'top', 
                    value: `${p.name} (${p.status})`, 
                    fill: 'white', 
                    fontSize: 10, 
                    fontWeight: 'black' 
                  }} 
                />
              </React.Fragment>
            ))}

            {/* Render Candles */}
            {candles.map((c, i) => (
              <ReferenceDot 
                key={`candle-${i}`}
                x={chartData[c.index]?.name} 
                y={c.price} 
                r={8} 
                fill={c.type === "ALCISTA" ? "#00ffa3" : "#ff7162"} 
                stroke="white"
                label={{ 
                  position: 'bottom', 
                  value: c.name, 
                  fill: c.type === "ALCISTA" ? "#00ffa3" : "#ff7162", 
                  fontSize: 9, 
                  fontWeight: 'black' 
                }} 
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-surface-container-high p-6 rounded-2xl space-y-3 border border-outline-variant/5 group hover:border-primary/30 transition-all">
          <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">Máximo 24h</p>
          <p className="text-xl font-black text-primary tracking-tighter">${ticker ? parseFloat(ticker.highPrice).toLocaleString() : "---"}</p>
        </div>
        <div className="bg-surface-container-high p-6 rounded-2xl space-y-3 border border-outline-variant/5 group hover:border-secondary/30 transition-all">
          <p className="text-[11px] font-black text-on-surface-variant uppercase tracking-widest">Mínimo 24h</p>
          <p className="text-xl font-black text-secondary tracking-tighter">${ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "---"}</p>
        </div>
      </div>

      {/* Pattern/Candle Legend if active */}
      {(showPatterns || showCandles) && (
        <div className="grid grid-cols-1 gap-4 pt-6 border-t border-outline-variant/10">
          {patterns.map((p, i) => (
            <div key={i} className="flex items-center justify-between p-4 bg-surface-container-high rounded-2xl border border-primary/20">
              <div className="flex items-center gap-4">
                <Zap className={cn("w-5 h-5", p.type === "ALCISTA" ? "text-primary" : "text-secondary")} />
                <span className="text-[12px] font-black text-on-surface uppercase tracking-widest">{p.name}</span>
              </div>
              <div className="flex items-center gap-5">
                <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">{p.status}</span>
                <span className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest", p.type === "ALCISTA" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary")}>
                  {p.action}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketOverview;
