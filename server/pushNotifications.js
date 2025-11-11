/**
 * Sistema de Notificações Push Nativo
 * Usando Web Push API + VAPID
 */

import webpush from 'web-push';

// Chaves VAPID geradas
export const VAPID_PUBLIC_KEY = 'BKgmKhuhrgdKq_1htzMDYWUKt4DjAU1EyP5iFGTdjv9HT4L9t_qt9pa_j3J95uE2FKiqO1LKc7dfV8-cYPB5law';
const VAPID_PRIVATE_KEY = 'dlMUU4XLFxaZk7NvJg3zqmcChMrat5FhKdIH2YHqVPs';

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:contato@zapcorte.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

/**
 * Envia notificação push para um usuário
 */
export async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia notificação de novo agendamento
 */
export async function sendNewAppointmentNotification(subscription, data) {
  const { customerName, scheduledAt, serviceName } = data;
  
  const date = new Date(scheduledAt);
  const hoje = new Date().toDateString() === date.toDateString();
  const dataFormatada = date.toLocaleDateString('pt-BR');
  const hora = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const payload = {
    title: '🎉 Novo Agendamento!',
    body: `${customerName} agendou ${serviceName || 'um serviço'} para ${hoje ? 'hoje' : dataFormatada} às ${hora}`,
    icon: '/zapcorte-icon.png',
    badge: '/zapcorte-icon.png',
    data: {
      url: '/dashboard/appointments',
      type: 'new_appointment',
      customerName,
      scheduledAt,
      serviceName,
    },
  };

  return await sendPushNotification(subscription, payload);
}

/**
 * Envia notificação de teste
 */
export async function sendTestNotification(subscription) {
  const payload = {
    title: '✅ Notificação de Teste',
    body: 'Suas notificações estão funcionando perfeitamente!',
    icon: '/zapcorte-icon.png',
    badge: '/zapcorte-icon.png',
    data: {
      url: '/dashboard/notifications',
      type: 'test',
    },
  };

  return await sendPushNotification(subscription, payload);
}
