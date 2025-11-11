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
 * Busca usuário por email (método robusto e profissional)
 */
async function findUserByEmail(email) {
  try {
    console.log(`🔍 Buscando usuário com email: ${email}`);

    // Método 1: Buscar na tabela profiles por email
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle(); // Usar maybeSingle() para evitar erro se não encontrar

    if (profile && !profileError) {
      console.log('✅ Usuário encontrado na tabela profiles:', {
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        plan_type: profile.plan_type
      });
      
      return {
        profileId: profile.id, // ID do profile (UUID único)
        userId: profile.user_id, // ID do auth.users (se existir)
        email: profile.email,
        name: profile.full_name || profile.name || email,
        plan: profile.plan_type,
        subscription_status: profile.subscription_status
      };
    }

    // Método 2: Buscar no auth.users (fallback)
    console.log('🔄 Tentando buscar no auth.users...');
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('❌ Erro ao buscar usuários no auth:', authError);
      return null;
    }

    const authUser = authData.users.find(u => u.email === email);
    if (authUser) {
      console.log('✅ Usuário encontrado no auth.users:', {
        id: authUser.id,
        email: authUser.email
      });
      
      // Tentar encontrar o profile correspondente por user_id
      const { data: linkedProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();
      
      if (linkedProfile) {
        console.log('✅ Profile vinculado encontrado:', {
          id: linkedProfile.id,
          user_id: linkedProfile.user_id
        });
        
        return {
          profileId: linkedProfile.id,
          userId: authUser.id,
          email: authUser.email,
          name: linkedProfile.full_name || authUser.user_metadata?.name || authUser.email,
          plan: linkedProfile.plan_type || 'free',
          subscription_status: linkedProfile.subscription_status || 'inactive'
        };
      }
      
      // Se não encontrou profile, retornar dados do auth
      return {
        profileId: null,
        userId: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email,
        plan: 'free',
        subscription_status: 'inactive'
      };
    }

    console.log('❌ Usuário não encontrado em nenhuma tabela');
    return null;

  } catch (error) {
    console.error('❌ Erro ao buscar usuário:', error);
    return null;
  }
}

/**
 * Determina o tipo de plano baseado no produto Cakto
 */
function determinePlanType(productId, offerId) {
  // Verificar pelo offer ID (mais confiável)
  if (offerId === CAKTO_CONFIG.productIdStarter || offerId === '3th8tvh') {
    return 'starter';
  } else if (offerId === CAKTO_CONFIG.productIdPro || offerId === '9jk3ref') {
    return 'pro';
  }
  
  // Fallback: verificar pelo product ID
  if (productId === CAKTO_CONFIG.productIdStarter) {
    return 'starter';
  } else if (productId === CAKTO_CONFIG.productIdPro) {
    return 'pro';
  }
  
  return 'starter'; // fallback padrão
}

/**
 * Processa pagamento aprovado - VERSÃO PROFISSIONAL
 */
