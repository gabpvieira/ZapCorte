import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Script para validar se um usuário está pronto para receber webhooks
 */

const EMAIL = process.argv[2] || 'eugabrieldpv@gmail.com';

async function validateUser() {
  console.log('🔍 ===== VALIDAÇÃO DE USUÁRIO =====\n');
  console.log(`📧 Email: ${EMAIL}\n`);

  // 1. Verificar se existe na tabela profiles
  console.log('1️⃣ Verificando tabela profiles...');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', EMAIL)
    .maybeSingle();

  if (profileError) {
    console.error('❌ Erro ao buscar profile:', profileError);
    return;
  }

  if (!profile) {
    console.error(`❌ Usuário não encontrado na tabela profiles!`);
    console.log('\n💡 Solução: Criar usuário primeiro no sistema');
    return;
  }

  console.log('✅ Profile encontrado:');
  console.log('   - ID:', profile.id);
  console.log('   - User ID:', profile.user_id);
  console.log('   - Email:', profile.email);
  console.log('   - Nome:', profile.full_name);
  console.log('   - Plano:', profile.plan_type);
  console.log('   - Status:', profile.subscription_status);

  // 2. Verificar se existe no auth.users
  console.log('\n2️⃣ Verificando auth.users...');
  if (profile.user_id) {
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.user_id);
    
    if (authError) {
      console.warn('⚠️ Erro ao buscar auth.users:', authError.message);
    } else if (authUser) {
      console.log('✅ Usuário encontrado no auth.users');
      console.log('   - ID:', authUser.user.id);
      console.log('   - Email:', authUser.user.email);
    }
  } else {
    console.log('ℹ️ Profile não tem user_id vinculado');
  }

  // 3. Verificar barbearia
  console.log('\n3️⃣ Verificando barbearia...');
  if (profile.user_id) {
    const { data: barbershop, error: barbershopError } = await supabase
      .from('barbershops')
      .select('*')
      .eq('user_id', profile.user_id)
      .maybeSingle();

    if (barbershopError) {
      console.warn('⚠️ Erro ao buscar barbearia:', barbershopError.message);
    } else if (barbershop) {
      console.log('✅ Barbearia encontrada:');
      console.log('   - ID:', barbershop.id);
      console.log('   - Nome:', barbershop.name);
      console.log('   - Slug:', barbershop.slug);
      console.log('   - Plano:', barbershop.plan_type);
    } else {
      console.log('ℹ️ Nenhuma barbearia encontrada para este usuário');
    }
  }

  // 4. Verificar histórico de pagamentos
  console.log('\n4️⃣ Verificando histórico de pagamentos...');
  const { data: payments, error: paymentsError } = await supabase
    .from('payment_history')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (paymentsError) {
    console.warn('⚠️ Erro ao buscar histórico:', paymentsError.message);
  } else if (payments && payments.length > 0) {
    console.log(`✅ ${payments.length} pagamento(s) encontrado(s):`);
    payments.forEach((payment, index) => {
      console.log(`\n   Pagamento ${index + 1}:`);
      console.log('   - Transaction ID:', payment.transaction_id);
      console.log('   - Valor:', payment.amount);
      console.log('   - Status:', payment.status);
      console.log('   - Plano:', payment.plan_type);
      console.log('   - Data:', payment.created_at);
    });
  } else {
    console.log('ℹ️ Nenhum pagamento encontrado');
  }

  // 5. Verificar webhooks recebidos
  console.log('\n5️⃣ Verificando webhooks recebidos...');
  const { data: webhooks, error: webhooksError } = await supabase
    .from('webhook_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (webhooksError) {
    console.warn('⚠️ Erro ao buscar webhooks:', webhooksError.message);
  } else if (webhooks && webhooks.length > 0) {
    console.log(`✅ ${webhooks.length} webhook(s) recebido(s):`);
    webhooks.forEach((webhook, index) => {
      console.log(`\n   Webhook ${index + 1}:`);
      console.log('   - Evento:', webhook.event_type);
      console.log('   - Status:', webhook.status);
      console.log('   - Data:', webhook.created_at);
      if (webhook.error_message) {
        console.log('   - Erro:', webhook.error_message);
      }
    });
  } else {
    console.log('ℹ️ Nenhum webhook recebido ainda');
  }

  // 6. Resumo e recomendações
  console.log('\n📊 ===== RESUMO =====\n');

  const checks = {
    profile: !!profile,
    authUser: !!profile.user_id,
    ready: !!profile && !!profile.user_id
  };

  if (checks.ready) {
    console.log('✅ Usuário está PRONTO para receber webhooks!');
    console.log('\n📋 Próximos passos:');
    console.log('   1. Configurar webhook no Cakto');
    console.log('   2. URL: https://seu-dominio.com/api/webhooks/cakto');
    console.log('   3. Secret:', process.env.CAKTO_WEBHOOK_SECRET);
    console.log('   4. Fazer compra de teste');
    console.log('   5. Verificar se perfil foi atualizado');
  } else {
    console.log('⚠️ Usuário NÃO está pronto para receber webhooks');
    console.log('\n🔧 Problemas encontrados:');
    if (!checks.profile) {
      console.log('   ❌ Profile não existe');
    }
    if (!checks.authUser) {
      console.log('   ❌ user_id não está vinculado');
    }
  }

  console.log('\n🎉 ===== VALIDAÇÃO CONCLUÍDA =====\n');
}

// Executar validação
validateUser().catch(console.error);
