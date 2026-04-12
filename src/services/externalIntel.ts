import { fetchMarketIntelligence } from "./geminiService";

export interface ExternalIntelData {
  sentiment: {
    long: number;
    short: number;
    intensity: "LOW" | "MEDIUM" | "HIGH";
  };
  narrative: string;
  trendingTopics: string[];
  whaleActivity: string;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  signals: Array<{
    asset: string;
    type: "LONG" | "SHORT";
    entry: number;
    tp: number;
    sl: number;
    source: string;
    reasoning?: string;
  }>;
  alerts: string[];
  consensus: "BULLISH" | "BEARISH" | "NEUTRAL";
  lastUpdate: string;
}

class ExternalIntelService {
  private cache: ExternalIntelData | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  async getIntelligence(symbol: string, forceRefresh = false): Promise<ExternalIntelData> {
    const now = Date.now();
    
    if (!forceRefresh && this.cache && (now - this.lastFetchTime < this.CACHE_DURATION)) {
      return this.cache;
    }

    try {
      const data = await fetchMarketIntelligence(symbol);
      
      // Ensure data structure is correct
      const intelData: ExternalIntelData = {
        sentiment: data.sentiment || { long: 50, short: 50, intensity: "MEDIUM" },
        narrative: data.narrative || "Análisis no disponible en este momento.",
        trendingTopics: data.trendingTopics || data.topAssets || ["BTC", "ETH", "SOL"],
        whaleActivity: data.whaleActivity || "No se detectó actividad inusual.",
        keyLevels: data.keyLevels || { support: [], resistance: [] },
        signals: data.signals || [],
        alerts: data.alerts || [],
        consensus: data.consensus || "NEUTRAL",
        lastUpdate: new Date().toISOString()
      };

      this.cache = intelData;
      this.lastFetchTime = now;
      return intelData;
    } catch (error) {
      console.error("ExternalIntelService Error:", error);
      if (this.cache) return this.cache;
      throw error;
    }
  }

  // Helper to detect spikes (simulated for now based on sentiment intensity)
  hasSpike(): boolean {
    return this.cache?.sentiment.intensity === "HIGH";
  }
}

export const externalIntelService = new ExternalIntelService();
