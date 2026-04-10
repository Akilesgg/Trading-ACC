import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TradingSignal } from "../core/signals/types";

interface TerminalState {
  layout: any[];
  setLayout: (layout: any[]) => void;
  signals: TradingSignal[];
  addSignal: (signal: TradingSignal) => void;
  updateSignal: (id: string, status: any) => void;
  updateSignals: (updatedSignals: TradingSignal[]) => void;
  activeSymbol: string;
  setActiveSymbol: (symbol: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  logs: string[];
  addLog: (log: string) => void;
}

import { useSignalStore } from "./useSignalStore";

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      layout: [
        { i: "analyzer", x: 0, y: 0, w: 9, h: 24, static: false },
        { i: "signals", x: 9, y: 0, w: 3, h: 8, static: false },
        { i: "orderbook", x: 9, y: 8, w: 3, h: 8, static: false },
        { i: "trade", x: 9, y: 16, w: 3, h: 8, static: false },
        { i: "backtest", x: 0, y: 24, w: 4, h: 6, static: false },
        { i: "alerts", x: 4, y: 24, w: 4, h: 6, static: false },
        { i: "console", x: 8, y: 24, w: 4, h: 6, static: false },
      ],
      setLayout: (layout) => set({ layout }),
      signals: [], // This will be synced with useSignalStore in the UI
      addSignal: (signal) => {
        // Redirect to useSignalStore
        useSignalStore.getState().addSignal({
          activo: signal.symbol,
          tipo: signal.type as any,
          entry: signal.entry,
          tp1: signal.takeProfit[0],
          tp2: signal.takeProfit[1],
          tp3: signal.takeProfit[2],
          sl: signal.stopLoss,
          estado: 'activa',
          leverage: `${signal.leverage || 20}x`,
          confidence: 90,
          analysis: "Señal ejecutada desde la Terminal."
        });
      },
      updateSignal: (id, status) => {
        // Redirect to useSignalStore if it's a close action
        if (status === 'CLOSED' || status === 'SL_HIT' || status === 'TP3_HIT') {
          useSignalStore.getState().closeSignal(id);
        }
      },
      updateSignals: (updatedSignals) => set({ signals: updatedSignals }),
      activeSymbol: "BTCUSDT",
      setActiveSymbol: (activeSymbol) => set({ activeSymbol }),
      timeframe: "1h",
      setTimeframe: (timeframe) => set({ timeframe }),
      logs: ["Terminal initialized..."],
      addLog: (log) => set((state) => ({ logs: [`[${new Date().toLocaleTimeString()}] ${log}`, ...state.logs.slice(0, 49)] })),
    }),
    {
      name: "terminal-storage",
    }
  )
);
