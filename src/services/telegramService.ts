
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
  const token = DEFAULT_TOKEN;
  const chatId = DEFAULT_CHAT_ID;

  const emoji = alert.type === "BULLISH" ? "🚀" : alert.type === "BEARISH" ? "📉" : alert.type === "BREAKOUT" ? "🔥" : "🎯";
  const typeText = alert.type === "BREAKOUT" ? "RUPTURA DETECTADA" : alert.type === "BULLISH" ? "SEÑAL ALCISTA" : alert.type === "BEARISH" ? "SEÑAL BAJISTA" : "NUEVA SEÑAL";

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const escapedAnalysis = alert.analysis ? escapeHtml(alert.analysis) : "";

  const message = `
${emoji} <b>${typeText}</b>

<b>Activo:</b> ${alert.symbol.replace("USDT", " / USDT")}
<b>Tipo:</b> ${alert.type === "BULLISH" ? "LONG" : alert.type === "BEARISH" ? "SHORT" : "SIGNAL"}
<b>Precio Actual:</b> $${alert.price}
<b>Entrada:</b> $${alert.entry || "---"}
<b>TP 1:</b> $${alert.tp1 || "---"}
<b>TP 2:</b> $${alert.tp2 || "---"}
<b>TP 3:</b> $${alert.tp3 || "---"}
<b>Stop Loss:</b> $${alert.sl || "---"}
<b>Apalancamiento:</b> ${alert.leverage || "20x"}
<b>Confianza:</b> ${alert.confidence}%

${escapedAnalysis ? `<b>Análisis IA:</b> \n<i>${escapedAnalysis.substring(0, 500)}${escapedAnalysis.length > 500 ? '...' : ''}</i>` : ""}

🔗 <a href="https://ais-dev-xr2uffhntgzke4a4vhmo6r-205890891792.europe-west2.run.app/terminal?symbol=${alert.symbol}">EJECUTAR EN TERMINAL</a>
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
        parse_mode: "HTML"
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
