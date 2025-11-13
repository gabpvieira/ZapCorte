/**
 * Configurações de autenticação e URLs de redirecionamento
 * Sistema de confirmação de email ZapCorte
 */

export const AUTH_CONFIG = {
  redirectUrls: {
    emailConfirmation: `${window.location.origin}/auth/confirm`,
    passwordReset: `${window.location.origin}/auth/callback`,
    signIn: `${window.location.origin}/dashboard`,
    signOut: `${window.location.origin}/login`
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
  const origin = window.location.origin;
  
  if (type === 'dashboard') {
    return `${origin}/dashboard`;
  }
  
  if (type === 'email-confirmado') {
    return `${origin}/email-confirmado`;
  }
  
  return `${origin}/auth/${type}`;
}

/**
 * Valida se uma URL de redirecionamento é permitida
 */
export function isAllowedRedirectUrl(url: string): boolean {
  return AUTH_CONFIG.allowedRedirectUrls.some(allowedUrl => 
    url.startsWith(allowedUrl)
  );
}
