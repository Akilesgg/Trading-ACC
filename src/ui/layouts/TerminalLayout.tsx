import React, { useState, useEffect } from "react";
import { Responsive } from "react-grid-layout";
import "/node_modules/react-grid-layout/css/styles.css";
import "/node_modules/react-resizable/css/styles.css";
import { useTerminalStore } from "../../store/useTerminalStore";
import { cn } from "@/lib/utils";

const ResponsiveGridLayout = Responsive;

interface TerminalLayoutProps {
  children: { [key: string]: React.ReactNode };
}

const TerminalLayout: React.FC<TerminalLayoutProps> = ({ children }) => {
  const { layout, setLayout } = useTerminalStore();

  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayout(currentLayout);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface font-mono selection:bg-primary/30">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={30}
        width={1200}
        onLayoutChange={onLayoutChange}
        margin={[8, 8]}
      >
        {layout.map((item: any) => (
          <div key={item.i} className="bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden shadow-2xl flex flex-col group">
            <div className="drag-handle bg-surface-container-high/50 px-4 py-2 border-b border-outline-variant/10 flex items-center justify-between cursor-grab active:cursor-grabbing">
              <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant opacity-50 group-hover:opacity-100 transition-opacity">
                {item.i}
              </span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-on-surface-variant/20" />
                <div className="w-2 h-2 rounded-full bg-on-surface-variant/20" />
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              {children[item.i] || <div className="p-4 text-xs text-on-surface-variant italic">Widget {item.i} not found</div>}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default TerminalLayout;
