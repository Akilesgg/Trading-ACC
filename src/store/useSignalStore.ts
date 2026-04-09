import { create } from 'zustand';
import { db, collection, onSnapshot, query, orderBy, limit, addDoc, Timestamp, updateDoc, doc } from '@/services/firebase';
import { sendTelegramAlert } from '@/services/telegramService';

export interface Signal {
  id?: string;
  activo: string;
  tipo: 'LONG' | 'SHORT';
  entry: number;
  tp1: number;
  tp2?: number;
  tp3?: number;
  sl: number;
  estado: 'activa' | 'cerrada';
  timestamp: any;
  authorUid?: string;
}

interface SignalState {
  activeSignals: Signal[];
  loading: boolean;
  addSignal: (signal: Omit<Signal, 'id' | 'timestamp'>) => Promise<void>;
  closeSignal: (id: string) => Promise<void>;
  init: () => () => void;
}

export const useSignalStore = create<SignalState>((set, get) => ({
  activeSignals: [],
  loading: true,
  addSignal: async (signalData) => {
    try {
      await addDoc(collection(db, 'signals'), {
        ...signalData,
        timestamp: Timestamp.now(),
        estado: 'activa'
      });

      // Send Telegram Alert
      await sendTelegramAlert({
        symbol: signalData.activo,
        price: signalData.entry.toString(),
        change: "0", // Initial change
        type: signalData.tipo === 'LONG' ? 'BULLISH' : 'BEARISH',
        confidence: 90, // Default confidence for manual signals
        entry: signalData.entry.toString(),
        tp1: signalData.tp1.toString(),
        tp2: signalData.tp2?.toString(),
        tp3: signalData.tp3?.toString(),
        sl: signalData.sl.toString()
      });
    } catch (error) {
      console.error("Error adding signal:", error);
    }
  },
  closeSignal: async (id) => {
    try {
      const signalRef = doc(db, 'signals', id);
      await updateDoc(signalRef, { estado: 'cerrada' });
    } catch (error) {
      console.error("Error closing signal:", error);
    }
  },
  init: () => {
    const q = query(
      collection(db, 'signals'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const signals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Signal[];
      set({ activeSignals: signals, loading: false });
    });

    return unsubscribe;
  }
}));
