import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { AssetFundamental } from "@/services/cryptoService";

interface FundamentalModalProps {
  fundamental: AssetFundamental | null;
  onClose: () => void;
}

const FundamentalModal: React.FC<FundamentalModalProps> = ({ fundamental, onClose }) => {
  return (
    <AnimatePresence>
      {fundamental && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-surface-container-low max-w-lg w-full rounded-[2.5rem] border border-outline-variant/20 overflow-hidden shadow-2xl"
          >
            <div className="bg-gradient-to-br from-primary/20 to-transparent p-8 relative">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 bg-surface-container rounded-2xl flex items-center justify-center border border-primary/30 shadow-xl">
                  <img 
                    src={`https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${fundamental.symbol.toLowerCase()}.png`} 
                    className="w-10 h-10" 
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={(e) => (e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2584/2584687.png")}
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-black uppercase tracking-tighter">{fundamental.name}</h2>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest border border-primary/20">
                    {fundamental.type}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Proyecto & Equipo</h3>
                  <p className="text-sm font-bold text-on-surface">{fundamental.project}</p>
                </div>
                
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Resumen del Activo</h3>
                  <p className="text-sm text-on-surface-variant leading-relaxed">{fundamental.summary}</p>
                </div>

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Potencial de Inversión</h3>
                  <p className="text-sm text-on-surface font-medium leading-relaxed">{fundamental.potential}</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-surface-container-high/50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-8 py-3 bg-on-surface text-surface-container-lowest rounded-xl font-black uppercase tracking-widest text-xs"
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
