import React from "react";
import { showErrorOverlay } from "@/lib/debug";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  hasError: boolean;
  error?: Error;
  info?: React.ErrorInfo;
};

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info });
    console.error("[ErrorBoundary] Render error:", error, info);
    
    // Se o erro for relacionado a variáveis não definidas, limpar cache
    if (error.message.includes("Can't find variable") || 
        error.message.includes("is not defined") ||
        error.message.includes("undefined")) {
      console.warn("[ErrorBoundary] Detectado erro de variável não definida - limpando cache...");
      this.clearCacheAndReload();
    }
  }

  async clearCacheAndReload() {
    try {
      // Limpar service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      
      // Limpar caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      
      // Aguardar um pouco e recarregar
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (e) {
      console.error("[ErrorBoundary] Erro ao limpar cache:", e);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
      const isVariableError = this.state.error?.message.includes("Can't find variable") || 
                              this.state.error?.message.includes("is not defined");
      
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0b",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', 'Noto Sans', 'Fira Sans', 'Droid Sans', Arial, sans-serif",
          padding: "20px"
        }}>
          <div style={{ maxWidth: 640, width: "100%" }}>
            <div style={{ 
              background: "#1e1e1e", 
              borderRadius: 12, 
              padding: 24,
              border: "1px solid #333"
            }}>
              <h1 style={{ fontSize: 22, marginBottom: 8, color: "#8B5CF6" }}>
                {isVariableError ? "🔄 Atualizando aplicativo..." : "Ocorreu um erro"}
              </h1>
              <p style={{ opacity: 0.8, marginBottom: 16, lineHeight: 1.5 }}>
                {isVariableError 
                  ? "Detectamos uma versão antiga em cache. Estamos limpando e recarregando automaticamente..."
                  : "Verifique o console do navegador para detalhes."}
              </p>
              {this.state.error && !isVariableError && (
                <pre style={{
                  background: "#0b0b0b",
                  border: "1px solid #333",
                  borderRadius: 8,
                  padding: 12,
                  whiteSpace: "pre-wrap",
                  fontSize: 12,
                  overflow: "auto"
                }}>
                  {String(this.state.error?.message || this.state.error)}
                </pre>
              )}
              {isVariableError && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  background: "#8B5CF6",
                  borderRadius: 8,
                  textAlign: "center"
                }}>
                  <div style={{
                    width: 24,
                    height: 24,
                    border: "3px solid #fff",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    margin: "0 auto",
                    animation: "spin 1s linear infinite"
                  }}></div>
                </div>
              )}
            </div>
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;