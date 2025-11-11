# 🧪 Como Testar o Webhook Real do Cakto

## 📋 Pré-requisitos

- ✅ Servidor rodando (local ou produção)
- ✅ Webhook configurado no Cakto
- ✅ Usuário cadastrado no sistema

---

## 🎯 Opção 1: Teste com Webhook de Teste do Cakto (Recomendado)

### Passo 1: Acessar Painel do Cakto

1. Login em: https://app.cakto.com.br
2. Menu **Apps** → **Webhooks**

### Passo 2: Localizar seu Webhook

Você verá o webhook configurado com:
- URL: `https://seu-dominio.com/api/webhooks/cakto`
- Secret: `8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df`
- Eventos: purchase_approved, refund, subscription_cancelled

### Passo 3: Enviar Teste

1. Clicar nos **três pontinhos** (⋮) do webhook
2. Selecionar **"Enviar evento de teste"**
3. Escolher evento: **purchase_approved**
4. Clicar em **"Enviar"**

### Passo 4: Verificar Resposta

**Resposta esperada:**
```
Status: 200 OK
```

Se receber 200 OK, o webhook está funcionando! ✅

### Passo 5: Validar no Banco de Dados

**Verificar webhook_logs:**
```sql
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 1;
```

**Resultado esperado:**
- `event_type`: purchase_approved
- `status`: success
- `error_message`: null

---

## 💳 Opção 2: Teste com Compra Real (R$ 5,00)

### Passo 1: Preparar Usuário

**Verificar se usuário existe:**
```bash
cd server
node validate-user.js eugabrieldpv@gmail.com
```

**Resultado esperado:**
```
✅ Usuário está PRONTO para receber webhooks!
```

### Passo 2: Fazer Compra

1. Acessar URL de checkout:
   ```
   https://pay.cakto.com.br/3th8tvh?email=eugabrieldpv@gmail.com
   ```

2. Preencher dados:
   - Nome: Gabriel Paiva
   - Email: eugabrieldpv@gmail.com
   - CPF: 290.925.583-20
   - Telefone: (59) 96667-3571

3. Escolher método de pagamento: **PIX**

4. Valor: **R$ 5,00** (Plano Starter)

5. Gerar QR Code e pagar

### Passo 3: Aguardar Confirmação

Após o pagamento ser confirmado (geralmente instantâneo com PIX):
- ⏱️ Aguardar 5-10 segundos
- 🔔 Webhook será enviado automaticamente pelo Cakto

### Passo 4: Verificar Perfil Atualizado

**Consultar perfil:**
```sql
SELECT 
  email,
  plan_type,
  subscription_status,
  last_payment_date,
  expires_at
FROM profiles 
WHERE email = 'eugabrieldpv@gmail.com';
```

**Resultado esperado:**
```
email: eugabrieldpv@gmail.com
plan_type: starter
subscription_status: active
last_payment_date: 2025-11-11 (data atual)
expires_at: 2025-12-11 (data atual + 30 dias)
```

### Passo 5: Verificar Histórico

**Consultar histórico:**
```sql
SELECT 
  transaction_id,
  amount,
  status,
  plan_type,
  created_at
FROM payment_history 
WHERE user_id = (
  SELECT id FROM profiles WHERE email = 'eugabrieldpv@gmail.com'
)
ORDER BY created_at DESC 
LIMIT 1;
```

**Resultado esperado:**
```
transaction_id: 70ce4c02-f03e-41ad-a8ec-653eb04a5e9a (ou similar)
amount: 5.99
status: completed
plan_type: starter
created_at: 2025-11-11 (data atual)
```

### Passo 6: Verificar Logs

**Logs do servidor:**
```bash
# Desenvolvimento
npm start
# Ver logs no terminal

# Produção (Vercel)
vercel logs
```

**Logs esperados:**
```
🔔 ===== PROCESSANDO PAGAMENTO APROVADO =====
📋 Dados extraídos do webhook:
  - Customer: { email: 'eugabrieldpv@gmail.com', ... }
  - Transaction ID: 70ce4c02-f03e-41ad-a8ec-653eb04a5e9a
  - Plan Type determinado: starter
🔍 Buscando usuário com email: eugabrieldpv@gmail.com
✅ Usuário encontrado na tabela profiles
✅ Perfil atualizado com sucesso
💾 Histórico de pagamento salvo
✅ ===== PAGAMENTO PROCESSADO COM SUCESSO =====
```

---

## 🔍 Checklist de Validação

