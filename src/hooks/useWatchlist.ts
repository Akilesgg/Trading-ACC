import { useState, useEffect } from 'react';
import { db, doc, onSnapshot, setDoc, Timestamp, OperationType, handleFirestoreError } from '@/firebase';
import { useAuth } from '@/AuthProvider';

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    const watchlistRef = doc(db, 'watchlists', user.uid);
    const unsubscribe = onSnapshot(watchlistRef, (doc) => {
      if (doc.exists()) {
        setWatchlist(doc.data().symbols || []);
      } else {
        setWatchlist([]);
      }
      setLoading(false);
    }, (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, `watchlists/${user.uid}`);
      } catch (e) {
        console.error("Watchlist onSnapshot error:", e);
      }
      setLoading(false); // Ensure loading state is resolved even on error
    });

    return () => unsubscribe();
  }, [user]);

  const toggleWatchlist = async (symbol: string) => {
    if (!user) return;

    const newWatchlist = watchlist.includes(symbol)
      ? watchlist.filter(s => s !== symbol)
      : [...watchlist, symbol];

    const watchlistRef = doc(db, 'watchlists', user.uid);
    try {
      await setDoc(watchlistRef, {
        uid: user.uid,
        symbols: newWatchlist,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `watchlists/${user.uid}`);
    }
  };

  return { watchlist, toggleWatchlist, loading };
}
