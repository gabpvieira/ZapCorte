/**
 * API Endpoint para enviar notificações push
 * Vercel Serverless Function
 */

const { sendNewAppointmentNotification } = require('../pushNotifications');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

module.exports = async (req, res) => {
  // Apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { barbershopId, customerName, scheduledAt, serviceName } = req.body;

    if (!barbershopId || !customerName || !scheduledAt) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // Buscar subscription do barbeiro
    const { data: barbershop, error } = await supabase
      .from('barbershops')
      .select('push_subscription')
      .eq('id', barbershopId)
      .single();

    if (error || !barbershop?.push_subscription) {
      return res.status(404).json({ error: 'Subscription não encontrada' });
    }

    // Enviar notificação
    const result = await sendNewAppointmentNotification(
      barbershop.push_subscription,
      { customerName, scheduledAt, serviceName }
    );

    if (result.success) {
      return res.status(200).json({ success: true, message: 'Notificação enviada' });
    } else {
      return res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    console.error('Erro ao processar notificação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
