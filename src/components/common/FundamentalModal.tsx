import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { AssetFundamental } from "@/services/cryptoService";

interface FundamentalModalProps {
  data: AssetFundamental | null;
  onClose: () => void;
}

const FundamentalModal: React.FC<FundamentalModalProps> = ({ data, onClose }) => {
  return (
    <AnimatePresence>
      {data && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="trading-card max-w-2xl w-full rounded-[3rem] border border-outline-variant/20 overflow-hidden shadow-[0_0_100px_rgba(0,255,163,0.1)] p-0"
          >
            <div className="bg-gradient-to-br from-primary/10 via-transparent to-transparent p-10 relative">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-3 bg-surface-container-high hover:border-primary/30 rounded-2xl border border-outline-variant/10 transition-all group shadow-lg"
              >
                <X className="w-6 h-6 text-on-surface-variant group-hover:text-primary transition-colors" />
              </button>
              
              <div className="flex items-center gap-8 mb-10">
                <div className="w-20 h-20 bg-surface-container-high rounded-3xl flex items-center justify-center p-4 border border-primary/30 shadow-2xl shadow-primary/10 group-hover:scale-110 transition-transform">
                  <img 
                    src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${data.symbol.toLowerCase()}.png`} 
                    className="w-12 h-12" 
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => (e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2584/2584687.png")}
                  />
                </div>
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter text-on-surface mb-2">{data.name}</h2>
                  <span className="px-4 py-1.5 bg-primary/10 text-primary text-[11px] font-black rounded-xl uppercase tracking-widest border border-primary/20 shadow-lg shadow-primary/5">
                    {data.type}
                  </span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="bg-surface-container-high/50 p-6 rounded-2xl border border-outline-variant/10">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-primary mb-3 opacity-70">Proyecto & Equipo</h3>
                  <p className="text-sm font-black text-on-surface tracking-tight leading-relaxed">{data.project}</p>
                </div>
                
                <div className="bg-surface-container-high/50 p-6 rounded-2xl border border-outline-variant/10">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-primary mb-3 opacity-70">Resumen del Activo</h3>
                  <p className="text-sm text-on-surface-variant font-medium leading-relaxed opacity-80">{data.summary}</p>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface-container-high/50 p-4 rounded-2xl border border-outline-variant/10 text-center">
                    <p className="text-[8px] font-black text-on-surface-variant uppercase mb-1">Suministro</p>
                    <p className="text-xs font-black text-on-surface">{data.marketData.supply}</p>
                  </div>
                  <div className="bg-surface-container-high/50 p-4 rounded-2xl border border-outline-variant/10 text-center">
                    <p className="text-[8px] font-black text-on-surface-variant uppercase mb-1">Máximo Histórico</p>
                    <p className="text-xs font-black text-on-surface">{data.marketData.allTimeHigh}</p>
                  </div>
                  <div className="bg-surface-container-high/50 p-4 rounded-2xl border border-outline-variant/10 text-center">
                    <p className="text-[8px] font-black text-on-surface-variant uppercase mb-1">Ranking MC</p>
                    <p className="text-xs font-black text-on-surface">#{data.marketData.marketCapRank}</p>
                  </div>
                </div>

                <div className="p-8 bg-primary/5 rounded-[2rem] border border-primary/20 shadow-xl shadow-primary/5 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-primary/5 blur-3xl -mr-32 -mt-32 group-hover:bg-primary/10 transition-all duration-1000"></div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-primary mb-4 relative z-10">Potencial de Inversión</h3>
                  <p className="text-sm text-on-surface font-black leading-relaxed tracking-tight relative z-10">{data.potential}</p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {data.links.map((link, i) => (
                    <a 
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-surface-container-high hover:bg-primary/10 border border-outline-variant/10 hover:border-primary/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-on-surface-variant hover:text-primary"
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-8 bg-surface-container-high/50 flex justify-end border-t border-outline-variant/10">
              <button 
                onClick={onClose}
                className="btn-primary px-12 py-4 text-[11px]"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default FundamentalModal;
