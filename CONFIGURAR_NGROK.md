# 🌐 Como Configurar o ngrok

## ⚠️ Authtoken Inválido

O authtoken atual está inválido ou expirado:
```
34pm4FasH49QPysbQFqPNUcObSf_2qny39zPS1ACBiEL2qDs5a
```

## 🔧 Como Obter um Novo Authtoken

### Passo 1: Acessar o Dashboard do ngrok
1. Acesse: https://dashboard.ngrok.com/get-started/your-authtoken
2. Faça login (ou crie uma conta gratuita)
3. Copie o novo authtoken

### Passo 2: Configurar o Authtoken
```bash
# Substitua SEU_NOVO_AUTHTOKEN pelo token copiado
& "$env:USERPROFILE\ngrok\ngrok.exe" config add-authtoken SEU_NOVO_AUTHTOKEN
```

### Passo 3: Iniciar o ngrok
```bash
& "$env:USERPROFILE\ngrok\ngrok.exe" http 3001
```

## 📋 Resultado Esperado

Você verá algo assim:
```
ngrok                                                                           

Session Status                online
Account                       Seu Nome (Plan: Free)
Version                       3.32.0
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

## 🔗 Copiar a URL Pública

A URL pública será algo como:
```
https://abc123.ngrok-free.app
```

## ⚙️ Atualizar na Cakto

1. Acesse: https://cakto.com.br/dashboard
2. Vá em: Configurações > Webhooks
3. Atualize a URL para:
   ```
   https://abc123.ngrok-free.app/api/webhooks/cakto
   ```
4. Mantenha o secret:
   ```
   8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df
   ```

## 🧪 Testar o Webhook Público

```bash
cd zap-corte-pro-main/server
node test-webhook.js https://abc123.ngrok-free.app
```

## 💡 Alternativa: Deploy em Produção (Railway)

Se você não quiser usar ngrok (URL muda toda vez), use Railway:

1. Criar conta: https://railway.app
2. Conectar GitHub
3. Deploy automático
4. URL fixa permanente

## 📞 Suporte

Se tiver problemas:
- Dashboard ngrok: https://dashboard.ngrok.com
- Documentação: https://ngrok.com/docs
- Erros comuns: https://ngrok.com/docs/errors

---

**✅ ngrok instalado em:** `C:\Users\nicol\ngrok\ngrok.exe`
