import React from "react";
import { motion } from "motion/react";
import { Wallet, ArrowUpRight, ArrowDownRight, History, CreditCard, Plus, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WalletPage = () => {
  const assets = [
    { symbol: "BTC", name: "Bitcoin", balance: "0.0245", value: "1,542.20", change: "+2.4%" },
    { symbol: "ETH", name: "Ethereum", balance: "1.4200", value: "3,240.50", change: "-1.2%" },
    { symbol: "USDT", name: "Tether", balance: "1,240.50", value: "1,240.50", change: "0.0%" },
    { symbol: "SOL", name: "Solana", balance: "12.5000", value: "1,845.00", change: "+5.8%" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="pt-24 pb-32 px-6 max-w-7xl mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tighter uppercase">Mi Billetera</h1>
          <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest mt-1">Gestión de activos y fondos</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 transition-all">
            <Plus className="w-4 h-4" /> Depositar
          </button>
          <button className="bg-surface-container-high text-on-surface px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95 transition-all">
            Retirar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-primary to-primary-dim p-8 rounded-[2rem] text-on-primary-fixed shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">Balance Total Estimado</span>
                <Wallet className="w-6 h-6 opacity-70" />
              </div>
              <div className="space-y-1">
                <h2 className="text-5xl font-headline font-bold">$7,868.20</h2>
                <p className="text-sm font-bold opacity-70">≈ 0.12450000 BTC</p>
              </div>
              <div className="flex gap-4 pt-4">
                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md">
                  <p className="text-[10px] uppercase opacity-70">Ganancia 24h</p>
                  <p className="font-bold">+$245.12 (+3.2%)</p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md">
                  <p className="text-[10px] uppercase opacity-70">Margen Libre</p>
                  <p className="font-bold">$4,210.00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Assets List */}
          <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/10">
            <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center">
              <h3 className="font-headline font-bold uppercase tracking-wider">Tus Activos</h3>
              <button className="text-primary text-xs font-bold uppercase tracking-widest hover:underline">Ver todos</button>
            </div>
            <div className="divide-y divide-outline-variant/5">
              {assets.map((asset) => (
                <div key={asset.symbol} className="p-6 flex items-center justify-between hover:bg-surface-container-high/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center font-bold text-primary">
                      {asset.symbol[0]}
                    </div>
                    <div>
                      <p className="font-bold">{asset.name}</p>
                      <p className="text-xs text-on-surface-variant">{asset.symbol}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{asset.balance} {asset.symbol}</p>
                    <p className="text-xs text-on-surface-variant">${asset.value}</p>
                  </div>
                  <div className={cn("hidden sm:block text-right font-bold", asset.change.startsWith("+") ? "text-primary" : "text-secondary")}>
                    {asset.change}
                  </div>
                  <button className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors">
                    <ArrowRight className="w-4 h-4 text-on-surface-variant" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Quick Actions */}
          <div className="bg-surface-container-high p-6 rounded-2xl space-y-4">
            <h3 className="font-headline font-bold uppercase tracking-wider text-sm">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center gap-2 p-4 bg-surface-container rounded-xl hover:bg-primary/10 transition-all group">
                <ArrowUpRight className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Enviar</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-surface-container rounded-xl hover:bg-primary/10 transition-all group">
                <ArrowDownRight className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Recibir</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-surface-container rounded-xl hover:bg-primary/10 transition-all group">
                <CreditCard className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Tarjeta</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 bg-surface-container rounded-xl hover:bg-primary/10 transition-all group">
                <History className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Historial</span>
              </button>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-4">
            <div className="flex items-center gap-3 text-tertiary">
              <div className="w-8 h-8 rounded-lg bg-tertiary/10 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <h3 className="font-headline font-bold uppercase tracking-wider text-sm">Seguridad</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Tu billetera está protegida con cifrado de grado militar y autenticación de dos factores activa.
            </p>
            <button className="w-full py-3 border border-outline-variant/20 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-high transition-all">
              Configurar Seguridad
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default WalletPage;
