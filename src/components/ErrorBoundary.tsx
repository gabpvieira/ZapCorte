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
    // Não fazer nada automaticamente - apenas logar o erro
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      
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
              Algo deu errado. Por favor, recarregue o aplicativo.
            </p>
            {this.state.error && (
              <div style={{
                background: "#18181B",
                border: "1px solid #27272A",
                borderRadius: 12,
                padding: 16,
                marginTop: 16,
                textAlign: "left",
                maxHeight: "200px",
                overflow: "auto"
              }}>
                <pre style={{
                  whiteSpace: "pre-wrap",
                  fontSize: 11,
                  color: "#EF4444",
                  margin: 0,
                  fontFamily: "monospace"
                }}>
                  {String(this.state.error?.message || this.state.error)}
                </pre>
              </div>
            )}
            <button
              onClick={() => {
                // Limpar tudo e recarregar
                sessionStorage.clear();
                localStorage.clear();
                window.location.href = window.location.origin;
              }}
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
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;