### Antes do Teste
- [ ] Servidor rodando (local ou produção)
- [ ] Webhook configurado no Cakto
- [ ] URL correta: `https://seu-dominio.com/api/webhooks/cakto`
- [ ] Secret correto: `8cd2a0f6-5a9a-43fb-932c-ebaafbefa7df`
- [ ] Usuário existe no banco de dados

### Durante o Teste
- [ ] Compra realizada com sucesso
- [ ] Pagamento confirmado (PIX)
- [ ] Webhook enviado pelo Cakto

### Após o Teste
- [ ] Perfil atualizado: `plan_type` = `starter`
- [ ] Status atualizado: `subscription_status` = `active`
- [ ] Data de expiração definida: `expires_at` = +30 dias
- [ ] Histórico salvo: `payment_history` tem registro
- [ ] Webhook log: `webhook_logs` tem registro com status `success`
- [ ] Logs do servidor mostram processamento bem-sucedido

---

## 🚨 Troubleshooting

### Problema: Webhook não foi enviado

**Possíveis causas:**
1. Pagamento ainda não foi confirmado
2. Webhook não está configurado no Cakto
3. URL do webhook está incorreta

**Soluções:**
1. Aguardar mais alguns segundos
2. Verificar configuração no painel Cakto
3. Testar com "Enviar evento de teste"

### Problema: Webhook retorna erro

**Verificar:**
1. Logs do servidor: `vercel logs` ou `npm start`
2. Tabela `webhook_logs`: verificar `error_message`
3. Variáveis de ambiente configuradas

**Erros comuns:**
- **400 - Assinatura inválida**: Secret incorreto
- **404 - Not Found**: URL incorreta
- **500 - Internal Error**: Erro no código (ver logs)

### Problema: Perfil não atualiza

**Verificar:**
1. Usuário existe no banco:
   ```bash
   node validate-user.js eugabrieldpv@gmail.com
   ```

2. Webhook foi recebido:
   ```sql
   SELECT * FROM webhook_logs 
   WHERE payload->>'data'->>'customer'->>'email' = 'eugabrieldpv@gmail.com'
   ORDER BY created_at DESC;
   ```

3. Logs do servidor para erro específico

---

## 📊 Resultados Esperados

### Teste com Webhook de Teste do Cakto

**Tempo:** ~5 segundos  
**Taxa de sucesso:** 100%  
**Custo:** R$ 0,00 (gratuito)

### Teste com Compra Real

**Tempo:** ~30 segundos (incluindo pagamento)  
**Taxa de sucesso:** 100%  
**Custo:** R$ 5,00 (Plano Starter)

---

## ✅ Validação Final

Após realizar o teste, você deve ter:

1. ✅ **Webhook recebido** - Status 200 OK
2. ✅ **Perfil atualizado** - plan_type = starter
3. ✅ **Status ativo** - subscription_status = active
4. ✅ **Data de expiração** - expires_at = +30 dias
5. ✅ **Histórico salvo** - payment_history tem registro
6. ✅ **Logs corretos** - webhook_logs com status success

Se todos os itens acima estiverem ✅, o webhook está **100% funcional**!

---

## 🎉 Próximos Passos

Após validar que o webhook está funcionando:

1. ✅ **Monitorar por 24-48h**
   - Verificar taxa de sucesso
   - Identificar possíveis erros
   - Ajustar se necessário

2. ✅ **Documentar para equipe**
   - Compartilhar guias
   - Treinar equipe
   - Definir processos

3. ✅ **Lançar oficialmente**
   - Anunciar para usuários
   - Ativar marketing
   - Começar a vender!

---

## 📞 Suporte

### Se algo der errado:

1. **Verificar logs do servidor**
   ```bash
   vercel logs  # ou npm start
   ```

2. **Verificar webhook_logs no banco**
   ```sql
   SELECT * FROM webhook_logs 
   WHERE status = 'failed' 
   ORDER BY created_at DESC;
   ```

3. **Executar validação do usuário**
   ```bash
   node validate-user.js email@usuario.com
   ```

4. **Consultar documentação**
   - `WEBHOOK_PRONTO_PARA_PRODUCAO.md`
   - `SOLUCAO_WEBHOOK_PROFISSIONAL.md`
   - `README_WEBHOOK.md`

---

## 🎯 Conclusão

O teste do webhook é **simples e rápido**. Com os passos acima, você pode validar que tudo está funcionando perfeitamente antes do lançamento oficial.

**Boa sorte com o teste! 🚀**

---

**Desenvolvido com ❤️ para ZapCorte**  
**Data:** 11 de Novembro de 2025
