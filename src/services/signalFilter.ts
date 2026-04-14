export type SignalType = "LONG" | "SHORT";
export type SignalStrength = "Débil" | "Media" | "Fuerte" | "Premium";

export interface SignalCondition {
  name: string;
  met: boolean;
  details?: string;
}

export interface SignalSetup {
  asset: string;
  type: SignalType;
  score: number;
  strength: SignalStrength;
  confluences: SignalCondition[];
  entry: number;
  sl: number;
  tp: number;
  rr: number;
  situation: string;
  analysis: string;
  action: string;
  timestamp: number;
}

export class SignalFilterService {
  private static instance: SignalFilterService;
  private cooldowns: Record<string, number> = {};
  private MAX_SIGNALS_PER_ASSET = 2;
  private COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SignalFilterService {
    if (!SignalFilterService.instance) {
      SignalFilterService.instance = new SignalFilterService();
    }
    return SignalFilterService.instance;
  }

  calculateScore(confluences: SignalCondition[]): number {
    const metCount = confluences.filter(c => c.met).length;
    const totalCount = confluences.length;
    if (totalCount === 0) return 0;
    
    // Base score from met conditions
    let score = (metCount / totalCount) * 100;
    
    // Bonus for specific high-quality confluences
    if (confluences.find(c => c.name === "Polymarket Sentiment" && c.met)) score += 10;
    if (confluences.find(c => c.name === "Volume Surge" && c.met)) score += 5;
    
    return Math.min(100, score);
  }

  getStrength(score: number): SignalStrength {
    if (score >= 90) return "Premium";
    if (score >= 75) return "Fuerte";
    if (score >= 60) return "Media";
    return "Débil";
  }

  validateSignal(setup: SignalSetup): boolean {
    // 1. Minimum Score
    if (setup.score < 60) return false;

    // 2. Minimum Confluences (3 required)
    const metCount = setup.confluences.filter(c => c.met).length;
    if (metCount < 3) return false;

    // 3. Anti-Spam: Cooldown
    const lastSignalTime = this.cooldowns[setup.asset] || 0;
    if (Date.now() - lastSignalTime < this.COOLDOWN_MS) return false;

    // 4. Market Context (Avoid low volume/lateral)
    const lowVol = setup.confluences.find(c => c.name === "Market Volume" && !c.met);
    if (lowVol) return false;

    // 5. Polymarket Validation
    const polyMatch = setup.confluences.find(c => c.name === "Polymarket Sentiment");
    if (polyMatch && !polyMatch.met) return false;

    // Update cooldown
    this.cooldowns[setup.asset] = Date.now();
    return true;
  }

  generateConclusion(setup: SignalSetup): string {
    if (setup.score >= 90) {
      return `Señal validada con MÁXIMA confluencia técnica (${setup.score}%). Respaldo total de mercado y sentimiento Polymarket. Entrada recomendada ${setup.type} PREMIUM.`;
    }
    if (setup.score >= 75) {
      return `Señal validada con alta confluencia técnica y respaldo de mercado. Entrada recomendada ${setup.type}.`;
    }
    return `Señal validada con confluencia moderada. Proceder con cautela. Entrada recomendada ${setup.type}.`;
  }
}

export const signalFilter = SignalFilterService.getInstance();
