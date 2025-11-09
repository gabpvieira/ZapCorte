import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import * as caktoService from './caktoService.js';

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

// Webhook do Cakto
app.post('/api/webhooks/cakto', async (req, res) => {
  console.log('\n🔔 Webhook Cakto recebido:', new Date().toISOString());
  console.log('Headers:', req.headers);
  console.log('Body type:', typeof req.body);
  console.log('Body:', req.body);

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
        return res.status(400).json({ error: `Evento não suportado: ${event}` });
    }

    console.log('✅ Webhook processado com sucesso:', result);

    res.status(200).json({
      success: true,
      event: event,
      result: result
    });

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error);
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