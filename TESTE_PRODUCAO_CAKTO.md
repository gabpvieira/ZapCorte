# Teste em Produção - Webhook Cakto

## 🎯 Objetivo
Testar o webhook do Cakto em produção usando o usuário real do sistema.

## 👤 Usuário de Teste
- **Email:** zkdigitalbusiness@gmail.com
- **ID:** 4c086d04-b3ca-41af-8ce9-e11438335b4f
- **User ID:** 79f840f4-e75c-4e56-ac70-0ba47cce0267
- **Plano Atual:** free
- **Status:** inactive

## 🔧 Configuração Atual

### Variáveis no Vercel (Confirmadas)
✅ `CAKTO_WEBHOOK_SECRET` - Configurado  
✅ `CAKTO_PRODUCT_ID_STARTER` - Configurado  
✅ `CAKTO_PRODUCT_ID_PRO` - Configurado  
✅ `SUPABASE_URL` - Configurado  
✅ `SUPABASE_SERVICE_ROLE_KEY` - Configurado  

### URL do Webhook
```
https://www.zapcorte.com.br/api/webhooks/cakto
```

## 📝 Passo a Passo do Teste

### 1. Acessar Painel Cakto
1. Login em: https://app.cakto.com.br
2. Menu **Apps** → **Webhooks**

### 2. Verificar/Criar Webhook
- **URL:** `https://www.zapcorte.com.br/api/webhooks/cakto`
- **Secret:** (usar o mesmo configurado no Vercel)
- **Eventos marcados:**
  - ✅ purchase_approved
  - ✅ pix_generated
  - ✅ boleto_generated
  - ✅ purchase_refunded
  - ✅ subscription_cancelled

### 3. Enviar Evento de Teste

#### Opção A: Teste do Painel Cakto
1. Clicar nos 3 pontinhos do webhook
2. Selecionar **Enviar evento de teste**
3. Escolher evento: **purchase_approved**
4. Modificar o JSON para usar o email correto:

```json
{
  "event": "purchase_approved",
  "data": {
    "customer": {
      "email": "zkdigitalbusiness@gmail.com",
      "name": "ZK Digital Business"
    },
    "product": {
      "id": "3th8tvh"
    },
    "amount": 97,
    "paymentMethod": "pix"
  }
}
```

5. Enviar

#### Opção B: Teste Manual com PowerShell
```powershell
$body = @{
    event = "purchase_approved"
    secret = "SEU_SECRET_AQUI"
    data = @{
        id = "test-prod-001"
        customer = @{
            email = "zkdigitalbusiness@gmail.com"
            name = "ZK Digital Business"
            phone = "11999999999"
        }
        product = @{
            id = "3th8tvh"
            name = "Plano Starter"
        }
        amount = 97
        status = "approved"
        paymentMethod = "pix"
        createdAt = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "https://www.zapcorte.com.br/api/webhooks/cakto" -Method POST -Body $body -ContentType "application/json"
    Write-Output "✅ Sucesso!"
    Write-Output ($response | ConvertTo-Json)
} catch {
    Write-Output "❌ Erro: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Output "Detalhes: $($_.ErrorDetails.Message)"
    }
}
```

### 4. Verificar Resultados

#### A. Verificar Webhook Logs
```sql
-- Último webhook recebido
SELECT 
  id,
  event_type,
  status,
  error_message,
  created_at,
  payload->>'data' as dados
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- `event_type`: "purchase_approved"
- `status`: "success"
- `error_message`: null

#### B. Verificar Payment History
```sql
-- Último pagamento registrado
SELECT 
  ph.id,
  ph.transaction_id,
  ph.amount,
  ph.status,
  ph.payment_method,
  ph.plan_type,
  ph.created_at,
  p.email
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE p.email = 'zkdigitalbusiness@gmail.com'
ORDER BY ph.created_at DESC
LIMIT 1;
```

**Resultado esperado:**
- `status`: "completed"
- `payment_method`: "PIX"
- `plan_type`: "starter"
- `amount`: 97

#### C. Verificar Profile Atualizado
```sql
-- Verificar se usuário virou premium
SELECT 
  email,
  plan_type,
  subscription_status,
  payment_method,
  last_payment_date,
  expires_at
FROM profiles
WHERE email = 'zkdigitalbusiness@gmail.com';
```

**Resultado esperado:**
- `plan_type`: "starter" (mudou de "free")
- `subscription_status`: "active" (mudou de "inactive")
- `payment_method`: "PIX"
- `last_payment_date`: data atual
- `expires_at`: data atual + 30 dias

#### D. Verificar Barbershop Atualizada
```sql
-- Verificar se barbearia foi atualizada
SELECT 
  b.id,
  b.name,
  b.plan_type,
  b.user_id
