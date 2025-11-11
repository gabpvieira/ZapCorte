/**
 * Vercel Serverless Function
 * Envia notificações push para múltiplos dispositivos
 */

import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configurar VAPID
const VAPID_PUBLIC_KEY = 'BKgmKhuhrgdKq_1htzMDYWUKt4DjAU1EyP5iFGTdjv9HT4L9t_qt9pa_j3J95uE2FKiqO1LKc7dfV8-cYPB5law';
const VAPID_PRIVATE_KEY = 'dlMUU4XLFxaZk7NvJg3zqmcChMrat5FhKdIH2YHqVPs';

webpush.setVapidDetails(
  'mailto:contato@zapcorte.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Configurar Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

/**
 * Envia notificação push
 */
async function sendPushNotification(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia notificação de teste
 */
async function sendTestNotification(subscription) {
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

/**
 * Handler principal
 */
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barbershopId, customerName, scheduledAt, serviceName } = req.body;

    if (!barbershopId) {
      return res.status(400).json({ error: 'barbershopId é obrigatório' });
    }

    console.log('📨 Requisição recebida:', { barbershopId });

    // Buscar todas as subscriptions ativas
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true);

    if (error) {
      console.error('Erro ao buscar subscriptions:', error);
      return res.status(500).json({ error: 'Erro ao buscar subscriptions' });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return res.status(400).json({ error: 'Nenhuma subscription ativa encontrada' });
    }

    console.log(`📱 Enviando para ${subscriptions.length} dispositivo(s)`);

    // Enviar para todos os dispositivos
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        const result = await sendTestNotification(sub.subscription);

        if (result.success) {
          successCount++;
          // Atualizar last_used_at
          await supabase
            .from('push_subscriptions')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', sub.id);
        } else {
          failCount++;
          // Se erro 410, marcar como inativa
          if (result.error && result.error.includes('410')) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', sub.id);
          }
        }

        results.push({
          device: sub.device_info?.type || 'unknown',
          success: result.success,
          error: result.error
        });
      } catch (error) {
        failCount++;
        console.error('Erro ao enviar para dispositivo:', error);
        results.push({
          device: sub.device_info?.type || 'unknown',
          success: false,
          error: error.message
        });
      }
    }

    // Registrar no histórico
    await supabase.from('push_notifications').insert({
      barbershop_id: barbershopId,
      title: '✅ Notificação de Teste',
      body: 'Suas notificações estão funcionando!',
      status: successCount > 0 ? 'sent' : 'failed',
      sent_at: successCount > 0 ? new Date().toISOString() : null,
      data: { 
        devices: results,
        successCount,
        failCount
      }
    });

    console.log(`✅ Enviado: ${successCount} | ❌ Falhou: ${failCount}`);

    return res.status(200).json({ 
      success: successCount > 0,
      message: `Notificação enviada para ${successCount} de ${subscriptions.length} dispositivo(s)`,
      details: {
        total: subscriptions.length,
        success: successCount,
        failed: failCount,
        results
      }
    });
  } catch (error) {
    console.error('Erro ao processar requisição:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      message: error.message 
    });
  }
}
