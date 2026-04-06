/**
 * Correlation Engine for BTC vs Crypto Comparison
 */

export interface CryptoAsset {
  symbol: string;
  name: string;
  correlation: number; // 0 to 1
  relativeVolatility: number; // ATR(Asset) / ATR(BTC)
}

export const SUPPORTED_ASSETS: CryptoAsset[] = [
  { symbol: "ETH", name: "Ethereum", correlation: 0.92, relativeVolatility: 1.25 },
  { symbol: "SOL", name: "Solana", correlation: 0.85, relativeVolatility: 1.85 },
  { symbol: "ADA", name: "Cardano", correlation: 0.88, relativeVolatility: 1.40 },
  { symbol: "AVAX", name: "Avalanche", correlation: 0.82, relativeVolatility: 1.95 },
  { symbol: "DOT", name: "Polkadot", correlation: 0.86, relativeVolatility: 1.55 },
  { symbol: "LINK", name: "Chainlink", correlation: 0.84, relativeVolatility: 1.65 },
  { symbol: "MATIC", name: "Polygon", correlation: 0.87, relativeVolatility: 1.75 },
  { symbol: "DOGE", name: "Dogecoin", correlation: 0.75, relativeVolatility: 2.50 },
  { symbol: "PEPE", name: "Pepe", correlation: 0.65, relativeVolatility: 4.20 },
  { symbol: "ARB", name: "Arbitrum", correlation: 0.80, relativeVolatility: 2.10 },
];

/**
 * Estimates the movement of an asset based on BTC movement
 * Formula: expectedMoveAsset = btcMove * correlation * relativeVolatility
 */
export const estimateAssetMove = (btcMove: number, asset: CryptoAsset): number => {
  return btcMove * asset.correlation * asset.relativeVolatility;
};

/**
 * Determines the impact level based on sensitivity (correlation * volatility)
 */
export const getImpactLevel = (asset: CryptoAsset): "HIGH" | "MEDIUM" | "LOW" => {
  const sensitivity = asset.correlation * asset.relativeVolatility;
  if (sensitivity > 1.8) return "HIGH";
  if (sensitivity > 1.2) return "MEDIUM";
  return "LOW";
};
