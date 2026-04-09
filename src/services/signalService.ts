import { fetchTickers, CryptoData } from "./cryptoService";
import { useSignalStore } from "../store/useSignalStore";
import { toast } from "sonner";

const SUPPORTED_SYMBOLS = [
  "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT",
  "DOTUSDT", "LINKUSDT", "MATICUSDT", "SHIBUSDT", "LTCUSDT", "TRXUSDT", "UNIUSDT", "ATOMUSDT"
];

export const sendPossibleSignalsToTelegram = async () => {
  try {
    toast.loading("Escaneando mercado en busca de señales...", { id: "telegram-scan" });
    
    const tickers = await fetchTickers(SUPPORTED_SYMBOLS);
    const addSignal = useSignalStore.getState().addSignal;
    
    // Define what a "possible signal" is:
    // 1. High consensus (> 80)
    // 2. Or very close to entry (proximity < 1%)
    const possibleSignals = tickers.filter(t => 
      (t.consensus && t.consensus > 80) || 
      (t.proximity && t.proximity < 1.0)
    );

    if (possibleSignals.length === 0) {
      toast.dismiss("telegram-scan");
      toast.info("No se detectaron señales claras en este momento.");
      return;
    }

    // Send the top 3 best signals to avoid spamming
    const bestSignals = possibleSignals
      .sort((a, b) => (b.consensus || 0) - (a.consensus || 0))
      .slice(0, 3);

    for (const signal of bestSignals) {
      await addSignal({
        activo: signal.symbol,
        tipo: parseFloat(signal.priceChangePercent) > 0 ? 'LONG' : 'SHORT',
        entry: signal.entry || parseFloat(signal.price),
        tp1: signal.takeProfits?.[0] || (parseFloat(signal.price) * 1.05),
        tp2: signal.takeProfits?.[1],
        tp3: signal.takeProfits?.[2],
        sl: signal.stopLoss || (parseFloat(signal.price) * 0.95),
        estado: 'activa',
        leverage: `${signal.leverage}x`,
        confidence: signal.consensus || 85,
        analysis: `Señal enviada manualmente por el usuario. Consenso: ${signal.consensus}%. Proximidad: ${signal.proximity?.toFixed(2)}%.`
      });
    }

    toast.dismiss("telegram-scan");
    toast.success(`¡${bestSignals.length} señales enviadas a Telegram y publicadas!`);
  } catch (error) {
    console.error("Error sending manual signals:", error);
    toast.dismiss("telegram-scan");
    toast.error("Error al enviar señales.");
  }
};
