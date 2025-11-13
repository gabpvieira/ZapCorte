# 🚀 Deploy do Webhook no Vercel

## ✅ Configuração Implementada

O webhook foi configurado como **Vercel Serverless Function** no mesmo projeto do frontend.

---

## 📁 Estrutura Criada

```
zap-corte-pro-main/
├── api/
│   ├── health.js              # Health check
│   ├── plans.js               # API de planos
│   └── webhooks/
│       └── cakto.js          # Webhook do Cakto
├── vercel.json               # Configuração do Vercel
└── ...
```

---

## 🔧 Configurar Variáveis de Ambiente no Vercel

### 1. Acessar Dashboard do Vercel
```
https://vercel.com/seu-usuario/zapcorte
```

### 2. Ir em Settings → Environment Variables

### 3. Adicionar as seguintes variáveis:

#### Supabase
```
SUPABASE_URL = https://ihwkbflhxvdsewifofdk.supabase.co
SUPABASE_SERVICE_ROLE_KEY = sua-service-role-key-aqui
```

#### Cakto
```
CAKTO_WEBHOOK_SECRET = 8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df
CAKTO_PRODUCT_ID_STARTER = 3th8tvh
CAKTO_PRODUCT_ID_PRO = 9jk3ref
```

**⚠️ IMPORTANTE:** Marcar todas como **Production**, **Preview** e **Development**

---

## 🌐 URLs do Webhook em Produção

Após o deploy, suas URLs serão:

### Health Check
```
https://zapcorte.com.br/api/health
```

### Webhook do Cakto
```
https://zapcorte.com.br/api/webhooks/cakto
```

### API de Planos
```
https://zapcorte.com.br/api/plans
```

---

## 📋 Configurar Webhook no Cakto

### 1. Acessar Painel do Cakto
```
https://app.cakto.com.br
```

### 2. Ir em Configurações → Webhooks

### 3. Adicionar URL do Webhook
```
https://zapcorte.com.br/api/webhooks/cakto
```

### 4. Eventos para Ativar
- ✅ `purchase_approved` - Pagamento aprovado
- ✅ `subscription_cancelled` - Assinatura cancelada
- ✅ `refund` - Reembolso

### 5. Secret
```
8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df
```

---

## 🧪 Testar Webhook

### 1. Testar Health Check
```bash
curl https://zapcorte.com.br/api/health
```

Deve retornar:
```json
{
  "status": "OK",
  "timestamp": "2025-11-13T...",
  "service": "ZapCorte Payment Server",
  "environment": "production"
}
```

### 2. Testar Webhook (após configurar no Cakto)
Fazer uma compra de teste no Cakto e verificar:

```sql
-- Verificar se webhook foi recebido
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar se plano foi atualizado
SELECT email, plan_type, subscription_status 
FROM profiles 
WHERE email = 'seu-email@teste.com';
```

---

## 📊 Monitoramento

### Logs do Vercel
```
https://vercel.com/seu-usuario/zapcorte/logs
```

### Logs do Supabase
```sql
SELECT 
    event_type,
    status,
    error_message,
    created_at
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 20;
```

---

## 🔄 Fluxo Completo

```
1. Cliente faz compra no Cakto
   ↓
2. Cakto envia webhook para:
   https://zapcorte.com.br/api/webhooks/cakto
   ↓
3. Vercel Serverless Function processa
   ↓
4. Atualiza profile e barbershop no Supabase
   ↓
5. Registra em webhook_logs e payment_history
   ↓
6. Cliente tem acesso ao plano ✅
```

---

## ✅ Vantagens do Vercel Serverless

- ✅ **Mesmo domínio** do frontend
- ✅ **Escalabilidade automática**
- ✅ **Sem servidor para gerenciar**
- ✅ **Deploy automático** com Git
- ✅ **HTTPS gratuito**
- ✅ **Logs integrados**
- ✅ **Custo zero** (plano gratuito)

---

## 🚨 Troubleshooting

### Webhook não está sendo recebido
1. Verificar se URL está correta no Cakto
2. Verificar logs do Vercel
3. Testar health check

### Erro 500 no webhook
1. Verificar variáveis de ambiente no Vercel
2. Verificar logs: `webhook_logs` table
3. Verificar se SUPABASE_SERVICE_ROLE_KEY está correto

### Plano não atualiza
1. Verificar se email do Cakto é o mesmo do cadastro
2. Verificar logs do webhook
3. Verificar RLS policies do Supabase

---

## 📝 Próximos Passos

1. **Fazer deploy:**
   ```bash
   git add .
   git commit -m "feat: Adicionar webhook serverless no Vercel"
   git push origin main
   ```

2. **Configurar variáveis no Vercel** (ver seção acima)

3. **Configurar webhook no Cakto** (ver seção acima)

4. **Fazer compra de teste**

5. **Verificar logs e funcionamento**

---

## 🎯 Checklist de Deploy

- [ ] Código commitado e pushed
- [ ] Deploy automático no Vercel concluído
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Health check funcionando (`/api/health`)
- [ ] Webhook configurado no painel do Cakto
- [ ] Compra de teste realizada
- [ ] Webhook recebido (verificar `webhook_logs`)
- [ ] Plano atualizado (verificar `profiles`)

---

**Status:** ✅ Pronto para Deploy  
**Última atualização:** 2025-11-13
