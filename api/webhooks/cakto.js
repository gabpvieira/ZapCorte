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

// Função para determinar tipo de plano baseado no offer_id
function determinePlanType(offerId) {
  // Verificar contra as variáveis de ambiente
  if (offerId === process.env.CAKTO_PRODUCT_ID_STARTER) return 'starter';
  if (offerId === process.env.CAKTO_PRODUCT_ID_PRO) return 'pro';
  
  // Fallback para IDs hardcoded
  if (offerId === '3th8tvh') return 'starter';
  if (offerId === '9jk3ref') return 'pro';
  
  return 'starter';
}

// Função para mapear método de pagamento
function mapPaymentMethod(method) {
  const methodMap = {
    'credit_card': 'Cartão de Crédito',
    'pix': 'PIX',
    'boleto': 'Boleto',
    'pix_automatic': 'PIX Automático',
    'debit_card': 'Cartão de Débito'
  };
  return methodMap[method] || method || 'Não especificado';
}

// Processar pagamento aprovado
async function processPaymentApproved(webhookData) {
  const customer = webhookData.data.customer;
  const transaction = webhookData.data;
  
  // Cakto envia offer.id (short_id do produto)
  const offerId = transaction.offer?.id;
  const planType = determinePlanType(offerId);
  const paymentMethod = mapPaymentMethod(transaction.paymentMethod);

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
      expires_at: expirationDate.toISOString(),
      payment_method: paymentMethod
    })
    .eq('id', user.profileId);

  // Atualizar barbershop
  if (user.userId) {
    await supabase
      .from('barbershops')
      .update({ plan_type: planType })
      .eq('user_id', user.userId);
  }

  // Salvar histórico de pagamento
  await supabase
    .from('payment_history')
    .insert({
      user_id: user.profileId,
      transaction_id: transaction.id,
      amount: transaction.amount,
      status: 'completed',
      payment_method: paymentMethod,
      plan_type: planType,
      cakto_data: webhookData.data
    });

  return { 
    success: true, 
    planType, 
    email: customer.email,
    paymentMethod,
    transactionId: transaction.id
  };
}

// Processar PIX gerado (aguardando pagamento)
async function processPixGenerated(webhookData) {
  const customer = webhookData.data.customer;
  const transaction = webhookData.data;
  const offerId = transaction.offer?.id;
  const planType = determinePlanType(offerId);

  // Buscar usuário
  const user = await findUserByEmail(customer.email);
  if (!user) {
    // Se usuário não existe, apenas registrar no log
    return { 
      success: true, 
      message: 'PIX gerado registrado (usuário não encontrado)',
      email: customer.email
    };
  }

  // Salvar no histórico como pendente
  await supabase
    .from('payment_history')
    .insert({
      user_id: user.profileId,
      transaction_id: transaction.id,
      amount: transaction.amount,
      status: 'pending',
      payment_method: 'PIX',
      plan_type: planType,
      cakto_data: webhookData.data
    });

  return { 
    success: true, 
    message: 'PIX gerado registrado',
    email: customer.email,
    transactionId: transaction.id
  };
}

// Processar boleto gerado (aguardando pagamento)
async function processBoletoGenerated(webhookData) {
  const customer = webhookData.data.customer;
  const transaction = webhookData.data;
  const offerId = transaction.offer?.id;
  const planType = determinePlanType(offerId);

  // Buscar usuário
  const user = await findUserByEmail(customer.email);
  if (!user) {
    return { 
      success: true, 
      message: 'Boleto gerado registrado (usuário não encontrado)',
      email: customer.email
    };
  }

  // Salvar no histórico como pendente
  await supabase
    .from('payment_history')
    .insert({
      user_id: user.profileId,
      transaction_id: transaction.id,
      amount: transaction.amount,
      status: 'pending',
      payment_method: 'Boleto',
      plan_type: planType,
      cakto_data: webhookData.data
    });

  return { 
    success: true, 
    message: 'Boleto gerado registrado',
    email: customer.email,
    transactionId: transaction.id
  };
}

