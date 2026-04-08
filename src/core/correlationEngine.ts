import { fetchKlines } from "../services/cryptoService";

export interface CryptoAsset {
  symbol: string;
  name: string;
  correlation: number;
  relativeVolatility: number;
  beta: number;
}

export const SUPPORTED_ASSETS: CryptoAsset[] = [
  { symbol: "ETHUSDT", name: "Ethereum", correlation: 0.85, relativeVolatility: 1.2, beta: 1.1 },
  { symbol: "SOLUSDT", name: "Solana", correlation: 0.75, relativeVolatility: 2.5, beta: 1.8 },
  { symbol: "BNBUSDT", name: "Binance Coin", correlation: 0.82, relativeVolatility: 1.1, beta: 0.9 },
  { symbol: "ADAUSDT", name: "Cardano", correlation: 0.78, relativeVolatility: 1.5, beta: 1.2 },
  { symbol: "XRPUSDT", name: "XRP", correlation: 0.65, relativeVolatility: 1.8, beta: 1.0 },
  { symbol: "DOTUSDT", name: "Polkadot", correlation: 0.80, relativeVolatility: 1.6, beta: 1.3 },
  { symbol: "MATICUSDT", name: "Polygon", correlation: 0.76, relativeVolatility: 1.9, beta: 1.4 },
  { symbol: "AVAXUSDT", name: "Avalanche", correlation: 0.72, relativeVolatility: 2.2, beta: 1.6 },
  { symbol: "LINKUSDT", name: "Chainlink", correlation: 0.70, relativeVolatility: 1.7, beta: 1.1 },
  { symbol: "DOGEUSDT", name: "Dogecoin", correlation: 0.55, relativeVolatility: 3.5, beta: 2.0 },
];

export function estimateAssetMove(btcMove: number, asset: CryptoAsset): number {
  return btcMove * asset.beta;
}

export function getImpactLevel(asset: CryptoAsset): "LOW" | "MEDIUM" | "HIGH" | "EXTREME" {
  if (asset.relativeVolatility > 3) return "EXTREME";
  if (asset.relativeVolatility > 2) return "HIGH";
  if (asset.relativeVolatility > 1.2) return "MEDIUM";
  return "LOW";
}

export async function calculateDynamicBeta(assetSymbol: string): Promise<number> {
  const cacheKey = `beta_${assetSymbol}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { value, timestamp } = JSON.parse(cached);
    // 24h cache
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return value;
    }
  }

  try {
    // Fetch 30 days of daily klines (+1 for returns calculation)
    const btcKlines = await fetchKlines("BTCUSDT", "1d", 31);
    const assetKlines = await fetchKlines(assetSymbol, "1d", 31);
    
    if (btcKlines.length < 31 || assetKlines.length < 31) return 1.0;

    // Calculate daily returns
    const btcReturns = btcKlines.slice(1).map((k: any, i: number) => (k.close - btcKlines[i].close) / btcKlines[i].close);
    const assetReturns = assetKlines.slice(1).map((k: any, i: number) => (k.close - assetKlines[i].close) / assetKlines[i].close);
    
    // Beta = cov(asset_returns, btc_returns) / var(btc_returns)
    const meanBtc = btcReturns.reduce((a: number, b: number) => a + b, 0) / btcReturns.length;
    const meanAsset = assetReturns.reduce((a: number, b: number) => a + b, 0) / assetReturns.length;
    
    let covariance = 0;
    let varianceBtc = 0;
    
    for (let i = 0; i < btcReturns.length; i++) {
      const diffBtc = btcReturns[i] - meanBtc;
      const diffAsset = assetReturns[i] - meanAsset;
      covariance += diffBtc * diffAsset;
      varianceBtc += diffBtc * diffBtc;
    }
    
    const beta = varianceBtc === 0 ? 1.0 : covariance / varianceBtc;
    
    localStorage.setItem(cacheKey, JSON.stringify({ value: beta, timestamp: Date.now() }));
    return beta;
  } catch (error) {
    console.error(`Error calculating dynamic beta for ${assetSymbol}:`, error);
    return 1.0;
  }
}
