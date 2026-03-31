import { useState, useEffect } from 'react';
import { db, collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, OperationType, handleFirestoreError } from '@/firebase';
import { useAuth } from '@/AuthProvider';

export interface TradeRecord {
  id?: string;
  uid: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: number;
  amount: number;
  total: number;
  timestamp: Timestamp;
}

export function useTrades() {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTrades([]);
      setLoading(false);
      return;
    }

    const tradesRef = collection(db, 'trades');
    const q = query(
      tradesRef,
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradeList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TradeRecord[];
      setTrades(tradeList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'trades');
    });

    return () => unsubscribe();
  }, [user]);

  const executeTrade = async (trade: Omit<TradeRecord, 'uid' | 'timestamp'>) => {
    if (!user) return;

    try {
      await addDoc(collection(db, 'trades'), {
        ...trade,
        uid: user.uid,
        timestamp: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'trades');
    }
  };

  return { trades, executeTrade, loading };
}
