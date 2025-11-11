import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import * as caktoService from './caktoService.js';
import * as pushService from './pushNotifications.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuração do Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'ZapCorte Payment Server'
  });
});

// Rota para obter informações dos planos
app.get('/api/plans', (req, res) => {
  res.json({
    starter: {
      name: 'Starter',
      price: 29.90,
      checkoutUrl: `https://pay.cakto.com.br/${process.env.CAKTO_PRODUCT_ID_STARTER}`
    },
    pro: {
      name: 'Pro', 
      price: 59.90,
      checkoutUrl: `https://pay.cakto.com.br/${process.env.CAKTO_PRODUCT_ID_PRO}`
    }
  });
});

// Rota para enviar notificação de teste
app.post('/api/send-notification', async (req, res) => {
  console.log('📨 Requisição de notificação recebida:', req.body);

  try {
    const { barbershopId, customerName, scheduledAt, serviceName } = req.body;

    if (!barbershopId) {
      return res.status(400).json({ error: 'barbershopId é obrigatório' });
    }

    // Buscar subscription da barbearia
    const { data: barbershop, error } = await supabase
      .from('barbershops')
      .select('push_subscription, push_enabled')
      .eq('id', barbershopId)
      .single();

    if (error || !barbershop) {
      console.error('Erro ao buscar barbearia:', error);
      return res.status(404).json({ error: 'Barbearia não encontrada' });
    }

    if (!barbershop.push_enabled || !barbershop.push_subscription) {
      return res.status(400).json({ error: 'Notificações não estão habilitadas' });
    }

    // Enviar notificação
    let result;
    if (customerName && scheduledAt && serviceName) {
      // Notificação de agendamento
      result = await pushService.sendNewAppointmentNotification(
        barbershop.push_subscription,
        { customerName, scheduledAt, serviceName }
      );
    } else {
      // Notificação de teste
      result = await pushService.sendTestNotification(barbershop.push_subscription);
    }

    if (result.success) {
      // Registrar no histórico
      await supabase.from('push_notifications').insert({
        barbershop_id: barbershopId,
        title: customerName ? '🎉 Novo Agendamento!' : '✅ Notificação de Teste',
        body: customerName 
          ? `${customerName} agendou ${serviceName}` 
          : 'Suas notificações estão funcionando!',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      return res.json({ success: true, message: 'Notificação enviada com sucesso' });
    } else {
      return res.status(500).json({ error: 'Falha ao enviar notificação', details: result.error });
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor', message: error.message });
  }
});

// Webhook do Cakto
app.post('/api/webhooks/cakto', async (req, res) => {
  console.log('\n🔔 Webhook Cakto recebido:', new Date().toISOString());
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  console.log('Body:', req.body);

  // Salvar log no Supabase
  const logWebhook = async (eventType, payload, status, errorMessage = null) => {
    try {
      await supabase.from('webhook_logs').insert({
        event_type: eventType || 'unknown',
        payload: payload,
        status: status,
        error_message: errorMessage
      });
    } catch (err) {
      console.error('Erro ao salvar log de webhook:', err);
    }
  };

  try {
    let webhookData;

    // Verificar se o body é um Buffer e converter
    if (Buffer.isBuffer(req.body)) {
      console.log('📦 Convertendo Buffer para string...');
      const bodyString = req.body.toString('utf8');
      console.log('String convertida:', bodyString);
      webhookData = JSON.parse(bodyString);
    } else if (typeof req.body === 'object') {
      webhookData = req.body;
    } else {
      console.log('📝 Parseando JSON do body string...');
      webhookData = JSON.parse(req.body);
    }

    console.log('📋 Dados do webhook parseados:', JSON.stringify(webhookData, null, 2));

    // Validação de assinatura
    let signatureValid = false;
    let validationMethod = '';

    // Método 1: Verificar headers
    const signature = req.headers['x-cakto-signature'] || req.headers['x-signature'];
    if (signature) {
      console.log('🔐 Tentando validação por header...');
      signatureValid = caktoService.validateWebhookSignature(req.body, signature);
      validationMethod = 'header';
    }

    // Método 2: Verificar secret no JSON (fallback)
    if (!signatureValid && webhookData.secret) {
      console.log('🔐 Header não encontrado, tentando validação por secret no JSON...');
      if (webhookData.secret === process.env.CAKTO_WEBHOOK_SECRET) {
        signatureValid = true;
        validationMethod = 'json_secret';
      }
    }

    if (!signatureValid) {
      console.log('❌ Assinatura do webhook inválida');
      console.log('Secret esperado:', process.env.CAKTO_WEBHOOK_SECRET);
      console.log('Secret recebido:', webhookData.secret);
      await logWebhook(webhookData.event, webhookData, 'failed', 'Assinatura inválida');
      return res.status(400).json({ error: 'Assinatura inválida' });
    }

    console.log(`✅ Assinatura validada com sucesso (método: ${validationMethod})`);

    // Processar evento
    const event = webhookData.event;
    let result;

    switch (event) {
      case 'purchase_approved':
        console.log('💳 Processando pagamento aprovado...');
        result = await caktoService.processPaymentApproved(webhookData);
        break;

      case 'refund':
        console.log('💸 Processando reembolso...');
        result = await caktoService.processRefund(webhookData);
        break;

      case 'subscription_cancelled':
        console.log('🚫 Processando cancelamento de assinatura...');
        result = await caktoService.processSubscriptionCancelled(webhookData);
        break;

      default:
        console.log(`⚠️ Evento não suportado: ${event}`);
        await logWebhook(event, webhookData, 'failed', `Evento não suportado: ${event}`);
        return res.status(400).json({ error: `Evento não suportado: ${event}` });
    }

    console.log('✅ Webhook processado com sucesso:', result);
    await logWebhook(event, webhookData, 'success');

    res.status(200).json({
      success: true,
      event: event,
      result: result
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
    await logWebhook('error', req.body, 'failed', error.message);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor ZapCorte rodando na porta ${PORT}`);
  console.log(`📡 Webhook URL: http://localhost:${PORT}/api/webhooks/cakto`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Plans API: http://localhost:${PORT}/api/plans`);
});