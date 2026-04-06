export interface BacktestResult {
  winrate: number;
  profitFactor: number;
  drawdown: number;
  tradesCount: number;
  totalPnL: number;
}

export const runBacktest = (strategy: any, historicalData: any[]): BacktestResult => {
  let wins = 0;
  let losses = 0;
  let totalPnL = 0;
  let maxDrawdown = 0;
  let peak = 0;

  historicalData.forEach(d => {
    const result = strategy(d);
    if (result.pnl > 0) {
      wins++;
    } else {
      losses++;
    }
    totalPnL += result.pnl;
    if (totalPnL > peak) peak = totalPnL;
    const drawdown = peak - totalPnL;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  });

  const tradesCount = wins + losses;
  const winrate = tradesCount > 0 ? (wins / tradesCount) * 100 : 0;
  const profitFactor = losses > 0 ? wins / losses : wins;

  return {
    winrate,
    profitFactor,
    drawdown: maxDrawdown,
    tradesCount,
    totalPnL
  };
};
