import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTerminalStore } from "../../store/useTerminalStore";
import { toast } from "sonner";

interface PriceAlert {
  id: string;
  symbol: string;
  price: number;
  condition: "ABOVE" | "BELOW";
  active: boolean;
}

const TerminalAlerts: React.FC = () => {
  const { activeSymbol } = useTerminalStore();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [newPrice, setNewPrice] = useState("");
  const [condition, setCondition] = useState<"ABOVE" | "BELOW">("ABOVE");

  useEffect(() => {
    const saved = localStorage.getItem("price-alerts");
    if (saved) setAlerts(JSON.parse(saved));
  }, []);

  const saveAlerts = (updated: PriceAlert[]) => {
    setAlerts(updated);
    localStorage.setItem("price-alerts", JSON.stringify(updated));
  };

  const addAlert = () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      toast.error("Introduce un precio válido");
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      symbol: activeSymbol,
      price: parseFloat(newPrice),
      condition,
      active: true
    };

    saveAlerts([...alerts, alert]);
    setNewPrice("");
    toast.success(`Alerta creada para ${activeSymbol} a $${newPrice}`);
  };

  const removeAlert = (id: string) => {
    saveAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
            <Bell className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="text-[12px] font-black uppercase tracking-widest text-on-surface">Alertas de Precio</h3>
            <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">Notificaciones en Tiempo Real</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <input 
              type="number" 
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="PRECIO..."
              className="w-full bg-surface-container-high/50 border border-outline-variant/10 rounded-xl py-2.5 px-4 text-[11px] font-black focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <select 
            value={condition}
            onChange={(e) => setCondition(e.target.value as any)}
            className="bg-surface-container-high/50 border border-outline-variant/10 rounded-xl px-3 text-[10px] font-black uppercase focus:outline-none"
          >
            <option value="ABOVE">ARRIBA</option>
            <option value="BELOW">ABAJO</option>
          </select>
          <button 
            onClick={addAlert}
            className="p-2.5 bg-primary text-on-primary rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {alerts.filter(a => a.symbol === activeSymbol).map((alert) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-4 bg-surface-container-highest/30 rounded-2xl border border-outline-variant/5 group"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    alert.condition === "ABOVE" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                  )}>
                    {alert.condition === "ABOVE" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black text-on-surface">${alert.price.toLocaleString()}</p>
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest opacity-50">
                      {alert.condition === "ABOVE" ? "Cruza hacia arriba" : "Cruza hacia abajo"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => removeAlert(alert.id)}
                  className="p-2 text-on-surface-variant hover:text-secondary opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {alerts.filter(a => a.symbol === activeSymbol).length === 0 && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-4 opacity-20">
              <AlertTriangle className="w-10 h-10" />
              <p className="text-[9px] font-black uppercase tracking-widest">No hay alertas activas para {activeSymbol}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TerminalAlerts;
