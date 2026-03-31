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
  const data = await response.json();
  return {
    symbol: data.symbol,
    price: data.lastPrice,
    priceChangePercent: data.priceChangePercent,
    highPrice: data.highPrice,
    lowPrice: data.lowPrice,
    volume: data.volume,
  };
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

export function connectTickerStream(symbol: string, onMessage: (data: any) => void): WebSocket {
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    onMessage({
      symbol: data.s,
      price: data.c,
      priceChangePercent: data.P,
      highPrice: data.h,
      lowPrice: data.l,
      volume: data.v,
    });
  };
  return ws;
}

export async function fetchEconomicEvents() {
  // Mocking economic calendar data as it usually requires paid APIs
  return [
    { event: "CPI (Consumer Price Index)", impact: "HIGH", time: "14:30", date: "Hoy" },
    { event: "FOMC Meeting Minutes", impact: "CRITICAL", time: "20:00", date: "Mañana" },
    { event: "Unemployment Claims", impact: "MEDIUM", time: "13:30", date: "Jueves" },
  ];
}

export async function fetchCryptoData() {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT"];
  const tickers = await fetchTickers(symbols);
  return tickers.map(t => ({
    id: t.symbol,
    name: t.symbol.replace("USDT", ""),
    symbol: t.symbol.replace("USDT", ""),
    current_price: parseFloat(t.price),
    price_change_percentage_24h: parseFloat(t.priceChangePercent),
    market_cap: parseFloat(t.volume) * parseFloat(t.price), // Mock market cap
    image: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${t.symbol.replace("USDT", "").toLowerCase()}.png`
  }));
}
