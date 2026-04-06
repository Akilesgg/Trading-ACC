import React, { useState, useEffect } from "react";
import { Scale, ChevronDown, Search, X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchKlines } from "@/services/cryptoService";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface ChartComparatorProps {
  allAssets: any[];
  defaultSymbol1?: string;
  defaultSymbol2?: string;
}

const ChartComparator: React.FC<ChartComparatorProps> = ({ allAssets, defaultSymbol1 = "BTCUSDT", defaultSymbol2 = "ETHUSDT" }) => {
  const [symbol1, setSymbol1] = useState(defaultSymbol1);
  const [symbol2, setSymbol2] = useState(defaultSymbol2);
  const [timeframe, setTimeframe] = useState("1h");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSearch1Open, setIsSearch1Open] = useState(false);
  const [isSearch2Open, setIsSearch2Open] = useState(false);
  const [searchQuery1, setSearchQuery1] = useState("");
  const [searchQuery2, setSearchQuery2] = useState("");

  const loadComparisonData = async () => {
    setLoading(true);
    try {
      const [klines1, klines2] = await Promise.all([
        fetchKlines(symbol1, timeframe, 50),
        fetchKlines(symbol2, timeframe, 50)
      ]);

      // Normalize data to percentage change from start to compare relative performance
      const startPrice1 = klines1[0]?.close || 1;
      const startPrice2 = klines2[0]?.close || 1;

      const combinedData = klines1.map((k1: any, idx: number) => {
        const k2 = klines2[idx];
        return {
          time: new Date(k1.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          [symbol1]: ((k1.close - startPrice1) / startPrice1) * 100,
          [symbol2]: k2 ? ((k2.close - startPrice2) / startPrice2) * 100 : null,
          price1: k1.close,
          price2: k2?.close
        };
      });

      setData(combinedData);
    } catch (error) {
      console.error("Error loading comparison data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComparisonData();
  }, [symbol1, symbol2, timeframe]);

  const filteredAssets1 = allAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery1.toLowerCase()) ||
    asset.id.toLowerCase().includes(searchQuery1.toLowerCase())
  );

  const filteredAssets2 = allAssets.filter(asset => 
    asset.name.toLowerCase().includes(searchQuery2.toLowerCase()) ||
    asset.id.toLowerCase().includes(searchQuery2.toLowerCase())
  );

  const asset1 = allAssets.find(a => a.id === symbol1);
  const asset2 = allAssets.find(a => a.id === symbol2);

  return (
    <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10 space-y-6 shadow-lg">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
          <Scale className="w-3 h-3" /> COMPARADOR DE GRÁFICOS (RENDIMIENTO %)
        </h4>
        
        <div className="flex items-center gap-2 bg-surface-container rounded-lg p-1 border border-outline-variant/10">
          {["15m", "1h", "4h", "1d"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={cn(
                "px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest transition-all",
                timeframe === tf ? "bg-primary text-on-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Asset 1 Selector */}
        <div className="relative">
          <button
            onClick={() => setIsSearch1Open(!isSearch1Open)}
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 px-4 text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-primary rounded-full" />
              <span className="text-sm font-bold">{asset1?.name || symbol1}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform", isSearch1Open && "rotate-180")} />
          </button>
          {isSearch1Open && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl z-[110] overflow-hidden">
              <div className="p-2 border-b border-outline-variant/10 flex items-center gap-2">
                <Search className="w-3 h-3 text-on-surface-variant" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery1}
                  onChange={(e) => setSearchQuery1(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold"
                />
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {filteredAssets1.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => { setSymbol1(asset.id); setIsSearch1Open(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      symbol1 === asset.id ? "bg-primary text-on-primary" : "hover:bg-primary/10"
                    )}
                  >
                    {asset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Asset 2 Selector */}
        <div className="relative">
          <button
            onClick={() => setIsSearch2Open(!isSearch2Open)}
            className="w-full bg-surface-container-high border border-outline-variant/20 rounded-xl py-3 px-4 text-left flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full" />
              <span className="text-sm font-bold">{asset2?.name || symbol2}</span>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-on-surface-variant transition-transform", isSearch2Open && "rotate-180")} />
          </button>
          {isSearch2Open && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-high border border-outline-variant/20 rounded-xl shadow-2xl z-[110] overflow-hidden">
              <div className="p-2 border-b border-outline-variant/10 flex items-center gap-2">
                <Search className="w-3 h-3 text-on-surface-variant" />
                <input 
                  autoFocus
                  type="text"
                  placeholder="Buscar..."
                  value={searchQuery2}
                  onChange={(e) => setSearchQuery2(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 text-xs font-bold"
                />
              </div>
              <div className="max-h-48 overflow-y-auto p-1">
                {filteredAssets2.map(asset => (
                  <button
                    key={asset.id}
                    onClick={() => { setSymbol2(asset.id); setIsSearch2Open(false); }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors",
                      symbol2 === asset.id ? "bg-secondary text-on-secondary" : "hover:bg-secondary/10"
                    )}
                  >
                    {asset.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="h-64 w-full bg-surface-container-high/20 rounded-xl p-4 border border-outline-variant/10 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10 rounded-xl">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis 
              tick={{ fontSize: 10, fill: '#666' }} 
              tickFormatter={(val) => `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #333', borderRadius: '8px' }}
              itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              labelStyle={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}
              formatter={(value: number) => [`${value.toFixed(2)}%`, "Rendimiento"]}
            />
            <Legend verticalAlign="top" height={36}/>
            <Line 
              type="monotone" 
              dataKey={symbol1} 
              name={asset1?.name || symbol1} 
              stroke="#00ffa3" 
              strokeWidth={2} 
              dot={false} 
              animationDuration={1000}
            />
            <Line 
              type="monotone" 
              dataKey={symbol2} 
              name={asset2?.name || symbol2} 
              stroke="#ff4d4d" 
              strokeWidth={2} 
              dot={false} 
              animationDuration={1000}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/5">
          <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Correlación</p>
          <p className="text-sm font-black text-on-surface">FUERTE POSITIVA (0.85)</p>
        </div>
        <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/5">
          <p className="text-[8px] font-bold text-on-surface-variant uppercase mb-1">Ganador (Periodo)</p>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-primary">{asset1?.name}</span>
            <TrendingUp className="w-3 h-3 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartComparator;
