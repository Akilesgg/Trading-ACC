import React, { useState } from "react";
import { 
  LayoutDashboard, 
  BarChart3, 
  Zap, 
  Layers, 
  Activity, 
  History, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Target,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";

const TerminalSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/" },
    { icon: BarChart3, label: "Market", path: "/market" },
    { icon: Target, label: "Analysis", path: "/analysis" },
    { icon: Zap, label: "Terminal", path: "/terminal" },
    { icon: Layers, label: "Copy Trading", path: "/copy-trading" },
    { icon: Flame, label: "Signals", path: "/signals" },
    { icon: History, label: "History", path: "/history" },
    { icon: ShieldCheck, label: "Risk", path: "/risk" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <div 
      className={cn(
        "h-screen bg-surface-container-low border-r border-outline-variant/10 flex flex-col items-center py-6 transition-all duration-300 relative z-[100]",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-surface-container-high border border-outline-variant/10 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-all shadow-xl"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>

      <div className="flex flex-col gap-2 w-full px-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex items-center gap-4 p-3 rounded-xl transition-all group relative",
              location.pathname === item.path 
                ? "bg-primary text-on-primary shadow-lg shadow-primary/20" 
                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
            )}
          >
            <item.icon className="w-5 h-5 min-w-[20px]" />
            {!collapsed && <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>}
            
            {collapsed && (
              <div className="absolute left-full ml-4 px-3 py-2 bg-surface-container-highest text-on-surface text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all shadow-2xl border border-outline-variant/10 whitespace-nowrap">
                {item.label}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TerminalSidebar;
