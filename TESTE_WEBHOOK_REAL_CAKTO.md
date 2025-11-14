# 🧪 Testes Reais do Webhook Cakto em Produção

## 🌐 URL de Produção
```
https://www.zapcorte.com.br/api/webhooks/cakto
```

## 📋 Pré-requisitos

1. ✅ Webhook configurado no painel Cakto
2. ✅ Variáveis de ambiente configuradas no Vercel
3. ✅ Usuário cadastrado no sistema com email válido

---

## 🧪 Teste 1: PIX Gerado (Pendente)

### Comando cURL

```bash
curl -X POST https://www.zapcorte.com.br/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -H "User-Agent: Cakto-Webhook/1.0" \
  -d '{
    "event": "pix_gerado",
    "secret": "SEU_SECRET_AQUI",
    "data": {
      "id": "test-pix-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste PIX Produção",
        "phone": "11999999999",
        "docNumber": "12345678900"
      },
      "amount": 97,
      "paymentMethod": "pix",
      "status": "waiting_payment",
      "offer": {
        "id": "3th8tvh",
        "name": "Plano Starter"
      },
      "pixQrCode": "00020126580014br.gov.bcb.pix...",
      "pixCopyPaste": "00020126580014br.gov.bcb.pix..."
    }
  }'
```

### Resposta Esperada (200 OK)

```json
{
  "success": true,
  "message": "PIX gerado registrado",
  "email": "seu-email@cadastrado.com",
  "transactionId": "test-pix-001",
  "processingTime": "156ms"
}
```

### Verificar no Supabase

```sql
-- Ver webhook recebido
SELECT * FROM webhook_logs 
WHERE event_type = 'pix_gerado' 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver pagamento pendente
SELECT * FROM payment_history 
WHERE transaction_id = 'test-pix-001';
```

---

## 🧪 Teste 2: Pagamento Aprovado (PIX)

### Comando cURL

```bash
curl -X POST https://www.zapcorte.com.br/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -H "User-Agent: Cakto-Webhook/1.0" \
  -d '{
    "event": "purchase_approved",
    "secret": "SEU_SECRET_AQUI",
    "data": {
      "id": "test-pix-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste PIX Produção",
        "phone": "11999999999",
        "docNumber": "12345678900"
      },
      "amount": 97,
      "paymentMethod": "pix",
      "status": "approved",
      "offer": {
        "id": "3th8tvh",
        "name": "Plano Starter"
      },
      "approvedAt": "2025-11-13T15:30:00Z"
    }
  }'
```

### Resposta Esperada (200 OK)

```json
{
  "success": true,
  "planType": "starter",
  "email": "seu-email@cadastrado.com",
  "paymentMethod": "PIX",
  "transactionId": "test-pix-001",
  "processingTime": "234ms"
}
```

### Verificar no Supabase

```sql
-- Ver pagamento aprovado
SELECT * FROM payment_history 
WHERE transaction_id = 'test-pix-001' 
AND status = 'completed';

-- Ver usuário premium
SELECT 
  email,
  plan_type,
  subscription_status,
  payment_method,
  last_payment_date,
  expires_at
FROM profiles 
WHERE email = 'seu-email@cadastrado.com';

-- Ver barbearia atualizada
SELECT 
  b.name,
  b.plan_type,
  p.email
FROM barbershops b
JOIN users u ON u.id = b.user_id
JOIN profiles p ON p.user_id = u.id
WHERE p.email = 'seu-email@cadastrado.com';
```

---

## 🧪 Teste 3: Cartão de Crédito (Plano Pro)

### Comando cURL

```bash
curl -X POST https://www.zapcorte.com.br/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -H "User-Agent: Cakto-Webhook/1.0" \
  -d '{
    "event": "purchase_approved",
    "secret": "SEU_SECRET_AQUI",
    "data": {
      "id": "test-card-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste Cartão Produção",
        "phone": "11999999999",
        "docNumber": "12345678900"
      },
      "amount": 147,
      "paymentMethod": "credit_card",
      "status": "approved",
      "offer": {
        "id": "9jk3ref",
        "name": "Plano Pro"
      },
      "card": {
        "brand": "visa",
        "lastDigits": "1234"
      },
      "approvedAt": "2025-11-13T15:35:00Z"
    }
  }'
```

### Resposta Esperada (200 OK)

```json
{
  "success": true,
  "planType": "pro",
  "email": "seu-email@cadastrado.com",
  "paymentMethod": "Cartão de Crédito",
  "transactionId": "test-card-001",
  "processingTime": "198ms"
}
```

---

## 🧪 Teste 4: Boleto Gerado

