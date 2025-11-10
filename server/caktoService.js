import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configurações do Cakto
const CAKTO_CONFIG = {
  webhookSecret: process.env.CAKTO_WEBHOOK_SECRET,
  productIdStarter: process.env.CAKTO_PRODUCT_ID_STARTER,
  productIdPro: process.env.CAKTO_PRODUCT_ID_PRO,
  checkoutUrlStarter: `https://pay.cakto.com.br/${process.env.CAKTO_PRODUCT_ID_STARTER}`,
  checkoutUrlPro: `https://pay.cakto.com.br/${process.env.CAKTO_PRODUCT_ID_PRO}`
};

/**
 * Valida a assinatura do webhook
 */
export function validateWebhookSignature(payload, signature) {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', CAKTO_CONFIG.webhookSecret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Erro ao validar assinatura:', error);
    return false;
  }
}

/**
 * Busca usuário por email (método robusto)
 */
async function findUserByEmail(email) {
  try {
    console.log(`🔍 Buscando usuário com email: ${email}`);

    // Método 1: Buscar na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (profile && !profileError) {
      console.log('👤 Usuário encontrado na tabela profiles:', profile);
      return {
        userId: profile.id, // ID do profile
        user_id: profile.user_id, // ID do auth.users (se existir)
        email: profile.email,
        name: profile.full_name || profile.name,
        plan: profile.plan_type,
        subscription_status: profile.subscription_status
      };
    }

    // Método 2: Buscar no auth.users (fallback)
    console.log('🔄 Tentando buscar no auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao buscar usuários:', authError);
      return null;
    }

    const user = authUsers.users.find(u => u.email === email);
    if (user) {
      console.log('👤 Usuário encontrado no auth:', user);
      
      // Tentar encontrar o profile correspondente
      const { data: linkedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (linkedProfile) {
        console.log('👤 Profile vinculado encontrado:', linkedProfile);
        return {
          userId: linkedProfile.id,
          user_id: user.id,
          email: user.email,
          name: linkedProfile.full_name || user.user_metadata?.name || user.email,
          plan: linkedProfile.plan_type || 'free',
          subscription_status: linkedProfile.subscription_status || 'inactive'
        };
      }
      
      return {
        userId: user.id,
        user_id: user.id,
        email: user.email,
        name: user.user_metadata?.name || user.email,
        plan: 'free'
      };
    }

    console.log('❌ Usuário não encontrado');
    return null;

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return null;
  }
}

/**
 * Determina o tipo de plano baseado no produto Cakto
 */
function determinePlanType(productId) {
  if (productId === CAKTO_CONFIG.productIdStarter) {
    return 'starter';
  } else if (productId === CAKTO_CONFIG.productIdPro) {
    return 'pro';
  }
  return 'premium'; // fallback genérico
}

/**
 * Processa pagamento aprovado
 */
export async function processPaymentApproved(webhookData) {
  try {
    // Extrair dados do webhook (estrutura correta do Cakto)
    const customer = webhookData.data.customer;
    const transaction = webhookData.data;
    const transactionId = transaction.id;
    const amount = transaction.amount;
    const paymentMethod = transaction.paymentMethod;
    const status = transaction.status;
    const productId = transaction.productId || webhookData.data.product?.id;

    console.log('Dados extraídos:');
    console.log('- Customer:', customer);
    console.log('- Transaction ID:', transactionId);
    console.log('- Amount:', amount);
    console.log('- Payment Method:', paymentMethod);
    console.log('- Status:', status);
    console.log('- Product ID:', productId);

    // Determinar tipo de plano
    const planType = determinePlanType(productId);
    console.log('- Plan Type:', planType);

    // Verificar se é usuário de teste
    const isTestUser = customer.email.includes('example.com') || 
                      customer.email.includes('test') ||
                      customer.email.includes('john.doe');

    if (isTestUser) {
      console.log('🧪 Usuário de teste detectado, processando em modo de teste');
    }

    // Buscar usuário
    const user = await findUserByEmail(customer.email);
    
    if (!user && !isTestUser) {
      console.log('❌ Usuário não encontrado para email:', customer.email);
      return {
        success: false,
        message: 'Usuário não encontrado',
        transaction_id: transactionId
      };
    }

    let userId = user?.userId;

    // Para usuários de teste, simular processamento
    if (isTestUser && !user) {
      console.log('🧪 Simulando processamento para usuário de teste');
      userId = 'test-user-id';
    }

    // Atualizar perfil para premium (se usuário real)
    if (user && !isTestUser) {
      const updateData = {
        plan_type: planType,
        subscription_status: 'active',
        last_payment_date: new Date().toISOString(),
        payment_method: paymentMethod,
        updated_at: new Date().toISOString()
      };

      // Adicionar data de expiração (30 dias para planos mensais)
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);
      updateData.expires_at = expirationDate.toISOString();

      // Usar user_id se existir, senão usar id
      const profileIdField = user.user_id ? 'user_id' : 'id';
      const profileIdValue = user.user_id || userId;

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq(profileIdField, profileIdValue);

      if (updateError) {
        console.error('❌ Erro ao atualizar perfil:', updateError);
        console.error('Tentando com campo:', profileIdField, '=', profileIdValue);
      } else {
        console.log(`✅ Perfil atualizado para ${planType}`);
      }
    }

    // Salvar histórico de pagamento (se usuário real)
    if (user && !isTestUser) {
      // Usar o ID correto do perfil (profiles.id, não auth.users.id)
      const profileUserId = user.user_id || userId;
      
      const { error: historyError } = await supabase
        .from('payment_history')
        .insert({
          user_id: profileUserId,
          transaction_id: transactionId,
          amount: amount,
          status: 'completed',
          payment_method: paymentMethod,
          cakto_data: webhookData.data,
          plan_type: planType,
          created_at: new Date().toISOString()
        });

      if (historyError) {
        console.error('❌ Erro ao salvar histórico:', historyError);
        console.error('Detalhes do erro:', historyError);
        console.error('user_id usado:', profileUserId);
      } else {
        console.log('✅ Histórico de pagamento salvo');
      }
    }

    const result = {
      success: true,
      message: isTestUser ? 
        `Webhook processado (usuário de teste: ${customer.email})` : 
        'Pagamento processado com sucesso',
      transaction_id: transactionId,
      amount: amount,
      plan_type: planType,
      test_mode: isTestUser
    };

    console.log('✅ Pagamento aprovado processado:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro ao processar pagamento aprovado:', error);
    throw error;
  }
}

