import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Gemini API Proxy Routes
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { symbol, price, change, mode } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server" });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      let modePrompt = "";
      if (mode === "Scalping") {
        modePrompt = "Enfoque en SCALPING: analiza temporalidades muy cortas (1M, 5M), identifica niveles de soporte/resistencia inmediatos y posibles micro-rupturas de segundos o minutos.";
      } else if (mode === "Swing") {
        modePrompt = "Enfoque en SWING TRADING: analiza temporalidades largas (1H, 4H, 1D), identifica la estructura de mercado mayor, tendencias de mediano plazo y niveles de retroceso de Fibonacci.";
      } else {
        modePrompt = "Enfoque ESTÁNDAR: análisis basado en la metodología Wyckoff, identificación de RUPTURAS (breakouts) inminentes y análisis de flujo de órdenes (Order Flow).";
      }

      const prompt = `Eres un analista experto en trading institucional y criptomonedas. 
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
        
        **METÁFORA TÉCNICA**: Una breve comparación creativa de los indicadores con elementos químicos o biológicos que impulsan el precio.`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error("Gemini Analyze Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/ai/setups", async (req, res) => {
    try {
      const { marketData } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "API Key missing" });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `Analiza los siguientes datos de mercado y encuentra los 3 mejores setups de trading actuales.
      DATOS: ${JSON.stringify(marketData)}
      
      Para cada setup, proporciona:
      1. Símbolo
      2. Tipo (LONG/SHORT)
      3. Precio de Entrada
      4. Stop Loss
      5. Take Profit (3 niveles)
      6. Puntuación de confianza (0-100)
      7. Justificación breve (BOS, RSI, Volumen, etc.)
      
      Responde estrictamente en formato JSON:
      [
        {
          "symbol": "BTCUSDT",
          "type": "LONG",
          "entry": 64000,
          "sl": 63000,
          "tp": [65000, 66000, 68000],
          "score": 85,
          "reason": "BOS alcista + RSI en 40"
        }
      ]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error: any) {
      console.error("Gemini Setups Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ai/news", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "API Key missing" });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-3-flash-preview",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `Busca y analiza las 6 noticias más recientes e importantes de GEOPOLÍTICA INTERNACIONAL y ECONOMÍA que afecten al mercado de criptomonedas hoy ${new Date().toLocaleDateString()}.
        Para cada noticia, proporciona:
        1. Título de la noticia.
        2. Un breve resumen (2 frases).
        3. El impacto estimado en el mercado (CRITICAL, HIGH, MEDIUM, LOW).
        4. Una puntuación de impacto de la IA (0-100).
        5. El efecto esperado (ej: Volatilidad, Tendencia Alcista, etc.).
        6. Una URL de fuente real y válida (Reuters, Bloomberg, CNBC, etc.).
        
        Responde estrictamente en formato JSON con esta estructura:
        [
          {
            "event": "Título",
            "description": "Resumen",
            "impact": "HIGH",
            "aiScore": 85,
            "effect": "Efecto",
            "time": "Hace X min",
            "sourceUrl": "URL"
          }
        ]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      res.json(JSON.parse(response.text()));
    } catch (error: any) {
      console.error("Gemini News Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ai/sentiment", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "API Key missing" });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const result = await model.generateContent("Analiza el sentimiento actual del mercado cripto global en una frase corta y profesional en ESPAÑOL. Incluye una estimación del índice Fear & Greed.");
      const response = await result.response;
      res.json({ text: response.text() });
    } catch (error: any) {
      console.error("Gemini Sentiment Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
