// Vercel Serverless Function para Webhook do Cakto - V2 (com tratamento de erro)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    // Inicializar Supabase dentro do handler
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Variáveis de ambiente não configuradas');
      return res.status(500).json({ 
        error: 'Configuração inválida',
        message: 'Variáveis de ambiente do Supabase não encontradas'
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const webhookData = req.body;
    const eventType = webhookData.event || 'unknown';

    // Validar secret
    const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET;
    if (webhookData.secret !== expectedSecret) {
      return res.status(401).json({ error: 'Secret inválido' });
    }

    // Log inicial
    const { data: logData, error: logError } = await supabase
      .from('webhook_logs')
      .insert({
        event_type: eventType,
        payload: webhookData,
        status: 'pending'
      })
      .select()
      .single();

    if (logError) {
      console.error('Erro ao criar log:', logError);
    }

    const webhookLogId = logData?.id;

    // Processar evento
    let result;
    const customer = webhookData.data?.customer;
    const transaction = webhookData.data;
    const offerId = transaction?.offer?.id;

    // Determinar plano
    let planType = 'starter';
    if (offerId === '3th8tvh' || offerId === process.env.CAKTO_PRODUCT_ID_STARTER) {
      planType = 'starter';
    } else if (offerId === '9jk3ref' || offerId === process.env.CAKTO_PRODUCT_ID_PRO) {
      planType = 'pro';
    }

    switch (eventType) {
      case 'purchase_approved':
        // Buscar usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', customer.email)
          .maybeSingle();

        if (!profile) {
          result = {
            success: false,
            message: `Usuário não encontrado: ${customer.email}`
          };
          break;
        }

        // Calcular expiração
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
            payment_method: transaction.paymentMethod
          })
          .eq('id', profile.id);

        // Atualizar barbershop
        if (profile.user_id) {
          await supabase
            .from('barbershops')
            .update({ plan_type: planType })
            .eq('user_id', profile.user_id);
        }

        // Salvar histórico
        await supabase
          .from('payment_history')
          .insert({
            user_id: profile.id,
            transaction_id: transaction.id,
            amount: transaction.amount,
            status: 'completed',
            payment_method: transaction.paymentMethod,
            plan_type: planType,
            cakto_data: webhookData.data
          });

        result = {
          success: true,
          message: 'Pagamento aprovado processado',
          email: customer.email,
          planType
        };
        break;

      case 'pix_gerado':
      case 'pix_generated':
        // Buscar usuário
        const { data: pixProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', customer.email)
          .maybeSingle();

        if (pixProfile) {
          // Salvar como pendente
          await supabase
            .from('payment_history')
            .insert({
              user_id: pixProfile.id,
              transaction_id: transaction.id,
              amount: transaction.amount,
              status: 'pending',
              payment_method: 'PIX',
              plan_type: planType,
              cakto_data: webhookData.data
            });
        }

        result = {
          success: true,
          message: 'PIX gerado registrado',
          email: customer.email
        };
        break;

      default:
        result = {
          success: true,
          message: `Evento ${eventType} registrado`,
          action: 'ignored'
        };
        break;
    }

    // Atualizar log de sucesso
    if (webhookLogId) {
      await supabase
        .from('webhook_logs')
        .update({ status: 'success' })
        .eq('id', webhookLogId);
    }

    const processingTime = Date.now() - startTime;

    return res.status(200).json({
      ...result,
      processingTime: `${processingTime}ms`
    });

  } catch (error) {
    console.error('Erro no webhook:', error);

    return res.status(500).json({
      error: error.message,
      success: false
    });
  }
}
