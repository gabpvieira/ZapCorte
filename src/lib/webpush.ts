/**
 * Web Push Service - Cliente
 * Sistema nativo de notificações push
 */

const VAPID_PUBLIC_KEY = 'BKgmKhuhrgdKq_1htzMDYWUKt4DjAU1EyP5iFGTdjv9HT4L9t_qt9pa_j3J95uE2FKiqO1LKc7dfV8-cYPB5law';

/**
 * Converte chave VAPID para Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registra o Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker não suportado neste navegador');
    return null;
  }

  try {
    console.log('📝 Registrando Service Worker...');
    
    // Tentar registrar o service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registrado:', registration.scope);
    
    // Aguardar o service worker estar pronto
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker pronto');
    
    return registration;
  } catch (error) {
    console.error('❌ Erro ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Verifica se notificações estão suportadas
 */
export function isPushSupported(): boolean {
  // Verificações básicas
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker não suportado');
    return false;
  }
  
  if (!('PushManager' in window)) {
    console.warn('Push Manager não suportado');
    return false;
  }
  
  if (!('Notification' in window)) {
    console.warn('Notification API não suportada');
    return false;
  }
  
  return true;
}

/**
 * Detecta se é iOS/Safari
 */
export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  return isIOS || isSafari;
}

/**
 * Verifica se notificações estão habilitadas
 */
export function isNotificationEnabled(): boolean {
  return Notification.permission === 'granted';
}

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushSupported()) {
    console.error('Push não suportado neste dispositivo');
    return false;
  }

  try {
    console.log('🔔 Solicitando permissão de notificações...');
    console.log('📱 Dispositivo:', getDeviceInfo());
    console.log('🌐 Navegador:', navigator.userAgent);
    
    // Verificar se já tem permissão
    if (Notification.permission === 'granted') {
      console.log('✅ Permissão já concedida');
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.error('❌ Permissão negada anteriormente');
      return false;
    }
    
    // Solicitar permissão
    const permission = await Notification.requestPermission();
    console.log('📋 Resultado da permissão:', permission);
    
    return permission === 'granted';
  } catch (error) {
    console.error('❌ Erro ao solicitar permissão:', error);
    return false;
  }
}

/**
 * Inscreve o usuário para receber notificações
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    console.log('📝 Iniciando inscrição push...');
    
    const registration = await registerServiceWorker();
    if (!registration) {
      console.error('❌ Falha ao registrar Service Worker');
      return null;
    }

    // Aguardar o service worker estar ativo
    console.log('⏳ Aguardando Service Worker ficar pronto...');
    await navigator.serviceWorker.ready;
    console.log('✅ Service Worker pronto');

    // Verificar se já existe uma subscription
    console.log('🔍 Verificando subscription existente...');
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('✅ Subscription existente encontrada');
      return subscription;
    }

    // Criar nova subscription
    console.log('📝 Criando nova subscription...');
    
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
      
      console.log('✅ Subscription criada com sucesso');
      return subscription;
    } catch (subscribeError: any) {
      console.error('❌ Erro ao criar subscription:', subscribeError);
      
      // Tentar novamente sem a chave VAPID (fallback para alguns navegadores)
      if (subscribeError.name === 'NotSupportedError' || subscribeError.name === 'InvalidStateError') {
        console.log('🔄 Tentando novamente sem VAPID...');
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true
          });
          console.log('✅ Subscription criada (sem VAPID)');
          return subscription;
        } catch (fallbackError) {
          console.error('❌ Falha no fallback:', fallbackError);
          return null;
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Erro geral ao inscrever:', error);
    return null;
  }
}

/**
 * Cancela a inscrição de notificações
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Detecta informações do dispositivo
 */
function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(ua);
  const isTablet = /iPad|Android/i.test(ua) && !/Mobile/i.test(ua);
  
  let deviceType = 'desktop';
  if (isTablet) deviceType = 'tablet';
  else if (isMobile) deviceType = 'mobile';
  
  let browser = 'unknown';
  if (ua.includes('Chrome')) browser = 'chrome';
  else if (ua.includes('Firefox')) browser = 'firefox';
  else if (ua.includes('Safari')) browser = 'safari';
  else if (ua.includes('Edge')) browser = 'edge';
  
  return {
    type: deviceType,
    browser,
    platform: navigator.platform,
    isMobile,
    isTablet,
  };
}

/**
 * Salva a subscription no banco de dados (suporta múltiplos dispositivos)
 */
export async function saveSubscriptionToDatabase(
  barbershopId: string,
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    const subscriptionData = subscription.toJSON();
    const deviceInfo = getDeviceInfo();
    const endpoint = subscriptionData.endpoint;
    
    console.log('💾 Salvando subscription:', { 
      barbershopId, 
      deviceInfo,
      endpoint: endpoint?.substring(0, 50) + '...'
    });
    
    // Verificar se já existe uma subscription com este endpoint
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('barbershop_id', barbershopId)
      .eq('subscription->>endpoint', endpoint)
      .single();

    if (existing) {
      // Atualizar subscription existente
      const { error: updateError } = await supabase
        .from('push_subscriptions')
        .update({
          subscription: subscriptionData,
          device_info: deviceInfo,
          user_agent: navigator.userAgent,
          is_active: true,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('❌ Erro ao atualizar subscription:', updateError);
        return false;
      }
      
      console.log('✅ Subscription atualizada com sucesso');
    } else {
      // Criar nova subscription
      const { error: insertError } = await supabase
        .from('push_subscriptions')
        .insert({
          barbershop_id: barbershopId,
          subscription: subscriptionData,
          device_info: deviceInfo,
          user_agent: navigator.userAgent,
          is_active: true,
          last_used_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('❌ Erro ao inserir subscription:', insertError);
        return false;
      }
      
      console.log('✅ Nova subscription criada com sucesso');
    }

    // Atualizar flag na tabela barbershops
    await supabase
      .from('barbershops')
      .update({
        push_enabled: true,
        push_last_updated: new Date().toISOString()
      })
      .eq('id', barbershopId);

    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar subscription:', error);
    return false;
  }
}

/**
 * Envia notificação de teste
 */
export async function sendTestNotification(barbershopId: string): Promise<boolean> {
  try {
    // Detecta ambiente automaticamente
    const isProduction = window.location.hostname !== 'localhost';
    
    // Em produção, usa a mesma URL base (Vercel Functions)
    // Em desenvolvimento, usa o servidor local
    const apiUrl = isProduction 
      ? window.location.origin  // https://zapcorte.vercel.app
      : (import.meta.env.VITE_API_URL || 'http://localhost:3001');
    
    console.log('🌐 Enviando para:', apiUrl);
    
    const response = await fetch(`${apiUrl}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barbershopId,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro da API:', errorText);
      
      let errorMessage = 'Erro ao enviar notificação';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('✅ Resposta da API:', result);
    return true;
  } catch (error) {
    console.error('❌ Erro ao enviar notificação de teste:', error);
    return false;
  }
}
