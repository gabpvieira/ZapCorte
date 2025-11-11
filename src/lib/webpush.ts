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
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica se notificações estão suportadas
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
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
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    return false;
  }
}

/**
 * Inscreve o usuário para receber notificações
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  try {
    const registration = await registerServiceWorker();
    if (!registration) {
      return null;
    }

    // Aguardar o service worker estar ativo
    await navigator.serviceWorker.ready;

    // Verificar se já existe uma subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Criar nova subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    return subscription;
  } catch (error) {
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
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/send-notification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barbershopId,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Erro ao enviar notificação de teste:', error);
    return false;
  }
}
