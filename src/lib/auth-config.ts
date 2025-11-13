/**
 * Configurações de autenticação e URLs de redirecionamento
 * Sistema de confirmação de email ZapCorte
 */

// Configuração: Forçar URLs de produção mesmo em desenvolvimento
// Mude para 'true' se quiser testar com URLs de produção no localhost
const FORCE_PRODUCTION_URLS = false;

// Detectar se está em produção ou desenvolvimento
const isProduction = window.location.hostname === 'zapcorte.com.br' || 
                     window.location.hostname === 'www.zapcorte.com.br' ||
                     FORCE_PRODUCTION_URLS;

const baseUrl = isProduction ? 'https://zapcorte.com.br' : window.location.origin;

export const AUTH_CONFIG = {
  redirectUrls: {
    emailConfirmation: `${baseUrl}/auth/confirm`,
    passwordReset: `${baseUrl}/auth/callback`,
    signIn: `${baseUrl}/dashboard`,
    signOut: `${baseUrl}/login`,
    afterEmailConfirmed: `${baseUrl}/dashboard` // URL após confirmar email
  },
  
  allowedRedirectUrls: [
    // Desenvolvimento local
    'http://localhost:5173/auth/callback',
    'http://localhost:5173/auth/verify',
    'http://localhost:5173/auth/confirm',
    'http://localhost:5173/dashboard',
    'http://localhost:5173/email-confirmado',
    
    // Produção
    'https://zapcorte.com.br/auth/callback',
    'https://zapcorte.com.br/auth/verify',
    'https://zapcorte.com.br/auth/confirm',
    'https://zapcorte.com.br/dashboard',
    'https://zapcorte.com.br/email-confirmado',
    'https://www.zapcorte.com.br/auth/callback',
    'https://www.zapcorte.com.br/auth/verify',
    'https://www.zapcorte.com.br/auth/confirm',
    'https://www.zapcorte.com.br/dashboard',
    'https://www.zapcorte.com.br/email-confirmado'
  ]
};

/**
 * Retorna a URL de redirecionamento apropriada baseada no tipo
 */
export function getRedirectUrl(type: 'callback' | 'verify' | 'confirm' | 'dashboard' | 'email-confirmado'): string {
  const isProduction = window.location.hostname === 'zapcorte.com.br' || 
                       window.location.hostname === 'www.zapcorte.com.br' ||
                       FORCE_PRODUCTION_URLS;
  const baseUrl = isProduction ? 'https://zapcorte.com.br' : window.location.origin;
  
  if (type === 'dashboard') {
    return `${baseUrl}/dashboard`;
  }
  
  if (type === 'email-confirmado') {
    return `${baseUrl}/email-confirmado`;
  }
  
  return `${baseUrl}/auth/${type}`;
}

/**
 * Retorna a URL base (produção ou desenvolvimento)
 */
export function getBaseUrl(): string {
  const isProduction = window.location.hostname === 'zapcorte.com.br' || 
                       window.location.hostname === 'www.zapcorte.com.br' ||
                       FORCE_PRODUCTION_URLS;
  return isProduction ? 'https://zapcorte.com.br' : window.location.origin;
}

/**
 * Retorna se está em modo de produção
 */
export function isProductionMode(): boolean {
  return window.location.hostname === 'zapcorte.com.br' || 
         window.location.hostname === 'www.zapcorte.com.br' ||
         FORCE_PRODUCTION_URLS;
}

/**
 * Valida se uma URL de redirecionamento é permitida
 */
export function isAllowedRedirectUrl(url: string): boolean {
  return AUTH_CONFIG.allowedRedirectUrls.some(allowedUrl => 
    url.startsWith(allowedUrl)
  );
}
