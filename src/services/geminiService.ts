import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

export async function analyzeMarket(symbol: string, price: string, change: string, mode: "Standard" | "Scalping" | "Swing" = "Standard") {
  if (!API_KEY) {
    console.error("GEMINI_API_KEY is missing");
    return "Error: Configuración de API de IA faltante.";
  }
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
      Responde siempre en ESPAÑOL. Mantén un tono profesional, analítico y profundamente involucrado.
      
      ES OBLIGATORIO que el informe use EXACTAMENTE estos encabezados en negrita y mayúsculas:
      
      **CONTEXTO Y EXPLICACIÓN BREVE**: (Proporciona un resumen ejecutivo de la situación actual del activo. Sé específico sobre lo que está ocurriendo ahora mismo)

      **COMENTARIOS Y OBSERVACIONES**: (Añade tus observaciones personales sobre el comportamiento del precio, anomalías en el volumen o patrones emergentes que otros podrían pasar por alto)

      **PREDICCIONES DE MERCADO**: (Realiza predicciones fundamentadas sobre el movimiento del precio a corto y mediano plazo. Indica objetivos específicos y posibles escenarios alternativos)

      **RECOMENDACIÓN IA**: (Basándote en todo lo anterior, proporciona una recomendación final clara y concisa para el trader. ¿Debe entrar ahora, esperar o mantenerse al margen?)

      **ESTRATEGIA**: (Describe la estrategia técnica recomendada: ALCISTA o BAJISTA)
      
      **DOMINANCIA BTC**: (Evalúa la dominancia de BTC y cómo afecta a este activo específico. Indica si es momento de rotación de capital)
      
      **FASE WYCKOFF**: (Identifica la fase actual: ACUMULACIÓN, MARKUP, DISTRIBUCIÓN o MARKDOWN. Explica detalladamente la estructura y QUÉ SE ESPERA a continuación)
      
      **INDICADORES TÉCNICOS (TOP 2026)**: (Lista de 8 a 10 indicadores clave. Explica qué indica cada uno en la temporalidad actual)
      
      **JUSTIFICACIÓN TÉCNICA**: (Explica detalladamente por qué el precio de entrada, el Stop Loss y los tres Take Profits están situados en esos niveles basándote en liquidez y volumen)
      
      **ANÁLISIS DE ESTRUCTURA**: (Explica detalladamente por qué la estructura actual justifica la postura tomada)
      
      **NIVELES OPERATIVOS**: 
      ENTRADA: [precio numérico]
      STOP LOSS: [precio numérico]
      TAKE PROFIT 1: [precio numérico]
      TAKE PROFIT 2: [precio numérico]
      TAKE PROFIT 3: [precio numérico]
      
      **NIVEL DE CONFIANZA**: (Un número del 1 al 100)

      **RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO**: (Recomienda un apalancamiento y un nivel de riesgo: BAJO, MODERADO o ALTO)
      
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
