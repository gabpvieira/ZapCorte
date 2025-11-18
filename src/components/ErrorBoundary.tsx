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
    // Overlay desabilitado - erro apenas no console
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0b0b",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, 'Helvetica Neue', 'Noto Sans', 'Fira Sans', 'Droid Sans', Arial, sans-serif"
        }}>
          <div style={{ maxWidth: 640, padding: 16 }}>
            <h1 style={{ fontSize: 22, marginBottom: 8 }}>Ocorreu um erro ao renderizar</h1>
            <p style={{ opacity: 0.8, marginBottom: 12 }}>Verifique o console do navegador para detalhes.</p>
            {this.state.error && (
              <pre style={{
                background: "#1e1e1e",
                border: "1px solid #333",
                borderRadius: 8,
                padding: 12,
                whiteSpace: "pre-wrap"
              }}>
                {String(this.state.error?.message || this.state.error)}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;