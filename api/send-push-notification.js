/**
 * API Endpoint para enviar notificações push
 * Vercel Serverless Function
 */

import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Chaves VAPID
const VAPID_PUBLIC_KEY = 'BKgmKhuhrgdKq_1htzMDYWUKt4DjAU1EyP5iFGTdjv9HT4L9t_qt9pa_j3J95uE2FKiqO1LKc7dfV8-cYPB5law';
const VAPID_PRIVATE_KEY = 'dlMUU4XLFxaZk7NvJg3zqmcChMrat5FhKdIH2YHqVPs';

// Configurar VAPID
webpush.setVapidDetails(
  'mailto:contato@zapcorte.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Inicializar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barbershopId, type, data } = req.body;

    if (!barbershopId) {
      return res.status(400).json({ error: 'barbershopId é obrigatório' });
    }

    // Buscar subscription da barbearia
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('push_subscription, name')
      .eq('id', barbershopId)
      .single();

    if (barbershopError || !barbershop) {
      console.error('[Push] Erro ao buscar barbearia:', barbershopError);
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    if (!barbershop.push_subscription) {
      console.log('[Push] Barbearia não tem subscription ativa');
      return res.status(200).json({ 
        success: false, 
        message: 'Notificações não ativadas para esta barbearia' 
      });
    }

    // Preparar payload baseado no tipo
    let payload;
    
    switch (type) {
      case 'new_appointment':
        payload = createNewAppointmentPayload(data);
        break;
      
      case 'test':
        payload = createTestPayload();
        break;
      
      default:
        return res.status(400).json({ error: 'Tipo de notificação inválido' });
    }

    // Enviar notificação
    try {
      await webpush.sendNotification(
        barbershop.push_subscription,
        JSON.stringify(payload)
      );

      console.log('[Push] ✅ Notificação enviada com sucesso');
      
      return res.status(200).json({ 
        success: true, 
        message: 'Notificação enviada com sucesso' 
      });
    } catch (pushError) {
      console.error('[Push] Erro ao enviar notificação:', pushError);
      
      // Se a subscription expirou, remover do banco
      if (pushError.statusCode === 410) {
        await supabase
          .from('barbershops')
          .update({ push_subscription: null })
          .eq('id', barbershopId);
        
        return res.status(410).json({ 
          success: false, 
          message: 'Subscription expirada' 
        });
      }
      
      return res.status(500).json({ 
        success: false, 
        error: 'Erro ao enviar notificação' 
      });
    }

  } catch (error) {
    console.error('[Push] Erro geral:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
}

/**
 * Cria payload para notificação de novo agendamento
 */
function createNewAppointmentPayload(data) {
  const { customerName, scheduledAt, serviceName } = data;
  
  const date = new Date(scheduledAt);
  const hoje = new Date().toDateString() === date.toDateString();
  const dataFormatada = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  const hora = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return {
    title: '🎉 Novo Agendamento!',
    body: `${customerName} agendou ${serviceName || 'um serviço'} para ${hoje ? 'hoje' : dataFormatada} às ${hora}`,
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    tag: 'new-appointment',
    requireInteraction: true,
    data: {
      url: '/dashboard',
      type: 'new_appointment',
      customerName,
      scheduledAt,
      serviceName,
    },
    actions: [
      {
        action: 'view',
        title: 'Ver Agendamento'
      }
    ]
  };
}

/**
 * Cria payload para notificação de teste
 */
function createTestPayload() {
  return {
    title: '✅ Notificação de Teste',
    body: 'Suas notificações estão funcionando perfeitamente! 🎉',
    icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    tag: 'test-notification',
    requireInteraction: false,
    data: {
      url: '/dashboard',
      type: 'test',
    }
  };
}
