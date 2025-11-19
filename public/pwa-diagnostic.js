/**
 * Script de diagnóstico PWA
 * Adicione este script ao console do navegador mobile para diagnosticar problemas
 */

(async function pwaDiagnostic() {
  console.log('=== DIAGNÓSTICO PWA ZAPCORTE ===\n');
  
  // 1. Verificar Service Worker
  console.log('1. SERVICE WORKER:');
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log(`   ✓ Suportado (${registrations.length} registrado(s))`);
      
      for (const reg of registrations) {
        console.log(`   - Scope: ${reg.scope}`);
        console.log(`   - Active: ${!!reg.active}`);
        console.log(`   - Waiting: ${!!reg.waiting}`);
        console.log(`   - Installing: ${!!reg.installing}`);
      }
    } catch (e) {
      console.error('   ✗ Erro:', e);
    }
  } else {
    console.log('   ✗ Não suportado');
  }
  
  // 2. Verificar Cache
  console.log('\n2. CACHE:');
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      console.log(`   ✓ ${cacheNames.length} cache(s) encontrado(s)`);
      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        console.log(`   - ${name}: ${keys.length} item(s)`);
      }
    } catch (e) {
      console.error('   ✗ Erro:', e);
    }
  } else {
    console.log('   ✗ Não suportado');
  }
  
  // 3. Verificar variáveis globais
  console.log('\n3. VARIÁVEIS GLOBAIS:');
  const globalVars = ['selectedService', 'selectedDate', 'selectedTime'];
  for (const varName of globalVars) {
    if (window[varName] !== undefined) {
      console.log(`   ⚠ ${varName}: ${window[varName]}`);
    }
  }
  
  // 4. Verificar localStorage
  console.log('\n4. LOCALSTORAGE:');
  try {
    console.log(`   ✓ ${localStorage.length} item(s)`);
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`   - ${key}`);
    }
  } catch (e) {
    console.error('   ✗ Erro:', e);
  }
  
  // 5. Verificar sessionStorage
  console.log('\n5. SESSIONSTORAGE:');
  try {
    console.log(`   ✓ ${sessionStorage.length} item(s)`);
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      console.log(`   - ${key}`);
    }
  } catch (e) {
    console.error('   ✗ Erro:', e);
  }
  
  // 6. Verificar modo PWA
  console.log('\n6. MODO PWA:');
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true;
  console.log(`   ${isPWA ? '✓' : '✗'} Rodando como PWA: ${isPWA}`);
  
  // 7. Verificar erros no console
  console.log('\n7. LIMPEZA:');
  console.log('   Execute os comandos abaixo para limpar tudo:');
  console.log('   - Limpar SW: navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()))');
  console.log('   - Limpar Cache: caches.keys().then(k => k.forEach(c => caches.delete(c)))');
  console.log('   - Limpar Storage: localStorage.clear(); sessionStorage.clear()');
  
  console.log('\n=== FIM DO DIAGNÓSTICO ===');
})();