export async function processPaymentApproved(webhookData) {
  try {
    console.log('\n🔔 ===== PROCESSANDO PAGAMENTO APROVADO =====');
    
    // Extrair dados do webhook (estrutura correta do Cakto)
    const customer = webhookData.data.customer;
    const transaction = webhookData.data;
    const transactionId = transaction.id;
    const amount = transaction.amount || transaction.baseAmount;
    const paymentMethod = transaction.paymentMethod;
    const status = transaction.status;
    const offerId = transaction.offer?.id || webhookData.data.offer?.id;
    const productId = transaction.product?.id || webhookData.data.productId;
    const subscription = transaction.subscription;

    console.log('📋 Dados extraídos do webhook:');
    console.log('  - Customer:', customer);
    console.log('  - Transaction ID:', transactionId);
    console.log('  - Amount:', amount);
    console.log('  - Payment Method:', paymentMethod);
    console.log('  - Status:', status);
    console.log('  - Offer ID:', offerId);
    console.log('  - Product ID:', productId);
    console.log('  - Subscription:', subscription);

    // Determinar tipo de plano
    const planType = determinePlanType(productId, offerId);
    console.log('  - Plan Type determinado:', planType);

    // Buscar usuário
    const user = await findUserByEmail(customer.email);
    
    if (!user) {
      console.log('❌ ERRO: Usuário não encontrado para email:', customer.email);
      return {
        success: false,
        message: `Usuário não encontrado para o email: ${customer.email}`,
        transaction_id: transactionId,
        email: customer.email
      };
    }

    console.log('✅ Usuário encontrado:', {
      profileId: user.profileId,
      userId: user.userId,
      email: user.email,
      currentPlan: user.plan
    });

    // Calcular data de expiração (30 dias para planos mensais)
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    // Preparar dados de atualização
    const updateData = {
      plan_type: planType,
      subscription_status: 'active',
      last_payment_date: new Date().toISOString(),
      payment_method: paymentMethod,
      expires_at: expirationDate.toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('📝 Dados de atualização preparados:', updateData);

    // ATUALIZAR PROFILE
    // Usar profileId (profiles.id) para atualizar
    if (user.profileId) {
      console.log('🔄 Atualizando profile com ID:', user.profileId);
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.profileId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ ERRO ao atualizar perfil:', updateError);
        console.error('   Detalhes:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details
        });
      } else {
        console.log('✅ Perfil atualizado com sucesso:', updatedProfile);
      }
    } else {
      console.warn('⚠️ Profile ID não encontrado, tentando atualizar por user_id');
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.userId)
        .select()
        .single();

      if (updateError) {
        console.error('❌ ERRO ao atualizar perfil por user_id:', updateError);
      } else {
        console.log('✅ Perfil atualizado com sucesso por user_id:', updatedProfile);
      }
    }

    // ATUALIZAR BARBERSHOP (se existir) - USANDO SERVICE ROLE
    if (user.userId) {
      console.log('🔄 Atualizando barbearia para user_id:', user.userId);
      
      // Primeiro, verificar se existe barbearia
      const { data: existingBarbershop, error: checkError } = await supabase
        .from('barbershops')
        .select('id, name, plan_type')
        .eq('user_id', user.userId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Erro ao verificar barbearia:', checkError);
      } else if (existingBarbershop) {
        console.log('📍 Barbearia encontrada:', {
          id: existingBarbershop.id,
          name: existingBarbershop.name,
          current_plan: existingBarbershop.plan_type,
          new_plan: planType
        });

        // Atualizar o plano da barbearia
        const { data: updatedBarbershop, error: updateError } = await supabase
          .from('barbershops')
          .update({ 
            plan_type: planType
          })
          .eq('user_id', user.userId)
          .select();

        if (updateError) {
          console.error('❌ ERRO ao atualizar barbearia:', updateError);
          console.error('   Detalhes:', {
            code: updateError.code,
            message: updateError.message,
            details: updateError.details
          });
        } else if (updatedBarbershop && updatedBarbershop.length > 0) {
          console.log('✅ Barbearia atualizada com sucesso:', {
            id: updatedBarbershop[0].id,
            name: updatedBarbershop[0].name,
            plan_type: updatedBarbershop[0].plan_type
          });
        }
      } else {
        console.log('ℹ️ Nenhuma barbearia encontrada para este usuário');
      }
    }

    // SALVAR HISTÓRICO DE PAGAMENTO
    // Usar profileId (profiles.id) como user_id no payment_history
    const historyUserId = user.profileId || user.userId;
    
    console.log('💾 Salvando histórico de pagamento para user_id:', historyUserId);
    
    const { data: paymentHistory, error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: historyUserId,
        transaction_id: transactionId,
        amount: amount,
        status: 'completed',
        payment_method: paymentMethod,
        plan_type: planType,
        cakto_data: webhookData.data,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (historyError) {
      console.error('❌ ERRO ao salvar histórico:', historyError);
      console.error('   Detalhes:', {
        code: historyError.code,
        message: historyError.message,
        details: historyError.details,
        user_id_usado: historyUserId
      });
    } else {
      console.log('✅ Histórico de pagamento salvo com sucesso:', paymentHistory);
    }

    const result = {
      success: true,
      message: 'Pagamento processado com sucesso',
      transaction_id: transactionId,
      amount: amount,
      plan_type: planType,
      user: {
        email: user.email,
        profileId: user.profileId,
        userId: user.userId
      },
      expires_at: expirationDate.toISOString()
    };

    console.log('✅ ===== PAGAMENTO PROCESSADO COM SUCESSO =====\n');
    return result;

  } catch (error) {
    console.error('❌ ===== ERRO CRÍTICO AO PROCESSAR PAGAMENTO =====');
    console.error('Erro:', error);
    console.error('Stack:', error.stack);
    throw error;
  }
}

