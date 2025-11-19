import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";
import { installGlobalDebug, showErrorOverlay } from "./lib/debug";
import { registerServiceWorker } from "./lib/serviceWorker";

async function bootstrap() {
  installGlobalDebug();

  // Verificar se precisa limpar cache (apenas uma vez)
  const needsCacheClear = sessionStorage.getItem('needs_cache_clear');
  if (needsCacheClear === 'true') {
    console.log('[Bootstrap] Limpando cache conforme solicitado...');
    sessionStorage.removeItem('needs_cache_clear');
    
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
      
      console.log('[Bootstrap] Cache limpo com sucesso');
    } catch (e) {
      console.error('[Bootstrap] Erro ao limpar cache:', e);
    }
  }

  // Registrar Service Worker para PWA
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
