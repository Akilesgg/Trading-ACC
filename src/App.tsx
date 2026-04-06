import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "sonner";
import { 
  LayoutDashboard, 
  BarChart3, 
  Zap, 
  Wallet as WalletIcon, 
  Search, 
  Menu, 
  Bell, 
  User,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Star,
  ArrowLeft,
  Verified,
  Rocket,
  Minus,
  TrendingDown,
  Monitor,
  Settings,
  HelpCircle,
  LogOut,
  History,
  GraduationCap,
  Bolt,
  Lock,
  X,
  Activity,
  Shield,
  Target,
  Users,
  Newspaper,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./AuthProvider";

// Pages
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Analysis from "./pages/Analysis";
import SignalDetail from "./pages/SignalDetail";
import Terminal from "./pages/Terminal";
import CopyTrading from "./pages/CopyTrading";
import News from "./pages/News";
import BTCComparison from "./pages/BTCComparison";

const LoginScreen = () => {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,163,0.05),transparent_70%)]"></div>
      
      <motion.div 
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-10 rounded-[2.5rem] space-y-8 relative z-10 text-center"
      >
        <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dim rounded-3xl flex items-center justify-center mx-auto shadow-[0_20px_40px_rgba(0,255,163,0.2)]">
          <Zap className="w-10 h-10 text-on-primary-fixed" />
        </div>
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold tracking-tighter uppercase">TRADING ACC</h1>
          <p className="text-on-surface-variant font-label text-sm uppercase tracking-widest">Terminal de Inteligencia Cuántica</p>
        </div>
        <div className="space-y-4">
          <button 
            onClick={login}
            className="w-full py-4 bg-on-background text-background rounded-full font-extrabold uppercase tracking-widest text-sm flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"
          >
            Entrar a la Terminal
          </button>
          <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest leading-relaxed">
            Acceso local configurado. No se requiere cuenta de Google.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const TopAppBar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: "Panel Principal", path: "/dashboard", desc: "Vista general de señales y mercado" },
    { icon: BarChart3, label: "Mercados Spot", path: "/market", desc: "Precios en tiempo real y heatmap" },
    { icon: Target, label: "Analizador IA", path: "/terminal", desc: "Análisis técnico profundo con Wyckoff" },
    { icon: Users, label: "Copy Trading", path: "/copy-trading", desc: "Sigue a ballenas y top traders" },
    { icon: Newspaper, label: "Noticias", path: "/news", desc: "Impacto económico y geopolítico" },
    { icon: Activity, label: "Comparativa BTC", path: "/btc-comparison", desc: "Correlación y volatilidad vs BTC" },
    { icon: TrendingUp, label: "Análisis IA", path: "/analysis", desc: "Análisis exhaustivo de activos con IA" },
    { icon: Shield, label: "Seguridad", path: "/dashboard", desc: "Configuración de cuenta y llaves API" },
    { icon: HelpCircle, label: "Soporte", path: "/dashboard", desc: "Centro de ayuda y tutoriales" },
  ];

  return (
    <>
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center px-6 h-16 w-full">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="hover:bg-primary/10 transition-colors p-2 rounded-xl active:scale-95 duration-200"
            >
              <Menu className="w-6 h-6 text-primary" />
            </button>
            <Link to="/dashboard" className="text-xl font-bold tracking-tighter text-primary font-headline uppercase">TRADING ACC</Link>
          </div>
          <div className="hidden md:flex items-center gap-8 font-label text-[10px] font-bold uppercase tracking-widest text-on-background/60">
            <Link to="/market" className={cn("hover:text-primary transition-colors", location.pathname === "/market" && "text-primary")}>Mercados</Link>
            <Link to="/dashboard" className={cn("hover:text-primary transition-colors", location.pathname === "/dashboard" && "text-primary")}>Señales</Link>
            <Link to="/terminal" className={cn("hover:text-primary transition-colors", location.pathname === "/terminal" && "text-primary")}>Analizador</Link>
            <Link to="/analysis" className={cn("hover:text-primary transition-colors", location.pathname === "/analysis" && "text-primary")}>Análisis</Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">Usuario Local</span>
              <span className="text-xs font-bold text-primary">{user?.displayName || "ADMIN_ACC"}</span>
            </div>
            <button onClick={logout} className="w-10 h-10 rounded-full border border-primary/20 p-0.5 overflow-hidden active:scale-95 duration-200">
              <img 
                src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuDhixhHsvZHj0307YqCJPp6pmq4CJh9WTE8vm9MijmKX2xzRNUfGMz0RKm1Rj0NFIcX9tfo4kj-7a31qv1sPoJR_jSJP1x-7Hac3BriTf0PkB3VCCQdcLpNaumMXSZ2rr6pDGDofj0qNn7M77CjIRDQil6tHANBt8feofMurDJ7L6tVZp5HvS_sWvcqEkQ1twkzEWy9R7WjwgT7YWzN0GECdBOjnla1j2lE4p5K5fY8jqPo9M8oMc0X5x5OcJyqfJq1g9bTG0FFWPk"} 
                alt="User" 
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-80 bg-surface-container-low z-[70] shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-on-primary" />
                  </div>
                  <span className="font-headline font-bold text-lg tracking-tight uppercase">TRADING ACC</span>
                </div>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-surface-container-high rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {menuItems.map((item) => (
                  <Link 
                    key={item.label}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl transition-all group",
                      location.pathname === item.path ? "bg-primary/10 text-primary" : "hover:bg-surface-container-high"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                      location.pathname === item.path ? "bg-primary text-on-primary" : "bg-surface-container-highest group-hover:bg-primary/20"
                    )}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.label}</p>
                      <p className="text-[10px] text-on-surface-variant font-label uppercase tracking-widest">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="p-6 border-t border-outline-variant/10 bg-surface-container-lowest">
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-3 bg-secondary/10 text-secondary rounded-xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-secondary/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesión
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const BottomNavBar = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "Panel", path: "/dashboard" },
    { icon: BarChart3, label: "Mercado", path: "/market" },
    { icon: Target, label: "Analizador", path: "/terminal" },
    { icon: Users, label: "Copy", path: "/copy-trading" },
    { icon: Newspaper, label: "Noticias", path: "/news" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full h-20 flex justify-around items-center px-8 pb-4 bg-background/80 backdrop-blur-xl rounded-t-[2rem] z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.label}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center transition-all active:scale-90 duration-150",
              isActive ? "text-primary bg-primary/10 rounded-full px-4 py-1" : "text-on-background/40 hover:text-primary"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="font-label text-[10px] font-bold uppercase tracking-widest mt-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0e11] flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-secondary" />
          </div>
          <h1 className="text-[#b1ffce] font-headline text-2xl font-bold mb-4 uppercase tracking-tighter">Error de Sistema</h1>
          <p className="text-[#a9abaf] font-label text-sm max-w-md mb-8 uppercase tracking-widest leading-relaxed">
            Se ha detectado una anomalía crítica en la terminal. Los protocolos de seguridad han aislado el error.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-on-background text-background rounded-full font-bold uppercase tracking-widest text-xs active:scale-95 transition-all shadow-xl"
          >
            Reiniciar Terminal
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0e11] flex flex-col items-center justify-center gap-6">
        <div className="w-16 h-16 border-4 border-[#b1ffce] border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(177,255,206,0.2)]"></div>
        <div className="text-center space-y-2">
          <h2 className="text-[#b1ffce] font-headline font-bold text-xl tracking-[0.2em] animate-pulse">TRADING ACC</h2>
          <p className="text-[#a9abaf] font-label text-[10px] uppercase tracking-widest">Inicializando Terminal de Inteligencia...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-right" theme="dark" richColors />
        <div className="min-h-screen flex flex-col">
          <TopAppBar />
          <main className="flex-1">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/market" element={<Market />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/signal/:symbol" element={<SignalDetail />} />
                <Route path="/terminal" element={<Terminal />} />
                <Route path="/copy-trading" element={<CopyTrading />} />
                <Route path="/news" element={<News />} />
                <Route path="/btc-comparison" element={<BTCComparison />} />
                {/* Fallbacks */}
                <Route path="/signals" element={<Dashboard />} />
              </Routes>
            </AnimatePresence>
          </main>
          <BottomNavBar />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