/**
 * Processa reembolso
 */
export async function processRefund(webhookData) {
  try {
    console.log('\n💸 ===== PROCESSANDO REEMBOLSO =====');
    
    const customer = webhookData.data.customer;
    const transaction = webhookData.data;
    const transactionId = transaction.id;
    const amount = transaction.amount;

    console.log('📋 Dados do reembolso:', {
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
    const updateData = {
      plan_type: 'free',
      subscription_status: 'cancelled',
      expires_at: null,
      updated_at: new Date().toISOString()
    };

    // Atualizar profile
    const profileIdToUpdate = user.profileId || user.userId;
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileIdToUpdate);

    if (updateError) {
      console.error('❌ Erro ao cancelar assinatura:', updateError);
    } else {
      console.log('✅ Assinatura cancelada (voltou para free)');
    }

    // Atualizar barbershop
    if (user.userId) {
      const { error: barbershopError } = await supabase
        .from('barbershops')
        .update({ plan_type: 'freemium' })
        .eq('user_id', user.userId);

      if (barbershopError) {
        console.warn('⚠️ Erro ao atualizar barbearia:', barbershopError.message);
      } else {
        console.log('✅ Barbearia atualizada para freemium');
      }
    }

    // Registrar reembolso no histórico
    const historyUserId = user.profileId || user.userId;
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: historyUserId,
        transaction_id: `refund_${transactionId}`,
        amount: -amount,
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

    console.log('✅ ===== REEMBOLSO PROCESSADO COM SUCESSO =====\n');
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
    console.log('\n🚫 ===== PROCESSANDO CANCELAMENTO DE ASSINATURA =====');
    
    const customer = webhookData.data.customer;
    const transaction = webhookData.data;
    const transactionId = transaction.id;

    console.log('📋 Dados do cancelamento:', {
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

    // Cancelar assinatura
    const updateData = {
      plan_type: 'free',
      subscription_status: 'cancelled',
      expires_at: null,
      updated_at: new Date().toISOString()
    };

    // Atualizar profile
    const profileIdToUpdate = user.profileId || user.userId;
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profileIdToUpdate);

    if (updateError) {
      console.error('❌ Erro ao cancelar assinatura:', updateError);
    } else {
      console.log('✅ Assinatura cancelada');
    }

    // Atualizar barbershop
    if (user.userId) {
      const { error: barbershopError } = await supabase
        .from('barbershops')
        .update({ plan_type: 'freemium' })
        .eq('user_id', user.userId);

      if (barbershopError) {
        console.warn('⚠️ Erro ao atualizar barbearia:', barbershopError.message);
      } else {
        console.log('✅ Barbearia atualizada para freemium');
      }
    }

    // Registrar cancelamento no histórico
    const historyUserId = user.profileId || user.userId;
    const { error: historyError } = await supabase
      .from('payment_history')
      .insert({
        user_id: historyUserId,
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

    console.log('✅ ===== CANCELAMENTO PROCESSADO COM SUCESSO =====\n');
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
