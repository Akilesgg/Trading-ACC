import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeMarket(symbol: string, price: string, change: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the current market situation for ${symbol}. Current price is ${price} with a 24h change of ${change}%. 
      Provide a brief Wyckoff methodology analysis and overall sentiment. 
      Keep it professional and concise, suitable for a trading terminal summary.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return "Analysis currently unavailable. Please check back later.";
  }
}

export async function getMarketSentiment() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "What is the current global crypto market sentiment? Provide a Fear & Greed index estimation and a brief explanation.",
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    console.error("Gemini sentiment error:", error);
    return "Neutral sentiment based on recent trends.";
  }
}
