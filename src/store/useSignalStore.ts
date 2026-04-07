import { create } from 'zustand';
import { CryptoData } from '@/services/cryptoService';

interface SignalState {
  activeSignals: CryptoData[];
  addSignal: (signal: CryptoData) => void;
  removeSignal: (symbol: string) => void;
  clearSignals: () => void;
}

export const useSignalStore = create<SignalState>((set) => ({
  activeSignals: [],
  addSignal: (signal) => set((state) => {
    const exists = state.activeSignals.find(s => s.symbol === signal.symbol);
    if (exists) return state;
    return { activeSignals: [signal, ...state.activeSignals].slice(0, 5) };
  }),
  removeSignal: (symbol) => set((state) => ({
    activeSignals: state.activeSignals.filter(s => s.symbol !== symbol)
  })),
  clearSignals: () => set({ activeSignals: [] }),
}));
