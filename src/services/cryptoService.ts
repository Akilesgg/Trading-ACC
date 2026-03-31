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
    { 
      event: "Reunión de Emergencia de la OTAN", 
      impact: "CRITICAL", 
      time: "14:30", 
      date: "Hoy", 
      description: "Discusión sobre nuevas sanciones comerciales y tensiones en fronteras orientales. Alta probabilidad de impacto en el precio del petróleo y activos de refugio.",
      effect: "Volatilidad extrema",
      probability: 95
    },
    { 
      event: "Decisión de Tasas (FED)", 
      impact: "CRITICAL", 
      time: "20:00", 
      date: "Mañana", 
      description: "El mercado espera una pausa en las tasas. Cualquier sorpresa podría causar liquidaciones masivas en el mercado cripto.",
      effect: "Cambio de Tendencia",
      probability: 88
    },
    { 
      event: "Cumbre G7 sobre Activos Digitales", 
      impact: "HIGH", 
      time: "09:00", 
      date: "2 Abr", 
      description: "Propuesta de marco regulatorio global para stablecoins y exchanges. Posible presión regulatoria a corto plazo.",
      effect: "Corrección Técnica",
      probability: 75
    },
    { 
      event: "Conflicto en Oriente Medio", 
      impact: "CRITICAL", 
      time: "En curso", 
      date: "Hoy", 
      description: "Escalada de tensiones afecta las rutas de suministro globales. Impacto directo en el sentimiento de riesgo (Risk-Off).",
      effect: "Fuga hacia Calidad (BTC/Oro)",
      probability: 92
    },
  ];
}

export async function fetchWhaleMovements() {
  return [
    { symbol: "BTCUSDT", type: "BUY", amount: "$2450K", impact: "Alta", exchange: "Binance", time: "hace 2 min" },
    { symbol: "ETHUSDT", type: "SELL", amount: "$1800K", impact: "Alta", exchange: "Bybit", time: "hace 5 min" },
    { symbol: "BNBUSDT", type: "BUY", amount: "$950K", impact: "Media", exchange: "OKX", time: "hace 12 min" },
    { symbol: "SOLUSDT", type: "BUY", amount: "$620K", impact: "Media", exchange: "Coinbase", time: "hace 18 min" },
    { symbol: "XRPUSDT", type: "SELL", amount: "$870K", impact: "Alta", exchange: "Binance", time: "hace 25 min" },
  ];
}

export async function fetchTopTraders() {
  return [
    { name: "CryptoGod", exchange: "Binance", followers: "12.5K", trade: "LONG BTC", profit: "+12.4%", score: 94 },
    { name: "WhaleHunter", exchange: "Bybit", followers: "8.9K", trade: "SHORT ETH", profit: "+8.2%", score: 88 },
    { name: "SmartMoney", exchange: "OKX", followers: "6.7K", trade: "LONG SOL", profit: "+15.7%", score: 85 },
    { name: "AlphaTrader", exchange: "Binance", followers: "15.4K", trade: "LONG BTC", profit: "+9.3%", score: 91 },
    { name: "MoonMaker", exchange: "Kucoin", followers: "5.2K", trade: "SHORT BNB", profit: "+5.8%", score: 72 },
  ];
}

export async function fetchLargeTransactions() {
  return [
    { symbol: "BTC", amount: "1,250", type: "Acumulación", time: "1 min", address: "0x3a2... → 0x7f1..." },
    { symbol: "ETH", amount: "45,000", type: "Distribución", time: "4 min", address: "0x9e4... → 0x2b8..." },
    { symbol: "SOL", amount: "250,000", type: "Depósito", time: "9 min", address: "0x5c3... → Exchange" },
    { symbol: "BNB", amount: "15,000", type: "Retiro", time: "14 min", address: "Exchange → 0x1d9..." },
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
