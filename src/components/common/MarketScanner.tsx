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
  const currentTimeframe = useSignalStore(state => state.currentTimeframe);
  const activeSignalsRef = useRef(activeSignals);
  const triggeredRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    activeSignalsRef.current = activeSignals;
  }, [activeSignals]);

  useEffect(() => {
    const scan = async () => {
      console.log(`🔍 MarketScanner: Iniciando escaneo de mercado (${currentTimeframe})...`);
      try {
        const tickers = await fetchTickers(SUPPORTED_SYMBOLS);
        console.log(`📊 MarketScanner: Se obtuvieron ${tickers.length} tickers.`);
        
        if (tickers.length === 0) {
          console.warn("⚠️ MarketScanner: No se obtuvieron tickers de la API.");
          return;
        }

        for (const ticker of tickers) {
          const proximity = ticker.proximity || 0;
          const consensus = ticker.consensus || 0;
          
          // Condition for automatic signal: Proximity < 2.0% OR Consensus > 90%
          const isSignal = proximity <= 2.0 || consensus >= 90;
          
          // Check if we already have an active signal for this asset in the store with the SAME timeframe
          const alreadyActiveInStore = activeSignalsRef.current.some(s => 
            s.activo === ticker.symbol && 
            s.estado === 'activa' && 
            s.timeframe === currentTimeframe
          );
          
          // Check if we already triggered it in this session for this timeframe
          const triggerKey = `${ticker.symbol}_${currentTimeframe}`;
          const alreadyTriggered = triggeredRef.current.has(triggerKey);

          if (isSignal && !alreadyActiveInStore && !alreadyTriggered) {
            console.log(`🚀 MarketScanner: ¡SEÑAL DETECTADA para ${ticker.symbol} en ${currentTimeframe}!`);
            const type = parseFloat(ticker.priceChangePercent) > 0 ? 'LONG' : 'SHORT';
            
            try {
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
                timeframe: currentTimeframe,
                analysis: `Señal automática detectada por el Escáner Cuántico en temporalidad ${currentTimeframe}. Consenso: ${consensus}%.`
              });
              
              triggeredRef.current.add(triggerKey);
              console.log(`✅ MarketScanner: Señal de ${ticker.symbol} (${currentTimeframe}) añadida correctamente.`);
            } catch (addError) {
              console.error(`❌ MarketScanner: Error al añadir señal para ${ticker.symbol}:`, addError);
            }
          }
        }

        // Clean up triggeredRef
        triggeredRef.current.forEach(key => {
          const [symbol, tf] = key.split('_');
          if (tf !== currentTimeframe) return; // Only clean up current tf

          const ticker = tickers.find(t => t.symbol === symbol);
          if (ticker) {
            const proximity = ticker.proximity || 0;
            const consensus = ticker.consensus || 0;
            if (proximity > 2.0 && consensus < 70) {
              triggeredRef.current.delete(key);
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
  }, [addSignal, currentTimeframe]);

  return null;
};

export default MarketScanner;
