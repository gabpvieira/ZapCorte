/**
 * Script de teste para webhook Cakto - VERSÃO MELHORADA
 * 
 * Uso:
 * node test-webhook.js
 * 
 * Ou com URL customizada:
 * node test-webhook.js https://abc123.ngrok.io
 * 
 * Ou testar plano Pro:
 * node test-webhook.js http://localhost:3001 pro
 */

const baseUrl = process.argv[2] || 'http://localhost:3001';
const planType = process.argv[3] || 'starter';

const productIds = {
  starter: '3th8tvh',
  pro: '9jk3ref'
};

const prices = {
  starter: 29.90,
  pro: 59.90
};

const testData = {
  event: 'purchase_approved',
  secret: '8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df',
  data: {
    id: 'test_' + Date.now(),
    amount: prices[planType],
    status: 'approved',
    paymentMethod: 'pix',
    productId: productIds[planType],
    customer: {
      email: 'carvalhomozeli@gmail.com',
      name: 'Teste Webhook'
    }
  }
};

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║       🧪 TESTE DE WEBHOOK CAKTO - VERSÃO 2.0         ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

console.log('📋 Configuração do Teste:');
console.log('  • URL:', `${baseUrl}/api/webhooks/cakto`);
console.log('  • Plano:', planType.toUpperCase());
console.log('  • Preço:', `R$ ${prices[planType]}`);
console.log('  • Product ID:', productIds[planType]);
console.log('  • Email:', testData.data.customer.email);
console.log('  • Transaction ID:', testData.data.id);
console.log('\n' + '─'.repeat(60) + '\n');

// Teste 1: Health Check
console.log('🏥 Teste 1/3: Health Check...');
fetch(`${baseUrl}/api/health`)
  .then(response => response.json())
  .then(data => {
    console.log('✅ Servidor está online!');
    console.log('   Status:', data.status);
    console.log('   Timestamp:', data.timestamp);
    console.log('\n' + '─'.repeat(60) + '\n');
    
    // Teste 2: Webhook
    console.log('🔔 Teste 2/3: Enviando Webhook...');
    console.log('⏳ Aguarde...\n');
    
    return fetch(`${baseUrl}/api/webhooks/cakto`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
  })
  .then(response => {
    console.log('📊 Status HTTP:', response.status, response.statusText);
    
    if (response.status !== 200) {
      console.log('⚠️  Aviso: Status diferente de 200');
    }
    
    return response.json();
  })
  .then(data => {
    console.log('\n📦 Resposta do Servidor:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n' + '─'.repeat(60) + '\n');
    
    if (data.success) {
      console.log('✅ TESTE 2/3 PASSOU!');
      console.log('🎉 Webhook processado com sucesso!\n');
      
      // Teste 3: Verificação no Supabase
      console.log('🔍 Teste 3/3: Verificação Manual Necessária');
      console.log('\n📋 Execute no Supabase para confirmar:');
      console.log('\n-- Verificar perfil atualizado:');
      console.log('SELECT id, email, plan_type, subscription_status, last_payment_date');
      console.log('FROM profiles');
      console.log(`WHERE email = '${testData.data.customer.email}';`);
      console.log('\n-- Verificar histórico de pagamento:');
      console.log('SELECT *');
      console.log('FROM payment_history');
      console.log(`WHERE transaction_id = '${testData.data.id}';`);
      
      console.log('\n' + '═'.repeat(60));
      console.log('🎯 RESULTADO FINAL: SUCESSO! ✅');
      console.log('═'.repeat(60) + '\n');
      
      console.log('📋 Próximos Passos:');
      console.log('1. ✅ Servidor funcionando');
      console.log('2. ✅ Webhook processando corretamente');
      console.log('3. ⚠️  Verificar dados no Supabase (manual)');
      console.log('4. ⚠️  Configurar URL pública (ngrok/Railway)');
      console.log('5. ⚠️  Configurar webhook na Cakto');
      console.log('6. ⚠️  Fazer pagamento real de teste\n');
      
    } else {
      console.log('❌ TESTE 2/3 FALHOU!');
      console.log('Erro:', data.error || 'Erro desconhecido');
      console.log('\n💡 Verifique:');
      console.log('- Logs do servidor para mais detalhes');
      console.log('- Secret do webhook está correto');
      console.log('- Usuário existe no banco de dados\n');
    }
  })
  .catch(error => {
    console.log('\n' + '═'.repeat(60));
    console.log('❌ ERRO NO TESTE!');
    console.log('═'.repeat(60) + '\n');
    console.error('Mensagem:', error.message);
    console.log('\n🔍 Possíveis Causas:');
    console.log('  • Servidor não está rodando');
    console.log('  • URL incorreta');
    console.log('  • Firewall bloqueando a conexão');
    console.log('  • Porta 3001 não está acessível');
    console.log('\n💡 Soluções:');
    console.log('  1. Verificar se o servidor está rodando:');
    console.log('     cd zap-corte-pro-main/server && npm start');
    console.log('  2. Testar health check manualmente:');
    console.log(`     curl ${baseUrl}/api/health`);
    console.log('  3. Verificar se a porta 3001 está livre:');
    console.log('     netstat -ano | findstr :3001');
    console.log('  4. Verificar firewall do Windows\n');
  });
