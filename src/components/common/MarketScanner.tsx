import React, { useEffect, useRef } from "react";
import { fetchTickers, CryptoData } from "../../services/cryptoService";
import { sendTelegramAlert } from "../../services/telegramService";
import { useSignalStore } from "../../store/useSignalStore";
import { toast } from "sonner";

const SCAN_INTERVAL = 60000; // 1 minute
const SUPPORTED_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT",
  "DOTUSDT", "LINKUSDT", "MATICUSDT", "SHIBUSDT", "LTCUSDT", "TRXUSDT", "UNIUSDT", "ATOMUSDT"
];

const MarketScanner: React.FC = () => {
  const addSignal = useSignalStore(state => state.addSignal);
  const activeSignals = useSignalStore(state => state.activeSignals);
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const scan = async () => {
      try {
        const tickers = await fetchTickers(SUPPORTED_SYMBOLS);
        
        for (const ticker of tickers) {
          const proximity = ticker.proximity || 0;
          const consensus = ticker.consensus || 0;
          
          // Condition for automatic signal: Proximity < 0.5% OR Consensus > 90%
          const isSignal = proximity <= 0.5 || consensus >= 90;
          
          // Check if we already have an active signal for this asset to avoid duplicates
          const alreadyActive = activeSignals.some(s => s.activo === ticker.symbol && s.estado === 'activa');
          
          if (isSignal && !alreadyActive && !triggeredRef.current.has(ticker.symbol)) {
            const type = parseFloat(ticker.priceChangePercent) > 0 ? 'LONG' : 'SHORT';
            
            // Add to Global Store (Firestore) - This will trigger Telegram Alert automatically
            await addSignal({
              activo: ticker.symbol,
              tipo: type,
              entry: ticker.entry || parseFloat(ticker.price),
              tp1: ticker.takeProfits?.[0] || (parseFloat(ticker.price) * 1.05),
              tp2: ticker.takeProfits?.[1],
              tp3: ticker.takeProfits?.[2],
              sl: ticker.stopLoss || (parseFloat(ticker.price) * 0.95),
              estado: 'activa',
              leverage: `${ticker.leverage}x`,
              confidence: consensus || 85,
              analysis: `Señal automática detectada por el Escáner Cuántico. Consenso: ${consensus}%. Proximidad: ${proximity.toFixed(2)}%.`
            });
            
            triggeredRef.current.add(ticker.symbol);
            
            toast.success(`¡Nueva señal automática: ${ticker.symbol}!`, {
              description: `Enviada a Telegram con éxito.`,
              duration: 5000,
            });
          }
        }

        // Clean up triggeredRef for symbols that are no longer signals
        triggeredRef.current.forEach(symbol => {
          const ticker = tickers.find(t => t.symbol === symbol);
          if (ticker) {
            const proximity = ticker.proximity || 0;
            const consensus = ticker.consensus || 0;
            if (proximity > 2.0 && consensus < 70) {
              triggeredRef.current.delete(symbol);
            }
          }
        });

      } catch (error) {
        console.error("Error in MarketScanner:", error);
      }
    };

    scan();
    const interval = setInterval(scan, SCAN_INTERVAL);
    return () => clearInterval(interval);
  }, [addSignal, activeSignals]);

  return null;
};

export default MarketScanner;
