/**
 * Script para limpar cache do PWA manualmente
 * Execute no console: clearZapCorteCache()
 */

window.clearZapCorteCache = async function() {
  console.log('🧹 Limpando cache do ZapCorte...');
  
  try {
    // 1. Desregistrar service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('✓ Service Worker removido');
      }
    }
    
    // 2. Limpar todos os caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('✓ Cache removido:', cacheName);
      }
    }
    
    // 3. Limpar storage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✓ Storage limpo');
    
    console.log('✅ Cache limpo com sucesso!');
    console.log('🔄 Recarregando em 2 segundos...');
    
    setTimeout(() => {
      window.location.href = window.location.origin;
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
  }
};

console.log('💡 Para limpar o cache manualmente, execute: clearZapCorteCache()');
