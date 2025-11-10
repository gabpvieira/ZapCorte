# 💰 Nota sobre Preços e Checkout

## 📊 Preços Configurados

### No Sistema (Frontend):
- **Plano Starter:** R$ 30/mês (exibido na página Plan.tsx)
- **Plano Pro:** R$ 69/mês (exibido na página Plan.tsx)

### No Cakto (Checkout Real):
Os preços reais são configurados **diretamente no painel da Cakto**, não no código.

---

## 🔧 Como Alterar os Preços

### 1. Alterar Preço no Painel da Cakto (OBRIGATÓRIO)
1. Acesse: https://cakto.com.br/dashboard
2. Vá em: Produtos
3. Edite o produto:
   - **Starter (ID: 3th8tvh):** Altere o preço para o valor desejado
   - **Pro (ID: 9jk3ref):** Altere o preço para o valor desejado
4. Salve as alterações

**⚠️ IMPORTANTE:** O preço real cobrado é o configurado na Cakto, não no código!

### 2. Atualizar Preço no Frontend (Opcional - apenas visual)
Se você alterou o preço na Cakto, atualize também no código para manter consistência:

**Arquivo:** `zap-corte-pro-main/src/pages/Plan.tsx`

```typescript
const planLimits = {
  // ...
  starter: {
    // ...
    price: 'R$ 30/mês', // ← Altere aqui para o novo preço
    // ...
  },
  pro: {
    // ...
    price: 'R$ 69/mês', // ← Altere aqui para o novo preço
    // ...
  }
};
```

---

## 🧪 Sobre o Teste com R$ 5,00

Você mencionou que alterou o valor para R$ 5,00 temporariamente para teste.

### ✅ O que foi feito:
1. ✅ Pagamento de R$ 5,00 foi registrado manualmente no banco
2. ✅ Usuário `carvalhomozeli@gmail.com` foi ativado com plano STARTER
3. ✅ Expira em: 10/12/2025

### 📝 Observações:
- O preço de R$ 5,00 foi apenas para o teste
- O preço real do plano Starter continua sendo R$ 30/mês (ou o que estiver configurado na Cakto)
- Próximos pagamentos usarão o preço configurado na Cakto

---

## 🔄 Fluxo de Pagamento

```
1. Usuário clica em "Fazer Upgrade"
   ↓
2. Sistema redireciona para: https://pay.cakto.com.br/3th8tvh
   ↓
3. Cakto exibe o checkout com o PREÇO CONFIGURADO NO PAINEL
   ↓
4. Usuário paga
   ↓
5. Cakto envia webhook para o servidor Express
   ↓
6. Servidor processa e ativa o plano no Supabase
```

---

## ⚙️ URLs de Checkout Configuradas

### Variáveis de Ambiente (`.env.local`):
```env
VITE_CAKTO_CHECKOUT_STARTER=https://pay.cakto.com.br/3th8tvh
VITE_CAKTO_CHECKOUT_PRO=https://pay.cakto.com.br/9jk3ref
```

### IDs dos Produtos:
- **Starter:** `3th8tvh`
- **Pro:** `9jk3ref`

---

## 🎯 Checklist de Configuração de Preços

- [ ] Preço configurado no painel da Cakto
- [ ] Preço atualizado no código (Plan.tsx) para consistência visual
- [ ] Variáveis de ambiente configuradas (.env.local)
- [ ] Servidor Express rodando para receber webhooks
- [ ] Webhook configurado na Cakto
- [ ] Teste de pagamento realizado

---

## 💡 Dicas Importantes

1. **Preço Real = Preço na Cakto**
   - O código apenas exibe o preço visualmente
   - O valor cobrado é sempre o configurado na Cakto

2. **Testes com Valores Baixos**
   - Para testes, configure um preço baixo (ex: R$ 1,00) na Cakto
   - Após testar, volte ao preço real

3. **Consistência Visual**
   - Sempre mantenha o preço do código sincronizado com a Cakto
   - Evita confusão para os usuários

4. **Webhook é Essencial**
   - Sem webhook funcionando, o pagamento não ativa o plano
   - Siga o guia `CAKTO_WEBHOOK_FIX.md` para configurar

---

## 📞 Próximos Passos

1. ✅ Preços estão configurados corretamente
2. ⚠️ **URGENTE:** Configurar webhook (ver `CAKTO_WEBHOOK_FIX.md`)
3. ⚠️ **URGENTE:** Iniciar servidor Express
4. ⚠️ **URGENTE:** Expor servidor publicamente (ngrok/Railway)
5. Testar fluxo completo de pagamento
6. Ajustar preços na Cakto se necessário

---

## 🆘 Problemas Comuns

### "O preço no checkout está diferente do site"
- Verifique o preço configurado no painel da Cakto
- Atualize o código (Plan.tsx) para refletir o preço correto

### "Paguei mas o plano não foi ativado"
- Verifique se o webhook está configurado
- Verifique se o servidor Express está rodando
- Veja os logs do servidor e do Supabase

### "Quero fazer testes sem pagar"
- Configure um preço baixo (R$ 1,00) na Cakto temporariamente
- Ou processe manualmente (ver `CAKTO_WEBHOOK_FIX.md`)

---

**Última atualização:** 10/11/2025  
**Status:** Preços configurados ✅ | Webhook pendente ⚠️
