# 🔧 Correção do Webhook Cakto - Diagnóstico Completo

## 📋 Problema Identificado

**Usuário de teste:** carvalhomozeli@gmail.com  
**Status atual:** Plano FREE (deveria ser STARTER após pagamento)  
**Histórico de pagamento:** Vazio (webhook não foi recebido)  
**Logs de webhook:** Vazios (nenhum webhook chegou ao servidor)

## 🔍 Análise da Situação

### ✅ O que está funcionando:
1. ✅ Servidor Express configurado corretamente (`server/index.js`)
2. ✅ Serviço Cakto implementado (`server/caktoService.js`)
3. ✅ Tabelas do Supabase criadas (profiles, payment_history, webhook_logs)
4. ✅ Usuário existe no banco: `9b83ed1f-fa8f-497a-9ca9-e0cda5c1f76a`
5. ✅ Credenciais Cakto configuradas no `.env`

### ❌ O que NÃO está funcionando:
1. ❌ Servidor Express NÃO está rodando (porta 3001 não está ativa)
2. ❌ Webhook da Cakto não consegue alcançar o servidor
3. ❌ Nenhum log de webhook no Supabase
4. ❌ Pagamento não foi processado

## 🚨 Problemas Críticos Identificados

### 1. **Servidor Express não está rodando**
O servidor precisa estar ativo 24/7 para receber webhooks. Atualmente está offline.

### 2. **URL do webhook não está acessível publicamente**
O webhook está configurado para `http://localhost:3001/api/webhooks/cakto`, mas:
- `localhost` só funciona na sua máquina local
- A Cakto precisa de uma URL pública (HTTPS)

### 3. **Falta de túnel ou deploy em produção**
Para receber webhooks em desenvolvimento, você precisa de:
- **Opção A:** Usar ngrok/localtunnel para expor localhost
- **Opção B:** Fazer deploy do servidor em produção (Vercel, Railway, etc.)

## 🔧 Soluções

### Solução 1: Usar ngrok (Desenvolvimento/Teste) ⚡ RECOMENDADO

#### Passo 1: Instalar ngrok
```bash
# Baixar em: https://ngrok.com/download
# Ou via chocolatey (Windows):
choco install ngrok

# Ou via npm:
npm install -g ngrok
```

#### Passo 2: Iniciar o servidor Express
```bash
cd zap-corte-pro-main/server
npm start
```

#### Passo 3: Expor o servidor com ngrok
```bash
# Em outro terminal:
ngrok http 3001
```

Você receberá uma URL pública como:
```
https://abc123.ngrok.io
```

#### Passo 4: Configurar webhook na Cakto
1. Acesse o painel da Cakto
2. Vá em Configurações > Webhooks
3. Configure a URL: `https://abc123.ngrok.io/api/webhooks/cakto`
4. Configure o Secret: `8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df`
5. Selecione os eventos:
   - `purchase_approved`
   - `refund`
   - `subscription_cancelled`

#### Passo 5: Testar o webhook
```bash
# Fazer um pagamento de teste na Cakto
# Verificar os logs no terminal do servidor
```

---

### Solução 2: Deploy em Produção (Railway) 🚀 RECOMENDADO PARA PRODUÇÃO

#### Passo 1: Criar conta no Railway
1. Acesse: https://railway.app
2. Faça login com GitHub

#### Passo 2: Fazer deploy do servidor
```bash
# No diretório do servidor:
cd zap-corte-pro-main/server

# Criar arquivo railway.json
```

Criar arquivo `railway.json`:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node index.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Passo 3: Configurar variáveis de ambiente no Railway
```
SUPABASE_URL=https://ihwkbflhxvdsewifofdk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
CAKTO_WEBHOOK_SECRET=8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df
CAKTO_PRODUCT_ID_STARTER=3th8tvh
CAKTO_PRODUCT_ID_PRO=9jk3ref
PORT=3001
```

#### Passo 4: Obter URL pública
Após o deploy, você receberá uma URL como:
```
https://zapcorte-server-production.up.railway.app
```

#### Passo 5: Configurar webhook na Cakto
URL do webhook: `https://zapcorte-server-production.up.railway.app/api/webhooks/cakto`

---

### Solução 3: Deploy na Vercel (Alternativa)

#### Criar arquivo `vercel.json` no diretório `server/`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ],
  "env": {
    "SUPABASE_URL": "@supabase_url",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "CAKTO_WEBHOOK_SECRET": "@cakto_webhook_secret",
    "CAKTO_PRODUCT_ID_STARTER": "@cakto_product_id_starter",
    "CAKTO_PRODUCT_ID_PRO": "@cakto_product_id_pro"
  }
}
```

Deploy:
```bash
cd zap-corte-pro-main/server
vercel --prod
```

---

## 🧪 Como Testar o Webhook

### 1. Verificar se o servidor está rodando
```bash
# Testar health check:
curl http://localhost:3001/api/health

