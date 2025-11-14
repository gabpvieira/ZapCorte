# Configuração Completa do Webhook Cakto

## ✅ Correções Implementadas

### 1. Registro de Todos os Métodos de Pagamento

O webhook agora registra **TODOS** os tipos de pagamento:

- ✅ **PIX** (instantâneo e automático)
- ✅ **Cartão de Crédito**
- ✅ **Cartão de Débito**
- ✅ **Boleto**
- ✅ **Outros métodos**

### 2. Eventos Suportados

| Evento | Descrição | Ação |
|--------|-----------|------|
| `purchase_approved` | Pagamento aprovado | Ativa plano premium + registra histórico |
| `pix_gerado` / `pix_generated` | PIX gerado | Registra como pendente |
| `boleto_gerado` / `boleto_generated` | Boleto gerado | Registra como pendente |
| `payment_failed` | Pagamento falhou | Registra falha no histórico |
| `refund` | Reembolso | Cancela assinatura + registra |
| `subscription_cancelled` | Assinatura cancelada | Cancela assinatura + registra |

### 3. Estrutura das Tabelas

#### **profiles**
```sql
- id (uuid) - PK
- user_id (uuid) - FK para auth.users
- email (text)
- plan_type (text) - 'free', 'starter', 'pro'
- subscription_status (text) - 'active', 'inactive', 'cancelled', 'expired'
- last_payment_date (timestamp)
- expires_at (timestamp)
- payment_method (text)
```

#### **payment_history**
```sql
- id (uuid) - PK
- user_id (uuid) - Referência ao profiles.id
- transaction_id (text) - UNIQUE
- amount (numeric)
- status (text) - 'pending', 'completed', 'failed', 'refunded', 'cancelled'
- payment_method (text)
- plan_type (text) - 'starter', 'pro'
- cakto_data (jsonb) - Dados completos do webhook
- created_at (timestamp)
```

#### **webhook_logs**
```sql
- id (uuid) - PK
- event_type (text)
- payload (jsonb)
- status (text) - 'pending', 'success', 'failed'
- error_message (text)
- created_at (timestamp)
```

## 🔧 Configuração no Painel Cakto

### 1. URL do Webhook

**Produção:**
```
https://seu-dominio.vercel.app/api/webhooks/cakto
```

**Desenvolvimento (ngrok):**
```
https://abc123.ngrok-free.app/api/webhooks/cakto
```

### 2. Eventos a Selecionar

Marque TODOS os eventos no painel Cakto:
- ✅ purchase_approved
- ✅ pix_gerado
- ✅ boleto_gerado
- ✅ payment_failed
- ✅ refund
- ✅ subscription_cancelled

### 3. Secret do Webhook

Gere um secret seguro e adicione no `.env`:

```env
CAKTO_WEBHOOK_SECRET=seu_secret_aqui
```

## 📊 Fluxo de Pagamento

### PIX
1. Cliente escolhe PIX → `pix_gerado` (status: pending)
2. Cliente paga → `purchase_approved` (status: completed)
3. Usuário vira premium ✅

### Cartão de Crédito
1. Cliente paga → `purchase_approved` (status: completed)
2. Usuário vira premium ✅

### Boleto
1. Cliente gera boleto → `boleto_gerado` (status: pending)
2. Cliente paga → `purchase_approved` (status: completed)
3. Usuário vira premium ✅

### Reembolso
1. Admin faz reembolso → `refund` (status: refunded)
2. Usuário volta para free ❌

## 🧪 Como Testar

### 1. Verificar Logs no Supabase

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

-- Ver histórico de pagamentos
SELECT 
  p.email,
  ph.transaction_id,
  ph.amount,
  ph.status,
  ph.payment_method,
  ph.plan_type,
  ph.created_at
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
ORDER BY ph.created_at DESC;

-- Ver usuários premium
SELECT 
  email,
  plan_type,
  subscription_status,
  payment_method,
  last_payment_date,
  expires_at
FROM profiles
WHERE plan_type != 'free'
ORDER BY last_payment_date DESC;
```

### 2. Testar com cURL

```bash
curl -X POST https://seu-dominio.vercel.app/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_approved",
    "secret": "seu_secret",
    "data": {
      "id": "test-123",
      "customer": {
        "email": "teste@email.com",
        "name": "Cliente Teste"
      },
      "amount": 97,
      "paymentMethod": "pix",
      "status": "approved",
      "offer": {
        "id": "3th8tvh"
      }
    }
  }'
```

### 3. Verificar Resposta Esperada

**Sucesso (200 OK):**
```json
{
  "success": true,
  "planType": "starter",
  "email": "teste@email.com",
  "paymentMethod": "PIX",
  "transactionId": "test-123",
  "processingTime": "245ms"
}
```

**Erro (401 Unauthorized):**
```json
{
  "error": "Assinatura inválida"
}
```

## 🔍 Troubleshooting

### Problema: Webhook não está sendo chamado

**Solução:**
1. Verifique se a URL está correta no painel Cakto
2. Teste a URL manualmente com cURL
3. Verifique os logs do Vercel

### Problema: Pagamento não registra no histórico

**Solução:**
1. Verifique os logs em `webhook_logs`
2. Confirme que o email do cliente existe em `profiles`
3. Verifique se o `transaction_id` não está duplicado

### Problema: Usuário não vira premium

**Solução:**
1. Verifique se o evento é `purchase_approved`
2. Confirme que o `offer_id` está correto (3th8tvh ou 9jk3ref)
3. Verifique se o profile foi atualizado:

```sql
SELECT * FROM profiles WHERE email = 'email@cliente.com';
```

### Problema: PIX não registra

**Solução:**
1. Confirme que o evento `pix_gerado` está marcado no Cakto
2. Verifique se o webhook está recebendo o evento:

```sql
SELECT * FROM webhook_logs WHERE event_type = 'pix_gerado';
```

## 📝 Variáveis de Ambiente Necessárias

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key

# Cakto
CAKTO_WEBHOOK_SECRET=seu_webhook_secret
```

## ✅ Checklist de Configuração

- [ ] Webhook configurado no painel Cakto
- [ ] URL correta (produção ou ngrok)
- [ ] Todos os eventos marcados
- [ ] Secret configurado no `.env`
- [ ] Tabelas criadas no Supabase
- [ ] Teste manual com cURL funcionando
- [ ] Logs aparecendo em `webhook_logs`
- [ ] Pagamento teste registrado em `payment_history`
- [ ] Usuário teste virou premium em `profiles`

## 🎯 Resultado Final

Após a configuração, o sistema irá:

1. ✅ Registrar **todos** os webhooks em `webhook_logs`
2. ✅ Registrar **todos** os pagamentos em `payment_history`
3. ✅ Atualizar usuário para premium em `profiles`
4. ✅ Atualizar barbearia em `barbershops`
5. ✅ Suportar **todos** os métodos de pagamento (PIX, cartão, boleto)
6. ✅ Processar reembolsos e cancelamentos
7. ✅ Registrar pagamentos pendentes (PIX/boleto gerados)

---

**Status:** ✅ Configuração completa e funcional
**Última atualização:** 13/11/2025
