import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Zap, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Shield,
  Clock,
  Target,
  BarChart3,
  ChevronRight,
  Flame,
  Brain,
  Settings,
  Maximize2,
  Minimize2,
  LayoutGrid,
  List,
  Search,
  Bell,
  Menu,
  User,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Layers,
  History,
  Wallet,
  GraduationCap,
  Bolt
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchTicker, CryptoData, fetchKlines } from "@/services/cryptoService";
import { useTrades } from "@/hooks/useTrades";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  ComposedChart,
  Line,
  Cell
} from "recharts";

const Terminal = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const symbol = searchParams.get("symbol") || "BTCUSDT";
  const [ticker, setTicker] = useState<CryptoData | null>(null);
  const [klines, setKlines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [amount, setAmount] = useState("");
  const [price, setPrice] = useState("");
  const { trades, executeTrade } = useTrades();
  const [activeTab, setActiveTab] = useState<"Open Orders" | "Order History" | "Trade History" | "Assets">("Trade History");

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchTicker(symbol);
        setTicker(data);
        setPrice(data.price);
        const chartData = await fetchKlines(symbol, "1h", 100);
        setKlines(chartData);
      } catch (error) {
        console.error("Terminal data load error:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [symbol]);

  if (!ticker) return <div className="pt-32 text-center">Inicializando terminal...</div>;

  const isPositive = parseFloat(ticker.priceChangePercent) >= 0;

  const orderBook = {
    asks: Array.from({ length: 15 }, (_, i) => ({
      price: parseFloat(ticker.price) * (1 + (i + 1) * 0.0001),
      amount: Math.random() * 2,
      total: Math.random() * 50000,
    })).reverse(),
    bids: Array.from({ length: 15 }, (_, i) => ({
      price: parseFloat(ticker.price) * (1 - (i + 1) * 0.0001),
      amount: Math.random() * 2,
      total: Math.random() * 50000,
    })),
  };

  const handleTrade = async () => {
    if (!amount || !price) return;
    
    await executeTrade({
      symbol,
      side,
      type: orderType,
      price: parseFloat(price),
      amount: parseFloat(amount),
      total: parseFloat(price) * parseFloat(amount)
    });
    
    setAmount("");
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-screen pt-16 pb-20 md:pb-0 bg-surface-container-lowest flex flex-col overflow-hidden"
    >
      {/* Terminal Header */}
      <header className="h-14 border-b border-outline-variant/10 flex items-center justify-between px-4 bg-surface-container-low">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
          </button>
          <div className="flex items-center gap-3 border-l border-outline-variant/10 pl-4">
            <div className="flex items-center gap-2">
              <h2 className="font-headline font-bold text-lg">{ticker.symbol.replace("USDT", "")}</h2>
              <span className="text-[10px] bg-surface-container-highest px-2 py-0.5 rounded text-on-surface-variant font-bold uppercase tracking-widest">USDT</span>
            </div>
            <div className="flex items-center gap-4 text-xs font-label ml-4">
              <div className="flex flex-col">
                <span className={cn("font-bold", isPositive ? "text-primary" : "text-secondary")}>${parseFloat(ticker.price).toLocaleString()}</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Precio</span>
              </div>
              <div className="flex flex-col">
                <span className={cn("font-bold", isPositive ? "text-primary" : "text-secondary")}>{isPositive ? "+" : ""}{ticker.priceChangePercent}%</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Cambio 24h</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-on-surface">${parseFloat(ticker.highPrice).toLocaleString()}</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Máximo 24h</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="font-bold text-on-surface">${parseFloat(ticker.lowPrice).toLocaleString()}</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">Mínimo 24h</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant">
            <Settings className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-surface-container-high rounded-lg transition-colors text-on-surface-variant">
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Order Book */}
        <aside className="w-64 border-r border-outline-variant/10 flex flex-col bg-surface-container-low overflow-hidden">
          <div className="p-3 border-b border-outline-variant/10 flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Libro de Órdenes</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-primary/20 rounded-sm"></div>
              <div className="w-3 h-3 bg-secondary/20 rounded-sm"></div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[10px] p-2 space-y-0.5">
            <div className="flex justify-between text-on-surface-variant mb-2 px-1">
              <span>Precio (USDT)</span>
              <span>Cantidad</span>
            </div>
            {/* Asks */}
            {orderBook.asks.map((ask, i) => (
              <div key={i} className="flex justify-between relative group hover:bg-secondary/5 px-1">
                <div className="absolute right-0 top-0 bottom-0 bg-secondary/10 transition-all" style={{ width: `${(ask.amount / 2) * 100}%` }}></div>
                <span className="text-secondary relative z-10">{ask.price.toFixed(2)}</span>
                <span className="text-on-surface-variant relative z-10">{ask.amount.toFixed(4)}</span>
              </div>
            ))}
            {/* Spread */}
            <div className="py-3 text-center border-y border-outline-variant/10 my-2">
              <p className={cn("text-lg font-bold font-headline", isPositive ? "text-primary" : "text-secondary")}>${parseFloat(ticker.price).toLocaleString()}</p>
              <p className="text-[10px] text-on-surface-variant uppercase tracking-widest">Spread: 0.01%</p>
            </div>
            {/* Bids */}
            {orderBook.bids.map((bid, i) => (
              <div key={i} className="flex justify-between relative group hover:bg-primary/5 px-1">
                <div className="absolute right-0 top-0 bottom-0 bg-primary/10 transition-all" style={{ width: `${(bid.amount / 2) * 100}%` }}></div>
                <span className="text-primary relative z-10">{bid.price.toFixed(2)}</span>
                <span className="text-on-surface-variant relative z-10">{bid.amount.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Middle: Chart & History */}
        <main className="flex-1 flex flex-col overflow-hidden bg-surface-container-lowest">
          <div className="flex-1 p-4 relative">
            <div className="absolute top-8 left-8 z-10 flex gap-4">
              <div className="flex bg-surface-container-high rounded-lg p-1">
                {["1M", "5M", "15M", "1H", "4H", "1D"].map((tf) => (
                  <button key={tf} className={cn("px-3 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-all", tf === "1H" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:text-on-surface")}>
                    {tf}
                  </button>
                ))}
              </div>
              <div className="flex bg-surface-container-high rounded-lg p-1">
                <button className="p-1.5 rounded text-primary"><BarChart3 className="w-4 h-4" /></button>
                <button className="p-1.5 rounded text-on-surface-variant"><Activity className="w-4 h-4" /></button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={klines}>
                <CartesianGrid strokeDasharray="3 3" stroke="#22262b" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  hide 
                />
                <YAxis 
                  domain={['auto', 'auto']} 
                  orientation="right" 
                  stroke="#45484c" 
                  fontSize={10} 
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#1c2024", border: "none", borderRadius: "12px", color: "#f8f9fe" }}
                  itemStyle={{ color: "#b1ffce" }}
                />
                <Bar 
                  dataKey="volume" 
                  yAxisId={0} 
                  fill="#22262b" 
                  opacity={0.3} 
                />
                <Area 
                  type="monotone" 
                  dataKey="close" 
                  stroke={isPositive ? "#b1ffce" : "#ff7162"} 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                />
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#b1ffce" : "#ff7162"} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={isPositive ? "#b1ffce" : "#ff7162"} stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="h-48 border-t border-outline-variant/10 bg-surface-container-low flex flex-col">
            <div className="flex border-b border-outline-variant/10">
              {[
                { id: "Open Orders", label: "Órdenes Abiertas" },
                { id: "Order History", label: "Historial de Órdenes" },
                { id: "Trade History", label: "Historial de Operaciones" },
                { id: "Assets", label: "Activos" }
              ].map((tab) => (
                <button 
                  key={tab.id} 
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2", 
                    activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-on-surface-variant"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {activeTab === "Trade History" ? (
                <table className="w-full text-left text-[10px] font-label">
                  <thead className="sticky top-0 bg-surface-container-low text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/10">
                    <tr>
                      <th className="px-6 py-2">Hora</th>
                      <th className="px-6 py-2">Símbolo</th>
                      <th className="px-6 py-2">Lado</th>
                      <th className="px-6 py-2">Precio</th>
                      <th className="px-6 py-2">Cantidad</th>
                      <th className="px-6 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/5">
                    {trades.filter(t => t.symbol === symbol).map((trade) => (
                      <tr key={trade.id} className="hover:bg-surface-container-high/30">
                        <td className="px-6 py-2 text-on-surface-variant">
                          {trade.timestamp.toDate().toLocaleTimeString()}
                        </td>
                        <td className="px-6 py-2 font-bold">{trade.symbol.replace("USDT", "")}</td>
                        <td className={cn("px-6 py-2 font-bold uppercase", trade.side === "buy" ? "text-primary" : "text-secondary")}>
                          {trade.side === "buy" ? "Compra" : "Venta"}
                        </td>
                        <td className="px-6 py-2">${trade.price.toLocaleString()}</td>
                        <td className="px-6 py-2">{trade.amount}</td>
                        <td className="px-6 py-2">${trade.total.toLocaleString()}</td>
                      </tr>
                    ))}
                    {trades.filter(t => t.symbol === symbol).length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-on-surface-variant/40 italic">
                          No se encontró historial de operaciones para este par.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="flex-1 h-full flex items-center justify-center text-on-surface-variant/40 italic text-xs">
                  No se encontraron datos para esta sección.
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right: Trade Panel */}
        <aside className="w-80 border-l border-outline-variant/10 bg-surface-container-low flex flex-col p-4 space-y-6">
          <div className="flex bg-surface-container-high rounded-xl p-1">
            <button 
              onClick={() => setSide("buy")}
              className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all", side === "buy" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant")}
            >
              Comprar
            </button>
            <button 
              onClick={() => setSide("sell")}
              className={cn("flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all", side === "sell" ? "bg-secondary text-on-secondary shadow-lg" : "text-on-surface-variant")}
            >
              Vender
            </button>
          </div>

          <div className="flex gap-4 border-b border-outline-variant/10 pb-2">
            {[
              { id: "limit", label: "Límite" },
              { id: "market", label: "Mercado" },
              { id: "stop", label: "Stop" }
            ].map((type) => (
              <button 
                key={type.id}
                onClick={() => setOrderType(type.id as any)}
                className={cn("text-[10px] font-bold uppercase tracking-widest transition-all", orderType === type.id ? "text-primary" : "text-on-surface-variant")}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span>Precio</span>
                <span>USDT</span>
              </div>
              <input 
                type="text" 
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                disabled={orderType === "market"}
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-colors font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                <span>Cantidad</span>
                <span>{ticker.symbol.replace("USDT", "")}</span>
              </div>
              <input 
                type="text" 
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 px-4 focus:outline-none focus:border-primary transition-colors font-mono text-sm"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {["25%", "50%", "75%", "100%"].map((p) => (
                <button key={p} className="py-1.5 bg-surface-container-high rounded-lg text-[8px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-all">
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-outline-variant/10">
            <div className="flex justify-between text-xs font-label">
              <span className="text-on-surface-variant">Disponible</span>
              <span className="font-bold">1,240.50 USDT</span>
            </div>
            <div className="flex justify-between text-xs font-label">
              <span className="text-on-surface-variant">Compra Máx.</span>
              <span className="font-bold">0.024 BTC</span>
            </div>
            <div className="flex justify-between text-xs font-label">
              <span className="text-on-surface-variant">Comisión Est.</span>
              <span className="font-bold">0.12 USDT</span>
            </div>
          </div>

          <button 
            onClick={handleTrade}
            className={cn(
              "w-full py-4 rounded-2xl font-extrabold uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all mt-auto",
              side === "buy" ? "bg-primary text-on-primary shadow-primary/20" : "bg-secondary text-on-secondary shadow-secondary/20"
            )}
          >
            {side === "buy" ? "Comprar" : "Vender"} {ticker.symbol.replace("USDT", "")}
          </button>

          <div className="bg-surface-container-high/50 p-4 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Brain className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Asistente de Ejecución IA</span>
            </div>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              Absorción de ballenas detectada en ${(parseFloat(ticker.price) * 0.998).toFixed(2)}. Se recomienda establecer una orden límite ligeramente por encima.
            </p>
          </div>
        </aside>
      </div>
    </motion.div>
  );
};

export default Terminal;