// Handler principal
export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  let webhookLogId = null;

  try {
    const webhookData = req.body;
    const eventType = webhookData.event || 'unknown';

    // Log inicial do webhook
    const { data: logData } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: eventType,
        payload: webhookData,
        status: 'pending'
      })
      .select()
      .single();
    
    webhookLogId = logData?.id;

    // Validar secret
    if (!validateWebhook(webhookData)) {
      await supabase
        .from('webhook_logs')
        .update({
          status: 'failed',
          error_message: 'Assinatura inválida'
        })
        .eq('id', webhookLogId);
      
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    // Processar evento
    let result;
    
    switch (eventType) {
      case 'purchase_approved':
        // Pagamento aprovado - atualizar usuário para premium
        result = await processPaymentApproved(webhookData);
        break;
      
      case 'pix_gerado':
      case 'pix_generated':
        // PIX gerado - registrar como pendente
        result = await processPixGenerated(webhookData);
        break;
      
      case 'boleto_gerado':
      case 'boleto_generated':
        // Boleto gerado - registrar como pendente
        result = await processBoletoGenerated(webhookData);
        break;
      
      case 'subscription_cancelled':
      case 'refund':
        // Cancelar assinatura ou reembolso
        const user = await findUserByEmail(webhookData.data.customer.email);
        if (user) {
          // Atualizar profile
          await supabase
            .from('profiles')
            .update({
              plan_type: 'free',
              subscription_status: eventType === 'refund' ? 'cancelled' : 'cancelled',
              expires_at: null
            })
            .eq('id', user.profileId);

          // Atualizar barbershop
          if (user.userId) {
            await supabase
              .from('barbershops')
              .update({ plan_type: 'freemium' })
              .eq('user_id', user.userId);
          }

          // Registrar no histórico
          await supabase
            .from('payment_history')
            .insert({
              user_id: user.profileId,
              transaction_id: `${eventType}_${webhookData.data.id}`,
              amount: webhookData.data.amount || 0,
              status: eventType === 'refund' ? 'refunded' : 'cancelled',
              payment_method: mapPaymentMethod(webhookData.data.paymentMethod),
              plan_type: user.plan,
              cakto_data: webhookData.data
            });
        }
        
        result = { 
          success: true, 
          message: `${eventType} processado`,
          email: webhookData.data.customer.email
        };
        break;

      case 'payment_failed':
        // Pagamento falhou - registrar no histórico
        const failedUser = await findUserByEmail(webhookData.data.customer.email);
        if (failedUser) {
          const offerId = webhookData.data.offer?.id;
          await supabase
            .from('payment_history')
            .insert({
              user_id: failedUser.profileId,
              transaction_id: webhookData.data.id,
              amount: webhookData.data.amount,
              status: 'failed',
              payment_method: mapPaymentMethod(webhookData.data.paymentMethod),
              plan_type: determinePlanType(offerId),
              cakto_data: webhookData.data
            });
        }
        
        result = { 
          success: true, 
          message: 'Pagamento falho registrado',
          email: webhookData.data.customer.email
        };
        break;

      default:
        // Eventos não suportados são registrados mas não causam erro
        result = { 
          success: true, 
          message: `Evento ${eventType} registrado mas não processado`,
          action: 'ignored'
        };
        break;
    }

    // Log de sucesso
    await supabase
      .from('webhook_logs')
      .update({
        status: 'success'
      })
      .eq('id', webhookLogId);

    const processingTime = Date.now() - startTime;
    
    return res.status(200).json({
      ...result,
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    console.error('Erro no webhook:', error);

    // Log de erro
    if (webhookLogId) {
      await supabase
        .from('webhook_logs')
        .update({
          status: 'failed',
          error_message: error.message
        })
        .eq('id', webhookLogId);
    } else {
      await supabase
        .from('webhook_logs')
        .insert({
          event_type: req.body?.event || 'error',
          payload: req.body,
          status: 'failed',
          error_message: error.message
        });
    }

    return res.status(500).json({ 
      error: error.message,
      success: false
    });
  }
}
