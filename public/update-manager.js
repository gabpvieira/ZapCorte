/**
 * Update Manager - Sistema robusto de atualização PWA
 * Executa ANTES do React carregar para evitar tela preta
 */

(function() {
  'use strict';
  
  const APP_VERSION = '2.4.1';
  const VERSION_KEY = 'zapcorte_version';
  const LAST_CHECK_KEY = 'zapcorte_last_check';
  const UPDATE_IN_PROGRESS_KEY = 'zapcorte_updating';
  
  // Verificar se está rodando como PWA instalado
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                window.navigator.standalone === true ||
                document.referrer.includes('android-app://');
  
  // Se não for PWA, não fazer nada
  if (!isPWA) {
    console.log('[Update Manager] Não é PWA, pulando verificação de atualização');
    return;
  }
  
  console.log('[Update Manager] PWA detectado, iniciando verificação...');
  
  // Verificar se já está atualizando (evitar loop)
  const isUpdating = sessionStorage.getItem(UPDATE_IN_PROGRESS_KEY);
  if (isUpdating === 'true') {
    console.log('[Update Manager] Atualização já em progresso, continuando...');
    sessionStorage.removeItem(UPDATE_IN_PROGRESS_KEY);
    return;
  }
  
  // Verificar versão armazenada
  const storedVersion = localStorage.getItem(VERSION_KEY);
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  const now = Date.now();
  
  console.log('[Update Manager] Versão armazenada:', storedVersion);
  console.log('[Update Manager] Versão atual:', APP_VERSION);
  
  // Função para mostrar splash de atualização
  function showUpdateSplash() {
    const splash = document.createElement('div');
    splash.id = 'update-splash';
    splash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    splash.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <img src="/zapcorte-icon.png" alt="ZapCorte" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 16px;">
        <h1 style="color: #fff; font-size: 24px; margin-bottom: 10px; font-weight: 600;">Atualizando ZapCorte</h1>
        <p style="color: #a0a0a0; font-size: 14px; margin-bottom: 30px;">Versão ${APP_VERSION}</p>
        <div style="width: 200px; height: 4px; background: rgba(139, 92, 246, 0.2); border-radius: 2px; overflow: hidden; margin: 0 auto;">
          <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); transition: width 0.3s ease;"></div>
        </div>
        <p id="status-text" style="color: #a0a0a0; font-size: 12px; margin-top: 20px;">Preparando atualização...</p>
      </div>
    `;
    
    document.body.appendChild(splash);
    return splash;
  }
  
  // Função para atualizar progresso
  function updateProgress(percent, message) {
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('status-text');
    if (progressBar) progressBar.style.width = percent + '%';
    if (statusText) statusText.textContent = message;
  }
  
  // Função para limpar atualização
  async function performUpdate() {
    console.log('[Update Manager] Iniciando atualização...');
    
    // Marcar que está atualizando
    sessionStorage.setItem(UPDATE_IN_PROGRESS_KEY, 'true');
    
    // Mostrar splash
    const splash = showUpdateSplash();
    
    try {
      // Passo 1: Desregistrar Service Workers (20%)
      updateProgress(20, 'Removendo versões antigas...');
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }
      }
      await sleep(300);
      
      // Passo 2: Limpar caches (40%)
      updateProgress(40, 'Limpando cache...');
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        for (const cacheName of cacheNames) {
          await caches.delete(cacheName);
        }
      }
      await sleep(300);
      
      // Passo 3: Limpar localStorage seletivamente (60%)
      updateProgress(60, 'Atualizando configurações...');
      const keysToPreserve = ['supabase.auth.token', 'sb-'];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach(key => {
        const shouldPreserve = keysToPreserve.some(prefix => key.startsWith(prefix));
        if (!shouldPreserve && key !== VERSION_KEY && key !== LAST_CHECK_KEY) {
          localStorage.removeItem(key);
        }
      });
      await sleep(300);
      
      // Passo 4: Limpar sessionStorage (80%)
      updateProgress(80, 'Finalizando...');
      sessionStorage.clear();
      await sleep(300);
      
      // Passo 5: Atualizar versão (100%)
      updateProgress(100, 'Concluído!');
      localStorage.setItem(VERSION_KEY, APP_VERSION);
      localStorage.setItem(LAST_CHECK_KEY, now.toString());
      await sleep(500);
      
      // Remover splash e recarregar
      if (splash && splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
      
      console.log('[Update Manager] Atualização concluída, recarregando...');
      window.location.reload(true);
      
    } catch (error) {
      console.error('[Update Manager] Erro durante atualização:', error);
      sessionStorage.removeItem(UPDATE_IN_PROGRESS_KEY);
      
      // Em caso de erro, tentar recarregar mesmo assim
      updateProgress(100, 'Erro, tentando novamente...');
      await sleep(1000);
      window.location.reload(true);
    }
  }
  
  // Helper para sleep
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Verificar se precisa atualizar
  const needsUpdate = !storedVersion || storedVersion !== APP_VERSION;
  
  // Verificar se passou tempo suficiente desde última verificação (evitar loops)
  const timeSinceLastCheck = lastCheck ? now - parseInt(lastCheck) : Infinity;
  const minCheckInterval = 5000; // 5 segundos
  
  if (needsUpdate && timeSinceLastCheck > minCheckInterval) {
    console.log('[Update Manager] Nova versão detectada, iniciando atualização...');
    performUpdate();
  } else if (needsUpdate) {
    console.log('[Update Manager] Atualização necessária mas muito recente, pulando...');
    localStorage.setItem(VERSION_KEY, APP_VERSION);
  } else {
    console.log('[Update Manager] App atualizado, versão:', APP_VERSION);
    // Atualizar timestamp de verificação
    localStorage.setItem(LAST_CHECK_KEY, now.toString());
  }
  
})();
