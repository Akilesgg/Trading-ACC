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

export async function fetchTicker(symbol: string, timeframe: string = "1h"): Promise<CryptoData> {
  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    if (!response.ok) throw new Error("Failed to fetch ticker");
    const data = await response.json();
    
    const price = parseFloat(data.lastPrice);
    const change = parseFloat(data.priceChangePercent);
    const isBullish = change > 0;
    const volatility = Math.abs(parseFloat(data.highPrice) - parseFloat(data.lowPrice)) / price;
    
    // Dynamic TP/SL based on timeframe
    let tp1 = 0.02, tp2 = 0.05, tp3 = 0.10;
    let slPercent = 0.02;

    switch(timeframe.toLowerCase()) {
      case '1m':
      case '3m':
        tp1 = 0.003; tp2 = 0.006; tp3 = 0.01; slPercent = 0.005;
        break;
      case '5m':
        tp1 = 0.005; tp2 = 0.01; tp3 = 0.02; slPercent = 0.01;
        break;
      case '15m':
        tp1 = 0.01; tp2 = 0.025; tp3 = 0.05; slPercent = 0.015;
        break;
      case '1h':
        tp1 = 0.02; tp2 = 0.05; tp3 = 0.10; slPercent = 0.03;
        break;
      case '4h':
        tp1 = 0.05; tp2 = 0.10; tp3 = 0.20; slPercent = 0.05;
        break;
      case '1d':
        tp1 = 0.10; tp2 = 0.20; tp3 = 0.40; slPercent = 0.10;
        break;
    }

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
      timeframe,
      winRate: Math.floor(Math.random() * 20) + 65,
      proximity: Math.random() * 0.5,
      direction: isBullish ? "LONG" : "SHORT",
      stopLoss: isBullish ? price * (1 - slPercent) : price * (1 + slPercent),
      takeProfits: isBullish 
        ? [price * (1 + tp1), price * (1 + tp2), price * (1 + tp3)] 
        : [price * (1 - tp1), price * (1 - tp2), price * (1 - tp3)],
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
  } catch (error) {
    console.error(`Error fetching ticker for ${symbol}:`, error);
    // Fallback data if API fails but we need to show something
    return {
      symbol,
      price: "0.00",
      priceChangePercent: "0.00",
      highPrice: "0.00",
      lowPrice: "0.00",
      volume: "0.00",
      market: "N/A",
      image: `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${symbol.replace("USDT", "").toLowerCase()}.png`
    };
  }
}

export async function fetchTickers(symbols: string[], timeframe: string = "1h"): Promise<CryptoData[]> {
  const results = await Promise.all(symbols.map(s => fetchTicker(s, timeframe)));
  return results.filter(t => t.price !== "0.00");
}

