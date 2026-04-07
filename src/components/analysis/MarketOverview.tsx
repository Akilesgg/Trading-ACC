import React from "react";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CryptoData } from "@/services/cryptoService";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface MarketOverviewProps {
  ticker: CryptoData | null;
  selectedSymbol: string;
  chartData: any[];
  timeframe: string;
}

const MarketOverview: React.FC<MarketOverviewProps> = ({
  ticker,
  selectedSymbol,
  chartData,
  timeframe
}) => {
  const isBullish = ticker && parseFloat(ticker.priceChangePercent) >= 0;

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
            <h3 className="text-3xl font-black tracking-tighter text-on-surface leading-none mb-1">{selectedSymbol.replace("USDT", "")}</h3>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Binance Spot • {timeframe.toUpperCase()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black tracking-tighter text-on-surface leading-none mb-1">${ticker ? parseFloat(ticker.price).toLocaleString() : "---"}</p>
          <p className={cn("text-[10px] font-black flex items-center justify-end gap-1 uppercase tracking-widest", isBullish ? "text-primary" : "text-secondary")}>
            {isBullish ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {ticker?.priceChangePercent}%
          </p>
        </div>
      </div>

      <div className="h-64 w-full bg-surface-container-high/20 rounded-[2rem] p-6 border border-outline-variant/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
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
              contentStyle={{ backgroundColor: '#0a0c10', border: '1px solid #333', fontSize: '10px', borderRadius: '16px', fontWeight: '900', textTransform: 'uppercase' }}
              itemStyle={{ color: isBullish ? '#00ffa3' : '#ff7162' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isBullish ? "#00ffa3" : "#ff7162"} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              strokeWidth={4} 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-high p-5 rounded-2xl space-y-2 border border-outline-variant/5 group hover:border-primary/30 transition-all">
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Máximo 24h</p>
          <p className="text-sm font-black text-primary tracking-tighter">${ticker ? parseFloat(ticker.highPrice).toLocaleString() : "---"}</p>
        </div>
        <div className="bg-surface-container-high p-5 rounded-2xl space-y-2 border border-outline-variant/5 group hover:border-secondary/30 transition-all">
          <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Mínimo 24h</p>
          <p className="text-sm font-black text-secondary tracking-tighter">${ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "---"}</p>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