# Ou com ngrok:
curl https://abc123.ngrok.io/api/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "timestamp": "2025-11-10T...",
  "service": "ZapCorte Payment Server"
}
```

### 2. Simular webhook manualmente
```bash
curl -X POST http://localhost:3001/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_approved",
    "secret": "8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df",
    "data": {
      "id": "test_123",
      "amount": 29.90,
      "status": "approved",
      "paymentMethod": "pix",
      "productId": "3th8tvh",
      "customer": {
        "email": "carvalhomozeli@gmail.com",
        "name": "Teste"
      }
    }
  }'
```

### 3. Verificar logs no Supabase
```sql
-- Verificar se o pagamento foi registrado:
SELECT * FROM payment_history 
WHERE user_id = '9b83ed1f-fa8f-497a-9ca9-e0cda5c1f76a';

-- Verificar se o plano foi atualizado:
SELECT plan_type, subscription_status, last_payment_date 
FROM profiles 
WHERE email = 'carvalhomozeli@gmail.com';

-- Verificar logs de webhook:
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🔄 Processar Pagamento Manualmente (Solução Temporária)

Se você precisa ativar o plano AGORA enquanto configura o webhook:

```sql
-- Atualizar perfil para STARTER:
UPDATE profiles 
SET 
  plan_type = 'starter',
  subscription_status = 'active',
  last_payment_date = NOW(),
  expires_at = NOW() + INTERVAL '30 days',
  payment_method = 'pix',
  updated_at = NOW()
WHERE email = 'carvalhomozeli@gmail.com';

-- Registrar pagamento manualmente:
INSERT INTO payment_history (
  user_id,
  transaction_id,
  amount,
  status,
  payment_method,
  plan_type,
  cakto_data,
  created_at
) VALUES (
  '9b83ed1f-fa8f-497a-9ca9-e0cda5c1f76a',
  'manual_test_' || NOW()::text,
  5.00,
  'completed',
  'pix',
  'starter',
  '{"manual": true, "note": "Pagamento de teste processado manualmente"}'::jsonb,
  NOW()
);
```

---

## 📊 Checklist de Verificação

- [ ] Servidor Express rodando na porta 3001
- [ ] ngrok ou Railway configurado e rodando
- [ ] URL pública do webhook configurada na Cakto
- [ ] Secret do webhook configurado corretamente
- [ ] Eventos selecionados na Cakto (purchase_approved, refund, subscription_cancelled)
- [ ] Health check respondendo corretamente
- [ ] Teste manual do webhook funcionando
- [ ] Logs aparecendo no terminal do servidor
- [ ] Dados sendo salvos no Supabase

---

## 🐛 Logs e Debugging

### Ver logs do servidor em tempo real:
```bash
cd zap-corte-pro-main/server
npm start
```

### Logs importantes a observar:
```
🚀 Servidor ZapCorte rodando na porta 3001
📡 Webhook URL: http://localhost:3001/api/webhooks/cakto
🔔 Webhook Cakto recebido: [timestamp]
✅ Assinatura validada com sucesso
💳 Processando pagamento aprovado...
✅ Perfil atualizado para starter
✅ Histórico de pagamento salvo
```

---

## 📞 Próximos Passos

1. **URGENTE:** Iniciar o servidor Express
2. **URGENTE:** Configurar ngrok ou fazer deploy
3. **URGENTE:** Atualizar URL do webhook na Cakto
4. Testar com um novo pagamento
5. Verificar logs e dados no Supabase
6. Processar manualmente o pagamento do teste anterior (se necessário)

---

## 💡 Dicas Importantes

1. **ngrok gratuito:** A URL muda toda vez que você reinicia. Para URL fixa, use plano pago ou Railway.
2. **Railway:** Oferece 500 horas grátis por mês, suficiente para testes.
3. **Logs:** Sempre monitore os logs do servidor ao testar webhooks.
4. **Teste local primeiro:** Use curl para testar antes de configurar na Cakto.
5. **Backup:** Sempre faça backup dos dados antes de processar manualmente.

---

## 🆘 Suporte

Se continuar com problemas:
1. Verifique os logs do servidor
2. Verifique os logs da Cakto (painel de webhooks)
3. Teste o health check
4. Verifique se a URL está acessível publicamente
5. Confirme que o secret está correto
