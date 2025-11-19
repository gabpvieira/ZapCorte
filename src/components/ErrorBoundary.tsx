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
  isClearing: boolean;
};

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, isClearing: false };
  private clearAttempted = false;

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, isClearing: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info });
    console.error("[ErrorBoundary] Render error:", error, info);
    
    // Verificar se já tentou limpar (evitar loop)
    const alreadyCleared = sessionStorage.getItem('cache_cleared');
    
    // Se o erro for relacionado a variáveis não definidas e ainda não limpou
    if (!alreadyCleared && !this.clearAttempted &&
        (error.message.includes("Can't find variable") || 
         error.message.includes("is not defined") ||
         error.message.includes("undefined"))) {
      console.warn("[ErrorBoundary] Detectado erro de variável não definida - limpando cache...");
      this.clearAttempted = true;
      this.setState({ isClearing: true });
      this.clearCacheAndReload();
    }
  }

  async clearCacheAndReload() {
    try {
      // Marcar que já tentou limpar
      sessionStorage.setItem('cache_cleared', 'true');
      
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
      
      // Limpar localStorage e sessionStorage (exceto a flag)
      const cacheFlag = sessionStorage.getItem('cache_cleared');
      localStorage.clear();
      sessionStorage.clear();
      if (cacheFlag) sessionStorage.setItem('cache_cleared', cacheFlag);
      
      // Aguardar e recarregar com hard refresh
      setTimeout(() => {
        window.location.href = window.location.href.split('?')[0] + '?t=' + Date.now();
      }, 2000);
    } catch (e) {
      console.error("[ErrorBoundary] Erro ao limpar cache:", e);
      // Se falhar, tentar reload simples
      setTimeout(() => {
        window.location.reload();
      }, 2000);
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
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          color: "#fff",
          fontFamily: "'Poppins', system-ui, -apple-system, sans-serif",
          padding: "20px"
        }}>
          {/* Logo ZapCorte */}
          <div style={{ marginBottom: "32px", textAlign: "center" }}>
            <img 
              src="/iconePWA.png" 
              alt="ZapCorte" 
              style={{ 
                width: "80px", 
                height: "80px",
                borderRadius: "20px",
                boxShadow: "0 8px 32px rgba(139, 92, 246, 0.3)"
              }} 
            />
          </div>

          <div style={{ maxWidth: 400, width: "100%", textAlign: "center" }}>
            {this.state.isClearing || isVariableError ? (
              <>
                <h1 style={{ 
                  fontSize: 24, 
                  marginBottom: 12, 
                  color: "#8B5CF6",
                  fontWeight: 600
                }}>
                  Atualizando aplicativo...
                </h1>
                <p style={{ 
                  opacity: 0.7, 
                  marginBottom: 24, 
                  lineHeight: 1.6,
                  fontSize: 14,
                  color: "#A1A1AA"
                }}>
                  Detectamos uma versão antiga em cache. Estamos limpando e recarregando automaticamente...
                </p>
                
                {/* Loading spinner com estilo ZapCorte */}
                <div style={{
                  marginTop: 24,
                  padding: 24,
                  background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)",
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    border: "4px solid rgba(255, 255, 255, 0.2)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite"
                  }}></div>
                </div>
                
                <p style={{
                  marginTop: 16,
                  fontSize: 12,
                  color: "#71717A",
                  fontStyle: "italic"
                }}>
                  Aguarde alguns segundos...
                </p>
              </>
            ) : (
              <>
                <h1 style={{ 
                  fontSize: 24, 
                  marginBottom: 12, 
                  color: "#EF4444",
                  fontWeight: 600
                }}>
                  Ocorreu um erro
                </h1>
                <p style={{ 
                  opacity: 0.7, 
                  marginBottom: 16, 
                  lineHeight: 1.6,
                  fontSize: 14,
                  color: "#A1A1AA"
                }}>
                  Algo deu errado. Por favor, tente recarregar o aplicativo.
                </p>
                {this.state.error && (
                  <div style={{
                    background: "#18181B",
                    border: "1px solid #27272A",
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 16,
                    textAlign: "left"
                  }}>
                    <pre style={{
                      whiteSpace: "pre-wrap",
                      fontSize: 11,
                      overflow: "auto",
                      color: "#EF4444",
                      margin: 0,
                      fontFamily: "monospace"
                    }}>
                      {String(this.state.error?.message || this.state.error)}
                    </pre>
                  </div>
                )}
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    marginTop: 24,
                    padding: "12px 24px",
                    background: "#8B5CF6",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  Recarregar Aplicativo
                </button>
              </>
            )}
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