### Comando cURL

```bash
curl -X POST https://www.zapcorte.com.br/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -H "User-Agent: Cakto-Webhook/1.0" \
  -d '{
    "event": "boleto_gerado",
    "secret": "SEU_SECRET_AQUI",
    "data": {
      "id": "test-boleto-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste Boleto Produção",
        "phone": "11999999999",
        "docNumber": "12345678900"
      },
      "amount": 97,
      "paymentMethod": "boleto",
      "status": "waiting_payment",
      "offer": {
        "id": "3th8tvh",
        "name": "Plano Starter"
      },
      "boletoUrl": "https://boleto.exemplo.com/123456",
      "boletoBarcode": "34191.79001 01043.510047 91020.150008 1 96610000000100",
      "dueDate": "2025-11-20"
    }
  }'
```

### Resposta Esperada (200 OK)

```json
{
  "success": true,
  "message": "Boleto gerado registrado",
  "email": "seu-email@cadastrado.com",
  "transactionId": "test-boleto-001",
  "processingTime": "145ms"
}
```

---

## 🧪 Teste 5: Pagamento Falhou

### Comando cURL

```bash
curl -X POST https://www.zapcorte.com.br/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -H "User-Agent: Cakto-Webhook/1.0" \
  -d '{
    "event": "payment_failed",
    "secret": "SEU_SECRET_AQUI",
    "data": {
      "id": "test-failed-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste Falha",
        "phone": "11999999999"
      },
      "amount": 97,
      "paymentMethod": "credit_card",
      "status": "failed",
      "offer": {
        "id": "3th8tvh"
      },
      "failureReason": "Cartão recusado",
      "failedAt": "2025-11-13T15:40:00Z"
    }
  }'
```

### Resposta Esperada (200 OK)

```json
{
  "success": true,
  "message": "Pagamento falho registrado",
  "email": "seu-email@cadastrado.com",
  "processingTime": "123ms"
}
```

---

## 🧪 Teste 6: Reembolso

### Comando cURL

```bash
curl -X POST https://www.zapcorte.com.br/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -H "User-Agent: Cakto-Webhook/1.0" \
  -d '{
    "event": "refund",
    "secret": "SEU_SECRET_AQUI",
    "data": {
      "id": "test-pix-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste Reembolso",
        "phone": "11999999999"
      },
      "amount": 97,
      "paymentMethod": "pix",
      "status": "refunded",
      "offer": {
        "id": "3th8tvh"
      },
      "refundedAt": "2025-11-13T15:45:00Z",
      "refundReason": "Solicitação do cliente"
    }
  }'
```

### Resposta Esperada (200 OK)

```json
{
  "success": true,
  "message": "refund processado",
  "email": "seu-email@cadastrado.com",
  "processingTime": "189ms"
}
```

### Verificar no Supabase

```sql
-- Ver reembolso registrado
SELECT * FROM payment_history 
WHERE transaction_id LIKE 'refund_%' 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver usuário voltou para free
SELECT 
  email,
  plan_type,
  subscription_status
FROM profiles 
WHERE email = 'seu-email@cadastrado.com';
```

---

## 🧪 Teste 7: Cancelamento de Assinatura

### Comando cURL

```bash
curl -X POST https://www.zapcorte.com.br/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -H "User-Agent: Cakto-Webhook/1.0" \
  -d '{
    "event": "subscription_cancelled",
    "secret": "SEU_SECRET_AQUI",
    "data": {
      "id": "test-cancel-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste Cancelamento",
        "phone": "11999999999"
      },
      "amount": 0,
      "paymentMethod": "subscription",
      "status": "cancelled",
      "offer": {
        "id": "3th8tvh"
      },
      "cancelledAt": "2025-11-13T15:50:00Z",
      "cancelReason": "Solicitação do cliente"
    }
  }'
```

### Resposta Esperada (200 OK)

```json
{
  "success": true,
  "message": "subscription_cancelled processado",
  "email": "seu-email@cadastrado.com",
  "processingTime": "167ms"
}
```

---

## 🧪 Teste 8: Secret Inválido (Erro Esperado)

### Comando cURL

```bash
curl -X POST https://www.zapcorte.com.br/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_approved",
    "secret": "SECRET_ERRADO",
    "data": {
      "id": "test-001",
      "customer": {
        "email": "teste@teste.com"
      },
      "amount": 97
    }
  }'
```

### Resposta Esperada (401 Unauthorized)

```json
{
  "error": "Assinatura inválida"
}
```

---

## 📊 Script de Teste Completo (Bash)

Salve como `test-webhook-producao.sh`:

