import React, { useState, useEffect, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
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
  BellOff,
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
import { useSignalStore } from "./store/useSignalStore";

// Pages
import Dashboard from "./pages/Dashboard";
import Market from "./pages/Market";
import Analysis from "./pages/Analysis";
import SignalDetail from "./pages/SignalDetail";
import Terminal from "./pages/Terminal";
import CopyTrading from "./pages/CopyTrading";
import News from "./pages/News";
import BTCComparison from "./pages/BTCComparison";
import SignalHistory from "./pages/SignalHistory";
import Landing from "./pages/Landing";
import Onboarding from "./components/onboarding/Onboarding";
import CryptoBubbles from "./pages/CryptoBubbles";

import ErrorBoundary from "./components/common/ErrorBoundary";

const LoginScreen = () => {
  const { login } = useAuth();
  return (
    <div className="min-h-screen bg-surface-container-lowest flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,163,0.1),transparent_70%)]"></div>
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full trading-card p-12 space-y-10 relative z-10 text-center rounded-[3rem] shadow-[0_0_100px_rgba(0,255,163,0.1)]"
      >
        <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary-dim rounded-[2rem] flex items-center justify-center mx-auto shadow-[0_20px_60px_rgba(0,255,163,0.3)] relative group">
          <div className="absolute inset-0 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Zap className="w-12 h-12 text-on-primary-fixed relative z-10" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black tracking-tighter uppercase text-on-surface">TRADING ACC</h1>
          <p className="text-primary font-black text-[11px] uppercase tracking-[0.3em] opacity-70">Terminal de Inteligencia Cuántica</p>
        </div>
        <div className="space-y-6">
          <button 
            onClick={login}
            className="w-full py-5 bg-on-background text-background rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 active:scale-95 transition-all shadow-2xl hover:bg-primary hover:text-on-primary hover:shadow-primary/30"
          >
            <ArrowRight className="w-5 h-5" />
            Entrar a la Terminal
          </button>
          <div className="flex items-center justify-center gap-2 text-[10px] text-on-surface-variant font-black uppercase tracking-widest opacity-50">
            <Shield className="w-3 h-3" />
            Acceso Local Seguro
          </div>
        </div>
      </motion.div>
    </div>
  );
};

import { sendPossibleSignalsToTelegram } from "./services/signalService";

const TopAppBar = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const isMuted = useSignalStore(state => state.isMuted);
  const toggleMute = useSignalStore(state => state.toggleMute);

  const handleManualTelegram = async () => {
    setIsSending(true);
    await sendPossibleSignalsToTelegram();
    setIsSending(false);
  };

  const menuItems = [
    { icon: LayoutDashboard, label: "PANEL", path: "/dashboard" },
    { icon: BarChart3, label: "MERCADOS", path: "/market" },
    { icon: Target, label: "ANALIZADOR", path: "/terminal" },
    { icon: TrendingUp, label: "ANÁLISIS IA", path: "/analysis" },
    { icon: Users, label: "COPIA", path: "/copy-trading" },
    { icon: Newspaper, label: "NOTICIAS", path: "/news" },
    { icon: Activity, label: "BTC", path: "/btc-comparison" },
    { icon: Zap, label: "TOP 100", path: "/top-100" },
    { icon: Shield, label: "SEGURIDAD", path: "/dashboard" },
    { icon: HelpCircle, label: "SOPORTE", path: "/dashboard" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-2xl border-b border-outline-variant/10 shadow-2xl">
      <div className="flex justify-between items-center px-4 md:px-8 h-20 w-full max-w-screen-xl mx-auto">
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="text-2xl font-black tracking-tighter text-primary uppercase group flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6 text-on-primary" />
            </div>
            <span className="hidden sm:inline">TRADING ACC</span>
          </Link>
        </div>
        
        <div className="hidden xl:flex items-center gap-2">
          {menuItems.slice(0, 8).map((item) => (
            <Link 
              key={item.label}
              to={item.path} 
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-transparent", 
                location.pathname === item.path 
                  ? "text-primary bg-primary/10 border-primary/20 shadow-lg shadow-primary/5" 
                  : "text-on-surface-variant hover:text-primary hover:bg-primary/5"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          ))}
          <div className="relative group ml-2">
            <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-all flex items-center gap-2 border border-transparent">
              <Menu className="w-3.5 h-3.5" />
              MÁS
            </button>
            <div className="absolute top-full right-0 mt-3 w-64 trading-card p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] shadow-2xl border-primary/20">
              {menuItems.slice(8).map((item) => (
                <Link 
                  key={item.label}
                  to={item.path}
                  className="flex items-center gap-4 p-4 hover:bg-primary/10 rounded-2xl transition-all group/item"
                >
                  <div className="w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center border border-outline-variant/10 group-hover/item:border-primary/30 transition-all">
                    <item.icon className="w-5 h-5 text-on-surface-variant group-hover/item:text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-on-surface">{item.label}</p>
            <p className="text-[9px] text-on-surface-variant font-medium opacity-50">Acceder a {item.label.toLowerCase()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleManualTelegram}
              disabled={isSending}
              className={cn(
                "hidden md:flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl border border-primary/20 hover:bg-primary hover:text-on-primary transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none group",
                isSending && "animate-pulse"
              )}
            >
              <Bell className={cn("w-4 h-4", isSending ? "animate-bounce" : "group-hover:animate-ring")} />
              <span className="text-[10px] font-black uppercase tracking-widest">Enviar a Telegram</span>
            </button>
            <button 
              onClick={toggleMute}
              className="hidden md:flex p-2 bg-surface-container-high rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all active:scale-90"
              title={isMuted ? "Activar Sonido" : "Desactivar Sonido"}
            >
              {isMuted ? <BellOff className="w-3.5 h-3.5 text-secondary" /> : <Bell className="w-3.5 h-3.5 text-primary" />}
            </button>
            <button 
              onClick={async () => {
                const { sendTelegramAlert } = await import("./services/telegramService");
                await sendTelegramAlert({
                  symbol: "TEST",
                  price: "0",
                  change: "0",
                  type: "SIGNAL",
                  confidence: 100,
                  analysis: "Prueba de conexión desde la barra superior."
                });
              }}
              className="hidden md:flex p-2 bg-surface-container-high rounded-xl border border-outline-variant/10 hover:border-primary/30 transition-all active:scale-90"
              title="Probar Conexión Telegram"
            >
              <Activity className="w-3.5 h-3.5 text-on-surface-variant" />
            </button>
          </div>
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[9px] text-on-surface-variant font-black uppercase tracking-widest opacity-50">Terminal Activa</span>
            <span className="text-xs font-black text-on-surface tracking-tight">{user?.displayName || "ADMIN_ACC"}</span>
          </div>
          <div className="relative group">
            <button className="w-12 h-12 rounded-2xl border-2 border-primary/20 p-1 overflow-hidden hover:border-primary transition-all active:scale-90 shadow-lg group-hover:shadow-primary/20">
              <img 
                src={user?.photoURL || "https://lh3.googleusercontent.com/aida-public/AB6AXuDhixhHsvZHj0307YqCJPp6pmq4CJh9WTE8vm9MijmKX2xzRNUfGMz0RKm1Rj0NFIcX9tfo4kj-7a31qv1sPoJR_jSJP1x-7Hac3BriTf0PkB3VCCQdcLpNaumMXSZ2rr6pDGDofj0qNn7M77CjIRDQil6tHANBt8feofMurDJ7L6tVZp5HvS_sWvcqEkQ1twkzEWy9R7WjwgT7YWzN0GECdBOjnla1j2lE4p5K5fY8jqPo9M8oMc0X5x5OcJyqfJq1g9bTG0FFWPk"} 
                alt="User" 
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </button>
            <div className="absolute top-full right-0 mt-3 w-56 trading-card p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] shadow-2xl border-primary/20">
              <button 
                onClick={logout}
                className="w-full flex items-center gap-4 p-4 hover:bg-secondary/10 text-on-surface hover:text-secondary rounded-2xl transition-all group/logout"
              >
                <LogOut className="w-5 h-5 group-hover/logout:translate-x-1 transition-transform" />
                <span className="text-[11px] font-black uppercase tracking-widest">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const BottomNavBar = () => {
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: "PANEL", path: "/dashboard" },
    { icon: BarChart3, label: "MERCADO", path: "/market" },
    { icon: Target, label: "ANALIZADOR", path: "/terminal" },
    { icon: Users, label: "COPIA", path: "/copy-trading" },
    { icon: Newspaper, label: "NOTICIAS", path: "/news" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full h-24 flex justify-around items-center px-10 pb-6 bg-background/80 backdrop-blur-2xl border-t border-outline-variant/10 z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.4)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;
        return (
          <Link 
            key={item.label}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center transition-all active:scale-90 duration-200 relative group",
              isActive ? "text-primary" : "text-on-background/40 hover:text-primary/60"
            )}
          >
            {isActive && (
              <motion.div 
                layoutId="nav-active"
                className="absolute -inset-x-4 -inset-y-2 bg-primary/10 rounded-2xl blur-lg"
              />
            )}
            <item.icon className={cn("w-7 h-7 relative z-10 transition-transform", isActive && "scale-110")} />
            <span className="font-black text-[9px] uppercase tracking-[0.2em] mt-2 relative z-10">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

import SignalMonitor from "./components/common/SignalMonitor";
import MarketScanner from "./components/common/MarketScanner";

export default function App() {
  const { user, loading, login } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const initSignals = useSignalStore(state => state.init);

  useEffect(() => {
    const unsubscribe = initSignals();
    return () => unsubscribe();
  }, [initSignals]);

  useEffect(() => {
    if (user) {
      const hasSeenOnboarding = localStorage.getItem(`onboarding_${user.uid}`);
      if (!hasSeenOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [user]);

  const handleOnboardingComplete = () => {
    if (user) {
      localStorage.setItem(`onboarding_${user.uid}`, "true");
    }
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center gap-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,163,0.1),transparent_70%)]"></div>
        
        <div className="relative">
          <div className="w-32 h-32 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-[0_0_50px_rgba(0,255,163,0.2)]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Zap className="w-10 h-10 text-primary animate-pulse" />
          </div>
        </div>

        <div className="text-center space-y-4 relative z-10">
          <h2 className="text-primary text-3xl font-black tracking-[0.4em] animate-pulse uppercase">TRADING ACC</h2>
          <div className="flex flex-col items-center gap-2">
            <p className="text-on-surface-variant text-[11px] font-black uppercase tracking-[0.3em] opacity-70">Inicializando Terminal de Inteligencia...</p>
            <div className="w-48 h-1 bg-surface-container-high rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-full h-full bg-gradient-to-r from-transparent via-primary to-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <LoginScreen />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-right" theme="dark" richColors />
        <SignalMonitor />
        <MarketScanner />
        <div className="min-h-screen flex flex-col bg-background text-on-background selection:bg-primary/30 selection:text-primary">
          {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
          <TopAppBar />
          <main className="flex-1 pt-20 pb-24">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/market" element={<Market />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/signal/:symbol" element={<SignalDetail />} />
                <Route path="/signals-history" element={<SignalHistory />} />
                <Route path="/terminal" element={<Terminal />} />
                <Route path="/copy-trading" element={<CopyTrading />} />
                <Route path="/news" element={<News />} />
                <Route path="/btc-comparison" element={<BTCComparison />} />
                <Route path="/top-100" element={<CryptoBubbles />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </AnimatePresence>
          </main>
          <BottomNavBar />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
