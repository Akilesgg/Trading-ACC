
export interface TelegramAlert {
  symbol: string;
  price: string;
  change: string;
  type: "BULLISH" | "BEARISH" | "BREAKOUT";
  confidence: number;
  analysis?: string;
}

export const sendTelegramAlert = async (alert: TelegramAlert) => {
  const token = localStorage.getItem("telegramToken") || "8287353475:AAE90JqwdWnwoJSrr9OaNIphmKtmuy0Qu0Q";
  const chatId = localStorage.getItem("telegramChatId") || "-1003045390811";

  if (!token || !chatId) return;

  const emoji = alert.type === "BULLISH" ? "🚀" : alert.type === "BEARISH" ? "📉" : "🔥";
  const typeText = alert.type === "BREAKOUT" ? "RUPTURA DETECTADA" : alert.type === "BULLISH" ? "SEÑAL ALCISTA" : "SEÑAL BAJISTA";

  const message = `
${emoji} *${typeText}*

*Activo:* ${alert.symbol.replace("USDT", " / USDT")}
*Precio:* $${parseFloat(alert.price).toLocaleString()}
*Cambio (24h):* ${alert.change}%
*Confianza:* ${alert.confidence}%

${alert.analysis ? `*Análisis IA:* \n_${alert.analysis.substring(0, 500)}..._` : ""}

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
