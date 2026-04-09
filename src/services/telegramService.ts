
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

import { toast } from "sonner";

export const sendTelegramAlert = async (alert: TelegramAlert) => {
  const token = localStorage.getItem("telegramToken") || DEFAULT_TOKEN;
  const chatId = localStorage.getItem("telegramChatId") || DEFAULT_CHAT_ID;

  if (!token || !chatId) {
    console.warn("Telegram Token or Chat ID missing");
    return;
  }

  const emoji = alert.type === "BULLISH" ? "🚀" : alert.type === "BEARISH" ? "📉" : alert.type === "BREAKOUT" ? "🔥" : "🎯";
  const typeText = alert.type === "BREAKOUT" ? "RUPTURA DETECTADA" : alert.type === "BULLISH" ? "SEÑAL ALCISTA" : alert.type === "BEARISH" ? "SEÑAL BAJISTA" : "NUEVA SEÑAL";

  const message = `
${emoji} *${typeText}*

*Activo:* ${alert.symbol.replace("USDT", " / USDT")}
*Tipo:* ${alert.type === "BULLISH" ? "LONG" : alert.type === "BEARISH" ? "SHORT" : "SIGNAL"}
*Precio Actual:* $${alert.price}
*Entrada:* $${alert.entry || "---"}
*TP 1:* $${alert.tp1 || "---"}
*TP 2:* $${alert.tp2 || "---"}
*TP 3:* $${alert.tp3 || "---"}
*Stop Loss:* $${alert.sl || "---"}
*Apalancamiento:* ${alert.leverage || "20x"}
*Confianza:* ${alert.confidence}%

${alert.analysis ? `*Análisis IA:* \n_${alert.analysis.substring(0, 500)}${alert.analysis.length > 500 ? '...' : ''}_` : ""}

🔗 [EJECUTAR EN TERMINAL](https://ais-dev-xr2uffhntgzke4a4vhmo6r-205890891792.europe-west2.run.app/terminal?symbol=${alert.symbol})
  `;

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    console.log(`Sending Telegram alert to ${chatId}...`);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error("Telegram API Error:", data);
      toast.error(`Error de Telegram: ${data.description || "Fallo al enviar"}`);
    } else {
      console.log("Telegram alert sent successfully:", data);
    }
    return data;
  } catch (error) {
    console.error("Error sending Telegram alert:", error);
    toast.error("Error de red al conectar con Telegram");
  }
};
