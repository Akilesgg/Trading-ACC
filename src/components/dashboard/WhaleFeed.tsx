import React from "react";
import { 
  Target, 
  Zap, 
  Users, 
  Waves, 
  ArrowRightLeft 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WhaleFeedProps {
  whaleMovements: any[];
  topTraders: any[];
  largeTransactions: any[];
}

const WhaleFeed: React.FC<WhaleFeedProps> = ({ whaleMovements, topTraders, largeTransactions }) => {
  return (
    <div className="bg-[#0a0c10] border border-orange-500/30 rounded-2xl overflow-hidden shadow-2xl">
      <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-4 border-b border-orange-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Target className="w-5 h-5 text-black" />
          </div>
          <h3 className="text-sm font-black uppercase tracking-widest text-orange-500">
            COPY TRADING | WHALES & TOP TRADERS EN VIVO
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
            <Zap className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Ballenas Activas: {whaleMovements.length}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container rounded-full border border-outline-variant/10">
            <Users className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-bold text-on-surface-variant uppercase">Top Traders: {topTraders.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-x divide-outline-variant/10">
        {/* Whale Movements */}
        <div className="p-4 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
            <Waves className="w-3 h-3" /> MOVIMIENTOS DE BALLENAS
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {whaleMovements.map((whale, i) => (
              <a 
                key={i} 
                href={whale.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-surface-container rounded flex items-center justify-center">
                    <img 
                      src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} 
                      className="w-4 h-4" 
                      alt=""
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface">{whale.symbol}</p>
                    <p className="text-[8px] text-on-surface-variant uppercase">{whale.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-[10px] font-black", whale.type === "COMPRA" ? "text-primary" : "text-secondary")}>{whale.type}</p>
                  <p className="text-[10px] font-bold text-on-surface">{whale.amount}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Top Traders */}
        <div className="p-4 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
            <Users className="w-3 h-3" /> TOP TRADERS
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {topTraders.map((trader, i) => (
              <a 
                key={i} 
                href={trader.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-surface-container rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-on-surface-variant" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-on-surface">{trader.name}</p>
                    <p className="text-[8px] text-on-surface-variant uppercase">{trader.profit}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn("text-[10px] font-black", trader.trade.includes("LARGO") ? "text-primary" : "text-secondary")}>{trader.trade}</p>
                </div>
                <div className="w-6 h-6 rounded-full border border-orange-500/30 flex items-center justify-center text-[8px] font-bold text-orange-500">
                  {trader.score}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Large Transactions */}
        <div className="p-4 space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-2">
            <ArrowRightLeft className="w-3 h-3" /> GRANDES TX
          </h4>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {largeTransactions.map((tx, i) => (
              <a 
                key={i} 
                href={tx.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between group cursor-pointer hover:bg-surface-container/30 p-1 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-[10px] font-bold text-on-surface">{tx.symbol}</p>
                  <p className="text-[8px] text-on-surface-variant font-mono">{tx.address}</p>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-[10px] font-black uppercase",
                    tx.type === "Acumulación" ? "text-orange-500" : 
                    tx.type === "Depósito" ? "text-yellow-500" : "text-secondary"
                  )}>
                    {tx.type}
                  </p>
                  <p className="text-[8px] text-on-surface-variant">{tx.time}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhaleFeed;
