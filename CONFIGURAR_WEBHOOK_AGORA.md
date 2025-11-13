# ⚡ Configurar Webhook AGORA - Guia Rápido

## ✅ Código já está no GitHub!

O webhook foi enviado para o GitHub e o Vercel vai fazer deploy automático.

---

## 🚀 Próximos Passos (5 minutos)

### 1️⃣ Aguardar Deploy do Vercel (2 minutos)

Acessar: https://vercel.com/dashboard

Aguardar o deploy automático terminar. Você verá:
```
✅ Building...
✅ Deploying...
✅ Ready
```

---

### 2️⃣ Configurar Variáveis de Ambiente (2 minutos)

**Acessar:** https://vercel.com/seu-usuario/zapcorte/settings/environment-variables

**Adicionar estas variáveis:**

```
Nome: SUPABASE_URL
Valor: https://ihwkbflhxvdsewifofdk.supabase.co
Ambientes: ✅ Production ✅ Preview ✅ Development

Nome: SUPABASE_SERVICE_ROLE_KEY
Valor: [Pegar no Supabase Dashboard → Settings → API]
Ambientes: ✅ Production ✅ Preview ✅ Development

Nome: CAKTO_WEBHOOK_SECRET
Valor: 8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df
Ambientes: ✅ Production ✅ Preview ✅ Development

Nome: CAKTO_PRODUCT_ID_STARTER
Valor: 3th8tvh
Ambientes: ✅ Production ✅ Preview ✅ Development

Nome: CAKTO_PRODUCT_ID_PRO
Valor: 9jk3ref
Ambientes: ✅ Production ✅ Preview ✅ Development
```

**⚠️ Após adicionar, fazer REDEPLOY:**
- Ir em Deployments
- Clicar nos 3 pontinhos do último deploy
- Clicar em "Redeploy"

---

### 3️⃣ Testar Health Check (30 segundos)

Abrir no navegador:
```
https://zapcorte.com.br/api/health
```

Deve mostrar:
```json
{
  "status": "OK",
  "timestamp": "2025-11-13T...",
  "service": "ZapCorte Payment Server",
  "environment": "production"
}
```

✅ Se aparecer isso, está funcionando!

---

### 4️⃣ Configurar Webhook no Cakto (1 minuto)

**Acessar:** https://app.cakto.com.br

**Ir em:** Configurações → Webhooks → Adicionar Webhook

**Configurar:**
```
URL do Webhook:
https://zapcorte.com.br/api/webhooks/cakto

Secret:
8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df

Eventos:
✅ purchase_approved
✅ subscription_cancelled
✅ refund
```

**Salvar**

---

## 🧪 Testar Agora!

### Fazer uma compra de teste:

1. Acessar: https://zapcorte.com.br/dashboard/plan
2. Clicar em "Assinar Starter"
3. Fazer pagamento PIX de teste
4. Aguardar confirmação

### Verificar se funcionou:

**Opção 1: Ver no Supabase**
```sql
-- Ver webhook recebido
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver se plano foi ativado
SELECT email, plan_type, subscription_status 
FROM profiles 
WHERE email = 'seu-email@teste.com';
```

**Opção 2: Ver no Vercel**
- Ir em: https://vercel.com/seu-usuario/zapcorte/logs
- Procurar por: "Webhook Cakto recebido"

---

## ✅ Checklist Rápido

- [ ] Deploy do Vercel concluído
- [ ] Variáveis de ambiente configuradas
- [ ] Redeploy feito após adicionar variáveis
- [ ] Health check funcionando (`/api/health`)
- [ ] Webhook configurado no Cakto
- [ ] Compra de teste realizada
- [ ] Plano ativado automaticamente

---

## 🎯 URLs Importantes

**Health Check:**
```
https://zapcorte.com.br/api/health
```

**Webhook (para configurar no Cakto):**
```
https://zapcorte.com.br/api/webhooks/cakto
```

**Vercel Dashboard:**
```
https://vercel.com/dashboard
```

**Supabase Dashboard:**
```
https://supabase.com/dashboard/project/ihwkbflhxvdsewifofdk
```

---

## 🚨 Se Algo Der Errado

### Webhook não recebe
1. Verificar se URL está correta no Cakto
2. Verificar logs do Vercel
3. Verificar se variáveis de ambiente estão configuradas

### Plano não ativa
1. Verificar logs em `webhook_logs`
2. Verificar se email do Cakto é o mesmo do cadastro
3. Verificar se `SUPABASE_SERVICE_ROLE_KEY` está correto

---

## 💡 Dica

Após configurar tudo, **faça uma nova compra** (não a anterior que deu erro).

O webhook só funciona para compras **APÓS** a configuração estar completa.

---

**Tempo total:** ~5 minutos  
**Dificuldade:** Fácil  
**Status:** ✅ Pronto para configurar!
