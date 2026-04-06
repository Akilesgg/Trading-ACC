import { create } from "zustand";
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

export const useTerminalStore = create<TerminalState>((set) => ({
  layout: [
    { i: "chart", x: 0, y: 0, w: 8, h: 12 },
    { i: "signals", x: 8, y: 0, w: 4, h: 6 },
    { i: "orderbook", x: 8, y: 6, w: 4, h: 6 },
    { i: "console", x: 0, y: 12, w: 12, h: 4 },
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
}));
