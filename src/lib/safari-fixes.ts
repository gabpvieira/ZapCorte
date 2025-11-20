/**
 * Safari-specific fixes and polyfills
 * Detecta e aplica correções para problemas conhecidos do Safari
 */

export function applySafariFixes() {
  // Detectar Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  
  if (!isSafari) {
    console.log('[Safari] Não é Safari - pulando correções');
    return;
  }

  console.log('[Safari] 🍎 Safari detectado - aplicando correções...');
  console.log('[Safari] User Agent:', navigator.userAgent);

  try {
    // Fix 1: Forçar background color no body
    document.body.style.backgroundColor = '#0C0C0C';
    document.documentElement.style.backgroundColor = '#0C0C0C';
    console.log('[Safari] ✓ Background color aplicado');

    // Fix 2: Adicionar classe para CSS específico do Safari
    document.documentElement.classList.add('is-safari');
    console.log('[Safari] ✓ Classe is-safari adicionada');

    // Fix 3: Fix para backdrop-filter
    if (!CSS.supports('backdrop-filter', 'blur(10px)') && 
        !CSS.supports('-webkit-backdrop-filter', 'blur(10px)')) {
      console.warn('[Safari] ⚠️ Safari não suporta backdrop-filter - usando fallback');
      document.documentElement.classList.add('no-backdrop-filter');
    } else {
      console.log('[Safari] ✓ backdrop-filter suportado');
    }

    // Fix 4: Prevenir zoom em inputs (problema comum no Safari iOS)
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
      viewport.setAttribute('content', 
        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
      );
      console.log('[Safari] ✓ Viewport configurado');
    }

    // REMOVIDO: Fix 5 que forçava repaint - pode estar causando problemas

    console.log('[Safari] ✅ Todas as correções aplicadas com sucesso');
  } catch (error) {
    console.error('[Safari] ❌ Erro ao aplicar correções:', error);
  }
}

// Aplicar fixes assim que o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySafariFixes);
} else {
  applySafariFixes();
}
