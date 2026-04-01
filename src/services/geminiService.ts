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
      Responde siempre en ESPAÑOL. Mantén un tono profesional y detallado.
      
      ES OBLIGATORIO que el informe use EXACTAMENTE estos encabezados en negrita y mayúsculas:
      
      **ESTRATEGIA**: (Describe la estrategia técnica recomendada: ALCISTA o BAJISTA)
      
      **JUSTIFICACIÓN DE ENTRADA**: (Explica detalladamente por qué el precio de entrada, el Stop Loss y los tres Take Profits están situados en esos niveles específicos basándote en la estructura de mercado, liquidez y volumen. Sé extremadamente detallado)
      
      **JUSTIFICACIÓN ALCISTA/BAJISTA**: (Explica detalladamente por qué la estructura actual justifica la postura tomada)
      
      **NIVELES OPERATIVOS**: 
      ENTRADA: [precio]
      STOP LOSS: [precio]
      TAKE PROFIT 1: [precio]
      TAKE PROFIT 2: [precio]
      TAKE PROFIT 3: [precio]
      
      **METÁFORA TÉCNICA**: (Incluye una breve mención creativa comparando los indicadores con 'ingredientes activos' o 'canabinoides' que impulsan el precio)
      
      Asegúrate de que la descripción sea detallada y profesional. No uses otros formatos.`,
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
