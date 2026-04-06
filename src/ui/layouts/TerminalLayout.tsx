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
            className="bg-surface-container-low border border-outline-variant/10 rounded-xl overflow-hidden shadow-sm flex flex-col group"
          >
            <div className="drag-handle bg-surface-container-high/30 px-4 py-2 border-b border-outline-variant/10 flex items-center justify-between cursor-grab active:cursor-grabbing">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                <span className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant">
                  {item.i}
                </span>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-1 h-1 rounded-full bg-on-surface-variant/20" />
                <div className="w-1 h-1 rounded-full bg-on-surface-variant/20" />
                <div className="w-1 h-1 rounded-full bg-on-surface-variant/20" />
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {children[item.i] || <div className="p-4 text-xs text-on-surface-variant italic">Widget {item.i} not found</div>}
            </div>
          </div>
        ))}
      </ResponsiveGridLayout>
    </div>
  );
};

export default TerminalLayout;
