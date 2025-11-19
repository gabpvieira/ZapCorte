/**
 * Service Worker Registration
 * Gerencia o registro e atualização do service worker do PWA
 */

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

/**
 * Registra o service worker
 */
export async function registerServiceWorker(config?: ServiceWorkerConfig): Promise<void> {
  // Verificar se o navegador suporta service workers
  if (!('serviceWorker' in navigator)) {
    console.log('[SW] Service Workers não são suportados neste navegador');
    return;
  }

  // Não registrar em desenvolvimento (opcional)
  if (import.meta.env.DEV) {
    console.log('[SW] Service Worker desabilitado em desenvolvimento');
    return;
  }

  try {
    // Aguardar o carregamento completo da página
    await new Promise<void>((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', () => resolve());
      }
    });

    console.log('[SW] Registrando Service Worker...');

    // Limpar service workers antigos primeiro
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('[SW] Service Worker antigo removido');
    }

    // Limpar todos os caches antigos
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('[SW] Cache antigo removido:', cacheName);
      }
    }

    // Registrar o service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    console.log('[SW] Service Worker registrado com sucesso:', registration.scope);

    // Verificar atualizações
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      
      if (!newWorker) return;

      console.log('[SW] Nova versão do Service Worker encontrada');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[SW] Nova versão disponível - Atualizando automaticamente...');
          
          // Atualização automática sem confirmação
          if (config?.onUpdate) {
            config.onUpdate(registration);
          }
          
          // Forçar atualização automática
          forceUpdate(registration);
        }
      });
    });

    // Verificar atualizações periodicamente (a cada 5 minutos)
    setInterval(() => {
      console.log('[SW] Verificando atualizações...');
      registration.update();
    }, 5 * 60 * 1000); // 5 minutos

    // Verificar imediatamente após 10 segundos
    setTimeout(() => {
      registration.update();
    }, 10000);

    // Escutar mensagens do service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_UPDATED') {
        console.log('[SW] Service Worker atualizado para versão:', event.data.version);
      }
    });

    // Callback de sucesso
    if (config?.onSuccess) {
      config.onSuccess(registration);
    }

  } catch (error) {
    console.error('[SW] Erro ao registrar Service Worker:', error);
    
    if (config?.onError) {
      config.onError(error as Error);
    }
  }
}

/**
 * Desregistra o service worker
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      const success = await registration.unregister();
      console.log('[SW] Service Worker desregistrado:', success);
      return success;
    }
    
    return false;
  } catch (error) {
    console.error('[SW] Erro ao desregistrar Service Worker:', error);
    return false;
  }
}

/**
 * Força a atualização do service worker automaticamente
 */
function forceUpdate(registration: ServiceWorkerRegistration): void {
  const waitingWorker = registration.waiting;
  
  if (waitingWorker) {
    console.log('[SW] Forçando atualização automática...');
    
    // Enviar mensagem para o service worker pular a espera
    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    
    // Recarregar quando o novo service worker assumir o controle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      
      console.log('[SW] Recarregando página com nova versão...');
      
      // Mostrar toast antes de recarregar (se disponível)
      try {
        const event = new CustomEvent('sw-update', {
          detail: { message: 'Atualizando para nova versão...' }
        });
        window.dispatchEvent(event);
      } catch (e) {
        // Ignorar erro se toast não estiver disponível
      }
      
      // Aguardar 1 segundo antes de recarregar para mostrar o toast
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    });
  }
}

/**
 * Mostra notificação de atualização disponível (método legado)
 */
function showUpdateNotification(registration: ServiceWorkerRegistration): void {
  // Agora usa atualização automática por padrão
  forceUpdate(registration);
}

/**
 * Verifica se há uma atualização disponível
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration) {
      await registration.update();
      return !!registration.waiting;
    }
    
    return false;
  } catch (error) {
    console.error('[SW] Erro ao verificar atualizações:', error);
    return false;
  }
}

/**
 * Obtém informações sobre o service worker
 */
export async function getServiceWorkerInfo(): Promise<{
  registered: boolean;
  active: boolean;
  waiting: boolean;
  scope?: string;
}> {
  if (!('serviceWorker' in navigator)) {
    return {
      registered: false,
      active: false,
      waiting: false
    };
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (!registration) {
      return {
        registered: false,
        active: false,
        waiting: false
      };
    }

    return {
      registered: true,
      active: !!registration.active,
      waiting: !!registration.waiting,
      scope: registration.scope
    };
  } catch (error) {
    console.error('[SW] Erro ao obter informações:', error);
    return {
      registered: false,
      active: false,
      waiting: false
    };
  }
}

/**
 * Limpa todos os caches do service worker
 */
export async function clearServiceWorkerCaches(): Promise<void> {
  if (!('caches' in window)) {
    return;
  }

  try {
    const cacheNames = await caches.keys();
    
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    
    console.log('[SW] Todos os caches foram limpos');
  } catch (error) {
    console.error('[SW] Erro ao limpar caches:', error);
  }
}

/**
 * Envia mensagem para o service worker
 */
export async function sendMessageToServiceWorker(message: any): Promise<void> {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    
    if (registration?.active) {
      registration.active.postMessage(message);
    }
  } catch (error) {
    console.error('[SW] Erro ao enviar mensagem:', error);
  }
}

/**
 * Pré-carrega URLs no cache do service worker
 */
export async function precacheUrls(urls: string[]): Promise<void> {
  await sendMessageToServiceWorker({
    type: 'CACHE_URLS',
    urls
  });
}
