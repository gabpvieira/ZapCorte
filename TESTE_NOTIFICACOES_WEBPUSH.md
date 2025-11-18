# 🧪 Guia de Teste - Notificações WebPush

## 🎯 Objetivo

Testar o sistema de notificações push nativas do ZapCorte.

---

## 📋 Pré-requisitos

- [x] Servidor rodando (`npm run dev`)
- [x] Navegador moderno (Chrome, Firefox, Safari 16+)
- [x] Conta de barbeiro criada e logada
- [x] Barbearia configurada

---

## 🚀 Passo a Passo

### 1. Acessar Página de Notificações

```
http://localhost:5173/dashboard/notifications
```

Você deve ver:
- Card com status "Notificações Desativadas"
- Botão "Ativar Notificações"
- Seção "Como Funciona"
- Seção "Informações Importantes"

### 2. Ativar Notificações

1. Clique no botão **"Ativar Notificações"**
2. O navegador vai solicitar permissão
3. Clique em **"Permitir"**

**Resultado esperado:**
- ✅ Toast de sucesso: "Notificações Ativadas!"
- ✅ Status muda para "Notificações Ativadas"
- ✅ Ícone verde de CheckCircle aparece
- ✅ Botões mudam para "Testar Notificação" e "Desativar"

### 3. Testar Notificação

1. Clique no botão **"Testar Notificação"**

**Resultado esperado:**
- ✅ Toast: "Teste Enviado! Verifique se a notificação chegou"
- ✅ Notificação aparece no sistema:
  ```
  ✅ Notificação de Teste
  Suas notificações estão funcionando perfeitamente! 🎉
  ```

### 4. Testar com Agendamento Real

1. Abra uma nova aba anônima (Ctrl+Shift+N)
2. Acesse: `http://localhost:5173/barbershop/[seu-slug]`
3. Faça um agendamento completo
4. Volte para a aba do dashboard

**Resultado esperado:**
- ✅ Notificação aparece:
  ```
  🎉 Novo Agendamento!
  [Nome] agendou [Serviço] para [Data] às [Hora]
  ```
- ✅ Clicando na notificação, redireciona para `/dashboard`

### 5. Verificar no Banco de Dados

Execute no Supabase SQL Editor:

```sql
SELECT 
  id, 
  name, 
  push_subscription IS NOT NULL as has_subscription
FROM barbershops
WHERE user_id = '[seu-user-id]';
```

**Resultado esperado:**
- ✅ `has_subscription` = `true`

---

## 🔍 Verificações Técnicas

### Service Worker

1. Abra DevTools (F12)
2. Vá em **Application** → **Service Workers**

**Resultado esperado:**
- ✅ Service Worker registrado em `/sw.js`
- ✅ Status: "activated and running"

### Subscription

1. No DevTools, vá em **Application** → **Storage** → **IndexedDB**
2. Ou execute no console:

```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.pushManager.getSubscription().then(sub => {
    console.log('Subscription:', sub);
  });
});
```

**Resultado esperado:**
- ✅ Objeto subscription com `endpoint` e `keys`

### Console Logs

Verifique o console para logs:

```
[WebPush] Service Worker registrado
[WebPush] Subscription criada
[WebPush] Subscription salva no banco de dados
[Push] ✅ Notificação enviada com sucesso
```

---

## 🐛 Problemas Comuns

### Notificação não aparece

**Solução 1: Verificar permissão**
```
chrome://settings/content/notifications
```
- Certifique-se de que `localhost` está em "Permitir"

**Solução 2: Limpar Service Worker**
1. DevTools → Application → Service Workers
2. Clique em "Unregister"
3. Recarregue a página (F5)
4. Ative notificações novamente

**Solução 3: Verificar console**
- Procure por erros em vermelho
- Verifique se a API `/api/send-push-notification` está respondendo

### Permissão negada

Se você negou a permissão por engano:

**Chrome:**
1. Clique no ícone de cadeado na barra de endereço
2. Clique em "Configurações do site"
3. Mude "Notificações" para "Permitir"
4. Recarregue a página

**Firefox:**
1. Clique no ícone de informações na barra de endereço
2. Vá em "Permissões"
3. Mude "Notificações" para "Permitir"
4. Recarregue a página

### Service Worker não registra

**Solução:**
1. Certifique-se de que o arquivo `/public/sw.js` existe
2. Verifique se está acessando via `http://localhost` (não `http://127.0.0.1`)
3. Limpe o cache do navegador (Ctrl+Shift+Delete)

---

## ✅ Checklist de Teste

- [ ] Página de notificações carrega sem erros
- [ ] Botão "Ativar Notificações" funciona
- [ ] Navegador solicita permissão
- [ ] Permissão é concedida
- [ ] Status muda para "Ativado"
- [ ] Botão "Testar Notificação" funciona
- [ ] Notificação de teste aparece
- [ ] Notificação tem logo do ZapCorte
- [ ] Agendamento real dispara notificação
- [ ] Notificação mostra dados corretos (nome, serviço, data, hora)
- [ ] Clicar na notificação redireciona para dashboard
- [ ] Subscription salva no banco de dados
- [ ] Service Worker registrado corretamente
- [ ] Botão "Desativar" funciona
- [ ] Após desativar, notificações param de chegar

---

## 📱 Teste em Mobile

### Android (Chrome)

1. Acesse via ngrok ou deploy em produção (HTTPS obrigatório)
2. Siga os mesmos passos acima
3. Notificações devem aparecer na barra de notificações do Android

### iOS (Safari 16+)

1. Acesse via HTTPS (deploy em produção)
2. Siga os mesmos passos
3. Notificações devem aparecer no iOS

**Nota:** iOS requer HTTPS e Safari 16+

---

## 🎉 Teste Bem-Sucedido

Se todos os itens do checklist estão marcados, o sistema está funcionando perfeitamente!

Próximo passo: **Deploy em produção**

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique o console do navegador
2. Verifique os logs do servidor
3. Consulte `IMPLEMENTACAO_WEBPUSH_NATIVO.md`
4. Verifique a seção Troubleshooting

---

**Data:** 18 de Novembro de 2025  
**Versão:** 1.0.0