export async function fetchKlines(symbol: string, interval: string = "1h", limit: number = 50) {
  // Map micro-timeframes to closest supported Binance API interval
  let apiInterval = interval;
  let aggregationFactor = 1;
  
  if (interval === '10s') {
    apiInterval = '1s';
    aggregationFactor = 10;
  } else if (interval === '30s') {
    apiInterval = '1s';
    aggregationFactor = 30;
  }
  
  // We need more data if we are aggregating
  const fetchLimit = limit * aggregationFactor;
  // Binance has a max limit of 1000 for regular klines (sometimes 1500)
  const safeLimit = Math.min(fetchLimit, 1000);

  const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${apiInterval}&limit=${safeLimit}`);
  
  if (!response.ok) {
    // If 1s is not supported (often only for top pairs like BTCUSDT), fallback to 1m
    if (apiInterval === '1s') {
      return fetchKlines(symbol, '1m', limit);
    }
    throw new Error("Failed to fetch klines");
  }
  
  const rawData = await response.json();
  const candles = rawData.map((d: any) => ({
    time: d[0],
    open: parseFloat(d[1]),
    high: parseFloat(d[2]),
    low: parseFloat(d[3]),
    close: parseFloat(d[4]),
    volume: parseFloat(d[5]),
  }));

  if (aggregationFactor === 1) return candles;

  // Aggregate candles
  const aggregated = [];
  for (let i = 0; i < candles.length; i += aggregationFactor) {
    const chunk = candles.slice(i, i + aggregationFactor);
    if (chunk.length === 0) continue;
    
    aggregated.push({
      time: chunk[0].time,
      open: chunk[0].open,
      high: Math.max(...chunk.map(c => c.high)),
      low: Math.min(...chunk.map(c => c.low)),
      close: chunk[chunk.length - 1].close,
      volume: chunk.reduce((sum, c) => sum + c.volume, 0),
    });
  }
  
  return aggregated.slice(-limit);
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

export function connectKlineStream(symbol: string, interval: string, onMessage: (candle: any) => void): WebSocket {
  const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
  let lastCandleTime = 0;
  let lastEmit = 0;

  ws.onmessage = (event) => {
    const k = JSON.parse(event.data).k;
    const now = Date.now();
    const isFinal = k.x;
    const candleTime = k.t;

    // Cuando cambia el tiempo de vela → nueva barra, emitir INMEDIATAMENTE sin throttle
    const isNewCandle = candleTime !== lastCandleTime;
    if (isNewCandle) {
      lastCandleTime = candleTime;
      lastEmit = now;
      onMessage({ time: candleTime, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v, isFinal });
      return;
    }

    // Misma vela: isFinal siempre pasa, actualizaciones intermedias throttleadas a 80ms
    if (!isFinal && now - lastEmit < 80) return;
    lastEmit = now;
    onMessage({ time: candleTime, open: +k.o, high: +k.h, low: +k.l, close: +k.c, volume: +k.v, isFinal });
  };
  return ws;
}

export interface AssetFundamental {
  symbol: string;
  name: string;
  type: "Crypto" | "Meme" | "Stablecoin" | "DeFi" | "L1" | "L2";
  project: string;
  summary: string;
  potential: string;
  links: { label: string; url: string }[];
  marketData: {
    supply: string;
    allTimeHigh: string;
    marketCapRank: number;
  };
}

export async function fetchAssetFundamentals(symbol: string): Promise<AssetFundamental> {
  const data: Record<string, AssetFundamental> = {
    "BTC": {
      symbol: "BTC",
      name: "Bitcoin",
      type: "Crypto",
      project: "Satoshi Nakamoto (Whitepaper 2008)",
      summary: "Bitcoin es la primera moneda digital descentralizada. Utiliza la tecnología Proof of Work (PoW) para asegurar la red. Es ampliamente considerada como el 'Oro Digital' debido a su suministro limitado de 21 millones de monedas.",
      potential: "Máximo potencial como reserva de valor global. La adopción de ETFs institucionales y su uso como activo de tesorería por empresas como MicroStrategy validan su tesis de inversión a largo plazo.",
      links: [
        { label: "Whitepaper", url: "https://bitcoin.org/bitcoin.pdf" },
        { label: "Explorador", url: "https://blockchain.info" },
        { label: "CoinMarketCap", url: "https://coinmarketcap.com/currencies/bitcoin/" }
      ],
      marketData: {
        supply: "19.6M / 21M",
        allTimeHigh: "$73,737",
        marketCapRank: 1
      }
    },
    "ETH": {
      symbol: "ETH",
      name: "Ethereum",
      type: "L1",
      project: "Vitalik Buterin (Lanzamiento 2015)",
      summary: "Ethereum es una plataforma global descentralizada para aplicaciones que no pueden ser censuradas. Es la base de las Finanzas Descentralizadas (DeFi) y los NFTs.",
      potential: "Líder indiscutible en utilidad. Con la transición a Proof of Stake (PoS) y las actualizaciones de escalabilidad (EIP-4844), Ethereum se posiciona como la computadora mundial definitiva.",
      links: [
        { label: "Sitio Oficial", url: "https://ethereum.org" },
        { label: "Etherscan", url: "https://etherscan.io" },
        { label: "CoinGecko", url: "https://www.coingecko.com/en/coins/ethereum" }
      ],
      marketData: {
        supply: "120.1M (Dinámico)",
        allTimeHigh: "$4,878",
        marketCapRank: 2
      }
    },
    "SOL": {
      symbol: "SOL",
      name: "Solana",
      type: "L1",
      project: "Anatoly Yakovenko (Solana Labs)",
      summary: "Solana es una blockchain de alto rendimiento que utiliza Proof of History (PoH) para lograr velocidades de hasta 65,000 transacciones por segundo con costos mínimos.",
      potential: "Fuerte competidor de Ethereum en el sector retail y juegos. Su ecosistema de DEXs (como Jupiter) y su rapidez la hacen la opción preferida para nuevos usuarios y desarrolladores.",
      links: [
        { label: "Documentación", url: "https://docs.solana.com" },
        { label: "Solscan", url: "https://solscan.io" },
        { label: "Twitter", url: "https://twitter.com/solana" }
      ],
      marketData: {
        supply: "443.8M",
        allTimeHigh: "$259",
        marketCapRank: 5
      }
    }
  };

  const cleanSymbol = symbol.replace("USDT", "").toUpperCase();
  const baseData = data[cleanSymbol] || {
    symbol: cleanSymbol,
    name: cleanSymbol,
    type: "Crypto",
    project: "Desarrollo Comunitario",
    summary: `Activo digital nativo del ecosistema ${cleanSymbol}. Enfocado en proporcionar soluciones descentralizadas dentro de su nicho de mercado.`,
    potential: "Depende directamente de la ejecución del roadmap técnico y la adopción de la comunidad en los próximos ciclos de mercado.",
    links: [
      { label: "CoinMarketCap", url: `https://coinmarketcap.com/currencies/${cleanSymbol.toLowerCase()}/` },
      { label: "Twitter Search", url: `https://twitter.com/search?q=%24${cleanSymbol}` }
    ],
    marketData: {
      supply: "N/A",
      allTimeHigh: "Variable",
      marketCapRank: 0
    }
  };

  return baseData;
}

