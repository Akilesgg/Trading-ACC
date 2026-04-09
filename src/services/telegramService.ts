
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
  const storedToken = localStorage.getItem("telegramToken");
  const storedChatId = localStorage.getItem("telegramChatId");
  
  const token = (storedToken && storedToken.trim() !== "") ? storedToken : DEFAULT_TOKEN;
  const chatId = (storedChatId && storedChatId.trim() !== "") ? storedChatId : DEFAULT_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram credentials missing");
    return;
  }

  const emoji = alert.type === "BULLISH" ? "🚀" : alert.type === "BEARISH" ? "📉" : alert.type === "BREAKOUT" ? "🔥" : "🎯";
  const typeText = alert.type === "BREAKOUT" ? "RUPTURA DETECTADA" : alert.type === "BULLISH" ? "SEÑAL ALCISTA" : alert.type === "BEARISH" ? "SEÑAL BAJISTA" : "NUEVA SEÑAL";

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  };

  const escapedAnalysis = alert.analysis ? escapeHtml(alert.analysis) : "";
  // Truncate safely to avoid breaking HTML entities or being too long for Telegram (4096 chars limit)
  const finalAnalysis = escapedAnalysis.length > 800 ? escapedAnalysis.substring(0, 800) + "..." : escapedAnalysis;

  const message = [
    `${emoji} <b>${typeText}</b>`,
    "",
    `<b>Activo:</b> ${alert.symbol.replace("USDT", " / USDT")}`,
    `<b>Tipo:</b> ${alert.type === "BULLISH" ? "LONG" : alert.type === "BEARISH" ? "SHORT" : "SIGNAL"}`,
    `<b>Precio Actual:</b> $${alert.price}`,
    `<b>Entrada:</b> $${alert.entry || "---"}`,
    `<b>TP 1:</b> $${alert.tp1 || "---"}`,
    `<b>TP 2:</b> $${alert.tp2 || "---"}`,
    `<b>TP 3:</b> $${alert.tp3 || "---"}`,
    `<b>Stop Loss:</b> $${alert.sl || "---"}`,
    `<b>Apalancamiento:</b> ${alert.leverage || "20x"}`,
    `<b>Confianza:</b> ${alert.confidence}%`,
    "",
    finalAnalysis ? `<b>Análisis IA:</b>\n<i>${finalAnalysis}</i>\n` : "",
    `🔗 <a href="https://ais-dev-xr2uffhntgzke4a4vhmo6r-205890891792.europe-west2.run.app/terminal?symbol=${alert.symbol}">EJECUTAR EN TERMINAL</a>`
  ].join("\n");

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    console.log("Telegram Payload:", { chat_id: chatId, parse_mode: "HTML" });
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: false
      })
    });
    
    const data = await response.json();
    if (!response.ok) {
      console.error("Telegram API Error Details:", data);
      toast.error(`Telegram Error: ${data.description || "Fallo al enviar"}`);
      
      // Fallback: try sending without HTML if it failed due to parse error
      if (data.description?.includes("can't parse entities")) {
        console.log("Retrying Telegram alert without HTML formatting...");
        const plainMessage = message.replace(/<[^>]*>/g, "");
        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: plainMessage
          })
        });
      }
    } else {
      console.log("Telegram alert sent successfully");
    }
    return data;
  } catch (error) {
    console.error("Network error sending Telegram alert:", error);
    toast.error("Error de red al conectar con Telegram");
  }
};
