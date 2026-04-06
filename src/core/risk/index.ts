export interface RiskParams {
  capital: number;
  riskPerTrade: number; // e.g., 0.01 for 1%
  atr: number;
}

export const calculatePositionSize = (params: RiskParams, entry: number, stopLoss: number): number => {
  const riskAmount = params.capital * params.riskPerTrade;
  const stopLossDistance = Math.abs(entry - stopLoss);
  if (stopLossDistance === 0) return 0;
  return riskAmount / stopLossDistance;
};

export const calculateDynamicSL = (entry: number, atr: number, multiplier: number = 2): number => {
  return entry - (atr * multiplier);
};

export const calculateStaggeredTP = (entry: number, stopLoss: number, targets: number[] = [1.5, 2.5, 4]): number[] => {
  const risk = Math.abs(entry - stopLoss);
  return targets.map(t => entry + (risk * t));
};
