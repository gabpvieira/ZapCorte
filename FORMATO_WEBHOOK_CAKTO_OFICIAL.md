# Formato Oficial do Webhook Cakto

## 📚 Documentação Oficial
- **Ajuda:** https://ajuda.cakto.com.br/pt/article/como-funcionam-os-webhooks-1l9m78k/
- **Docs:** https://burly-level-c93.notion.site/Webhooks-pt-br-13c5b1d7878780d792f0fcda3411955c

## 🔔 Eventos Disponíveis

Segundo a documentação oficial do Cakto, os eventos são:

1. **purchase_approved** - Compra aprovada
2. **purchase_refunded** - Compra reembolsada
3. **subscription_cancelled** - Assinatura cancelada
4. **subscription_expired** - Assinatura expirada
5. **pix_generated** - PIX gerado (aguardando pagamento)
6. **boleto_generated** - Boleto gerado (aguardando pagamento)

## 📦 Formato do Payload

### Estrutura Geral

```json
{
  "event": "purchase_approved",
  "secret": "seu_webhook_secret",
  "data": {
    "id": "transaction-id-uuid",
    "customer": {
      "name": "Nome do Cliente",
      "email": "cliente@email.com",
      "phone": "11999999999",
      "docNumber": "12345678909"
    },
    "product": {
      "id": "product-id",
      "name": "Nome do Produto"
    },
    "amount": 97.00,
    "status": "approved",
    "paymentMethod": "pix",
    "createdAt": "2025-11-13T10:00:00Z"
  }
}
```

### Campos Importantes

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `event` | string | Tipo do evento |
| `secret` | string | Secret configurado no webhook |
| `data.id` | string | ID único da transação |
| `data.customer.email` | string | Email do cliente |
| `data.product.id` | string | **ID do produto (usar para identificar plano)** |
| `data.amount` | number | Valor da transação |
| `data.paymentMethod` | string | Método de pagamento |

## 🎯 Eventos por Método de Pagamento

### PIX
```
1. Cliente escolhe PIX
   ↓
2. Evento: pix_generated (status: waiting_payment)
   ↓
3. Cliente paga
   ↓
4. Evento: purchase_approved (status: approved)
```

### Cartão de Crédito
```
1. Cliente paga
   ↓
2. Evento: purchase_approved (status: approved)
```

### Boleto
```
1. Cliente gera boleto
   ↓
2. Evento: boleto_generated (status: waiting_payment)
   ↓
3. Cliente paga
   ↓
4. Evento: purchase_approved (status: approved)
```

## 🔧 Configuração no Painel Cakto

### 1. Acessar Webhooks
1. Menu **Apps**
2. Submenu **Webhooks**
3. Clicar em **Adicionar**

### 2. Configurar Webhook
- **URL:** `https://www.zapcorte.com.br/api/webhooks/cakto`
- **Secret:** (gerar um secret seguro)
- **Eventos:** Marcar todos os eventos necessários

### 3. Testar Webhook
1. Clicar nos 3 pontinhos do webhook
2. Selecionar **Enviar evento de teste**
3. Escolher o evento
4. Enviar

## 🧪 Exemplo de Teste

### purchase_approved (PIX)
```json
{
  "event": "purchase_approved",
  "secret": "seu_secret_aqui",
  "data": {
    "id": "test-001",
    "customer": {
      "name": "ZK Digital Business",
      "email": "zkdigitalbusiness@gmail.com",
      "phone": "11999999999"
    },
    "product": {
      "id": "3th8tvh",
      "name": "Plano Starter"
    },
    "amount": 97,
    "status": "approved",
    "paymentMethod": "pix",
    "createdAt": "2025-11-13T10:00:00Z"
  }
}
```

