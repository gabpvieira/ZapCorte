/**
 * Safari-specific fixes and polyfills
 * Detecta e aplica correções para problemas conhecidos do Safari
 */

export function applySafariFixes() {
  // Detectar Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (!isSafari) return;

  console.log('🍎 Safari detectado - aplicando correções...');

  // Fix 1: Forçar background color no body
  document.body.style.backgroundColor = '#0C0C0C';
  document.documentElement.style.backgroundColor = '#0C0C0C';

  // Fix 2: Adicionar classe para CSS específico do Safari
  document.documentElement.classList.add('is-safari');

  // Fix 3: Fix para backdrop-filter
  if (!CSS.supports('backdrop-filter', 'blur(10px)') && 
      !CSS.supports('-webkit-backdrop-filter', 'blur(10px)')) {
    console.warn('⚠️ Safari não suporta backdrop-filter - usando fallback');
    document.documentElement.classList.add('no-backdrop-filter');
  }

  // Fix 4: Prevenir zoom em inputs (problema comum no Safari iOS)
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) {
    viewport.setAttribute('content', 
      'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
    );
  }

  // Fix 5: Forçar repaint após carregamento
  setTimeout(() => {
    document.body.style.display = 'none';
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    document.body.offsetHeight; // Trigger reflow
    document.body.style.display = '';
  }, 100);

  console.log('✅ Correções do Safari aplicadas');
}

// Aplicar fixes assim que o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySafariFixes);
} else {
  applySafariFixes();
}
