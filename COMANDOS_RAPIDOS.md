# ⚡ Comandos Rápidos - Integração Cakto

## 🚀 Iniciar Tudo (Copy & Paste)

### Windows PowerShell:
```powershell
# 1. Abrir terminal no diretório do servidor
cd C:\Users\nicol\OneDrive\Documentos\WORKFLOW\SaaS\ZapCorte\zap-corte-pro-main\server

# 2. Iniciar servidor
npm start
```

### Novo Terminal (para ngrok):
```powershell
# Expor servidor publicamente
ngrok http 3001
```

---

## 🧪 Testar Webhook

### Teste Completo:
```bash
cd zap-corte-pro-main/server
node test-webhook.js
```

### Teste com URL customizada:
```bash
node test-webhook.js https://sua-url.ngrok.io
```

### Teste Plano Pro:
```bash
node test-webhook.js http://localhost:3001 pro
```

---

## 🔍 Verificar Status

### Health Check:
```bash
curl http://localhost:3001/api/health
```

### Verificar Porta:
```powershell
netstat -ano | findstr :3001
```

### Matar Processo na Porta 3001:
```powershell
# 1. Encontrar PID
netstat -ano | findstr :3001

# 2. Matar (substitua <PID>)
taskkill /PID <PID> /F
```

---

## 📊 Queries Supabase

### Verificar Perfil:
```sql
SELECT id, email, plan_type, subscription_status, last_payment_date, expires_at
FROM profiles
WHERE email = 'carvalhomozeli@gmail.com';
```

### Verificar Histórico de Pagamento:
```sql
SELECT *
FROM payment_history
WHERE user_id = (
  SELECT user_id FROM profiles WHERE email = 'carvalhomozeli@gmail.com'
)
ORDER BY created_at DESC;
```

### Verificar Logs de Webhook:
```sql
SELECT *
FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Ativar Plano Manualmente:
```sql
UPDATE profiles
SET
  plan_type = 'starter',
  subscription_status = 'active',
  last_payment_date = NOW(),
  expires_at = NOW() + INTERVAL '30 days',
  payment_method = 'pix',
  updated_at = NOW()
WHERE email = 'seu-email@exemplo.com';
```

---

## 🔧 Troubleshooting Rápido

### Reinstalar Dependências:
```bash
cd zap-corte-pro-main/server
rm -rf node_modules
npm install
```

### Verificar Variáveis de Ambiente:
```bash
cat server/.env
```

### Ver Logs em Tempo Real:
```bash
cd zap-corte-pro-main/server
npm start
# Logs aparecem no terminal
```

---

## 🌐 URLs Importantes

### Local:
- Health Check: http://localhost:3001/api/health
- Webhook: http://localhost:3001/api/webhooks/cakto

### Cakto:
- Dashboard: https://cakto.com.br/dashboard
- Checkout Starter: https://pay.cakto.com.br/3th8tvh
- Checkout Pro: https://pay.cakto.com.br/9jk3ref

### Supabase:
- Dashboard: https://supabase.com/dashboard
- Projeto: https://ihwkbflhxvdsewifofdk.supabase.co

### ngrok:
- Dashboard: https://dashboard.ngrok.com
- Download: https://ngrok.com/download

### Railway:
- Dashboard: https://railway.app

---

## 📋 Checklist Rápido

```
[ ] Servidor rodando (npm start)
[ ] Health check OK (curl)
[ ] Teste local passou (node test-webhook.js)
[ ] ngrok rodando
[ ] URL pública copiada
[ ] Webhook configurado na Cakto
[ ] Pagamento de teste feito
[ ] Dados no Supabase confirmados
```

---

## 🆘 Comandos de Emergência

### Resetar Tudo:
```bash
# Parar servidor (Ctrl+C)
# Parar ngrok (Ctrl+C)
# Limpar porta
taskkill /F /IM node.exe
# Reiniciar
cd zap-corte-pro-main/server
npm start
```

### Verificar se Está Tudo OK:
```bash
# 1. Servidor
curl http://localhost:3001/api/health

# 2. Teste
node test-webhook.js

# 3. Supabase (via MCP)
# Ver queries acima
```

---

## 💾 Backup Rápido

### Exportar Dados do Supabase:
```sql
-- Perfis
COPY (SELECT * FROM profiles) TO '/tmp/profiles_backup.csv' CSV HEADER;

-- Histórico
COPY (SELECT * FROM payment_history) TO '/tmp/payment_history_backup.csv' CSV HEADER;
```

---

## 🎯 Fluxo Completo em 5 Minutos

```bash
# 1. Iniciar servidor (Terminal 1)
cd zap-corte-pro-main/server
npm start

# 2. Testar localmente (Terminal 2)
cd zap-corte-pro-main/server
node test-webhook.js

# 3. Expor publicamente (Terminal 2)
ngrok http 3001

# 4. Copiar URL do ngrok
# Exemplo: https://abc123.ngrok.io

# 5. Configurar na Cakto
# Dashboard > Webhooks > Adicionar
# URL: https://abc123.ngrok.io/api/webhooks/cakto
# Secret: 8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df

# 6. Testar com URL pública
node test-webhook.js https://abc123.ngrok.io

# 7. Fazer pagamento real de teste
# Acessar: https://pay.cakto.com.br/3th8tvh

# 8. Verificar logs
# Ver terminal do servidor

# 9. Confirmar no Supabase
# Ver queries acima
```

---

## 📞 Atalhos de Teclado

- **Ctrl+C** - Parar servidor/ngrok
- **Ctrl+L** - Limpar terminal
- **Seta ↑** - Comando anterior
- **Tab** - Autocompletar

---

**⚡ Mantenha este arquivo aberto para referência rápida!**
