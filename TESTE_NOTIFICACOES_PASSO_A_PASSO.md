# 🧪 Teste de Notificações - Passo a Passo

## ✅ Status Atual

- ✅ Tabela `push_subscriptions` criada
- ✅ Rota `/api/send-notification` funcionando
- ✅ Servidor rodando na porta 3001
- ⏳ Aguardando subscription real do navegador

## 🔍 Problema Identificado

O erro 400 ocorre porque não há subscriptions na tabela `push_subscriptions`.

**Causa:** O frontend precisa ativar as notificações para salvar a subscription.

## 📝 Passos para Testar

### 1. Verificar Servidor Backend
```bash
# Deve estar rodando
cd server
npm run dev

# Deve mostrar:
🚀 Servidor ZapCorte rodando na porta 3001
```

### 2. Verificar Frontend
```bash
# Deve estar rodando
npm run dev

# Acesse: http://localhost:5173
```

### 3. Ativar Notificações
```
1. Acesse: http://localhost:5173/dashboard/notifications
2. Clique em "Ativar Notificações"
3. Permita no navegador
4. Verifique o console (F12):
   - Deve mostrar: "💾 Salvando subscription..."
   - Deve mostrar: "✅ Subscription salva com sucesso" ou "✅ Nova subscription criada"
```

### 4. Verificar no Banco de Dados
```sql
SELECT 
  id,
  device_info->>'type' as tipo,
  device_info->>'browser' as navegador,
  is_active,
  created_at
FROM push_subscriptions
WHERE barbershop_id = '54f0a086-a7f7-46b9-bf96-f658940c8ae8';
```

**Esperado:** Deve retornar 1 linha com a subscription

### 5. Testar Notificação
```
1. Na página de notificações, clique em "Testar Notificação"
2. Verifique o console do navegador
3. Verifique os logs do servidor
4. Deve receber uma notificação do sistema
```

### 6. Verificar Logs do Servidor
```
Esperado:
📨 Requisição de notificação recebida: { barbershopId: "..." }
📱 Enviando para 1 dispositivo(s)
✅ Enviado: 1 | ❌ Falhou: 0
```

## 🐛 Troubleshooting

### Erro: "Nenhuma subscription ativa encontrada"

**Causa:** Subscription não foi salva no banco

**Solução:**
1. Abra o console do navegador (F12)
2. Vá em "Ativar Notificações" novamente
3. Verifique se aparece erro no console
4. Verifique se a tabela `push_subscriptions` tem dados

### Erro: "The subscription p256dh value should be 65 bytes long"

**Causa:** Subscription com chaves inválidas (dados de teste)

**Solução:**
```sql
-- Limpar subscriptions de teste
DELETE FROM push_subscriptions
WHERE user_agent = 'Test User Agent';
```

### Erro: "Failed to register service worker"

**Causa:** Service worker não está registrado

**Solução:**
1. Verifique se o arquivo `public/sw.js` existe
2. Acesse: http://localhost:5173/sw.js (deve mostrar o código)
3. No console, execute: `navigator.serviceWorker.getRegistrations()`
4. Se vazio, recarregue a página

### Notificação não aparece

**Possíveis causas:**
1. Permissão negada no navegador
2. Service worker não ativo
3. Subscription expirada

**Solução:**
1. Verifique permissões: `Notification.permission` (deve ser "granted")
2. Verifique SW: `navigator.serviceWorker.ready`
3. Reative as notificações

## 📊 Comandos Úteis

### Verificar Subscriptions
```sql
SELECT COUNT(*) as total,
       SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as ativos
FROM push_subscriptions;
```

### Limpar Todas Subscriptions
```sql
DELETE FROM push_subscriptions;
```

### Ver Histórico de Notificações
```sql
SELECT 
  title,
  body,
  status,
  sent_at,
  data->>'successCount' as sucessos,
  data->>'failCount' as falhas
FROM push_notifications
ORDER BY created_at DESC
LIMIT 10;
```

### Testar Rota Manualmente (PowerShell)
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/send-notification" `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"barbershopId": "54f0a086-a7f7-46b9-bf96-f658940c8ae8"}'
```

## ✅ Checklist de Validação

Antes de fazer push, verificar:

- [ ] Servidor backend rodando
- [ ] Frontend rodando
- [ ] Notificações ativadas no navegador
- [ ] Subscription salva no banco (verificar SQL)
- [ ] Teste de notificação funcionando
- [ ] Notificação aparece no sistema
- [ ] Logs do servidor sem erros
- [ ] Console do navegador sem erros

## 🎯 Próximos Passos

Após validação local:

1. ✅ Commit das alterações
2. ✅ Push para o repositório
3. ⏳ Testar em produção
4. ⏳ Testar em múltiplos dispositivos
5. ⏳ Monitorar métricas

---

**Status:** 🟡 Aguardando Teste Local  
**Última Atualização:** 2025-11-11 19:05
