import { useEffect, useState } from 'react';
import { APP_VERSION, shouldClearCache } from '@/config/version';

const VERSION_KEY = 'zapcorte_app_version';
const LAST_UPDATE_KEY = 'zapcorte_last_update';

export const useAppVersion = () => {
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(APP_VERSION);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const lastUpdate = localStorage.getItem(LAST_UPDATE_KEY);
      
      console.log('[Version] Stored:', storedVersion, 'Current:', APP_VERSION);

      // Se a versão mudou
      if (storedVersion && storedVersion !== APP_VERSION) {
        console.log('[Version] Nova versão detectada, iniciando atualização...');
        setNeedsUpdate(true);
        await performUpdate();
      } else if (!storedVersion) {
        // Primeira instalação
        console.log('[Version] Primeira instalação');
        localStorage.setItem(VERSION_KEY, APP_VERSION);
        localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString());
      }
    } catch (error) {
      console.error('[Version] Erro ao verificar versão:', error);
    }
  };

  const performUpdate = async () => {
    setIsUpdating(true);

    try {
      console.log('[Update] Iniciando processo de atualização...');

      // 1. Limpar Service Workers antigos
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('[Update] Service Workers encontrados:', registrations.length);
        
        for (const registration of registrations) {
          await registration.unregister();
          console.log('[Update] Service Worker removido');
        }
      }

      // 2. Limpar todos os caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log('[Update] Caches encontrados:', cacheNames.length);
        
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
          console.log('[Update] Cache removido:', cacheName);
        }
      }

      // 3. Limpar dados específicos do localStorage (preservar auth)
      const authData = localStorage.getItem('supabase.auth.token');
      const userData = localStorage.getItem('user_data');
      
      // Limpar tudo exceto dados críticos
      const keysToPreserve = [
        'supabase.auth.token',
        'user_data',
        'sb-' // Prefixo do Supabase
      ];
      
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        const shouldPreserve = keysToPreserve.some(prefix => key.startsWith(prefix));
        if (!shouldPreserve) {
          localStorage.removeItem(key);
        }
      });

      // 4. Limpar sessionStorage
      sessionStorage.clear();

      // 5. Atualizar versão
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString());

      console.log('[Update] Atualização concluída com sucesso');

      // 6. Aguardar um pouco antes de recarregar
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 7. Recarregar a página
      window.location.reload();
      
    } catch (error) {
      console.error('[Update] Erro durante atualização:', error);
      // Em caso de erro, tentar recarregar mesmo assim
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const forceUpdate = async () => {
    console.log('[Version] Forçando atualização...');
    setNeedsUpdate(true);
    await performUpdate();
  };

  return {
    currentVersion: APP_VERSION,
    needsUpdate,
    isUpdating,
    forceUpdate,
    checkVersion
  };
};