export async function fetchEconomicEvents() {
  // Mocking economic calendar data as it usually requires paid APIs
  return [
    { 
      event: "Reunión de Emergencia de la OTAN", 
      impact: "CRÍTICO", 
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
      impact: "CRÍTICO", 
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
      impact: "ALTO", 
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
      impact: "CRÍTICO", 
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
  try {
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"];
    
    const results = await Promise.all(symbols.map(async (symbol) => {
      try {
        const response = await fetch(`https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=500`);
        if (!response.ok) return [];
        const trades = await response.json();
        
        return trades.filter((t: any) => {
          const price = parseFloat(t.p);
          const qty = parseFloat(t.q);
          return (price * qty) > 500000;
        }).map((t: any) => {
          const price = parseFloat(t.p);
          const qty = parseFloat(t.q);
          const amount = price * qty;
          return {
            symbol,
            type: t.m ? "VENTA" : "COMPRA",
            amount: `$${(amount / 1000000).toFixed(2)}M`,
            impact: amount > 1000000 ? "CRÍTICA" : "ALTA",
            exchange: "Binance",
            time: new Date(t.T).toLocaleTimeString(),
            sourceUrl: `https://www.binance.com/en/trade/${symbol}`,
            recommendation: t.m ? "VENTA" : "COMPRA",
            details: `Institución detectada en ${symbol}. Volumen: ${qty.toFixed(2)} ${symbol.replace("USDT", "")}.`
          };
        });
      } catch (e) {
        console.error(`Error fetching whale trades for ${symbol}:`, e);
        return [];
      }
    }));

    return results.flat().sort((a, b) => b.amount.localeCompare(a.amount)).slice(0, 15);
  } catch (error) {
    console.error("Error fetching whale movements:", error);
    return [];
  }
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

export async function calculateBTCCorrelation(symbol: string) {
  const cacheKey = `beta_${symbol}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { value, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
      return value;
    }
  }

  try {
    const btcKlines = await fetchKlines("BTCUSDT", "1d", 31);
    const assetKlines = await fetchKlines(symbol, "1d", 31);
    
    if (btcKlines.length < 31 || assetKlines.length < 31) return 1.0;

    const btcReturns = btcKlines.slice(1).map((k: any, i: number) => (k.close - btcKlines[i].close) / btcKlines[i].close);
    const assetReturns = assetKlines.slice(1).map((k: any, i: number) => (k.close - assetKlines[i].close) / assetKlines[i].close);
    
    // Beta = cov(asset, btc) / var(btc)
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
    
    const beta = covariance / varianceBtc;
    
    localStorage.setItem(cacheKey, JSON.stringify({ value: beta, timestamp: Date.now() }));
    return beta;
  } catch (error) {
    console.error("Error calculating beta:", error);
    return 1.0;
  }
}

export interface FearGreedData {
  value: number;
  value_classification: string;
  timestamp: string;
}

export async function fetchFearGreedIndex(limit: number = 30): Promise<FearGreedData[]> {
  try {
    const response = await fetch(`https://api.alternative.me/fng/?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch Fear & Greed Index");
    const data = await response.json();
    return data.data.map((item: any) => ({
      value: parseInt(item.value),
      value_classification: item.value_classification,
      timestamp: new Date(parseInt(item.timestamp) * 1000).toISOString()
    })).reverse(); // Reverse to get chronological order for charts
  } catch (error) {
    console.error("Error fetching Fear & Greed Index:", error);
    // Fallback data
    return Array.from({ length: limit }).map((_, i) => ({
      value: 50 + Math.floor(Math.random() * 20),
      value_classification: "Neutral",
      timestamp: new Date(Date.now() - (limit - i) * 24 * 60 * 60 * 1000).toISOString()
    }));
  }
}
