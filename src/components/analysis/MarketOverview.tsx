import React, { useMemo, useState, useEffect } from "react";
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
  Brush
} from 'recharts';
import { detectPatterns, detectCandles, detectLevels, Pattern, CandlePattern, Level } from "@/lib/technicalAnalysis";
import { ZoomIn, ZoomOut, Maximize2, Move } from "lucide-react";

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
  const [zoomRange, setZoomRange] = useState({ start: 0, end: 100 });
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [candles, setCandles] = useState<CandlePattern[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  // Update indicators every 30 seconds
  useEffect(() => {
    const updateIndicators = () => {
      if (chartData.length > 0) {
        setPatterns(showPatterns ? detectPatterns(chartData) : []);
        setCandles(showCandles ? detectCandles(chartData) : []);
        setLevels(detectLevels(chartData));
      }
    };

    updateIndicators();
    const interval = setInterval(updateIndicators, 30000);
    return () => clearInterval(interval);
  }, [chartData, showPatterns, showCandles]);

  useEffect(() => {
    if (chartData.length > 0) {
      setZoomRange({ start: Math.max(0, chartData.length - 20), end: chartData.length - 1 });
    }
  }, [chartData.length]);

  const handleZoomIn = () => {
    const range = zoomRange.end - zoomRange.start;
    if (range > 5) {
      setZoomRange(prev => ({ ...prev, start: Math.min(prev.end - 5, prev.start + 2) }));
    }
  };

  const handleZoomOut = () => {
    setZoomRange(prev => ({ ...prev, start: Math.max(0, prev.start - 5) }));
  };

  const handleResetZoom = () => {
    setZoomRange({ start: 0, end: chartData.length - 1 });
  };

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

      <div className="h-[45rem] w-full bg-surface-container-high/20 rounded-[2.5rem] p-8 border border-outline-variant/10 relative overflow-hidden group/chart">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
        
        {/* Chart Controls Overlay */}
        <div className="absolute top-6 right-6 z-30 flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-surface-container-highest/50 backdrop-blur-md p-1.5 rounded-2xl border border-outline-variant/10">
            <button 
              onClick={() => onTogglePatterns?.(!showPatterns)}
              className={cn(
                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                showPatterns 
                  ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              )}
            >
              Patrones
            </button>
            <button 
              onClick={() => onToggleCandles?.(!showCandles)}
              className={cn(
                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                showCandles 
                  ? "bg-secondary text-on-secondary shadow-lg shadow-secondary/20" 
                  : "text-on-surface-variant hover:bg-surface-container-highest"
              )}
            >
              Velas
            </button>
          </div>

          <div className="flex items-center gap-2 bg-surface-container-highest/50 backdrop-blur-md p-1.5 rounded-2xl border border-outline-variant/10 self-end">
            <button onClick={handleZoomIn} className="p-2 hover:bg-surface-container-highest rounded-lg text-on-surface-variant transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
            <button onClick={handleZoomOut} className="p-2 hover:bg-surface-container-highest rounded-lg text-on-surface-variant transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button onClick={handleResetZoom} className="p-2 hover:bg-surface-container-highest rounded-lg text-on-surface-variant transition-colors" title="Reset View">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Interaction Hint */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover/chart:opacity-100 transition-opacity pointer-events-none">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
            <Move className="w-3 h-3" />
            Usa el deslizador inferior para navegar
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isBullish ? "#00ffa3" : "#ff7162"} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={isBullish ? "#00ffa3" : "#ff7162"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#666" 
              fontSize={10} 
              fontWeight="900" 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#666"
              fontSize={10}
              fontWeight="900"
              tickLine={false}
              axisLine={false}
              domain={['auto', 'auto']} 
              orientation="right"
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0a0c10', border: '1px solid #333', fontSize: '12px', borderRadius: '16px', fontWeight: '900', textTransform: 'uppercase' }}
              itemStyle={{ color: isBullish ? '#00ffa3' : '#ff7162' }}
              cursor={{ stroke: '#444', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isBullish ? "#00ffa3" : "#ff7162"} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              strokeWidth={4} 
              animationDuration={1000}
              activeDot={{ r: 6, strokeWidth: 0, fill: isBullish ? "#00ffa3" : "#ff7162" }}
            />

            {/* Render Static Levels (Support/Resistance) */}
            {levels.map((l, i) => (
              <ReferenceLine 
                key={`level-${i}`}
                y={l.price} 
                stroke={l.type === "SOPORTE" ? "#00ffa3" : "#ff7162"} 
                strokeOpacity={0.3}
                strokeDasharray="3 3"
                label={{ 
                  position: 'left', 
                  value: `${l.type}`, 
                  fill: l.type === "SOPORTE" ? "#00ffa3" : "#ff7162", 
                  fontSize: 8, 
                  fontWeight: 'black',
                  opacity: 0.5
                }} 
              />
            ))}

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

            {/* Zoom & Pan Brush */}
            <Brush 
              dataKey="name" 
              height={30} 
              stroke="#333" 
              fill="#0a0c10"
              travellerWidth={10}
              gap={1}
              startIndex={zoomRange.start}
              endIndex={zoomRange.end}
              onChange={(range: any) => setZoomRange({ start: range.startIndex, end: range.endIndex })}
            >
              <AreaChart>
                <Area dataKey="price" fill={isBullish ? "#00ffa3" : "#ff7162"} fillOpacity={0.2} stroke="none" />
              </AreaChart>
            </Brush>
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
