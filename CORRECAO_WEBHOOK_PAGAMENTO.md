# 🔧 Correção: Webhook de Pagamento Não Funcionou

## ❌ Problema Identificado

Você fez uma compra do plano Starter com o usuário `zkdigitalbusiness@gmail.com` mas:
- ❌ Nenhum webhook foi registrado na tabela `webhook_logs`
- ❌ O plano não foi ativado automaticamente
- ❌ O pagamento não foi processado

## 🔍 Diagnóstico

### Causa Raiz:
**O servidor backend não está rodando!**

O webhook do Cakto está configurado para enviar para:
```
http://seu-servidor.com/api/webhooks/cakto
```

Mas se o servidor não estiver rodando, o Cakto não consegue entregar o webhook.

---

## ✅ Solução

### Opção 1: Rodar Servidor Localmente (Desenvolvimento)

#### 1. Navegar para a pasta do servidor
```bash
cd server
```

#### 2. Instalar dependências (se necessário)
```bash
npm install
```

#### 3. Configurar variáveis de ambiente
Criar/editar arquivo `.env` na pasta `server`:
```env
# Supabase
SUPABASE_URL=https://ihwkbflhxvdsewifofdk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# Cakto
CAKTO_WEBHOOK_SECRET=8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df
CAKTO_PRODUCT_ID_STARTER=3th8tvh
CAKTO_PRODUCT_ID_PRO=9jk3ref

# Servidor
PORT=3001
```

#### 4. Iniciar o servidor
```bash
npm start
```

Ou usando PowerShell:
```powershell
.\start.ps1
```

#### 5. Expor servidor para internet (ngrok)
```bash
# Instalar ngrok: https://ngrok.com/download
ngrok http 3001
```

Isso vai gerar uma URL pública tipo:
```
https://abc123.ngrok.io
```

#### 6. Configurar webhook no Cakto
Acessar painel do Cakto e configurar webhook URL:
```
https://abc123.ngrok.io/api/webhooks/cakto
```

---

### Opção 2: Deploy em Produção (Recomendado)

#### Plataformas Recomendadas:

**1. Railway.app** (Mais fácil)
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd server
railway up
```

**2. Render.com** (Gratuito)
1. Criar conta em https://render.com
2. New → Web Service
3. Conectar repositório GitHub
4. Configurar:
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Adicionar variáveis de ambiente

**3. Heroku**
```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Criar app
heroku create zapcorte-webhook

# Deploy
cd server
git init
git add .
git commit -m "Deploy webhook server"
heroku git:remote -a zapcorte-webhook
git push heroku main

# Configurar variáveis
heroku config:set SUPABASE_URL=...
heroku config:set SUPABASE_SERVICE_ROLE_KEY=...
heroku config:set CAKTO_WEBHOOK_SECRET=...
```

---

## 🧪 Testar Webhook

### 1. Verificar se servidor está rodando
```bash
curl http://localhost:3001/api/health
```

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2025-11-13T...",
  "service": "ZapCorte Payment Server"
}
```

### 2. Testar webhook manualmente
```bash
curl -X POST http://localhost:3001/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_approved",
    "secret": "8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df",
    "data": {
      "id": "test_123",
      "customer": {
        "email": "zkdigitalbusiness@gmail.com",
        "name": "Gabriel Santos"
      },
      "amount": 29.90,
      "status": "paid",
      "paymentMethod": "pix",
      "offer": {
        "id": "3th8tvh"
      },
      "product": {
        "id": "a9ba0c0b-0dc1-4cee-9811-6e26a14896a6"
      }
    }
  }'
```

### 3. Verificar logs
```bash
# No terminal onde o servidor está rodando
# Deve aparecer:
# 🔔 Webhook Cakto recebido: ...
# ✅ Assinatura validada com sucesso
# 💳 Processando pagamento aprovado...
# ✅ Webhook processado com sucesso
```

