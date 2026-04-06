export interface CryptoData {
  symbol: string;
  price: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  // New fields for signals table
  market?: string;
  entry?: number;
  timeframe?: string;
  winRate?: number;
  proximity?: number;
  direction?: "LONG" | "SHORT";
  stopLoss?: number;
  takeProfits?: number[];
  consensus?: number;
  funding?: string;
  oi?: string;
  rsi?: number;
  recommendation?: string;
  liquidity?: string;
  alert?: boolean;
  leverage?: number;
  riskLevel?: "Bajo" | "Moderado" | "Alto";
  image?: string;
}

export async function fetchTicker(symbol: string): Promise<CryptoData> {
  const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
  if (!response.ok) throw new Error("Failed to fetch ticker");
  const data = await response.json();
  
  // Mocking/Calculating additional fields
  const price = parseFloat(data.lastPrice);
  const change = parseFloat(data.priceChangePercent);
  const isBullish = change > 0;
  const volatility = Math.abs(parseFloat(data.highPrice) - parseFloat(data.lowPrice)) / price;
  
  // Leverage calculation based on volatility (ATR-like)
  let leverage = 10;
  let riskLevel: "Bajo" | "Moderado" | "Alto" = "Moderado";
  if (volatility > 0.05) {
    leverage = 3;
    riskLevel = "Alto";
  } else if (volatility < 0.02) {
    leverage = 20;
    riskLevel = "Bajo";
  }

  return {
    symbol: data.symbol,
    price: data.lastPrice,
    priceChangePercent: data.priceChangePercent,
    highPrice: data.highPrice,
    lowPrice: data.lowPrice,
    volume: data.volume,
    market: "FUTUROS",
    entry: price * (isBullish ? 0.995 : 1.005),
    timeframe: "1h",
    winRate: Math.floor(Math.random() * 20) + 65,
    proximity: Math.random() * 0.5,
    direction: isBullish ? "LONG" : "SHORT",
    stopLoss: isBullish ? price * 0.98 : price * 1.02,
    takeProfits: isBullish ? [price * 1.02, price * 1.05, price * 1.1] : [price * 0.98, price * 0.95, price * 0.9],
    consensus: Math.floor(Math.random() * 30) + 60,
    funding: (Math.random() * 0.02 - 0.01).toFixed(4) + "%",
    oi: (parseFloat(data.volume) * 0.1).toFixed(2) + "M",
    rsi: Math.floor(Math.random() * 40) + 30,
    recommendation: isBullish ? "COMPRA FUERTE" : "VENTA FUERTE",
    liquidity: (parseFloat(data.volume) * 0.05).toFixed(2) + "M",
    alert: Math.random() > 0.7,
    leverage,
    riskLevel,
    image: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${data.symbol.replace("USDT", "").toLowerCase()}.png`
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
      image: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${data.s.replace("USDT", "").toLowerCase()}.png`
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
      probability: 95,
      sourceUrl: "https://www.reuters.com/world/europe/",
      recommendation: "MANTENER",
      details: "Las sanciones podrían desestabilizar los mercados energéticos europeos, lo que históricamente ha llevado a una correlación negativa con activos de riesgo. Se recomienda reducir exposición a altcoins de baja capitalización."
    },
    { 
      event: "Decisión de Tasas (FED)", 
      impact: "CRITICAL", 
      time: "20:00", 
      date: "Mañana", 
      description: "El mercado espera una pausa en las tasas. Cualquier sorpresa podría causar liquidaciones masivas en el mercado cripto.",
      effect: "Cambio de Tendencia",
      probability: 88,
      sourceUrl: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
      recommendation: "VENTA",
      details: "Si la FED decide un aumento inesperado, el DXY (Índice del Dólar) se fortalecerá, presionando a la baja a BTC. Los traders institucionales están cubriendo posiciones con opciones de venta."
    },
    { 
      event: "Cumbre G7 sobre Activos Digitales", 
      impact: "HIGH", 
      time: "09:00", 
      date: "2 Abr", 
      description: "Propuesta de marco regulatorio global para stablecoins y exchanges. Posible presión regulatoria a corto plazo.",
      effect: "Corrección Técnica",
      probability: 75,
      sourceUrl: "https://www.g7germany.de/",
      recommendation: "MANTENER",
      details: "La regulación global es positiva a largo plazo para la adopción masiva, pero genera incertidumbre inmediata. Observar niveles de soporte en stablecoins algorítmicas."
    },
    { 
      event: "Conflicto en Oriente Medio", 
      impact: "CRITICAL", 
      time: "En curso", 
      date: "Hoy", 
      description: "Escalada de tensiones afecta las rutas de suministro globales. Impacto directo en el sentimiento de riesgo (Risk-Off).",
      effect: "Fuga hacia Calidad (BTC/Oro)",
      probability: 92,
      sourceUrl: "https://www.aljazeera.com/news/",
      recommendation: "COMPRA",
      details: "En escenarios de inestabilidad geopolítica, Bitcoin ha comenzado a comportarse como 'oro digital'. Se observa un flujo de capital desde mercados de renta variable hacia BTC."
    },
  ];
}

