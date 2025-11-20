import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { installGlobalDebug, showErrorOverlay } from "./lib/debug";
import { registerServiceWorker } from "./lib/serviceWorker";
import "./lib/safari-fixes"; // Aplicar correções do Safari

function bootstrap() {
  console.log('[Bootstrap] Iniciando aplicação...');
  console.log('[Bootstrap] User Agent:', navigator.userAgent);
  console.log('[Bootstrap] Viewport:', window.innerWidth, 'x', window.innerHeight);
  
  installGlobalDebug();
  console.log('[Bootstrap] Debug instalado');

  // Registrar Service Worker para PWA (não bloqueia renderização)
  setTimeout(() => {
    registerServiceWorker({
      onSuccess: (registration) => {
        console.log('✅ PWA pronto para uso offline');
      },
      onUpdate: (registration) => {
        console.log('🔄 Nova versão disponível');
      },
      onError: (error) => {
        console.error('❌ Erro no Service Worker:', error);
      }
    });
  }, 1000);

  try {
    console.log('[Bootstrap] Procurando elemento #root...');
    const rootEl = document.getElementById("root");
    if (!rootEl) {
      const msg = "Elemento #root não encontrado no DOM";
      console.error('[Bootstrap] ERRO:', msg);
      showErrorOverlay("Boot error", msg);
      return;
    }
    console.log('[Bootstrap] Elemento #root encontrado');

    console.log('[Bootstrap] Verificando variáveis de ambiente...');
    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      const errorMsg = "Variáveis de ambiente do Supabase não configuradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.";
      console.error('[Bootstrap] ERRO:', errorMsg);
      showErrorOverlay("Erro de Configuração", errorMsg);
      throw new Error(errorMsg);
    }
    console.log('[Bootstrap] Variáveis de ambiente OK');

    console.log('[Bootstrap] Criando root React...');
    const root = createRoot(rootEl);
    
    console.log('[Bootstrap] Renderizando App...');
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
    console.log('[Bootstrap] App renderizado com sucesso!');
  } catch (err) {
    console.error('[Bootstrap] ERRO FATAL:', err);
    showErrorOverlay("Fatal error", String((err as Error)?.message || err));
    
    // Mostrar erro visual no Safari
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.innerHTML = `
        <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #0C0C0C; color: white; padding: 20px; text-align: center; font-family: -apple-system, sans-serif;">
          <div>
            <h1 style="color: #EF4444; margin-bottom: 16px;">Erro ao carregar</h1>
            <p style="color: #A1A1AA; margin-bottom: 24px;">${String((err as Error)?.message || err)}</p>
            <button onclick="window.location.reload()" style="padding: 12px 24px; background: #24C36B; color: black; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
              Recarregar
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Garante execução após o DOM estar pronto
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
