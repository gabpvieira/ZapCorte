# ⚡ Deploy Rápido - Webhook Cakto

## 🚀 Deploy em 5 Minutos (Vercel)

### Passo 1: Preparar Projeto
```bash
# Já está pronto! ✅
```

### Passo 2: Instalar Vercel CLI
```bash
npm install -g vercel
```

### Passo 3: Login
```bash
vercel login
```

### Passo 4: Deploy
```bash
# Na raiz do projeto
vercel --prod
```

### Passo 5: Configurar Variáveis de Ambiente

No painel da Vercel (https://vercel.com/dashboard):

1. Selecionar projeto
2. Settings → Environment Variables
3. Adicionar:

```
SUPABASE_URL=https://ihwkbflhxvdsewifofdk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlod2tiZmxoeHZkc2V3aWZvZmRrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTg4OTU1MywiZXhwIjoyMDc3NDY1NTUzfQ.xuw23MUIzqZ-ajzU3HjP376Z7myCQP7aAsYS3Lku5PU
CAKTO_WEBHOOK_SECRET=8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df
CAKTO_PRODUCT_ID_STARTER=3th8tvh
CAKTO_PRODUCT_ID_PRO=9jk3ref
PORT=3001
```

### Passo 6: Configurar no Cakto

**URL do Webhook:**
```
https://seu-projeto.vercel.app/api/webhooks/cakto
```

**Secret:**
```
8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df
```

**Eventos:**
- ✅ purchase_approved
- ✅ refund
- ✅ subscription_cancelled

### Passo 7: Testar

1. Enviar webhook de teste do Cakto
2. Verificar resposta (deve ser 200 OK)
3. Fazer compra real de R$ 5,00
4. Verificar se perfil foi atualizado

---

## 🎯 Checklist Rápido

- [ ] Vercel CLI instalado
- [ ] Login feito
- [ ] Deploy realizado
- [ ] Variáveis de ambiente configuradas
- [ ] URL do webhook configurada no Cakto
- [ ] Teste com webhook de teste (sucesso)
- [ ] Teste com compra real (sucesso)
- [ ] Perfil atualizado corretamente

---

## 🔍 Verificação Rápida

**Testar endpoint:**
```bash
curl https://seu-projeto.vercel.app/api/health
```

**Resposta esperada:**
```json
{
  "status": "OK",
  "timestamp": "2025-11-11T...",
  "service": "ZapCorte Payment Server"
}
```

---

## 📊 Monitoramento

**Ver logs:**
```bash
vercel logs
```

**Ver últimos webhooks:**
```sql
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🚨 Problemas?

**Webhook retorna 404:**
- Verificar se URL está correta
- Adicionar `/api/webhooks/cakto` no final

**Webhook retorna 400:**
- Verificar secret no Cakto
- Deve ser: `8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df`

**Webhook retorna 500:**
- Ver logs: `vercel logs`
- Verificar variáveis de ambiente

---

## ✅ Pronto!

Seu webhook está funcionando em produção! 🎉

**Próximo passo:** Fazer compra real e validar.
