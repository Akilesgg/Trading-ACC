import React, { useState, useEffect } from "react";
import { useTerminalStore } from "../../store/useTerminalStore";
import { TrendingUp, TrendingDown, Minus, Activity, Target, Shield, Zap, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const TerminalOrderbook: React.FC = () => {
  const { activeSymbol } = useTerminalStore();
  const [bids, setBids] = useState<any[]>([]);
  const [asks, setAsks] = useState<any[]>([]);

  const generateMockOrderbook = () => {
    const basePrice = 64231.42;
    const mockBids = [];
    const mockAsks = [];
    for (let i = 0; i < 20; i++) {
      mockBids.push({
        price: basePrice - (i * 2.5),
        amount: Math.random() * 5,
        total: Math.random() * 10,
        depth: Math.random() * 100
      });
      mockAsks.push({
        price: basePrice + (i * 2.5),
        amount: Math.random() * 5,
        total: Math.random() * 10,
        depth: Math.random() * 100
      });
    }
    return { bids: mockBids, asks: mockAsks.reverse() };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const { bids, asks } = generateMockOrderbook();
      setBids(bids);
      setAsks(asks);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeSymbol]);

  return (
    <div className="h-full flex flex-col p-4 bg-surface-container-low/50 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
          <Activity className="w-3 h-3" /> ORDER BOOK
        </h4>
        <div className="flex gap-2">
          <span className="text-[8px] font-black bg-surface-container-high text-on-surface-variant px-2 py-1 rounded-full uppercase tracking-widest">
            0.1 STEP
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 text-[8px] font-black text-on-surface-variant uppercase tracking-widest mb-2 px-2">
        <span>Precio</span>
        <span className="text-right">Cantidad</span>
        <span className="text-right">Total</span>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Asks (Sells) */}
        <div className="flex-1 overflow-hidden flex flex-col-reverse">
          {asks.map((ask, idx) => (
            <div key={idx} className="grid grid-cols-3 text-[10px] font-black py-0.5 px-2 relative group hover:bg-white/5 transition-colors">
              <div className="absolute inset-y-0 right-0 bg-secondary/10 transition-all duration-500" style={{ width: `${ask.depth}%` }} />
              <span className="text-secondary relative z-10">{ask.price.toFixed(2)}</span>
              <span className="text-right text-on-surface-variant relative z-10">{ask.amount.toFixed(4)}</span>
              <span className="text-right text-on-surface-variant relative z-10">{ask.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="py-4 my-2 border-y border-outline-variant/10 flex flex-col items-center justify-center bg-surface-container-high/30">
          <div className="flex items-center gap-3">
            <span className="text-lg font-headline font-black text-on-surface tracking-tighter">64,231.42</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          <span className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Spread: 0.01 (0.00%)</span>
        </div>

        {/* Bids (Buys) */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {bids.map((bid, idx) => (
            <div key={idx} className="grid grid-cols-3 text-[10px] font-black py-0.5 px-2 relative group hover:bg-white/5 transition-colors">
              <div className="absolute inset-y-0 right-0 bg-primary/10 transition-all duration-500" style={{ width: `${bid.depth}%` }} />
              <span className="text-primary relative z-10">{bid.price.toFixed(2)}</span>
              <span className="text-right text-on-surface-variant relative z-10">{bid.amount.toFixed(4)}</span>
              <span className="text-right text-on-surface-variant relative z-10">{bid.total.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TerminalOrderbook;