### 4. Verificar banco de dados
```sql
-- Verificar webhook_logs
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar se plano foi atualizado
SELECT email, plan_type, subscription_status 
FROM profiles 
WHERE email = 'zkdigitalbusiness@gmail.com';
```

---

## 📋 Checklist de Configuração

### Servidor
- [ ] Servidor instalado (`npm install` na pasta server)
- [ ] Variáveis de ambiente configuradas (`.env`)
- [ ] Servidor rodando (`npm start`)
- [ ] Health check funcionando (`/api/health`)

### Webhook
- [ ] URL pública configurada (ngrok ou deploy)
- [ ] URL configurada no painel do Cakto
- [ ] Secret correto no `.env`
- [ ] Teste manual funcionando

### Banco de Dados
- [ ] Tabela `webhook_logs` existe
- [ ] Tabela `payment_history` existe
- [ ] Tabela `profiles` existe
- [ ] RLS policies configuradas

---

## 🔄 Processar Pagamento Manualmente (Temporário)

Enquanto o webhook não está configurado, você pode ativar o plano manualmente:

```sql
-- Atualizar profile para Starter
UPDATE profiles 
SET 
    plan_type = 'starter',
    subscription_status = 'active',
    last_payment_date = NOW(),
    expires_at = NOW() + INTERVAL '30 days',
    payment_method = 'pix'
WHERE email = 'zkdigitalbusiness@gmail.com';

-- Atualizar barbershop
UPDATE barbershops 
SET plan_type = 'starter'
WHERE user_id = (
    SELECT user_id FROM profiles 
    WHERE email = 'zkdigitalbusiness@gmail.com'
);

-- Registrar pagamento no histórico
INSERT INTO payment_history (
    user_id,
    transaction_id,
    amount,
    status,
    payment_method,
    plan_type,
    created_at
)
SELECT 
    id,
    'manual_' || gen_random_uuid(),
    29.90,
    'completed',
    'pix',
    'starter',
    NOW()
FROM profiles
WHERE email = 'zkdigitalbusiness@gmail.com';
```

---

## 📊 Monitoramento

### Logs do Servidor
```bash
# Ver logs em tempo real
tail -f server/logs/webhook.log

# Ou no terminal onde o servidor está rodando
```

### Logs do Supabase
```sql
-- Ver últimos webhooks recebidos
SELECT 
    event_type,
    status,
    error_message,
    created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Logs do Cakto
Acessar painel do Cakto → Webhooks → Ver tentativas de entrega

---

## 🚨 Problemas Comuns

### 1. Servidor não inicia
**Erro:** `Cannot find module`
**Solução:**
```bash
cd server
rm -rf node_modules
npm install
npm start
```

### 2. Webhook retorna 401/403
**Erro:** `Assinatura inválida`
**Solução:** Verificar se `CAKTO_WEBHOOK_SECRET` está correto no `.env`

### 3. Usuário não encontrado
**Erro:** `Usuário não encontrado para o email`
**Solução:** Verificar se o email do Cakto é o mesmo do cadastro

### 4. Erro ao atualizar profile
**Erro:** `RLS policy violation`
**Solução:** Verificar se está usando `SUPABASE_SERVICE_ROLE_KEY` (não anon key)

---

## 📝 Próximos Passos

1. **Imediato:**
   - [ ] Ativar plano manualmente (SQL acima)
   - [ ] Configurar servidor em produção

2. **Curto Prazo:**
   - [ ] Deploy do servidor (Railway/Render)
   - [ ] Configurar webhook no Cakto
   - [ ] Testar nova compra

3. **Longo Prazo:**
   - [ ] Monitoramento automático
   - [ ] Alertas de falha de webhook
   - [ ] Dashboard de pagamentos

---

## ✅ Resumo

**Problema:** Servidor backend não está rodando
**Solução:** Deploy do servidor + configurar webhook no Cakto
**Temporário:** Ativar plano manualmente via SQL

**Após configurar o servidor, faça uma nova compra para testar!**

---

**Status:** 🔧 Aguardando Configuração do Servidor  
**Última atualização:** 2025-11-13
