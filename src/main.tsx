import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { installGlobalDebug, showErrorOverlay } from "./lib/debug";

function bootstrap() {
  installGlobalDebug();

  try {
    const rootEl = document.getElementById("root");
    if (!rootEl) {
      const msg = "Elemento #root não encontrado no DOM";
      showErrorOverlay("Boot error", msg);
      return;
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const errorMsg = "Variáveis de ambiente do Supabase não configuradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.";
      showErrorOverlay("Erro de Configuração", errorMsg);
      throw new Error(errorMsg);
    }

    const root = createRoot(rootEl);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (err) {
    showErrorOverlay("Fatal error", String((err as Error)?.message || err));
  }
}

// Garante execução após o DOM estar pronto
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
