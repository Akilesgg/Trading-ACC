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
  const [width, setWidth] = useState(1200);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayout(currentLayout);
  };

  return (
    <div ref={containerRef} className="min-h-full bg-background text-on-surface font-mono selection:bg-primary/30">
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout, md: layout, sm: layout, xs: layout, xxs: layout }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
        rowHeight={30}
        width={width}
        onLayoutChange={onLayoutChange}
        margin={[16, 16]}
      >
        {layout.map((item: any) => (
          <div 
            key={item.i} 
            className="trading-card p-0 flex flex-col group overflow-hidden"
          >
            <div className="drag-handle bg-surface-container-high/50 px-5 py-3 border-b border-outline-variant/10 flex items-center justify-between cursor-grab active:cursor-grabbing group-hover:bg-surface-container-high transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-primary/40 shadow-[0_0_8px_rgba(0,255,163,0.3)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant group-hover:text-primary transition-colors">
                  {item.i}
                </span>
              </div>
              <div className="flex gap-1.5 opacity-30 group-hover:opacity-100 transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40" />
                <div className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/40" />
              </div>
            </div>
            <div className="flex-1 overflow-hidden relative">
              {children[item.i] || <div className="p-6 text-[10px] font-black uppercase tracking-widest text-on-surface-variant italic opacity-50">Widget {item.i} not found</div>}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default TerminalLayout;
