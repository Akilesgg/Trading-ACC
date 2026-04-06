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
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6 shadow-xl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shadow-inner">
            <img 
              src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${selectedSymbol.replace("USDT", "").toLowerCase()}.png`} 
              className="w-8 h-8" 
              alt=""
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h3 className="text-2xl font-headline font-bold">{selectedSymbol.replace("USDT", "")}</h3>
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Binance Spot • {timeframe.toUpperCase()}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-headline font-bold">${ticker ? parseFloat(ticker.price).toLocaleString() : "---"}</p>
          <p className={cn("text-sm font-bold flex items-center justify-end gap-1", isBullish ? "text-primary" : "text-secondary")}>
            {isBullish ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {ticker?.priceChangePercent}%
          </p>
        </div>
      </div>

      <div className="h-64 w-full bg-surface-container-high/20 rounded-xl p-4 border border-outline-variant/10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isBullish ? "#00ffa3" : "#ff7162"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isBullish ? "#00ffa3" : "#ff7162"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="name" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', fontSize: '10px', borderRadius: '12px' }}
              itemStyle={{ color: isBullish ? '#00ffa3' : '#ff7162' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={isBullish ? "#00ffa3" : "#ff7162"} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              strokeWidth={3} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container p-4 rounded-xl space-y-1 border border-outline-variant/5">
          <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Máximo 24h</p>
          <p className="text-sm font-bold text-primary">${ticker ? parseFloat(ticker.highPrice).toLocaleString() : "---"}</p>
        </div>
        <div className="bg-surface-container p-4 rounded-xl space-y-1 border border-outline-variant/5">
          <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest">Mínimo 24h</p>
          <p className="text-sm font-bold text-secondary">${ticker ? parseFloat(ticker.lowPrice).toLocaleString() : "---"}</p>
        </div>
      </div>
    </div>
  );
};

export default MarketOverview;
