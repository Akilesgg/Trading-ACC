import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyAe6AZU5UZAwl--4YTd0kUkQiCELvIB98E";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeMarket(symbol: string, price: string, change: string, mode: "Standard" | "Scalping" | "Swing" = "Standard") {
  try {
    let modePrompt = "";
    if (mode === "Scalping") {
      modePrompt = "Enfoque en SCALPING: analiza temporalidades cortas (1M, 5M), identifica niveles de soporte/resistencia inmediatos y posibles micro-rupturas.";
    } else if (mode === "Swing") {
      modePrompt = "Enfoque en SWING TRADING: analiza temporalidades largas (1H, 4H, 1D), identifica la estructura de mercado mayor y tendencias de mediano plazo.";
    } else {
      modePrompt = "Enfoque ESTÁNDAR: análisis basado en la metodología Wyckoff e identificación de RUPTURAS (breakouts) inminentes o confirmadas.";
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analiza la situación actual del mercado para ${symbol}. El precio actual es ${price} con un cambio en 24h del ${change}%. 
      ${modePrompt}
      Responde siempre en ESPAÑOL. Mantén un tono profesional y detallado, adecuado para un resumen de terminal de trading. 
      
      REQUISITOS DEL INFORME:
      1. ESTRATEGIA: Describe la estrategia técnica recomendada para este activo según el modo seleccionado (${mode}).
      2. JUSTIFICACIÓN ALCISTA: Explica detalladamente por qué la estructura actual justifica una postura alcista (o los riesgos si es bajista).
      3. METÁFORA TÉCNICA: Incluye una breve mención creativa comparando los indicadores con 'ingredientes activos' o 'canabinoides' que actúan como el motor del movimiento (como moléculas que impulsan el precio).
      
      Asegúrate de que la descripción sea detallada y profesional.`,
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
