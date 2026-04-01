import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAe6AZU5UZAwl--4YTd0kUkQiCELvIB98E";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeMarket(symbol: string, price: string, change: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza la situación actual del mercado para ${symbol}. El precio actual es ${price} con un cambio en 24h del ${change}%. 
      Proporciona un análisis breve basado en la metodología Wyckoff y, lo más importante, identifica si hay una RUPTURA (breakout) inminente o confirmada. 
      Responde siempre en ESPAÑOL. Mantén un tono profesional y conciso, adecuado para un resumen de terminal de trading.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Análisis no disponible actualmente. Por favor, inténtalo de nuevo más tarde.";
  }
}

export async function getMarketSentiment() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "¿Cuál es el sentimiento actual del mercado global de criptomonedas? Proporciona una estimación del índice de Miedo y Codicia y una breve explicación en ESPAÑOL.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini sentiment error:", error);
    return "Sentimiento neutral basado en tendencias recientes.";
  }
}