```bash
#!/bin/bash

# Configurações
WEBHOOK_URL="https://www.zapcorte.com.br/api/webhooks/cakto"
SECRET="SEU_SECRET_AQUI"
EMAIL="seu-email@cadastrado.com"

echo "🧪 Iniciando testes do webhook em produção..."
echo ""

# Teste 1: PIX Gerado
echo "📍 Teste 1: PIX Gerado"
curl -s -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"pix_gerado\",
    \"secret\": \"$SECRET\",
    \"data\": {
      \"id\": \"test-pix-$(date +%s)\",
      \"customer\": {
        \"email\": \"$EMAIL\",
        \"name\": \"Teste PIX\"
      },
      \"amount\": 97,
      \"paymentMethod\": \"pix\",
      \"status\": \"waiting_payment\",
      \"offer\": {
        \"id\": \"3th8tvh\"
      }
    }
  }" | jq '.'
echo ""
sleep 2

# Teste 2: Pagamento Aprovado
echo "📍 Teste 2: Pagamento Aprovado (PIX)"
curl -s -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"purchase_approved\",
    \"secret\": \"$SECRET\",
    \"data\": {
      \"id\": \"test-approved-$(date +%s)\",
      \"customer\": {
        \"email\": \"$EMAIL\",
        \"name\": \"Teste Aprovado\"
      },
      \"amount\": 97,
      \"paymentMethod\": \"pix\",
      \"status\": \"approved\",
      \"offer\": {
        \"id\": \"3th8tvh\"
      }
    }
  }" | jq '.'
echo ""
sleep 2

# Teste 3: Cartão de Crédito
echo "📍 Teste 3: Cartão de Crédito (Pro)"
curl -s -X POST $WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d "{
    \"event\": \"purchase_approved\",
    \"secret\": \"$SECRET\",
    \"data\": {
      \"id\": \"test-card-$(date +%s)\",
      \"customer\": {
        \"email\": \"$EMAIL\",
        \"name\": \"Teste Cartão\"
      },
      \"amount\": 147,
      \"paymentMethod\": \"credit_card\",
      \"status\": \"approved\",
      \"offer\": {
        \"id\": \"9jk3ref\"
      }
    }
  }" | jq '.'
echo ""

echo "✅ Testes concluídos!"
echo ""
echo "📊 Verifique os resultados no Supabase:"
echo "   - webhook_logs"
echo "   - payment_history"
echo "   - profiles"
```

### Executar o script:

```bash
chmod +x test-webhook-producao.sh
./test-webhook-producao.sh
```

---

## 📊 Monitoramento em Tempo Real

### Ver logs do Vercel

```bash
vercel logs --follow
```

### Consultas SQL úteis

```sql
-- Últimos 10 webhooks
SELECT 
  event_type,
  status,
  error_message,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;

-- Pagamentos das últimas 24h
SELECT 
  p.email,
  ph.transaction_id,
  ph.status,
  ph.payment_method,
  ph.amount,
  ph.created_at
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
WHERE ph.created_at > NOW() - INTERVAL '24 hours'
ORDER BY ph.created_at DESC;

-- Taxa de sucesso dos webhooks
SELECT 
  event_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'success' THEN 1 END) as sucesso,
  COUNT(CASE WHEN status = 'failed' THEN 1 END) as falhas,
  ROUND(
    COUNT(CASE WHEN status = 'success' THEN 1 END)::numeric / 
    COUNT(*)::numeric * 100, 
    2
  ) as taxa_sucesso_pct
FROM webhook_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY total DESC;
```

---

## ✅ Checklist de Validação

Após cada teste, verificar:

- [ ] Status HTTP 200 retornado
- [ ] Resposta JSON válida
- [ ] Webhook registrado em `webhook_logs` com status `success`
- [ ] Pagamento registrado em `payment_history`
- [ ] Usuário atualizado em `profiles` (se aplicável)
- [ ] Barbearia atualizada em `barbershops` (se aplicável)
- [ ] Método de pagamento correto
- [ ] Valor correto
- [ ] Data de expiração calculada (se premium)

---

## 🐛 Troubleshooting

### Erro 401: Assinatura inválida
- Verifique o secret no Vercel
- Confirme que é o mesmo no painel Cakto

### Erro 500: Internal Server Error
- Verifique os logs do Vercel
- Confirme as variáveis de ambiente
- Verifique se as tabelas existem no Supabase

### Webhook não registra
- Verifique se a URL está correta
- Teste com cURL manualmente
- Veja os logs em `webhook_logs`

---

**Última atualização:** 13/11/2025  
**Status:** ✅ Pronto para testes em produção
