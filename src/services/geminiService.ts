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
      
      **CONTEXTO Y EXPLICACIÓN BREVE**: (Proporciona un resumen ejecutivo de la situación actual del activo en 2-3 frases)

      **ESTRATEGIA**: (Describe la estrategia técnica recomendada: ALCISTA o BAJISTA)

      **DOMINANCIA BTC**: (Si el activo es BTC, evalúa su dominancia. Si BTC es alcista, indica si es momento de buscar ALTCOINS de baja capitalización con mayor potencial. Si no es BTC, indica cómo la dominancia de BTC afecta a este activo específico)
      
      **FASE WYCKOFF**: (Menciona explícitamente la temporalidad analizada. Identifica la fase actual según la teoría de Wyckoff: ACUMULACIÓN, MARKUP, DISTRIBUCIÓN o MARKDOWN. Proporciona una explicación detallada de por qué se encuentra en esa fase y QUÉ SE ESPERA que haga el precio a continuación según esta estructura)
      
      **INDICADORES TÉCNICOS (TOP 2026)**: (Lista de 8 a 10 indicadores clave incluyendo RSI, MACD, EMAs (20, 50, 200), Bandas de Bollinger, Volumen, etc. Explica brevemente qué indica cada uno en la temporalidad actual)
      
      **JUSTIFICACIÓN TÉCNICA**: (Explica detalladamente por qué el precio de entrada, el Stop Loss y los tres Take Profits están situados en esos niveles específicos basándote en la estructura de mercado, liquidez y volumen. Sé extremadamente detallado)
      
      **ANÁLISIS DE ESTRUCTURA**: (Explica detalladamente por qué la estructura actual justifica la postura tomada)
      
      **NIVELES OPERATIVOS**: 
      ENTRADA: [precio numérico sin símbolos]
      STOP LOSS: [precio numérico sin símbolos]
      TAKE PROFIT 1: [precio numérico sin símbolos]
      TAKE PROFIT 2: [precio numérico sin símbolos]
      TAKE PROFIT 3: [precio numérico sin símbolos]
      
      **NIVEL DE CONFIANZA**: (Un número del 1 al 100 indicando la seguridad de la señal)

      **RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO**: (Basado en la volatilidad ATR y el riesgo, recomienda un apalancamiento (ej: x3, x5, x10) y un nivel de riesgo: BAJO, MODERADO o ALTO)
      
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
