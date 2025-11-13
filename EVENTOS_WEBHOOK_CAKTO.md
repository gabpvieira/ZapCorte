# 📡 Eventos do Webhook Cakto

## 🔄 Fluxo Completo de Pagamento PIX

### 1️⃣ PIX Gerado (`pix_gerado`)
**Quando:** Cliente clica em "Pagar com PIX"

**O que acontece:**
- ✅ Cakto gera QR Code do PIX
- ✅ Envia webhook `pix_gerado`
- ✅ Sistema registra em `webhook_logs`
- ⏳ **Não ativa o plano** (aguarda pagamento)

**Ação do Sistema:**
```javascript
{
  success: true,
  message: 'PIX gerado registrado',
  action: 'waiting_payment'
}
```

---

### 2️⃣ Pagamento Aprovado (`purchase_approved`)
**Quando:** Cliente paga o PIX

**O que acontece:**
- ✅ Cakto detecta pagamento
- ✅ Envia webhook `purchase_approved`
- ✅ Sistema registra em `webhook_logs`
- ✅ **Ativa o plano do usuário**
- ✅ Atualiza `profiles` e `barbershops`
- ✅ Registra em `payment_history`

**Ação do Sistema:**
```javascript
{
  success: true,
  planType: 'starter',
  email: 'usuario@email.com'
}
```

**Mudanças no Banco:**
```sql
-- profiles
plan_type = 'starter'
subscription_status = 'active'
last_payment_date = NOW()
expires_at = NOW() + 30 days

-- barbershops
plan_type = 'starter'

-- payment_history
+ novo registro de pagamento
```

---

### 3️⃣ Assinatura Cancelada (`subscription_cancelled`)
**Quando:** Cliente cancela assinatura

**O que acontece:**
- ✅ Envia webhook `subscription_cancelled`
- ✅ Sistema registra em `webhook_logs`
- ✅ **Cancela o plano** (volta para free)
- ✅ Atualiza `profiles`

**Ação do Sistema:**
```javascript
{
  success: true
}
```

**Mudanças no Banco:**
```sql
-- profiles
plan_type = 'free'
subscription_status = 'cancelled'
expires_at = NULL
```

---

### 4️⃣ Reembolso (`refund`)
**Quando:** Pagamento é reembolsado

**O que acontece:**
- ✅ Envia webhook `refund`
- ✅ Sistema registra em `webhook_logs`
- ✅ **Cancela o plano** (volta para free)
- ✅ Atualiza `profiles`

**Ação do Sistema:**
```javascript
{
  success: true
}
```

**Mudanças no Banco:**
```sql
-- profiles
plan_type = 'free'
subscription_status = 'cancelled'
expires_at = NULL
```

---

## 📊 Tabela de Eventos

| Evento | Quando | Ativa Plano? | Registra Log? |
|--------|--------|--------------|---------------|
| `pix_gerado` | QR Code gerado | ❌ Não | ✅ Sim |
| `purchase_approved` | Pagamento confirmado | ✅ Sim | ✅ Sim |
| `subscription_cancelled` | Assinatura cancelada | ❌ Cancela | ✅ Sim |
| `refund` | Reembolso | ❌ Cancela | ✅ Sim |
| Outros | Eventos desconhecidos | ❌ Não | ✅ Sim (ignored) |

---

## 🔍 Como Verificar se Funcionou

### 1. Verificar Webhook Logs
```sql
SELECT 
    event_type,
    status,
    error_message,
    created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Esperado:**
```
event_type          | status  | error_message
--------------------|---------|---------------
pix_gerado          | success | NULL
purchase_approved   | success | NULL
```

### 2. Verificar Plano Ativado
```sql
SELECT 
    email,
    plan_type,
    subscription_status,
    last_payment_date
FROM profiles
WHERE email = 'seu-email@teste.com';
```

**Esperado após pagamento:**
```
email               | plan_type | subscription_status | last_payment_date
--------------------|-----------|---------------------|------------------
seu-email@teste.com | starter   | active              | 2025-11-13 ...
```

### 3. Verificar Histórico de Pagamento
```sql
SELECT 
    transaction_id,
    amount,
    status,
    plan_type,
    created_at
FROM payment_history
WHERE user_id = (
    SELECT id FROM profiles WHERE email = 'seu-email@teste.com'
)
ORDER BY created_at DESC;
```

---

## 🐛 Troubleshooting

### Problema: `pix_gerado` não aparece em webhook_logs

**Possíveis causas:**
1. URL do webhook não está configurada no Cakto
2. Secret está incorreto
3. Webhook não está ativo no Cakto

**Solução:**
1. Verificar URL no Cakto: `https://zapcorte.com.br/api/webhooks/cakto`
2. Verificar Secret: `8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df`
3. Verificar logs do Vercel

---

### Problema: `purchase_approved` não ativa o plano

**Possíveis causas:**
1. Email do Cakto diferente do cadastro
2. Variáveis de ambiente não configuradas no Vercel
3. Erro no processamento

**Solução:**
1. Verificar se email é o mesmo
2. Verificar variáveis no Vercel
3. Ver logs em `webhook_logs` → `error_message`

---

### Problema: Plano não aparece no dashboard

**Possíveis causas:**
1. Cache do navegador
2. Dados não sincronizados

**Solução:**
1. Fazer logout e login novamente
2. Limpar cache (Ctrl+Shift+R)
3. Verificar banco de dados

---

## 📝 Logs Úteis

### Ver últimos webhooks recebidos
```sql
SELECT 
    id,
    event_type,
    status,
    error_message,
    created_at,
    payload->>'data'->>'customer'->>'email' as customer_email
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Ver pagamentos por usuário
```sql
SELECT 
    p.email,
    ph.transaction_id,
    ph.amount,
    ph.plan_type,
    ph.status,
    ph.created_at
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
ORDER BY ph.created_at DESC;
```

---

## ✅ Checklist de Funcionamento

- [ ] Webhook configurado no Cakto
- [ ] URL correta: `https://zapcorte.com.br/api/webhooks/cakto`
- [ ] Secret correto no Cakto
- [ ] Variáveis de ambiente no Vercel
- [ ] Health check funcionando
- [ ] Evento `pix_gerado` registrado
- [ ] Evento `purchase_approved` registrado
- [ ] Plano ativado no banco
- [ ] Plano aparece no dashboard

---

**Status:** ✅ Eventos Configurados  
**Última atualização:** 2025-11-13
