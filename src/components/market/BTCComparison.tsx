import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { calculateBTCCorrelation } from "@/services/cryptoService";
import { Activity, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BTCComparison: React.FC = () => {
  const [correlations, setCorrelations] = useState<{ symbol: string; correlation: number }[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const symbols = ["ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT"];
    const loadCorrelations = async () => {
      const results = await Promise.all(
        symbols.map(async (s) => ({
          symbol: s.replace("USDT", ""),
          correlation: await calculateBTCCorrelation(s)
        }))
      );
      setCorrelations(results);
    };
    loadCorrelations();
  }, []);

  return (
    <div className="trading-card p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-on-surface">Correlación con BTC</h3>
            <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest opacity-50">Basado en los últimos 30 días</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 justify-center py-4">
        {correlations.map((c) => (
          <motion.div
            key={c.symbol}
            whileHover={{ scale: 1.1, y: -5 }}
            onClick={() => navigate(`/analysis?symbol=${c.symbol}USDT`)}
            className="relative cursor-pointer group"
          >
            <div 
              className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-2 border-primary/20 bg-surface-container-high shadow-xl group-hover:border-primary/50 transition-all"
              style={{ 
                opacity: 0.5 + (c.correlation * 0.5),
                transform: `scale(${0.8 + (c.correlation * 0.4)})`
              }}
            >
              <span className="text-sm font-black text-on-surface">{c.symbol}</span>
              <span className="text-[10px] font-black text-primary">{(c.correlation * 100).toFixed(0)}%</span>
            </div>
            <div className="absolute -top-2 -right-2 bg-primary text-on-primary text-[8px] font-black px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              ANALIZAR
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
        <p className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest leading-relaxed">
          <span className="text-primary">TIP:</span> Los activos con baja correlación (&lt; 0.6) suelen ofrecer mejores oportunidades de diversificación durante movimientos bruscos de Bitcoin.
        </p>
      </div>
    </div>
  );
};

export default BTCComparison;
