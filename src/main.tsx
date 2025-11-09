console.log("[ZapCorte] main.tsx executing at", new Date().toISOString());

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { installGlobalDebug, showErrorOverlay } from "./lib/debug";

function bootstrap() {
  console.log("[ZapCorte] Boot: start");
  installGlobalDebug();

  try {
    const rootEl = document.getElementById("root");
    if (!rootEl) {
      const msg = "Elemento #root não encontrado no DOM";
      console.error(msg);
      showErrorOverlay("Boot error", msg);
      return;
    }

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const errorMsg = "Variáveis de ambiente do Supabase não configuradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.";
      console.error(errorMsg);
      showErrorOverlay("Erro de Configuração", errorMsg);
      // Lança para interromper renderização e sinalizar no console
      throw new Error(errorMsg);
    }

    console.log("[ZapCorte] Boot: env ok, rendering...");
    const root = createRoot(rootEl);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    console.log("[ZapCorte] Boot: render complete");
  } catch (err) {
    console.error("[ZapCorte] Boot: fatal error", err);
    showErrorOverlay("Fatal error", String((err as Error)?.message || err));
  }
}

// Garante execução após o DOM estar pronto
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
