/**
 * OneSignal Push Notifications Service
 * Gerencia notificações push para o PWA
 */

import logotipo from "@/assets/zapcorte-icon.png";

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY;

/**
 * Verifica se o OneSignal está configurado
 */
export function isOneSignalConfigured(): boolean {
  return !!(ONESIGNAL_APP_ID && ONESIGNAL_REST_API_KEY);
}

/**
 * Inicializa o OneSignal
 */
export async function initializeOneSignal(): Promise<boolean> {
  if (!ONESIGNAL_APP_ID) {
    return false;
  }

  try {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    
    window.OneSignalDeferred.push(async function(OneSignal: any) {
      await OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        safari_web_id: "web.onesignal.auto.xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
        notifyButton: {
          enable: false,
        },
        allowLocalhostAsSecureOrigin: true,
        serviceWorkerParam: { scope: '/' },
        serviceWorkerPath: 'OneSignalSDKWorker.js',
      });
    });

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Solicita permissão para notificações
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!window.OneSignalDeferred) {
    console.error('[OneSignal] SDK não carregado');
    return false;
  }

  return new Promise((resolve) => {
    window.OneSignalDeferred!.push(async function(OneSignal: any) {
      try {
        const permission = await OneSignal.Notifications.permission;
        
        if (permission === 'granted') {
          console.log('[OneSignal] Permissão já concedida');
          resolve(true);
          return;
        }

        // Solicitar permissão
        const result = await OneSignal.Notifications.requestPermission();
        console.log('[OneSignal] Resultado da solicitação:', result);
        resolve(result);
      } catch (error) {
        console.error('[OneSignal] Erro ao solicitar permissão:', error);
        resolve(false);
      }
    });
  });
}

/**
 * Verifica se as notificações estão habilitadas
 */
export async function isNotificationEnabled(): Promise<boolean> {
  if (!window.OneSignalDeferred) {
    return false;
  }

  return new Promise((resolve) => {
    window.OneSignalDeferred!.push(async function(OneSignal: any) {
      try {
        const permission = await OneSignal.Notifications.permission;
        resolve(permission === 'granted');
      } catch (error) {
        console.error('[OneSignal] Erro ao verificar permissão:', error);
        resolve(false);
      }
    });
  });
}

/**
 * Obtém o Player ID do usuário atual
 */
export async function getPlayerId(): Promise<string | null> {
  if (!window.OneSignalDeferred) {
    return null;
  }

  return new Promise((resolve) => {
    window.OneSignalDeferred!.push(async function(OneSignal: any) {
      try {
        const playerId = await OneSignal.User.PushSubscription.id;
        console.log('[OneSignal] Player ID:', playerId);
        resolve(playerId);
      } catch (error) {
        console.error('[OneSignal] Erro ao obter Player ID:', error);
        resolve(null);
      }
    });
  });
}

/**
 * Salva o Player ID no banco de dados
 */
export async function savePlayerIdToBarbershop(barbershopId: string, playerId: string) {
  const { supabase } = await import('@/lib/supabase');
  
  const { error } = await supabase
    .from('barbershops')
    .update({ player_id: playerId })
    .eq('id', barbershopId);

  if (error) {
    console.error('[OneSignal] Erro ao salvar Player ID:', error);
    return false;
  }

  console.log('[OneSignal] Player ID salvo com sucesso');
  return true;
}

/**
 * Envia notificação push para um usuário específico
 */
export async function sendPushNotification({
  playerId,
  title,
  message,
  url,
  data,
}: {
  playerId: string;
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}) {
  if (!ONESIGNAL_REST_API_KEY) {
    console.error('[OneSignal] REST API Key não configurada');
    return false;
  }

  const logoUrl = window.location.origin + logotipo;

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    include_player_ids: [playerId],
    headings: { en: title, pt: title },
    contents: { en: message, pt: message },
    url: url || window.location.origin + '/dashboard',
    chrome_web_icon: logoUrl,
    chrome_web_image: logoUrl,
    firefox_icon: logoUrl,
    chrome_web_badge: logoUrl,
    ios_sound: 'notification.wav',
    android_sound: 'notification',
    android_channel_id: 'zapcorte-notifications',
    priority: 10,
    data: data || {},
  };

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[OneSignal] Erro na resposta:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('[OneSignal] Notificação enviada com sucesso:', data);
    return true;
  } catch (error) {
    console.error('[OneSignal] Erro ao enviar notificação:', error);
    return false;
  }
}

/**
 * Envia notificação de novo agendamento
 */
export async function sendNewAppointmentNotification({
  playerId,
  customerName,
  scheduledAt,
  serviceName,
}: {
  playerId: string;
  customerName: string;
  scheduledAt: string;
  serviceName?: string;
}) {
  const date = new Date(scheduledAt);
  const hoje = new Date().toDateString() === date.toDateString();
  const dataFormatada = date.toLocaleDateString('pt-BR');
  const hora = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const title = '🎉 Novo Agendamento!';
  const message = `${customerName} agendou ${serviceName || 'um serviço'} para ${hoje ? 'hoje' : dataFormatada} às ${hora}`;

  return await sendPushNotification({
    playerId,
    title,
    message,
    url: window.location.origin + '/appointments',
    data: {
      type: 'new_appointment',
      customerName,
      scheduledAt,
      serviceName,
    },
  });
}