### pix_generated
```json
{
  "event": "pix_generated",
  "secret": "seu_secret_aqui",
  "data": {
    "id": "test-002",
    "customer": {
      "name": "ZK Digital Business",
      "email": "zkdigitalbusiness@gmail.com",
      "phone": "11999999999"
    },
    "product": {
      "id": "3th8tvh",
      "name": "Plano Starter"
    },
    "amount": 97,
    "status": "waiting_payment",
    "paymentMethod": "pix",
    "pixCode": "00020126580014br.gov.bcb.pix...",
    "pixQrCode": "data:image/png;base64,...",
    "createdAt": "2025-11-13T10:00:00Z"
  }
}
```

## ⚠️ Pontos de Atenção

### 1. Campo product.id vs offer.id
- ✅ **Correto:** `data.product.id`
- ❌ **Incorreto:** `data.offer.id`

O Cakto envia o ID do produto em `product.id`, não em `offer.id`.

### 2. Validação do Secret
O secret deve ser validado para garantir que o webhook veio do Cakto:

```javascript
function validateWebhook(webhookData) {
  return webhookData.secret === process.env.CAKTO_WEBHOOK_SECRET;
}
```

### 3. Eventos com Nomes Diferentes
Alguns eventos podem ter variações:
- `pix_generated` ou `pix_gerado`
- `boleto_generated` ou `boleto_gerado`

O código deve suportar ambos.

### 4. Status da Transação
- `waiting_payment` - Aguardando pagamento
- `approved` - Pagamento aprovado
- `refunded` - Reembolsado
- `cancelled` - Cancelado
- `failed` - Falhou

## 📊 Mapeamento de Planos

### Product IDs
Configure no Vercel:

```env
CAKTO_PRODUCT_ID_STARTER=3th8tvh
CAKTO_PRODUCT_ID_PRO=9jk3ref
```

### Lógica de Mapeamento
```javascript
function determinePlanType(productId) {
  if (productId === process.env.CAKTO_PRODUCT_ID_STARTER) return 'starter';
  if (productId === process.env.CAKTO_PRODUCT_ID_PRO) return 'pro';
  return 'starter'; // fallback
}
```

## ✅ Checklist de Configuração

- [ ] Webhook criado no painel Cakto
- [ ] URL configurada: `https://www.zapcorte.com.br/api/webhooks/cakto`
- [ ] Secret configurado (mesmo no Vercel)
- [ ] Eventos marcados: purchase_approved, pix_generated, boleto_generated, purchase_refunded, subscription_cancelled
- [ ] Variáveis no Vercel:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `CAKTO_WEBHOOK_SECRET`
  - [ ] `CAKTO_PRODUCT_ID_STARTER`
  - [ ] `CAKTO_PRODUCT_ID_PRO`
- [ ] Teste enviado do painel Cakto
- [ ] Webhook registrado em `webhook_logs`
- [ ] Pagamento registrado em `payment_history`

## 🔍 Como Verificar se Está Funcionando

### 1. Enviar Teste do Painel Cakto
No painel Cakto, envie um evento de teste de `purchase_approved`.

### 2. Verificar Logs no Supabase
```sql
-- Ver último webhook recebido
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver se registrou no histórico
SELECT * FROM payment_history 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver se usuário virou premium
SELECT email, plan_type, subscription_status 
FROM profiles 
WHERE email = 'zkdigitalbusiness@gmail.com';
```

### 3. Verificar Logs do Vercel
```bash
vercel logs --follow
```

## 🐛 Troubleshooting

### Erro 500
- Verificar se as variáveis de ambiente estão configuradas no Vercel
- Verificar logs do Vercel para ver o erro específico

### Webhook não chega
- Verificar URL no painel Cakto
- Testar URL manualmente
- Verificar se o domínio está acessível

### Secret inválido
- Confirmar que o secret no Vercel é o mesmo do painel Cakto
- Verificar se não há espaços extras

### Usuário não encontrado
- Confirmar que o email existe na tabela `profiles`
- Usar o email: zkdigitalbusiness@gmail.com para testes

---

**Última atualização:** 13/11/2025
