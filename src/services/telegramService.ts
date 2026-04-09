export interface TelegramAlert {
  symbol: string;
  price: string;
  change: string;
  type: "BULLISH" | "BEARISH" | "BREAKOUT" | "SIGNAL";
  confidence: number;
  analysis?: string;
  entry?: string;
  sl?: string;
  tp1?: string;
  tp2?: string;
  tp3?: string;
  leverage?: string;
}

const TELEGRAM_TOKEN = "8287353475:AAE90JqwdWnwoJSrr9OaNIphmKtmuy0Qu0Q";
const TELEGRAM_CHAT_ID = "-1003045390811";

export const sendTelegramAlert = async (alert: TelegramAlert): Promise<void> => {
  const token = localStorage.getItem("telegramToken") || TELEGRAM_TOKEN;
  const chatId = localStorage.getItem("telegramChatId") || TELEGRAM_CHAT_ID;

  console.log(`📤 Telegram: Intentando enviar alerta para ${alert.symbol}...`);
  console.log(`📤 Telegram: Usando Token: ${token.substring(0, 5)}... y ChatID: ${chatId}`);

  const emoji = alert.type === "BULLISH" ? "🚀" :
                alert.type === "BEARISH" ? "📉" :
                alert.type === "BREAKOUT" ? "🔥" : "🎯";

  const message = `${emoji} *SEÑAL DETECTADA*

*Activo:* ${alert.symbol.replace("USDT", "/USDT")}
*Precio:* $${parseFloat(alert.price).toLocaleString()}
*Cambio 24h:* ${alert.change}%
*Confianza:* ${alert.confidence}%
${alert.leverage ? `*Apalancamiento:* ${alert.leverage}` : ""}

📊 *NIVELES OPERATIVOS*
📍 Entrada: $${alert.entry || "—"}
🛑 Stop Loss: $${alert.sl || "—"}
✅ TP1: $${alert.tp1 || "—"}
✅ TP2: $${alert.tp2 || "—"}
✅ TP3: $${alert.tp3 || "—"}

⚡ Trading ACC`;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );
    const result = await response.json();
    if (result.ok) {
      console.log("✅ TELEGRAM OK:", alert.symbol);
    } else {
      console.error("❌ TELEGRAM ERROR:", result.description);
      // Fallback to plain text if Markdown fails
      if (result.description?.includes("can't parse entities")) {
        console.log("🔄 Telegram: Reintentando sin formato Markdown...");
        await fetch(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message.replace(/\*/g, "").replace(/_/g, ""),
            }),
          }
        );
      }
    }
  } catch (err) {
    console.error("❌ TELEGRAM FETCH ERROR:", err);
  }
};