FROM barbershops b
WHERE b.user_id = '79f840f4-e75c-4e56-ac70-0ba47cce0267';
```

**Resultado esperado:**
- `plan_type`: "starter" (mudou de "freemium")

## 🧪 Cenários de Teste

### Teste 1: PIX Gerado + Aprovado

#### 1.1 Enviar PIX Gerado
```json
{
  "event": "pix_generated",
  "secret": "seu_secret",
  "data": {
    "id": "pix-test-001",
    "customer": {
      "email": "zkdigitalbusiness@gmail.com",
      "name": "ZK Digital Business"
    },
    "product": {
      "id": "3th8tvh"
    },
    "amount": 97,
    "status": "waiting_payment",
    "paymentMethod": "pix"
  }
}
```

**Verificar:**
```sql
SELECT * FROM payment_history 
WHERE transaction_id = 'pix-test-001';
-- Deve ter status = 'pending'
```

#### 1.2 Enviar Pagamento Aprovado
```json
{
  "event": "purchase_approved",
  "secret": "seu_secret",
  "data": {
    "id": "pix-test-001",
    "customer": {
      "email": "zkdigitalbusiness@gmail.com",
      "name": "ZK Digital Business"
    },
    "product": {
      "id": "3th8tvh"
    },
    "amount": 97,
    "status": "approved",
    "paymentMethod": "pix"
  }
}
```

**Verificar:**
```sql
-- Deve ter 2 registros com mesmo transaction_id
SELECT * FROM payment_history 
WHERE transaction_id = 'pix-test-001'
ORDER BY created_at;

-- Usuário deve estar premium
SELECT plan_type, subscription_status 
FROM profiles 
WHERE email = 'zkdigitalbusiness@gmail.com';
```

### Teste 2: Cartão de Crédito (Direto)
```json
{
  "event": "purchase_approved",
  "secret": "seu_secret",
  "data": {
    "id": "card-test-001",
    "customer": {
      "email": "zkdigitalbusiness@gmail.com",
      "name": "ZK Digital Business"
    },
    "product": {
      "id": "9jk3ref"
    },
    "amount": 147,
    "status": "approved",
    "paymentMethod": "credit_card"
  }
}
```

**Verificar:**
```sql
SELECT plan_type FROM profiles 
WHERE email = 'zkdigitalbusiness@gmail.com';
-- Deve ser 'pro'
```

### Teste 3: Reembolso
```json
{
  "event": "purchase_refunded",
  "secret": "seu_secret",
  "data": {
    "id": "refund-test-001",
    "customer": {
      "email": "zkdigitalbusiness@gmail.com",
      "name": "ZK Digital Business"
    },
    "product": {
      "id": "3th8tvh"
    },
    "amount": 97,
    "paymentMethod": "pix"
  }
}
```

**Verificar:**
```sql
SELECT plan_type, subscription_status 
FROM profiles 
WHERE email = 'zkdigitalbusiness@gmail.com';
-- Deve voltar para 'free' e 'cancelled'
```

## 📊 Dashboard de Monitoramento

### Query Completa de Status
```sql
-- Status completo do usuário de teste
SELECT 
  'Profile' as tabela,
  p.email,
  p.plan_type,
  p.subscription_status,
  p.payment_method,
  p.last_payment_date,
  p.expires_at
FROM profiles p
WHERE p.email = 'zkdigitalbusiness@gmail.com'

UNION ALL

SELECT 
  'Barbershop' as tabela,
  p.email,
  b.plan_type,
  NULL as subscription_status,
  NULL as payment_method,
  NULL as last_payment_date,
  NULL as expires_at
FROM barbershops b
JOIN profiles p ON p.user_id = b.user_id
WHERE p.email = 'zkdigitalbusiness@gmail.com';
```

### Últimos 5 Webhooks
```sql
SELECT 
  event_type,
  status,
  error_message,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 5;
```

### Histórico de Pagamentos do Usuário
```sql
SELECT 
  ph.transaction_id,
  ph.amount,
  ph.status,
  ph.payment_method,
  ph.plan_type,
  ph.created_at
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE p.email = 'zkdigitalbusiness@gmail.com'
ORDER BY ph.created_at DESC;
```

## ✅ Checklist de Validação

Após cada teste, verificar:

- [ ] Webhook aparece em `webhook_logs` com status "success"
- [ ] Pagamento registrado em `payment_history`
- [ ] Profile atualizado em `profiles`
- [ ] Barbershop atualizada em `barbershops`
- [ ] Campos corretos:
  - [ ] `plan_type` correto
  - [ ] `subscription_status` = "active"
  - [ ] `payment_method` registrado
  - [ ] `expires_at` calculado (30 dias)
  - [ ] `last_payment_date` preenchido

## 🐛 Problemas Comuns

### 1. Erro 500 - FUNCTION_INVOCATION_FAILED
**Causa:** Variáveis de ambiente não configuradas ou código com erro

**Solução:**
1. Verificar logs do Vercel: `vercel logs --follow`
2. Confirmar variáveis no painel Vercel
3. Fazer redeploy se necessário

### 2. Webhook não registra
**Causa:** URL incorreta ou secret inválido

**Solução:**
1. Confirmar URL no painel Cakto
2. Verificar secret (sem espaços extras)
3. Testar URL manualmente

### 3. Usuário não vira premium
**Causa:** Email não encontrado ou product_id incorreto

**Solução:**
1. Confirmar email existe: `SELECT * FROM profiles WHERE email = 'zkdigitalbusiness@gmail.com'`
2. Verificar product_id nas variáveis de ambiente
3. Ver logs em `webhook_logs` para identificar erro

## 📞 Próximos Passos

1. ✅ Fazer deploy do código atualizado
2. ✅ Confirmar variáveis no Vercel
3. ✅ Enviar teste do painel Cakto
4. ✅ Verificar logs no Supabase
5. ✅ Validar que usuário virou premium
6. ✅ Testar com pagamento real (opcional)

---

**Status:** Pronto para teste  
**Última atualização:** 13/11/2025
