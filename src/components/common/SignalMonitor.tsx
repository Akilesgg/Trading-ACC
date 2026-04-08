import React, { useEffect } from "react";
import { useTerminalStore } from "../../store/useTerminalStore";
import { fetchTicker } from "../../services/cryptoService";
import { SignalStatus, TradingSignal } from "../../core/signals/types";

const SignalMonitor: React.FC = () => {
  const { signals, updateSignals } = useTerminalStore();

  useEffect(() => {
    const interval = setInterval(async () => {
      const openSignals = signals.filter(s => 
        s.status === SignalStatus.CONFIRMED || 
        s.status === SignalStatus.OPEN ||
        s.status === SignalStatus.TP1_HIT ||
        s.status === SignalStatus.TP2_HIT
      );

      if (openSignals.length === 0) return;

      const updatedSignals = [...signals];
      let hasChanges = false;

      for (const signal of openSignals) {
        try {
          const ticker = await fetchTicker(signal.symbol);
          const currentPrice = parseFloat(ticker.price);
          const entry = signal.entry;
          const isLong = signal.type === "LONG";
          
          let newStatus = signal.status;
          let profit = isLong 
            ? ((currentPrice - entry) / entry) * 100 
            : ((entry - currentPrice) / entry) * 100;

          // Check TP/SL
          if (isLong) {
            if (currentPrice <= signal.stopLoss) {
              newStatus = SignalStatus.SL_HIT;
              profit = ((signal.stopLoss - entry) / entry) * 100;
            } else if (currentPrice >= signal.takeProfit[2]) {
              newStatus = SignalStatus.TP3_HIT;
              profit = ((signal.takeProfit[2] - entry) / entry) * 100;
            } else if (currentPrice >= signal.takeProfit[1]) {
              newStatus = SignalStatus.TP2_HIT;
              profit = ((signal.takeProfit[1] - entry) / entry) * 100;
            } else if (currentPrice >= signal.takeProfit[0]) {
              newStatus = SignalStatus.TP1_HIT;
              profit = ((signal.takeProfit[0] - entry) / entry) * 100;
            } else {
              newStatus = SignalStatus.OPEN;
            }
          } else {
            // SHORT
            if (currentPrice >= signal.stopLoss) {
              newStatus = SignalStatus.SL_HIT;
              profit = ((entry - signal.stopLoss) / entry) * 100;
            } else if (currentPrice <= signal.takeProfit[2]) {
              newStatus = SignalStatus.TP3_HIT;
              profit = ((entry - signal.takeProfit[2]) / entry) * 100;
            } else if (currentPrice <= signal.takeProfit[1]) {
              newStatus = SignalStatus.TP2_HIT;
              profit = ((entry - signal.takeProfit[1]) / entry) * 100;
            } else if (currentPrice <= signal.takeProfit[0]) {
              newStatus = SignalStatus.TP1_HIT;
              profit = ((entry - signal.takeProfit[0]) / entry) * 100;
            } else {
              newStatus = SignalStatus.OPEN;
            }
          }

          if (newStatus !== signal.status || Math.abs((signal.profit || 0) - profit) > 0.01) {
            const idx = updatedSignals.findIndex(s => s.id === signal.id);
            if (idx !== -1) {
              updatedSignals[idx] = { 
                ...signal, 
                status: newStatus, 
                profit, 
                lastPrice: currentPrice 
              };
              hasChanges = true;
            }
          }
        } catch (error) {
          console.error(`Error monitoring signal ${signal.symbol}:`, error);
        }
      }

      if (hasChanges) {
        updateSignals(updatedSignals);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [signals, updateSignals]);

  return null;
};

export default SignalMonitor;
