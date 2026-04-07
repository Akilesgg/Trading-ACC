import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center p-16 trading-card border-secondary/20 text-center space-y-8 rounded-[3rem] shadow-[0_0_100px_rgba(255,107,107,0.1)]">
          <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center shadow-2xl shadow-secondary/20 relative group">
            <div className="absolute inset-0 bg-secondary/20 blur-2xl rounded-full animate-pulse"></div>
            <AlertTriangle className="w-12 h-12 text-secondary relative z-10" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-on-surface">Algo salió mal</h2>
            <p className="text-on-surface-variant max-w-md mx-auto font-medium opacity-80 leading-relaxed">
              Se ha producido un error inesperado en este módulo. Por favor, intenta recargar la página o contacta con soporte si el problema persiste.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 px-10 py-4 bg-secondary text-on-secondary rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-secondary/30"
          >
            <RefreshCw className="w-5 h-5" />
            Recargar Aplicación
          </button>
          {this.state.error && (
            <div className="p-6 bg-surface-container-high rounded-2xl border border-outline-variant/10 max-w-2xl overflow-x-auto text-left shadow-inner">
              <pre className="text-[10px] font-mono text-secondary/70 whitespace-pre-wrap font-black uppercase tracking-widest opacity-60">
                {this.state.error.toString()}
              </pre>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
