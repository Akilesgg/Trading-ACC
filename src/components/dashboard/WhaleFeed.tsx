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
    <div className="trading-card p-0 border border-orange-500/30 overflow-hidden shadow-2xl group/card">
      <div className="bg-gradient-to-r from-orange-600/20 to-transparent p-8 border-b border-orange-500/20 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-orange-500/5 blur-3xl -mr-32 -mt-32 group-hover/card:bg-orange-500/10 transition-all duration-1000"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-orange-500/30 group-hover/card:scale-110 transition-transform">
            <Target className="w-8 h-8 text-black" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-widest text-orange-500 leading-none mb-2">
              COPIA DE TRADING | BALLENAS Y MEJORES TRADERS
            </h3>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Monitoreo en tiempo real de flujos institucionales</p>
          </div>
        </div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-3 px-5 py-2 bg-surface-container-high rounded-2xl border border-outline-variant/10 shadow-lg">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Ballenas: {whaleMovements.length}</span>
          </div>
          <div className="flex items-center gap-3 px-5 py-2 bg-surface-container-high rounded-2xl border border-outline-variant/10 shadow-lg">
            <Users className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Traders: {topTraders.length}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-outline-variant/10">
        {/* Whale Movements */}
        <div className="p-8 space-y-8">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-3">
            <Waves className="w-4 h-4" /> MOVIMIENTOS DE BALLENAS
          </h4>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
            {whaleMovements.map((whale, i) => (
              <div 
                key={i} 
                className="bg-surface-container-high/40 p-5 rounded-[1.5rem] border border-outline-variant/5 space-y-4 group hover:border-orange-500/30 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-surface-container-highest rounded-xl flex items-center justify-center border border-outline-variant/10 shadow-inner group-hover:scale-110 transition-transform">
                      <img 
                        src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${whale.symbol.replace("USDT", "").toLowerCase()}.png`} 
                        className="w-6 h-6" 
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-on-surface leading-none mb-1 uppercase tracking-widest">{whale.symbol}</p>
                      <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">{whale.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest mb-1", whale.type === "COMPRA" ? "text-primary" : "text-secondary")}>{whale.type}</p>
                    <p className="text-[11px] font-black text-on-surface tracking-tighter">{whale.amount}</p>
                  </div>
                </div>
                
                <p className="text-[10px] text-on-surface-variant leading-relaxed italic font-medium opacity-80">
                  {whale.details}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg",
                    whale.recommendation === "COMPRA" ? "bg-primary/10 text-primary border border-primary/20" :
                    whale.recommendation === "VENTA" ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-tertiary/10 text-tertiary border border-tertiary/20"
                  )}>
                    REC: {whale.recommendation}
                  </div>
                  <a 
                    href={whale.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-orange-500 uppercase hover:text-orange-400 transition-colors flex items-center gap-2 group/link"
                  >
                    Ver Fuente <ArrowRightLeft className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Traders */}
        <div className="p-8 space-y-8">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-3">
            <Users className="w-4 h-4" /> TOP TRADERS
          </h4>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
            {topTraders.map((trader, i) => (
              <div 
                key={i} 
                className="bg-surface-container-high/40 p-5 rounded-[1.5rem] border border-outline-variant/5 space-y-4 group hover:border-orange-500/30 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-surface-container-highest rounded-full flex items-center justify-center border border-outline-variant/10 shadow-inner group-hover:scale-110 transition-transform">
                      <Users className="w-5 h-5 text-on-surface-variant" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-on-surface leading-none mb-1 uppercase tracking-widest">{trader.name}</p>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">{trader.profit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className={cn("text-[10px] font-black uppercase tracking-widest", trader.trade.includes("LARGO") ? "text-primary" : "text-secondary")}>{trader.trade}</p>
                    <div className="w-8 h-8 rounded-xl border border-orange-500/30 flex items-center justify-center text-[10px] font-black text-orange-500 bg-orange-500/5 shadow-lg shadow-orange-500/5">
                      {trader.score}
                    </div>
                  </div>
                </div>

                <p className="text-[10px] text-on-surface-variant leading-relaxed italic font-medium opacity-80">
                  {trader.details}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg",
                    trader.recommendation === "COMPRA" ? "bg-primary/10 text-primary border border-primary/20" :
                    trader.recommendation === "VENTA" ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-tertiary/10 text-tertiary border border-tertiary/20"
                  )}>
                    REC: {trader.recommendation}
                  </div>
                  <a 
                    href={trader.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-orange-500 uppercase hover:text-orange-400 transition-colors flex items-center gap-2 group/link"
                  >
                    Estrategia <ArrowRightLeft className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Large Transactions */}
        <div className="p-8 space-y-8">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-orange-500 flex items-center gap-3">
            <ArrowRightLeft className="w-4 h-4" /> GRANDES TX
          </h4>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
            {largeTransactions.map((tx, i) => (
              <div 
                key={i} 
                className="bg-surface-container-high/40 p-5 rounded-[1.5rem] border border-outline-variant/5 space-y-4 group hover:border-orange-500/30 transition-all shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-black text-on-surface leading-none mb-1 uppercase tracking-widest">{tx.symbol}</p>
                    <p className="text-[9px] font-black text-on-surface-variant font-mono tracking-tighter opacity-50">{tx.address}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest mb-1",
                      tx.type === "Acumulación" ? "text-orange-500" : 
                      tx.type === "Depósito" ? "text-yellow-500" : "text-secondary"
                    )}>
                      {tx.type}
                    </p>
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">{tx.time}</p>
                  </div>
                </div>

                <p className="text-[10px] text-on-surface-variant leading-relaxed italic font-medium opacity-80">
                  {tx.details}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/5">
                  <div className={cn(
                    "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg",
                    tx.recommendation === "COMPRA" ? "bg-primary/10 text-primary border border-primary/20" :
                    tx.recommendation === "VENTA" ? "bg-secondary/10 text-secondary border border-secondary/20" : "bg-tertiary/10 text-tertiary border border-tertiary/20"
                  )}>
                    REC: {tx.recommendation}
                  </div>
                  <a 
                    href={tx.sourceUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[9px] font-black text-orange-500 uppercase hover:text-orange-400 transition-colors flex items-center gap-2 group/link"
                  >
                    Explorer <ArrowRightLeft className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhaleFeed;
