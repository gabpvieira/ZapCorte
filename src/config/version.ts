/**
 * Configuração de Versão do App
 * 
 * IMPORTANTE: Atualizar esta versão a cada deploy para garantir
 * que os usuários recebam as atualizações corretamente.
 * 
 * Formato: MAJOR.MINOR.PATCH
 * - MAJOR: Mudanças incompatíveis na API
 * - MINOR: Novas funcionalidades compatíveis
 * - PATCH: Correções de bugs
 */

export const APP_VERSION = '2.4.3';
export const APP_NAME = 'ZapCorte';
export const BUILD_DATE = new Date().toISOString();

// Changelog - Últimas atualizações
export const CHANGELOG = {
  '2.4.3': [
    'Melhoria: Splash screen de atualização redesenhado',
    'Melhoria: Logotipo centralizado e maior',
    'Melhoria: Responsividade do seletor de barbeiro no mobile'
  ],
  '2.4.2': [
    'Correção: Nome do barbeiro aparecia como null no WhatsApp',
    'Melhoria: Atribuição automática agora mostra nome correto',
    'Correção: appointmentId agora é passado corretamente'
  ],
  '2.4.1': [
    'Correção: Horários após intervalo de almoço no Plano PRO',
    'Correção: Dados do barbeiro não carregavam no modal de edição',
    'Melhoria: Otimização no cálculo de horários disponíveis'
  ],
  '2.4.0': [
    'Sistema de notificações reais integrado com Supabase',
    'Notificações de agendamentos, cancelamentos e confirmações',
    'Splash screen de atualização apenas no PWA instalado',
    'Atualização automática robusta sem tela preta'
  ],
  '2.3.0': [
    'Botão de copiar link no dashboard',
    'Meta tags Open Graph atualizadas',
    'Sistema de atualização automática melhorado',
    'Correção de tela preta após atualizações'
  ],
  '2.2.0': [
    'Melhorias no calendário multi-barbeiro',
    'Correções de performance',
    'Otimizações de cache'
  ],
  '2.1.0': [
    'Sistema de notificações push',
    'Modo encaixe',
    'Melhorias de UI/UX'
  ]
};

// Verificar se precisa limpar cache baseado na versão
export const shouldClearCache = (storedVersion: string | null): boolean => {
  if (!storedVersion) return false;
  
  const [storedMajor, storedMinor] = storedVersion.split('.').map(Number);
  const [currentMajor, currentMinor] = APP_VERSION.split('.').map(Number);
  
  // Limpar cache em mudanças MAJOR ou MINOR
  return storedMajor < currentMajor || 
         (storedMajor === currentMajor && storedMinor < currentMinor);
};
