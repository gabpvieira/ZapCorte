# 🚀 Guia Rápido: Iniciar Servidor de Webhooks

## ⚡ Início Rápido (3 passos)

### 1️⃣ Iniciar o Servidor Express
```bash
cd zap-corte-pro-main/server
npm start
```

Você deve ver:
```
🚀 Servidor ZapCorte rodando na porta 3001
📡 Webhook URL: http://localhost:3001/api/webhooks/cakto
🏥 Health Check: http://localhost:3001/api/health
```

### 2️⃣ Expor com ngrok (em outro terminal)
```bash
ngrok http 3001
```

Copie a URL HTTPS que aparece (ex: `https://abc123.ngrok.io`)

### 3️⃣ Configurar na Cakto
1. Acesse: https://cakto.com.br/dashboard
2. Vá em: Configurações > Webhooks
3. Cole a URL: `https://abc123.ngrok.io/api/webhooks/cakto`
4. Secret: `8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df`
5. Eventos: `purchase_approved`, `refund`, `subscription_cancelled`

---

## 🧪 Testar se está funcionando

### Teste 1: Health Check
```bash
curl http://localhost:3001/api/health
```

Deve retornar:
```json
{"status":"OK","timestamp":"...","service":"ZapCorte Payment Server"}
```

### Teste 2: Webhook Manual
```bash
curl -X POST http://localhost:3001/api/webhooks/cakto \
  -H "Content-Type: application/json" \
  -d "{\"event\":\"purchase_approved\",\"secret\":\"8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df\",\"data\":{\"id\":\"test_123\",\"amount\":29.90,\"status\":\"approved\",\"paymentMethod\":\"pix\",\"productId\":\"3th8tvh\",\"customer\":{\"email\":\"carvalhomozeli@gmail.com\",\"name\":\"Teste\"}}}"
```

---

## 📊 Status Atual

✅ **Usuário de teste ativado manualmente:**
- Email: carvalhomozeli@gmail.com
- Plano: STARTER
- Status: ACTIVE
- Expira em: 10/12/2025
- Pagamento registrado: R$ 5,00 (teste)

⚠️ **Próximos pagamentos precisam do webhook configurado!**

---

## 🔧 Comandos Úteis

### Ver logs em tempo real:
```bash
cd zap-corte-pro-main/server
npm start
```

### Verificar porta 3001:
```bash
netstat -ano | findstr :3001
```

### Matar processo na porta 3001 (se necessário):
```bash
# Encontrar PID:
netstat -ano | findstr :3001
# Matar processo (substitua PID):
taskkill /PID <PID> /F
```

---

## 🌐 Opções de Deploy em Produção

### Railway (Recomendado)
1. Criar conta: https://railway.app
2. Conectar GitHub
3. Deploy automático
4. URL fixa e gratuita (500h/mês)

### Vercel
1. Instalar CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`
3. Configurar variáveis de ambiente

### Render
1. Criar conta: https://render.com
2. Conectar repositório
3. Deploy automático

---

## ❓ Problemas Comuns

### Erro: "Port 3001 already in use"
```bash
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Ou mude a porta no .env:
PORT=3002
```

### Erro: "Cannot find module"
```bash
cd zap-corte-pro-main/server
npm install
```

### ngrok URL mudou
- URL gratuita muda a cada reinício
- Atualize na Cakto sempre que reiniciar
- Ou use Railway para URL fixa

---

## 📞 Suporte

Se precisar de ajuda:
1. Verifique os logs do servidor
2. Teste o health check
3. Confirme que ngrok está rodando
4. Verifique a URL na Cakto
