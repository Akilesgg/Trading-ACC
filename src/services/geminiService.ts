import { GoogleGenAI } from "@google/genai";

const getApiKey = () => {
  // Try multiple sources for the API key
  const key = (
    process.env.GEMINI_API_KEY || 
    (import.meta as any).env?.VITE_GEMINI_API_KEY || 
    localStorage.getItem("GEMINI_API_KEY") || 
    "AIzaSyAe6AZU5UZAwl--4YTd0kUkQiCELvIB98E" // Hardcoded fallback provided by user
  );
  if (key && key !== "AIzaSyAe6AZU5UZAwl--4YTd0kUkQiCELvIB98E") {
    console.log("Gemini API Key found (masked):", key.substring(0, 4) + "..." + key.substring(key.length - 4));
  } else if (key === "AIzaSyAe6AZU5UZAwl--4YTd0kUkQiCELvIB98E") {
    console.log("Using hardcoded Gemini API Key fallback.");
  } else {
    console.warn("Gemini API Key NOT found in any source.");
  }
  return key;
};

export async function analyzeMarket(symbol: string, price: string, change: string, mode: "Standard" | "Scalping" | "Swing" = "Standard") {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return "Error: Configuración de API de IA faltante. Por favor, configura tu GEMINI_API_KEY en los ajustes o en el panel de análisis.";
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const maxRetries = 2;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      let modePrompt = "";
      if (mode === "Scalping") {
        modePrompt = "Enfoque en SCALPING: analiza temporalidades muy cortas (1M, 5M), identifica niveles de soporte/resistencia inmediatos y posibles micro-rupturas de segundos o minutos.";
      } else if (mode === "Swing") {
        modePrompt = "Enfoque en SWING TRADING: analiza temporalidades largas (1H, 4H, 1D), identifica la estructura de mercado mayor, tendencias de mediano plazo y niveles de retroceso de Fibonacci.";
      } else {
        modePrompt = "Enfoque ESTÁNDAR: análisis basado en la metodología Wyckoff, identificación de RUPTURAS (breakouts) inminentes y análisis de flujo de órdenes (Order Flow).";
      }

      console.log(`Iniciando análisis profundo para ${symbol} en modo ${mode} (Intento ${retryCount + 1})...`);

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Eres un analista experto en trading institucional y criptomonedas. 
        Analiza la situación actual del mercado para el par ${symbol}. 
        DATOS ACTUALES: Precio: ${price}, Cambio 24h: ${change}%. 
        
        ${modePrompt}
        
        INSTRUCCIONES CRÍTICAS:
        1. Responde SIEMPRE en ESPAÑOL.
        2. Mantén un tono profesional, analítico, directo y profundamente involucrado.
        3. Involúcrate en los resultados: proporciona niveles de precios REALES y COHERENTES con el precio actual. La ENTRADA debe estar muy cerca del precio actual (máximo 1-2% de diferencia).
        4. ES OBLIGATORIO usar EXACTAMENTE estos encabezados en negrita y mayúsculas para que el sistema pueda parsear tu respuesta:
        
        **CONTEXTO Y EXPLICACIÓN BREVE**: Resumen ejecutivo de la situación actual. Sé específico y técnico.
        
        **COMENTARIOS Y OBSERVACIONES**: Tus observaciones personales sobre anomalías, volumen y patrones ocultos.
        
        **PREDICCIONES DE MERCADO**: Predicciones fundamentadas a corto y mediano plazo con objetivos específicos.
        
        **RECOMENDACIÓN IA**: Recomendación final clara: ENTRAR AHORA, ESPERAR o MANTENERSE AL MARGEN.
        
        **ESTRATEGIA**: Indica claramente si la postura es ALCISTA o BAJISTA.
        
        **DOMINANCIA BTC**: Evaluación de la dominancia de BTC y su impacto en ${symbol}.
        
        **FASE WYCKOFF**: Identifica la fase (ACUMULACIÓN, MARKUP, DISTRIBUCIÓN o MARKDOWN) y explica la estructura.
        
        **INDICADORES TÉCNICOS (TOP 2026)**: Lista de 8-10 indicadores clave con su estado actual (ej: RSI: 65 - Sobrecompra leve).
        
        **JUSTIFICACIÓN TÉCNICA**: Explicación detallada de los niveles operativos basados en liquidez, FVG (Fair Value Gaps) y Order Blocks.
        
        **ANÁLISIS DE ESTRUCTURA**: Justificación de la estructura de mercado (BOS, CHoCH).
        
        **NIVELES OPERATIVOS**: 
        ENTRADA: [precio numérico]
        STOP LOSS: [precio numérico]
        TAKE PROFIT 1: [precio numérico]
        TAKE PROFIT 2: [precio numérico]
        TAKE PROFIT 3: [precio numérico]
        
        **NIVEL DE CONFIANZA**: [Número del 1 al 100]
        
        **RECOMENDACIÓN DE APALANCAMIENTO Y RIESGO**: Apalancamiento sugerido (ej: x10) y riesgo (BAJO, MODERADO, ALTO).
        
        **METÁFORA TÉCNICA**: Una breve comparación creativa de los indicadores con elementos químicos o biológicos que impulsan el precio.
        
        Asegúrate de que los niveles de ENTRADA, STOP LOSS y TAKE PROFITS sean lógicos respecto al precio actual de ${price} y que la señal sea ejecutable de inmediato o en breve.`,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.7,
        },
      });

      if (!response.text) {
        throw new Error("La respuesta de Gemini no contiene texto.");
      }

      console.log(`Análisis de ${symbol} completado con éxito.`);
      return response.text;
    } catch (error: any) {
      console.error(`Error en intento ${retryCount + 1}:`, error);
      
      const isQuotaError = error.message?.toLowerCase().includes("quota") || 
                           error.status === 429 || 
                           error.message?.includes("429");

      if (isQuotaError && retryCount < maxRetries) {
        retryCount++;
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 2s, 4s
        console.log(`Error de cuota. Reintentando en ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (error.message?.includes("API key not valid")) {
        return "Error: La clave API de Gemini no es válida. Por favor, revísala en los ajustes.";
      }
      if (isQuotaError) {
        return "Error: Se ha excedido la cuota de la API de Gemini. Esto suele ocurrir con claves compartidas. Te recomendamos configurar tu propia API Key gratuita en 'Configurar API Key' para evitar este límite.";
      }
      
      return "Análisis no disponible actualmente debido a una interconexión fallida con el núcleo de IA. Por favor, inténtalo de nuevo más tarde.";
    }
  }
  return "Error: Máximo de reintentos alcanzado sin éxito.";
}

export async function getMarketSentiment() {
  const apiKey = getApiKey();
  if (!apiKey) return "Sentimiento neutral (API Key faltante).";
  
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Analiza el sentimiento actual del mercado cripto global en una frase corta y profesional en ESPAÑOL. Incluye una estimación del índice Fear & Greed.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text || "Sentimiento neutral basado en tendencias recientes.";
  } catch (error) {
    console.error("Gemini sentiment error:", error);
    return "Sentimiento neutral basado en tendencias recientes.";
  }
}
