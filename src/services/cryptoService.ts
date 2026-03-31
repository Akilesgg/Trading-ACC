export interface CryptoData {
  symbol: string;
  price: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
}

export async function fetchTicker(symbol: string): Promise<CryptoData> {
  const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch ticker");
  return response.json();
}

export async function fetchTickers(symbols: string[]): Promise<CryptoData[]> {
  return Promise.all(symbols.map(fetchTicker));
}

export async function fetchKlines(symbol: string, interval: string = "1h", limit: number = 50) {
  const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`);
  if (!response.ok) throw new Error("Failed to fetch klines");
  const data = await response.json();
  return data.map((d: any) => ({
    time: d[0],
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
  }));
}
