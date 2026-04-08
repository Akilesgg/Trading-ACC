import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Plus, X, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { sendTelegramAlert } from "../../services/telegramService";
import { cn } from "@/lib/utils";

interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: "ABOVE" | "BELOW";
  triggered: boolean;
  createdAt: number;
}

interface PriceAlertsProps {
  currentPrices: Record<string, number>;
}

const PriceAlerts: React.FC<PriceAlertsProps> = ({ currentPrices }) => {
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    const saved = localStorage.getItem("price_alerts");
    return saved ? JSON.parse(saved) : [];
  });

  const [newSymbol, setNewSymbol] = useState("BTCUSDT");
  const [newPrice, setNewPrice] = useState("");
  const [newCondition, setNewCondition] = useState<"ABOVE" | "BELOW">("ABOVE");

  useEffect(() => {
    localStorage.setItem("price_alerts", JSON.stringify(alerts));
  }, [alerts]);

  // Check alerts
  useEffect(() => {
    const activeAlerts = alerts.filter(a => !a.triggered);
    if (activeAlerts.length === 0) return;

    let hasChanges = false;
    const updatedAlerts = [...alerts];

    activeAlerts.forEach(alert => {
      const currentPrice = currentPrices[alert.symbol];
      if (!currentPrice) return;

      const isTriggered = alert.condition === "ABOVE" 
        ? currentPrice >= alert.targetPrice 
        : currentPrice <= alert.targetPrice;

      if (isTriggered) {
        const alertIdx = updatedAlerts.findIndex(a => a.id === alert.id);
        if (alertIdx !== -1) {
          updatedAlerts[alertIdx].triggered = true;
          hasChanges = true;

          const message = `🚨 ALERTA: ${alert.symbol} ha superado $${alert.targetPrice.toLocaleString()} — Precio actual: $${currentPrice.toLocaleString()}`;
          
          toast.warning(message, {
            duration: 10000,
            icon: <Bell className="w-5 h-5 text-secondary" />
          });

          // Send Telegram
          sendTelegramAlert({
            symbol: alert.symbol,
            price: currentPrice.toString(),
            change: "0",
            type: "SIGNAL",
            confidence: 100,
            analysis: message
          });
        }
      }
    });

    if (hasChanges) {
      setAlerts(updatedAlerts);
    }
  }, [currentPrices, alerts]);

  const addAlert = () => {
    if (!newPrice || isNaN(parseFloat(newPrice))) {
      toast.error("Introduce un precio válido");
      return;
    }

    const alert: PriceAlert = {
      id: Date.now().toString(),
      symbol: newSymbol.toUpperCase(),
      targetPrice: parseFloat(newPrice),
      condition: newCondition,
      triggered: false,
      createdAt: Date.now()
    };

    setAlerts([alert, ...alerts]);
    setNewPrice("");
    toast.success("Alerta configurada correctamente");
  };

  const removeAlert = (id: string) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

  return (
    <div className="trading-card space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center border border-secondary/20">
            <Bell className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-on-surface">Alertas de Precio</h3>
            <p className="text-[8px] font-black text-on-surface-variant uppercase tracking-widest">Notificaciones personalizadas</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input 
          type="text" 
          value={newSymbol}
          onChange={(e) => setNewSymbol(e.target.value)}
          placeholder="SÍMBOLO (BTCUSDT)"
          className="bg-surface-container-high/50 border border-outline-variant/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-secondary/50 transition-all"
        />
        <input 
          type="number" 
          value={newPrice}
          onChange={(e) => setNewPrice(e.target.value)}
          placeholder="PRECIO OBJETIVO"
          className="bg-surface-container-high/50 border border-outline-variant/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-secondary/50 transition-all"
        />
        <div className="flex gap-2">
          <select 
            value={newCondition}
            onChange={(e) => setNewCondition(e.target.value as any)}
            className="flex-1 bg-surface-container-high/50 border border-outline-variant/10 rounded-xl px-4 py-2.5 text-[10px] font-black uppercase tracking-widest focus:outline-none focus:border-secondary/50 transition-all appearance-none"
          >
            <option value="ABOVE">ABOVE</option>
            <option value="BELOW">BELOW</option>
          </select>
          <button 
            onClick={addAlert}
            className="w-12 h-12 bg-secondary text-on-secondary rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-secondary/20"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
        <AnimatePresence initial={false}>
          {alerts.length > 0 ? alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={cn(
                "flex items-center justify-between p-4 rounded-2xl border transition-all",
                alert.triggered 
                  ? "bg-surface-container-low/30 border-outline-variant/5 opacity-50" 
                  : "bg-surface-container-high/40 border-outline-variant/10 hover:border-secondary/30"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  alert.condition === "ABOVE" ? "bg-primary/10 text-primary" : "bg-secondary/10 text-secondary"
                )}>
                  {alert.condition === "ABOVE" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-tighter text-on-surface">{alert.symbol}</p>
                  <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
                    {alert.condition} ${alert.targetPrice.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {alert.triggered && (
                  <span className="text-[8px] font-black text-secondary uppercase tracking-widest bg-secondary/10 px-2 py-1 rounded-md">DISPARADA</span>
                )}
                <button 
                  onClick={() => removeAlert(alert.id)}
                  className="p-2 hover:bg-secondary/10 text-on-surface-variant hover:text-secondary rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )) : (
            <div className="py-10 text-center opacity-20">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-[9px] font-black uppercase tracking-widest">No hay alertas configuradas</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PriceAlerts;
