/**
 * Script de teste para OneSignal API
 * Execute: node test-onesignal.js
 */

const ONESIGNAL_APP_ID = '4b3e5d19-c380-453a-b727-ed1cd29e1d8a';
const ONESIGNAL_REST_API_KEY = '39bdb513-4d7a-4ccb-ac2c-443c988603d8';

// Player ID de teste (você precisa obter um real após ativar notificações)
const TEST_PLAYER_ID = 'test-player-id';

async function testOneSignalAPI() {
  console.log('🧪 Testando OneSignal API...\n');
  
  console.log('🔑 Informações de Autenticação:');
  console.log('App ID:', ONESIGNAL_APP_ID);
  console.log('REST API Key:', ONESIGNAL_REST_API_KEY);
  console.log('Formato da Key:', ONESIGNAL_REST_API_KEY.length, 'caracteres');
  console.log('Começa com:', ONESIGNAL_REST_API_KEY.substring(0, 10) + '...');
  console.log('\n');

  const payload = {
    app_id: ONESIGNAL_APP_ID,
    include_player_ids: [TEST_PLAYER_ID],
    headings: { en: '🎉 Teste de Notificação', pt: '🎉 Teste de Notificação' },
    contents: { 
      en: 'Esta é uma notificação de teste do ZapCorte!',
      pt: 'Esta é uma notificação de teste do ZapCorte!'
    },
    url: 'https://zapcorte.vercel.app/dashboard',
    chrome_web_icon: 'https://zapcorte.vercel.app/zapcorte-icon.png',
    priority: 10,
  };

  console.log('📤 Enviando notificação...');
  console.log('Player ID:', TEST_PLAYER_ID);
  console.log('\n');

  try {
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro na API:');
      console.error('Status:', response.status);
      console.error('Resposta:', JSON.stringify(data, null, 2));
      
      if (data.errors) {
        console.error('\n📋 Erros detalhados:');
        data.errors.forEach(error => {
          console.error(`  - ${error}`);
        });
      }
      
      return false;
    }

    console.log('✅ Notificação enviada com sucesso!');
    console.log('\n📊 Resposta da API:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.recipients === 0) {
      console.log('\n⚠️  ATENÇÃO: 0 destinatários receberam a notificação');
      console.log('Isso significa que o Player ID não é válido ou o usuário não está inscrito.');
      console.log('\nPara obter um Player ID válido:');
      console.log('1. Acesse: http://localhost:5173/dashboard/notifications');
      console.log('2. Clique em "Ativar Notificações"');
      console.log('3. Permita notificações no navegador');
      console.log('4. Copie o Player ID que aparece na página');
      console.log('5. Substitua TEST_PLAYER_ID neste script');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao fazer requisição:');
    console.error(error.message);
    return false;
  }
}

// Executar teste
testOneSignalAPI().then(success => {
  console.log('\n' + '='.repeat(50));
  if (success) {
    console.log('✅ Teste concluído com sucesso!');
  } else {
    console.log('❌ Teste falhou. Verifique os erros acima.');
  }
  console.log('='.repeat(50));
});
