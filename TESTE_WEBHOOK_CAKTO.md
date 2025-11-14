# Guia de Teste do Webhook Cakto

## 🚀 Teste Rápido (5 minutos)

### 1. Configurar Variáveis de Ambiente

Crie/edite o arquivo `.env` na raiz do projeto:

```env
# Supabase (Backend)
SUPABASE_URL=https://ihwkbflhxvdsewifofdk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui

# Cakto
CAKTO_WEBHOOK_SECRET=seu_secret_aqui
```

### 2. Testar Localmente com cURL

#### Teste 1: PIX Gerado (Pendente)

```bash
curl -X POST http://localhost:3000/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d '{
    "event": "pix_gerado",
    "secret": "seu_secret_aqui",
    "data": {
      "id": "pix-test-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste PIX"
      },
      "amount": 97,
      "paymentMethod": "pix",
      "status": "waiting_payment",
      "offer": {
        "id": "3th8tvh"
      }
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "message": "PIX gerado registrado",
  "email": "seu-email@cadastrado.com",
  "transactionId": "pix-test-001",
  "processingTime": "123ms"
}
```

#### Teste 2: Pagamento Aprovado (PIX)

```bash
curl -X POST http://localhost:3000/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_approved",
    "secret": "seu_secret_aqui",
    "data": {
      "id": "pix-test-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste PIX"
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

**Resposta esperada:**
```json
{
  "success": true,
  "planType": "starter",
  "email": "seu-email@cadastrado.com",
  "paymentMethod": "PIX",
  "transactionId": "pix-test-001",
  "processingTime": "245ms"
}
```

#### Teste 3: Cartão de Crédito

```bash
curl -X POST http://localhost:3000/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d '{
    "event": "purchase_approved",
    "secret": "seu_secret_aqui",
    "data": {
      "id": "card-test-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste Cartão"
      },
      "amount": 147,
      "paymentMethod": "credit_card",
      "status": "approved",
      "offer": {
        "id": "9jk3ref"
      }
    }
  }'
```

#### Teste 4: Boleto Gerado

```bash
curl -X POST http://localhost:3000/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d '{
    "event": "boleto_gerado",
    "secret": "seu_secret_aqui",
    "data": {
      "id": "boleto-test-001",
      "customer": {
        "email": "seu-email@cadastrado.com",
        "name": "Teste Boleto"
      },
      "amount": 97,
      "paymentMethod": "boleto",
      "status": "waiting_payment",
      "offer": {
        "id": "3th8tvh"
      }
    }
  }'
```

### 3. Verificar no Supabase

Abra o SQL Editor do Supabase e execute:

```sql
-- Ver últimos webhooks
SELECT 
  event_type,
  status,
  created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 5;

-- Ver histórico de pagamentos
SELECT 
  p.email,
  ph.transaction_id,
  ph.status,
  ph.payment_method,
  ph.amount
FROM payment_history ph
JOIN profiles p ON p.id = ph.user_id
ORDER BY ph.created_at DESC
LIMIT 5;

-- Ver se usuário virou premium
SELECT 
  email,
  plan_type,
  subscription_status,
  payment_method
FROM profiles
WHERE email = 'seu-email@cadastrado.com';
```

## 🌐 Teste em Produção (Vercel)

### 1. Deploy no Vercel

```bash
# Fazer deploy
vercel --prod

# Ou via GitHub (push para main)
git add .
git commit -m "Atualizar webhook Cakto"
git push origin main
```

### 2. Configurar Variáveis no Vercel

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Adicione:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CAKTO_WEBHOOK_SECRET`

### 3. Configurar no Painel Cakto

1. Acesse: https://app.cakto.com.br
2. Vá em **Configurações > Webhooks**
3. Adicione:
   - **URL:** `https://seu-projeto.vercel.app/api/webhooks/cakto`
   - **Secret:** (mesmo do `.env`)
   - **Eventos:** Marque todos

### 4. Testar com Pagamento Real

1. Crie um produto de teste no Cakto (R$ 0,01)
2. Faça um pagamento teste
3. Verifique os logs no Supabase

## 🧪 Teste com ngrok (Desenvolvimento)

### 1. Instalar ngrok

```bash
npm install -g ngrok
```

### 2. Iniciar servidor local

```bash
# Terminal 1: Iniciar Vite
npm run dev

# Terminal 2: Expor com ngrok
ngrok http 3000
```

### 3. Copiar URL do ngrok

```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:3000
```

### 4. Configurar no Cakto

URL do webhook: `https://abc123.ngrok-free.app/api/webhooks/cakto`

### 5. Fazer pagamento teste

O webhook será chamado em tempo real!

## ✅ Checklist de Validação

Após cada teste, verifique:

- [ ] Webhook aparece em `webhook_logs` com status `success`
- [ ] Pagamento aparece em `payment_history` com status correto
- [ ] Usuário atualizado em `profiles` (se aprovado)
- [ ] Barbearia atualizada em `barbershops` (se aprovado)
- [ ] Método de pagamento registrado corretamente
- [ ] Valor correto registrado
- [ ] Data de expiração calculada (30 dias)

## 🐛 Problemas Comuns

### Erro: "Assinatura inválida"

**Causa:** Secret incorreto

**Solução:**
1. Verifique o secret no `.env`
2. Confirme que é o mesmo no painel Cakto
3. Redeploy no Vercel se necessário

### Erro: "Usuário não encontrado"

**Causa:** Email não existe em `profiles`

**Solução:**
1. Cadastre o usuário primeiro no sistema
2. Ou use um email já cadastrado nos testes

### Webhook não chama

**Causa:** URL incorreta ou servidor offline

**Solução:**
1. Teste a URL manualmente com cURL
2. Verifique se o servidor está rodando
3. Confirme a URL no painel Cakto

### Pagamento não registra

**Causa:** Erro no processamento

**Solução:**
1. Verifique `webhook_logs` para ver o erro
2. Veja os logs do Vercel/console
3. Confirme que as tabelas existem no Supabase

## 📊 Monitoramento

### Ver logs em tempo real (Vercel)

```bash
vercel logs --follow
```

### Ver logs no Supabase

```sql
-- Últimos erros
SELECT * FROM webhook_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Alertas importantes

Configure alertas para:
- Taxa de erro > 10%
- Webhooks não recebidos por > 1 hora
- Pagamentos pendentes por > 24 horas

## 🎯 Resultado Esperado

Após configuração completa:

✅ **PIX:** Gerado → Pendente → Aprovado → Premium  
✅ **Cartão:** Aprovado → Premium  
✅ **Boleto:** Gerado → Pendente → Aprovado → Premium  
✅ **Reembolso:** Processado → Free  
✅ **Cancelamento:** Processado → Free  

---

**Dúvidas?** Consulte `CONFIGURACAO_WEBHOOK_CAKTO_COMPLETA.md`
