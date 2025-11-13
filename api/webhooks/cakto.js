// Vercel Serverless Function para Webhook do Cakto
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Função para validar webhook
function validateWebhook(webhookData) {
  return webhookData.secret === process.env.CAKTO_WEBHOOK_SECRET;
}

// Função para buscar usuário
async function findUserByEmail(email) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (profile) {
    return {
      profileId: profile.id,
      userId: profile.user_id,
      email: profile.email,
      name: profile.full_name || email,
      plan: profile.plan_type
    };
  }
  return null;
}

// Função para determinar tipo de plano
function determinePlanType(offerId) {
  if (offerId === '3th8tvh') return 'starter';
  if (offerId === '9jk3ref') return 'pro';
  return 'starter';
}

// Processar pagamento aprovado
async function processPaymentApproved(webhookData) {
  const customer = webhookData.data.customer;
  const transaction = webhookData.data;
  const offerId = transaction.offer?.id;
  const planType = determinePlanType(offerId);

  // Buscar usuário
  const user = await findUserByEmail(customer.email);
  if (!user) {
    throw new Error(`Usuário não encontrado: ${customer.email}`);
  }

  // Calcular expiração (30 dias)
  const expirationDate = new Date();
  expirationDate.setMonth(expirationDate.getMonth() + 1);

  // Atualizar profile
  await supabase
    .from('profiles')
    .update({
      plan_type: planType,
      subscription_status: 'active',
      last_payment_date: new Date().toISOString(),
      expires_at: expirationDate.toISOString()
    })
    .eq('id', user.profileId);

  // Atualizar barbershop
  if (user.userId) {
    await supabase
      .from('barbershops')
      .update({ plan_type: planType })
      .eq('user_id', user.userId);
  }

  // Salvar histórico
  await supabase
    .from('payment_history')
    .insert({
      user_id: user.profileId,
      transaction_id: transaction.id,
      amount: transaction.amount,
      status: 'completed',
      payment_method: transaction.paymentMethod,
      plan_type: planType,
      cakto_data: webhookData.data
    });

  return { success: true, planType, email: customer.email };
}

// Handler principal
export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;

    // Log do webhook
    await supabase.from('webhook_logs').insert({
      event_type: webhookData.event || 'unknown',
      payload: webhookData,
      status: 'pending'
    });

    // Validar secret
    if (!validateWebhook(webhookData)) {
      await supabase.from('webhook_logs').insert({
        event_type: webhookData.event,
        payload: webhookData,
        status: 'failed',
        error_message: 'Assinatura inválida'
      });
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Processar evento
    let result;
    switch (webhookData.event) {
      case 'purchase_approved':
        result = await processPaymentApproved(webhookData);
        break;
      
      case 'pix_gerado':
        // PIX gerado - apenas registrar, não fazer nada
        // O pagamento será processado quando o evento 'purchase_approved' chegar
        result = { 
          success: true, 
          message: 'PIX gerado registrado',
          action: 'waiting_payment'
        };
        break;
      
      case 'subscription_cancelled':
      case 'refund':
        // Cancelar assinatura
        const user = await findUserByEmail(webhookData.data.customer.email);
        if (user) {
          await supabase
            .from('profiles')
            .update({
              plan_type: 'free',
              subscription_status: 'cancelled',
              expires_at: null
            })
            .eq('id', user.profileId);
        }
        result = { success: true };
        break;

      default:
        // Eventos não suportados são registrados mas não causam erro
        result = { 
          success: true, 
          message: `Evento ${webhookData.event} registrado mas não processado`,
          action: 'ignored'
        };
        break;
    }

    // Log de sucesso
    await supabase.from('webhook_logs').insert({
      event_type: webhookData.event,
      payload: webhookData,
      status: 'success'
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Erro no webhook:', error);

    // Log de erro
    await supabase.from('webhook_logs').insert({
      event_type: req.body?.event || 'error',
      payload: req.body,
      status: 'failed',
      error_message: error.message
    });

    return res.status(500).json({ error: error.message });
  }
}
