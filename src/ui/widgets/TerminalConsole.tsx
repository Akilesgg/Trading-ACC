import React, { useEffect, useRef } from "react";
import { useTerminalStore } from "../../store/useTerminalStore";
import { Terminal, Trash2, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TerminalConsole: React.FC = () => {
  const { logs, addLog } = useTerminalStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-neutral-950 text-emerald-500 font-mono text-[10px] p-4 leading-relaxed selection:bg-emerald-500/20">
      <div className="flex items-center justify-between mb-4 border-b border-emerald-500/10 pb-2">
        <div className="flex items-center gap-2 opacity-50">
          <Terminal className="w-3 h-3" />
          <span className="font-black uppercase tracking-widest">System Console v4.2.0</span>
        </div>
        <div className="flex gap-4 opacity-50">
          <button className="hover:text-emerald-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
          <button className="hover:text-emerald-400 transition-colors"><Maximize2 className="w-3 h-3" /></button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
        {logs.map((log, idx) => (
          <div key={idx} className="flex gap-4 group">
            <span className="opacity-20 select-none">{(logs.length - idx).toString().padStart(3, '0')}</span>
            <span className={cn(
              "break-all",
              log.includes("ERROR") ? "text-red-500" : 
              log.includes("SUCCESS") ? "text-primary" : 
              log.includes("SIGNAL") ? "text-amber-500" : "text-emerald-500/80"
            )}>
              {log}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2 animate-pulse">
          <span className="text-primary font-black">{">"}</span>
          <div className="w-2 h-4 bg-primary/50" />
        </div>
      </div>
    </div>
  );
};

export default TerminalConsole;
