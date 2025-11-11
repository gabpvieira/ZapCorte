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
 * Salva a subscription no banco de dados
 */
export async function saveSubscriptionToDatabase(
  barbershopId: string,
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const { supabase } = await import('@/lib/supabase');
    
    const subscriptionData = subscription.toJSON();
    console.log('💾 Salvando subscription:', { barbershopId, subscriptionData });
    
    const { data, error } = await supabase
      .from('barbershops')
      .update({
        push_subscription: subscriptionData,
        push_enabled: true,
        push_last_updated: new Date().toISOString()
      })
      .eq('id', barbershopId)
      .select();

    if (error) {
      console.error('❌ Erro ao salvar subscription:', error);
      return false;
    }

    console.log('✅ Subscription salva com sucesso:', data);
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
