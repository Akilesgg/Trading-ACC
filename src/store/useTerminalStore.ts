import { create } from "zustand";
import { persist } from "zustand/middleware";
import { TradingSignal } from "../core/signals/types";

interface TerminalState {
  layout: any[];
  setLayout: (layout: any[]) => void;
  signals: TradingSignal[];
  addSignal: (signal: TradingSignal) => void;
  updateSignal: (id: string, status: any) => void;
  activeSymbol: string;
  setActiveSymbol: (symbol: string) => void;
  timeframe: string;
  setTimeframe: (tf: string) => void;
  logs: string[];
  addLog: (log: string) => void;
}

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set) => ({
      layout: [
        { i: "chart", x: 0, y: 0, w: 9, h: 20, static: false },
        { i: "signals", x: 9, y: 0, w: 3, h: 6, static: false },
        { i: "trade", x: 9, y: 6, w: 3, h: 8, static: false },
        { i: "orderbook", x: 9, y: 14, w: 3, h: 6, static: false },
      ],
      setLayout: (layout) => set({ layout }),
      signals: [],
      addSignal: (signal) => set((state) => ({ signals: [signal, ...state.signals] })),
      updateSignal: (id, status) => set((state) => ({
        signals: state.signals.map(s => s.id === id ? { ...s, status } : s)
      })),
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