export async function fetchWhaleMovements() {
  return [
    { symbol: "BTCUSDT", type: "COMPRA", amount: "$2450K", impact: "Alta", exchange: "Binance", time: "hace 2 min", sourceUrl: "https://whale-alert.io/", recommendation: "COMPRA", details: "Acumulación masiva detectada en billeteras frías de Binance. Indica una fuerte confianza institucional a estos niveles de precio." },
    { symbol: "ETHUSDT", type: "VENTA", amount: "$1800K", impact: "Alta", exchange: "Bybit", time: "hace 5 min", sourceUrl: "https://whale-alert.io/", recommendation: "VENTA", details: "Gran flujo de ETH hacia exchanges detectado. Posible toma de ganancias masiva o preparación para una liquidación en cascada." },
    { symbol: "BNBUSDT", type: "COMPRA", amount: "$950K", impact: "Media", exchange: "OKX", time: "hace 12 min", sourceUrl: "https://whale-alert.io/", recommendation: "MANTENER", details: "Movimiento de ballena de tamaño medio. Podría ser una rebalanceo de cartera antes del próximo Launchpad de Binance." },
    { symbol: "SOLUSDT", type: "COMPRA", amount: "$620K", impact: "Media", exchange: "Coinbase", time: "hace 18 min", sourceUrl: "https://whale-alert.io/", recommendation: "COMPRA", details: "Compras consistentes en Coinbase Pro sugieren una acumulación silenciosa por parte de fondos de inversión estadounidenses." },
    { symbol: "XRPUSDT", type: "VENTA", amount: "$870K", impact: "Alta", exchange: "Binance", time: "hace 25 min", sourceUrl: "https://whale-alert.io/", recommendation: "VENTA", details: "Venta de XRP tras noticias legales. El volumen de venta supera la media de 24h, indicando una posible corrección mayor." },
  ];
}

