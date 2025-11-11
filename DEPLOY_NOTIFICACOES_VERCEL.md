# 🚀 Deploy de Notificações no Vercel

## 📋 O Que Foi Configurado

### 1. Vercel Serverless Function
Criada função serverless em `/api/send-notification.js` que:
- ✅ Busca subscriptions ativas do banco
- ✅ Envia notificações para múltiplos dispositivos
- ✅ Registra histórico
- ✅ Trata erros e subscriptions expiradas

### 2. Configuração do Vercel
Atualizado `vercel.json` para:
- ✅ Suportar funções serverless
- ✅ Configurar rotas da API
- ✅ Manter SPA routing

### 3. Dependências
Adicionado `web-push` ao `package.json`

## 🔧 Variáveis de Ambiente no Vercel

Você precisa configurar estas variáveis no Vercel Dashboard:

```bash
# Supabase
VITE_SUPABASE_URL=https://ihwkbflhxvdsewifofdk.supabase.co
VITE_SUPABASE_ANON_KEY=seu-anon-key
SUPABASE_SERVICE_ROLE_KEY=seu-service-role-key

# Outras variáveis já existentes
VITE_CAKTO_CHECKOUT_STARTER=...
VITE_CAKTO_CHECKOUT_PRO=...
```

## 📝 Como Configurar no Vercel

### 1. Acessar Dashboard
```
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto: zapcorte
3. Vá em: Settings > Environment Variables
```

### 2. Adicionar Variável
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development
```

### 3. Redeploy
```
1. Vá em: Deployments
2. Clique nos 3 pontos do último deploy
3. Clique em: Redeploy
```

## 🧪 Como Testar

### 1. Após Deploy
```
1. Acesse: https://zapcorte.vercel.app/dashboard/notifications
2. Clique em "Ativar Notificações"
3. Permita no navegador
4. Clique em "Testar Notificação"
```

### 2. Verificar Logs
```
1. No Vercel Dashboard
2. Vá em: Deployments > [último deploy] > Functions
3. Clique em: /api/send-notification
4. Veja os logs de execução
```

### 3. Testar API Diretamente
```bash
curl -X POST https://zapcorte.vercel.app/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{"barbershopId": "seu-id-aqui"}'
```

## 🔍 Troubleshooting

### Erro: "Module not found: web-push"
**Solução:** 
```bash
npm install web-push
git add package.json package-lock.json
git commit -m "Add web-push dependency"
git push
```

### Erro: "SUPABASE_SERVICE_ROLE_KEY is not defined"
**Solução:**
1. Adicionar variável no Vercel Dashboard
2. Redeploy o projeto

### Erro: "Function timeout"
**Solução:**
- Já configurado para 10s no vercel.json
- Se persistir, aumentar para 30s

### Notificação não chega
**Verificar:**
1. Subscription está salva no banco?
2. Campo `is_active` está `true`?
3. Logs da função no Vercel mostram sucesso?
4. Permissão de notificações está ativa no navegador?

## 📊 Estrutura de Arquivos

```
zap-corte-pro-main/
├── api/
│   └── send-notification.js    # Vercel Function
├── vercel.json                 # Configuração Vercel
├── package.json                # Dependências (web-push)
└── src/
    └── lib/
        └── webpush.ts          # Cliente (detecta produção)
```

## 🎯 Fluxo de Funcionamento

### Desenvolvimento (localhost)
```
Frontend (localhost:5173)
    ↓
API (localhost:3001/api/send-notification)
    ↓
Supabase
```

### Produção (Vercel)
```
Frontend (zapcorte.vercel.app)
    ↓
Vercel Function (zapcorte.vercel.app/api/send-notification)
    ↓
Supabase
```

## ✅ Checklist de Deploy

- [ ] Código commitado e pushed
- [ ] Variável `SUPABASE_SERVICE_ROLE_KEY` configurada no Vercel
- [ ] Deploy realizado com sucesso
- [ ] Função `/api/send-notification` aparece no dashboard
- [ ] Teste de notificação funcionando
- [ ] Logs da função sem erros
- [ ] Notificação chegando no dispositivo

## 🚀 Comandos Úteis

### Instalar Dependências
```bash
npm install
```

### Build Local
```bash
npm run build
```

### Testar Build
```bash
npm run preview
```

### Deploy Manual (se necessário)
```bash
vercel --prod
```

## 📝 Notas Importantes

1. **Service Role Key**: Nunca commitar no código, apenas no Vercel Dashboard
2. **CORS**: Já configurado na função para aceitar requisições do frontend
3. **Timeout**: Configurado para 10s, suficiente para enviar notificações
4. **Memory**: 1024MB, suficiente para processar múltiplas subscriptions

## 🔗 Links Úteis

- Vercel Dashboard: https://vercel.com/dashboard
- Vercel Functions Docs: https://vercel.com/docs/functions
- Web Push API: https://developer.mozilla.org/en-US/docs/Web/API/Push_API

---

**Status:** ✅ Configurado  
**Próximo Passo:** Fazer deploy e testar em produção
