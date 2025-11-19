/**
 * Cache Buster - Detecta e limpa cache problemático automaticamente
 * Este script roda ANTES do React carregar
 */

(function() {
  'use strict';
  
  const CACHE_VERSION = 'v4.0.0';
  const CACHE_KEY = 'zapcorte_cache_version';
  
  // Verificar versão do cache
  const currentVersion = localStorage.getItem(CACHE_KEY);
  
  if (currentVersion !== CACHE_VERSION) {
    console.log('[Cache Buster] Nova versão detectada, limpando cache...');
    
    // Limpar tudo de forma síncrona
    try {
      localStorage.clear();
      sessionStorage.clear();
      
      // Marcar nova versão
      localStorage.setItem(CACHE_KEY, CACHE_VERSION);
      
      console.log('[Cache Buster] Cache limpo com sucesso');
      
      // Se não for a primeira vez, recarregar
      if (currentVersion) {
        console.log('[Cache Buster] Recarregando página...');
        window.location.reload(true);
      }
    } catch (e) {
      console.error('[Cache Buster] Erro ao limpar cache:', e);
    }
  }
  
  // Interceptar erros globais
  window.addEventListener('error', function(event) {
    const errorMsg = event.message || '';
    
    // Detectar erros de variáveis não definidas
    if (errorMsg.includes("Can't find variable") || 
        errorMsg.includes("is not defined") ||
        errorMsg.includes("selectedService")) {
      
      console.error('[Cache Buster] Erro de cache detectado:', errorMsg);
      
      // Verificar se já tentou limpar
      const clearAttempted = sessionStorage.getItem('cache_clear_attempted');
      
      if (!clearAttempted) {
        console.log('[Cache Buster] Tentando limpar cache e recarregar...');
        sessionStorage.setItem('cache_clear_attempted', 'true');
        
        // Limpar service workers e caches de forma assíncrona
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(function(registrations) {
            registrations.forEach(function(registration) {
              registration.unregister();
            });
          });
        }
        
        if ('caches' in window) {
          caches.keys().then(function(names) {
            names.forEach(function(name) {
              caches.delete(name);
            });
          });
        }
        
        // Limpar storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Recarregar após 1 segundo
        setTimeout(function() {
          window.location.href = window.location.origin;
        }, 1000);
        
        // Prevenir propagação do erro
        event.preventDefault();
        return false;
      }
    }
  });
  
  console.log('[Cache Buster] Versão:', CACHE_VERSION);
})();
