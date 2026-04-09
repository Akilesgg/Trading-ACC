import React, { useEffect } from "react";
import { useSignalStore } from "../../store/useSignalStore";
import { fetchTicker } from "../../services/cryptoService";
import { db, doc, updateDoc } from "../../services/firebase";

const SignalMonitor: React.FC = () => {
  const activeSignals = useSignalStore(state => state.activeSignals);

  useEffect(() => {
    const interval = setInterval(async () => {
      const signalsToMonitor = activeSignals.filter(s => s.estado === 'activa');

      if (signalsToMonitor.length === 0) return;

      for (const signal of signalsToMonitor) {
        try {
          const ticker = await fetchTicker(signal.activo);
          const currentPrice = parseFloat(ticker.price);
          const entry = signal.entry;
          const isLong = signal.tipo === "LONG";
          
          let shouldClose = false;
          
          if (isLong) {
            if (currentPrice <= signal.sl || currentPrice >= (signal.tp3 || signal.tp1 * 1.1)) {
              shouldClose = true;
            }
          } else {
            if (currentPrice >= signal.sl || currentPrice <= (signal.tp3 || signal.tp1 * 0.9)) {
              shouldClose = true;
            }
          }

          if (shouldClose && signal.id) {
            console.log(`🎯 SignalMonitor: Cerrando señal para ${signal.activo} por alcanzar TP/SL.`);
            const signalRef = doc(db, 'signals', signal.id);
            await updateDoc(signalRef, { estado: 'cerrada' });
          }
        } catch (error) {
          console.error(`Error monitoring signal ${signal.activo}:`, error);
        }
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [activeSignals]);

  return null;
};

export default SignalMonitor;
