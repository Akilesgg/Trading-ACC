
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

const DEFAULT_TOKEN = "8287353475:AAE90JqwdWnwoJSrr9OaNIphmKtmuy0Qu0Q";
const DEFAULT_CHAT_ID = "-1003045390811";

export const sendTelegramAlert = async (alert: TelegramAlert) => {
  const token = localStorage.getItem("telegramToken") || DEFAULT_TOKEN;
  const chatId = localStorage.getItem("telegramChatId") || DEFAULT_CHAT_ID;

  if (!token || !chatId) return;

  const emoji = alert.type === "BULLISH" ? "🚀" : alert.type === "BEARISH" ? "📉" : alert.type === "BREAKOUT" ? "🔥" : "🎯";
  const typeText = alert.type === "BREAKOUT" ? "RUPTURA DETECTADA" : alert.type === "BULLISH" ? "SEÑAL ALCISTA" : alert.type === "BEARISH" ? "SEÑAL BAJISTA" : "NUEVA SEÑAL";

  const message = `
🚨 *${typeText}*

*Activo:* ${alert.symbol.replace("USDT", " / USDT")}
*Tipo:* ${alert.type === "BULLISH" ? "LONG" : alert.type === "BEARISH" ? "SHORT" : "SIGNAL"}
*Entrada:* ${alert.entry || "---"}
*TP 1:* ${alert.tp1 || "---"}
*TP 2:* ${alert.tp2 || "---"}
*TP 3:* ${alert.tp3 || "---"}
*Stop Loss:* ${alert.sl || "---"}

${alert.analysis ? `*Análisis IA:* \n_${alert.analysis.substring(0, 500)}${alert.analysis.length > 500 ? '...' : ''}_` : ""}

[Ver en el Terminal](https://ais-dev-xr2uffhntgzke4a4vhmo6r-205890891792.europe-west2.run.app/terminal?symbol=${alert.symbol})
  `;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      })
    });
  } catch (error) {
    console.error("Error sending Telegram alert:", error);
  }
};
