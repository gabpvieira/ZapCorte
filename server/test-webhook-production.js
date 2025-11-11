import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Script de teste para validar webhook em produção
 * Simula o payload real do Cakto
 */

const TEST_EMAIL = 'eugabrieldpv@gmail.com';
const WEBHOOK_URL = 'http://localhost:3001/api/webhooks/cakto';

async function testWebhook() {
  console.log('🧪 ===== TESTE DE WEBHOOK - PRODUÇÃO =====\n');

  // 1. Verificar se usuário existe
  console.log('1️⃣ Verificando se usuário existe no banco...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', TEST_EMAIL)
    .maybeSingle();

  if (profileError) {
    console.error('❌ Erro ao buscar perfil:', profileError);
    return;
  }

  if (!profile) {
    console.error(`❌ Usuário ${TEST_EMAIL} não encontrado no banco!`);
    console.log('   Crie o usuário primeiro antes de testar o webhook.');
    return;
  }

  console.log('✅ Usuário encontrado:', {
    id: profile.id,
    user_id: profile.user_id,
    email: profile.email,
    plan_type: profile.plan_type,
    subscription_status: profile.subscription_status
  });

  // 2. Simular payload real do Cakto (baseado no log real)
  console.log('\n2️⃣ Preparando payload do webhook...');
  
  const webhookPayload = {
    "data": {
      "id": "70ce4c02-f03e-41ad-a8ec-653eb04a5e9a",
      "offer": {
        "id": "3th8tvh",
        "name": "Plano Starter",
        "price": 5
      },
      "amount": 5.99,
      "baseAmount": 5,
      "status": "paid",
      "product": {
        "id": "a9ba0c0b-0dc1-4cee-9811-6e26a14896a6",
        "name": "ZapCorte - Sistema de Agendamento Barbearias",
        "type": "subscription"
      },
      "customer": {
        "name": "Gabriel Paiva",
        "email": TEST_EMAIL,
        "phone": "59966673571",
        "docNumber": "29092558320"
      },
      "paymentMethod": "pix",
      "subscription": {
        "id": "d0225fb9-704d-481e-8161-d21e848b5205",
        "offer": "3th8tvh",
        "status": "active",
        "trial_days": 30
      }
    },
    "event": "purchase_approved",
    "secret": process.env.CAKTO_WEBHOOK_SECRET
  };

  console.log('✅ Payload preparado');

  // 3. Enviar webhook
  console.log('\n3️⃣ Enviando webhook para:', WEBHOOK_URL);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webhookPayload)
    });

    const responseData = await response.json();

    console.log('\n📡 Resposta do servidor:');
    console.log('   Status:', response.status);
    console.log('   Body:', JSON.stringify(responseData, null, 2));

    if (response.status === 200) {
      console.log('\n✅ Webhook processado com sucesso!');
    } else {
      console.log('\n❌ Webhook falhou!');
    }

  } catch (error) {
    console.error('\n❌ Erro ao enviar webhook:', error.message);
    console.log('\n⚠️ Certifique-se de que o servidor está rodando:');
    console.log('   cd server && npm start');
    return;
  }

  // 4. Verificar se perfil foi atualizado
  console.log('\n4️⃣ Verificando se perfil foi atualizado...');
  
  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', TEST_EMAIL)
    .single();

  if (updateError) {
    console.error('❌ Erro ao buscar perfil atualizado:', updateError);
    return;
  }

  console.log('📋 Perfil após webhook:', {
    plan_type: updatedProfile.plan_type,
    subscription_status: updatedProfile.subscription_status,
    last_payment_date: updatedProfile.last_payment_date,
    expires_at: updatedProfile.expires_at
  });

  if (updatedProfile.plan_type === 'starter' && updatedProfile.subscription_status === 'active') {
    console.log('\n✅ ===== TESTE PASSOU! PERFIL ATUALIZADO COM SUCESSO =====');
  } else {
    console.log('\n❌ ===== TESTE FALHOU! PERFIL NÃO FOI ATUALIZADO =====');
  }

  // 5. Verificar histórico de pagamento
  console.log('\n5️⃣ Verificando histórico de pagamento...');
  
  const { data: paymentHistory, error: historyError } = await supabase
    .from('payment_history')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (historyError) {
    console.error('❌ Erro ao buscar histórico:', historyError);
  } else if (paymentHistory && paymentHistory.length > 0) {
    console.log('✅ Histórico de pagamento encontrado:', {
      transaction_id: paymentHistory[0].transaction_id,
      amount: paymentHistory[0].amount,
      status: paymentHistory[0].status,
      plan_type: paymentHistory[0].plan_type
    });
  } else {
    console.log('⚠️ Nenhum histórico de pagamento encontrado');
  }

  console.log('\n🎉 ===== TESTE CONCLUÍDO =====\n');
}

// Executar teste
testWebhook().catch(console.error);
