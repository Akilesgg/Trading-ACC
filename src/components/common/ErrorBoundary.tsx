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
        <div className="flex flex-col items-center justify-center p-12 bg-surface-container-low rounded-3xl border border-secondary/20 text-center space-y-6">
          <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-secondary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-headline font-bold text-on-surface">Algo salió mal</h2>
            <p className="text-on-surface-variant max-w-md mx-auto">
              Se ha producido un error inesperado en este módulo. Por favor, intenta recargar la página o contacta con soporte si el problema persiste.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-8 py-3 bg-secondary text-on-secondary rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar Aplicación
          </button>
          {this.state.error && (
            <div className="p-4 bg-surface-container-highest rounded-xl border border-outline-variant/10 max-w-2xl overflow-x-auto text-left">
              <pre className="text-[10px] font-mono text-secondary/70 whitespace-pre-wrap">
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