/**
 * Processa reembolso
 */
export async function processRefund(webhookData) {
  try {
    const customer = webhookData.data.customer;
    const transaction = webhookData.data;
    const transactionId = transaction.id;
    const amount = transaction.amount;

    console.log('💸 Processando reembolso:', {
      email: customer.email,
      transactionId,
      amount
    });

    // Buscar usuário
    const user = await findUserByEmail(customer.email);
    
    if (!user) {
      console.log('❌ Usuário não encontrado para reembolso:', customer.email);
      return {
        success: false,
        message: 'Usuário não encontrado',
        transaction_id: transactionId
      };
    }

    // Cancelar assinatura (voltar para free)
    const profileIdField = user.user_id ? 'user_id' : 'id';
    const profileIdValue = user.user_id || user.userId;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        plan_type: 'free',
        subscription_status: 'cancelled',
        expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq(profileIdField, profileIdValue);

    if (updateError) {
      console.error('❌ Erro ao cancelar assinatura:', updateError);
    } else {
      console.log('✅ Assinatura cancelada (voltou para free)');
    }

    // Registrar reembolso no histórico
    const profileUserId = user.user_id || user.userId;
    
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: profileUserId,
        transaction_id: `refund_${transactionId}`,
        amount: -amount, // Valor negativo para reembolso
        status: 'refunded',
        payment_method: 'refund',
        cakto_data: webhookData.data,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('❌ Erro ao registrar reembolso:', historyError);
    } else {
      console.log('✅ Reembolso registrado no histórico');
    }

    const result = {
      success: true,
      message: 'Reembolso processado com sucesso',
      transaction_id: transactionId,
      amount: amount
    };

    console.log('✅ Reembolso processado:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro ao processar reembolso:', error);
    throw error;
  }
}

/**
 * Processa cancelamento de assinatura
 */
export async function processSubscriptionCancelled(webhookData) {
  try {
    const customer = webhookData.data.customer;
    const transaction = webhookData.data;
    const transactionId = transaction.id;

    console.log('🚫 Processando cancelamento de assinatura:', {
      email: customer.email,
      transactionId
    });

    // Buscar usuário
    const user = await findUserByEmail(customer.email);
    
    if (!user) {
      console.log('❌ Usuário não encontrado para cancelamento:', customer.email);
      return {
        success: false,
        message: 'Usuário não encontrado',
        transaction_id: transactionId
      };
    }

    // Cancelar assinatura (voltar para free)
    const profileIdField = user.user_id ? 'user_id' : 'id';
    const profileIdValue = user.user_id || user.userId;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        plan_type: 'free',
        subscription_status: 'cancelled',
        expires_at: null,
        updated_at: new Date().toISOString()
      })
      .eq(profileIdField, profileIdValue);

    if (updateError) {
      console.error('❌ Erro ao cancelar assinatura:', updateError);
    } else {
      console.log('✅ Assinatura cancelada');
    }

    // Registrar cancelamento no histórico
    const profileUserId = user.user_id || user.userId;
    
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: profileUserId,
        transaction_id: `cancel_${transactionId}`,
        amount: 0,
        status: 'cancelled',
        payment_method: 'cancellation',
        cakto_data: webhookData.data,
        created_at: new Date().toISOString()
      });

    if (historyError) {
      console.error('❌ Erro ao registrar cancelamento:', historyError);
    } else {
      console.log('✅ Cancelamento registrado no histórico');
    }

    const result = {
      success: true,
      message: 'Cancelamento processado com sucesso',
      transaction_id: transactionId
    };

    console.log('✅ Cancelamento processado:', result);
    return result;

  } catch (error) {
    console.error('❌ Erro ao processar cancelamento:', error);
    throw error;
  }
}

/**
 * Gera URL de checkout personalizada
 */
export function generateCheckoutUrl(planType, userEmail, customData = {}) {
  let baseUrl;
  
  if (planType === 'starter') {
    baseUrl = CAKTO_CONFIG.checkoutUrlStarter;
  } else if (planType === 'pro') {
    baseUrl = CAKTO_CONFIG.checkoutUrlPro;
  } else {
    throw new Error(`Tipo de plano não suportado: ${planType}`);
  }

  const params = new URLSearchParams({
    email: userEmail,
    ...customData
  });
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Exporta configurações para uso externo
 */
export const config = CAKTO_CONFIG;