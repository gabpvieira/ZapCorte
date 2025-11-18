// Web Push API - Cliente
// Sistema de notificações nativo do navegador

import { supabase } from './supabase';

// Chave pública VAPID (pode ser exposta no frontend)
const VAPID_PUBLIC_KEY = 'BKgmKhuhrgdKq_1htzMDYWUKt4DjAU1EyP5iFGTdjv9HT4L9t_qt9pa_j3J95uE2FKiqO1LKc7dfV8-cYPB5law';

/**
 * Converte chave VAPID de base64 para Uint8Array
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
 * Verifica se o navegador suporta notificações push
 */
export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 
         'PushManager' in window && 
         'Notification' in window;
}

/**
 * Verifica o status da permissão de notificações
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Registra o Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('[WebPush] Service Worker não suportado');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('[WebPush] Service Worker registrado:', registration);
    
    // Aguardar ativação
    await navigator.serviceWorker.ready;
    
    return registration;
  } catch (error) {
    console.error('[WebPush] Erro ao registrar Service Worker:', error);
    return null;
  }
}

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn('[WebPush] Notificações não suportadas');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log('[WebPush] Permissão de notificação:', permission);
    return permission === 'granted';
  } catch (error) {
    console.error('[WebPush] Erro ao solicitar permissão:', error);
    return false;
  }
}

/**
 * Cria uma subscription de push
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey
    });

    console.log('[WebPush] Subscription criada:', subscription);
    return subscription;
  } catch (error) {
    console.error('[WebPush] Erro ao criar subscription:', error);
    return null;
  }
}

/**
 * Obtém a subscription existente
 */
export async function getExistingSubscription(
  registration: ServiceWorkerRegistration
): Promise<PushSubscription | null> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('[WebPush] Erro ao obter subscription:', error);
    return null;
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
    const subscriptionJson = subscription.toJSON();
    
    const { error } = await supabase
      .from('barbershops')
      .update({
        push_subscription: subscriptionJson
      })
      .eq('id', barbershopId);

    if (error) {
      console.error('[WebPush] Erro ao salvar subscription:', error);
      return false;
    }

    console.log('[WebPush] Subscription salva no banco de dados');
    return true;
  } catch (error) {
    console.error('[WebPush] Erro ao salvar subscription:', error);
    return false;
  }
}

/**
 * Remove a subscription do banco de dados
 */
export async function removeSubscriptionFromDatabase(
  barbershopId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('barbershops')
      .update({
        push_subscription: null
      })
      .eq('id', barbershopId);

    if (error) {
      console.error('[WebPush] Erro ao remover subscription:', error);
      return false;
    }

    console.log('[WebPush] Subscription removida do banco de dados');
    return true;
  } catch (error) {
    console.error('[WebPush] Erro ao remover subscription:', error);
    return false;
  }
}

/**
 * Cancela a subscription de push
 */
export async function unsubscribeFromPush(
  registration: ServiceWorkerRegistration
): Promise<boolean> {
  try {
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('[WebPush] Subscription cancelada');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[WebPush] Erro ao cancelar subscription:', error);
    return false;
  }
}

/**
 * Fluxo completo: ativar notificações
 */
export async function enablePushNotifications(
  barbershopId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Verificar suporte
    if (!isPushSupported()) {
      return {
        success: false,
        message: 'Seu navegador não suporta notificações push'
      };
    }

    // 2. Solicitar permissão
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      return {
        success: false,
        message: 'Permissão de notificação negada'
      };
    }

    // 3. Registrar Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return {
        success: false,
        message: 'Erro ao registrar Service Worker'
      };
    }

    // 4. Criar subscription
    const subscription = await subscribeToPush(registration);
    if (!subscription) {
      return {
        success: false,
        message: 'Erro ao criar subscription'
      };
    }

    // 5. Salvar no banco
    const saved = await saveSubscriptionToDatabase(barbershopId, subscription);
    if (!saved) {
      return {
        success: false,
        message: 'Erro ao salvar subscription'
      };
    }

    return {
      success: true,
      message: 'Notificações ativadas com sucesso!'
    };
  } catch (error) {
    console.error('[WebPush] Erro ao ativar notificações:', error);
    return {
      success: false,
      message: 'Erro ao ativar notificações'
    };
  }
}

/**
 * Fluxo completo: desativar notificações
 */
export async function disablePushNotifications(
  barbershopId: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Obter registration
    const registration = await navigator.serviceWorker.ready;

    // 2. Cancelar subscription
    await unsubscribeFromPush(registration);

    // 3. Remover do banco
    await removeSubscriptionFromDatabase(barbershopId);

    return {
      success: true,
      message: 'Notificações desativadas'
    };
  } catch (error) {
    console.error('[WebPush] Erro ao desativar notificações:', error);
    return {
      success: false,
      message: 'Erro ao desativar notificações'
    };
  }
}

/**
 * Verifica se as notificações estão ativadas
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  try {
    if (!isPushSupported()) {
      return false;
    }

    if (getNotificationPermission() !== 'granted') {
      return false;
    }

    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) {
      return false;
    }

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('[WebPush] Erro ao verificar status:', error);
    return false;
  }
}
