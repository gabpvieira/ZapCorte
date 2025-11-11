/**
 * Script de teste para subscription
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testSubscription() {
  const barbershopId = '54f0a086-a7f7-46b9-bf96-f658940c8ae8';
  
  // Dados de teste
  const testSubscription = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/test123',
    expirationTime: null,
    keys: {
      p256dh: 'test-p256dh-key',
      auth: 'test-auth-key'
    }
  };

  const deviceInfo = {
    type: 'desktop',
    browser: 'chrome',
    platform: 'Win32',
    isMobile: false,
    isTablet: false
  };

  console.log('🧪 Testando inserção de subscription...');

  // Tentar inserir
  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({
      barbershop_id: barbershopId,
      subscription: testSubscription,
      device_info: deviceInfo,
      user_agent: 'Test User Agent',
      is_active: true,
      last_used_at: new Date().toISOString()
    })
    .select();

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log('✅ Subscription inserida:', data);

  // Buscar subscriptions
  const { data: subscriptions, error: selectError } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('barbershop_id', barbershopId);

  if (selectError) {
    console.error('❌ Erro ao buscar:', selectError);
    return;
  }

  console.log('📱 Subscriptions encontradas:', subscriptions.length);
  console.log(subscriptions);
}

testSubscription().then(() => {
  console.log('✅ Teste concluído');
  process.exit(0);
}).catch(err => {
  console.error('❌ Erro no teste:', err);
  process.exit(1);
});
