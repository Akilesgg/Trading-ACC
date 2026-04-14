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
                    stroke="#FFD700" // Yellow
                    strokeWidth={2}
                    strokeDasharray="3 3"
                  />
                ))}
                
                {/* Entry Line */}
                <ReferenceLine 
                  y={p.entry} 
                  stroke="#00ffa3" 
                  strokeDasharray="3 3" 
                  label={{ position: 'right', value: 'ENTRADA', fill: '#00ffa3', fontSize: 10, fontWeight: 'black' }} 
                />
                
                {/* Target Line */}
                <ReferenceLine 
                  y={p.tp} 
                  stroke="#00ffa3" 
                  strokeWidth={2}
                  label={{ position: 'right', value: 'OBJETIVO', fill: '#00ffa3', fontSize: 10, fontWeight: 'black' }} 
                />

                {/* Stop Loss Line */}
                <ReferenceLine 
                  y={p.sl} 
                  stroke="#ff7162" 
                  strokeDasharray="3 3" 
                  label={{ position: 'right', value: 'STOP', fill: '#ff7162', fontSize: 10, fontWeight: 'black' }} 
                />

                <ReferenceDot 
                  x={chartData[p.points[p.points.length-1].x]?.name} 
                  y={p.points[p.points.length-1].y} 
                  r={6} 
                  fill="#FFD700" 
                  stroke="white"
                  label={{ 
                    position: 'top', 
                    value: `${p.name}`, 
                    fill: '#FFD700', 
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
                r={10} 
                fill={c.type === "ALCISTA" ? "#00ffa3" : "#ff7162"} 
                stroke="white"
                strokeWidth={2}
                label={{ 
                  position: 'bottom', 
                  value: c.name, 
                  fill: c.type === "ALCISTA" ? "#00ffa3" : "#ff7162", 
                  fontSize: 10, 
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
            <div key={`leg-p-${i}`} className="flex flex-col gap-4 p-6 bg-surface-container-high rounded-3xl border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", p.type === "ALCISTA" ? "bg-primary/10 border-primary/20" : "bg-secondary/10 border-secondary/20")}>
                    <Zap className={cn("w-5 h-5", p.type === "ALCISTA" ? "text-primary" : "text-secondary")} />
                  </div>
                  <div>
                    <span className="text-[14px] font-black text-on-surface uppercase tracking-tight">{p.name}</span>
                    <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">{p.status}</p>
                  </div>
                </div>
                <div className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest", p.type === "ALCISTA" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary")}>
                  {p.action}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 relative z-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Entrada</p>
                  <p className="text-xs font-black text-on-surface">${p.entry.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Objetivo</p>
                  <p className="text-xs font-black text-primary">${p.tp.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Stop Loss</p>
                  <p className="text-xs font-black text-secondary">${p.sl.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
          {candles.map((c, i) => (
            <div key={`leg-c-${i}`} className="flex items-center justify-between p-5 bg-surface-container-high rounded-3xl border border-outline-variant/10 group hover:border-primary/30 transition-all">
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", c.type === "ALCISTA" ? "bg-primary/10 border-primary/20" : "bg-secondary/10 border-secondary/20")}>
                  <Target className={cn("w-5 h-5", c.type === "ALCISTA" ? "text-primary" : "text-secondary")} />
                </div>
                <div>
                  <span className="text-[13px] font-black text-on-surface uppercase tracking-tight">{c.name}</span>
                  <p className="text-[10px] font-medium text-on-surface-variant opacity-70">{c.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">TP: ${c.tp.toLocaleString()}</p>
                  <p className="text-[9px] font-black text-secondary uppercase tracking-widest">SL: ${c.sl.toLocaleString()}</p>
                </div>
                <div className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest", c.type === "ALCISTA" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-secondary")}>
                  {c.action}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MarketOverview;
