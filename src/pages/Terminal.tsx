import React, { useEffect } from "react";
import TerminalLayout from "../ui/layouts/TerminalLayout";
import TerminalTopbar from "../ui/components/TerminalTopbar";
import TerminalSidebar from "../ui/components/TerminalSidebar";
import TerminalChart from "../ui/widgets/TerminalChart";
import TerminalSignals from "../ui/widgets/TerminalSignals";
import TerminalOrderbook from "../ui/widgets/TerminalOrderbook";
import TerminalConsole from "../ui/widgets/TerminalConsole";
import { useTerminalStore } from "../store/useTerminalStore";
import { SignalStatus } from "../core/signals/types";

const Terminal: React.FC = () => {
  const { addSignal, addLog } = useTerminalStore();

  useEffect(() => {
    // Initial mock signal to show functionality
    const initialSignal = {
      id: "1",
      symbol: "BTCUSDT",
      type: "LONG" as const,
      entry: 64231.42,
      stopLoss: 63800.00,
      takeProfit: [65000, 66000, 68000],
      riskReward: 3.5,
      score: 85,
      status: SignalStatus.CONFIRMED,
      timestamp: Date.now(),
      explanation: "BOS alcista detectado en 1h con confirmación de volumen alto y RSI rebotando en 40.",
      indicators: {
        rsi: 42,
        macd: "BULLISH",
        emaTrend: "BULLISH" as const,
        volume: "HIGH" as const,
        smc: "BOS"
      }
    };
    addSignal(initialSignal);
    addLog("SUCCESS: Terminal engine started. Monitoring 100+ pairs.");
    addLog("SIGNAL: New LONG setup detected for BTCUSDT (Score: 85%)");
  }, []);

  return (
    <div className="flex bg-surface min-h-screen overflow-hidden">
      <TerminalSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TerminalTopbar />
        <div className="flex-1 overflow-auto custom-scrollbar p-2">
          <TerminalLayout>
            {{
              chart: <TerminalChart />,
              signals: <TerminalSignals />,
              orderbook: <TerminalOrderbook />,
              console: <TerminalConsole />,
            }}
          </TerminalLayout>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