export async function fetchTopTraders() {
  return [
    { 
      name: "CryptoGod", 
      exchange: "Binance", 
      followers: "12.5K", 
      trade: "LARGO BTC", 
      profit: "+12.4%", 
      score: 94, 
      sourceUrl: "https://www.binance.com/en/copy-trading", 
      recommendation: "COMPRA", 
      details: "Estrategia basada en la ruptura de la resistencia de los $68k con confirmación de volumen institucional. Se observa una absorción de oferta en el Order Book, lo que sugiere una continuación alcista hacia el siguiente nivel de liquidez en $72k." 
    },
    { 
      name: "WhaleHunter", 
      exchange: "Bybit", 
      followers: "8.9K", 
      trade: "CORTO ETH", 
      profit: "+8.2%", 
      score: 88, 
      sourceUrl: "https://www.bybit.com/copyTrading", 
      recommendation: "VENTA", 
      details: "Posición corta fundamentada en una divergencia bajista clase A en el RSI de 4H y el rechazo del nivel de Fibonacci 0.618. El flujo de órdenes muestra una presión vendedora agresiva superando a los compradores pasivos." 
    },
    { 
      name: "SmartMoney", 
      exchange: "OKX", 
      followers: "6.7K", 
      trade: "LARGO SOL", 
      profit: "+15.7%", 
      score: 85, 
      sourceUrl: "https://www.okx.com/copy-trading", 
      recommendation: "COMPRA", 
      details: "Estrategia de rotación de capital. Se observa un incremento del 25% en el TVL de Solana en las últimas 48h y una ruptura de estructura (BOS) al alza en temporalidades de 1H, validando una entrada institucional." 
    },
    { 
      name: "AlphaTrader", 
      exchange: "Binance", 
      followers: "15.4K", 
      trade: "LARGO BTC", 
      profit: "+9.3%", 
      score: 91, 
      sourceUrl: "https://www.binance.com/en/copy-trading", 
      recommendation: "COMPRA", 
      details: "Seguimiento de tendencia macro. El precio se mantiene por encima de la EMA de 200 periodos y ha retesteado con éxito el POC (Point of Control) del perfil de volumen semanal. Objetivo técnico: Máximos históricos." 
    },
    { 
      name: "MoonMaker", 
      exchange: "Kucoin", 
      followers: "5.2K", 
      trade: "CORTO BNB", 
      profit: "+5.8%", 
      score: 72, 
      sourceUrl: "https://www.kucoin.com/copy-trading", 
      recommendation: "VENTA", 
      details: "Estrategia de arbitraje y cobertura. Se detecta una ineficiencia en el libro de órdenes (Fair Value Gap) que el precio tiende a rellenar. La debilidad relativa de BNB frente a BTC justifica esta cobertura táctica." 
    },
  ];
}

export async function fetchLargeTransactions() {
  return [
    { symbol: "BTC", amount: "1,250", type: "Acumulación", time: "1 min", address: "0x3a2... → 0x7f1...", sourceUrl: "https://blockchain.info/", recommendation: "COMPRA", details: "Transferencia masiva desde exchange a billetera privada. Típico comportamiento de 'HODL' institucional que reduce la oferta circulante." },
    { symbol: "ETH", amount: "45,000", type: "Distribución", time: "4 min", address: "0x9e4... → 0x2b8...", sourceUrl: "https://etherscan.io/", recommendation: "VENTA", details: "Movimiento desde billetera Génesis hacia múltiples direcciones. Sugiere una distribución estratégica por parte de ballenas tempranas." },
    { symbol: "SOL", amount: "250,000", type: "Depósito", time: "9 min", address: "0x5c3... → Exchange", sourceUrl: "https://solscan.io/", recommendation: "VENTA", details: "Depósito masivo en billetera caliente de exchange. Históricamente precede a una presión de venta inmediata en el mercado spot." },
    { symbol: "BNB", amount: "15,000", type: "Retiro", time: "14 min", address: "Exchange → 0x1d9...", sourceUrl: "https://bscscan.com/", recommendation: "COMPRA", details: "Retiro de fondos hacia billetera de staking. Indica una intención de bloqueo de activos a largo plazo, reduciendo la liquidez de venta." },
  ];
}

export async function fetchCryptoData() {
  const symbols = [
    "BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT",
    "DOTUSDT", "LINKUSDT", "MATICUSDT", "SHIBUSDT", "LTCUSDT", "TRXUSDT", "UNIUSDT", "ATOMUSDT",
    "ETCUSDT", "XMRUSDT", "BCHUSDT", "ALGOUSDT", "NEARUSDT", "FTMUSDT", "SANDUSDT", "MANAUSDT",
    "APEUSDT", "GALAUSDT", "AXSUSDT", "CHZUSDT", "EGLDUSDT", "FILUSDT"
  ];
  const tickers = await fetchTickers(symbols);
  return tickers.map(t => ({
    id: t.symbol,
    name: t.symbol.replace("USDT", ""),
    symbol: t.symbol.replace("USDT", ""),
    current_price: parseFloat(t.price),
    price_change_percentage_24h: parseFloat(t.priceChangePercent),
    market_cap: parseFloat(t.volume) * parseFloat(t.price), // Mock market cap
    image: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${t.symbol.replace("USDT", "").toLowerCase()}.png`,
    sourceUrl: `https://www.binance.com/en/trade/${t.symbol.replace("USDT", "")}_USDT`
  }));
}
